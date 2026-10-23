// Regras do programa aplicadas no banco (briefing técnico, seção 10).
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

async function novoParceiro(q: Q, nome: string, extra: Record<string, any> = {}) {
  await q.sistema();
  const cols = ["nome_fantasia", ...Object.keys(extra)];
  const vals = [nome, ...Object.values(extra)];
  const r = await q.um(
    `insert into public.parceiros (${cols.join(",")}) values (${cols.map((_, i) => `$${i + 1}`).join(",")}) returning *`,
    vals,
  );
  return r;
}

async function empresa(q: Q, codigo: string) {
  return (await q.um("select id from public.empresas_grupo where codigo = $1", [codigo])).id as string;
}

describe("Funil, aprovação e onboarding", () => {
  it("bloqueia fechamento sem aprovação do Diretor e libera depois dela", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Funil SA", { carteira_icp: 20, etapa: "proposta_decisor" });
      await q.como(U.parcerias);
      const msg = await q.falha("update public.parceiros set etapa = 'fechamento' where id = $1", [p.id]);
      expect(msg).toMatch(/aprovação do Diretor/);
      await q.como(U.diretor);
      await q.sql("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [p.id, U.diretor]);
      await q.como(U.parcerias);
      const r = await q.sql("update public.parceiros set etapa = 'fechamento' where id = $1 returning etapa", [p.id]);
      expect(r[0].etapa).toBe("fechamento");
    }));

  it("onboarding exige contrato assinado e cria tarefas com prazo de 2 dias úteis, contrapartidas e fila do Base Ativa", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Onboarding SA", { carteira_icp: 70, pacote: "A" });
      await q.sql("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [p.id, U.diretor]);
      await q.como(U.parcerias);
      const msg = await q.falha("update public.parceiros set etapa = 'onboarding' where id = $1", [p.id]);
      expect(msg).toMatch(/contrato assinado/);
      await q.sql("update public.parceiros set etapa = 'onboarding', data_assinatura = public.hoje() where id = $1", [p.id]);
      const tarefas = await q.sql("select prazo from public.tarefas_onboarding where parceiro_id = $1", [p.id]);
      expect(tarefas).toHaveLength(7);
      const esperado = await q.um("select public.add_dias_uteis(public.hoje(), 2) as d");
      expect(tarefas.every((t) => +t.prazo === +esperado.d)).toBe(true);
      const contra = await q.sql("select nome, periodicidade from public.contrapartidas where parceiro_id = $1", [p.id]);
      expect(contra.length).toBe(13); // catálogo do pacote A para Elite
      expect(contra.find((c) => c.nome.startsWith("Conteúdo conjunto"))!.periodicidade).toBe("bimestral");
      expect(contra.some((c) => c.nome === "Usuários ativos no Wise Hub")).toBe(true);
      const fila = await q.sql("select estado from public.ciclos_base_ativa where parceiro_id = $1", [p.id]);
      expect(fila).toEqual([{ estado: "fila" }]);
    }));

  it("pacote C de um Select gera só as contrapartidas do pacote C", () =>
    transacao(async (q) => {
      await q.sistema();
      const n = await q.um("select count(*)::int as n from public.contrapartidas where parceiro_id = $1", [P.C]);
      expect(n.n).toBe(5);
    }));

  it("registra perda com o motivo como etapa", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Perda SA");
      await q.como(U.parcerias);
      await q.sql("update public.parceiros set etapa = 'sem_interesse', motivo_perda = 'Sem orçamento' where id = $1", [p.id]);
      await q.sistema();
      const h = await q.sql("select valor_anterior, valor_novo from public.historico where registro_id = $1 and campo = 'etapa'", [p.id]);
      expect(h).toEqual([{ valor_anterior: "sem_contato", valor_novo: "sem_interesse" }]);
    }));
});

describe("Nível, pacote e status de atividade", () => {
  it("sugere Elite a partir de 50, Premium de 15 a 49, Select abaixo de 15", () =>
    transacao(async (q) => {
      for (const [carteira, nivel] of [[50, "A"], [49, "B"], [15, "B"], [14, "C"], [0, "C"]] as const) {
        const p = await novoParceiro(q, `Nivel ${carteira}`, { carteira_icp: carteira });
        expect([p.nivel, p.nivel_sugerido]).toEqual([nivel, nivel]);
      }
    }));

  it("ajuste manual de nível exige motivo e fica no histórico", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Ajuste SA", { carteira_icp: 20 });
      await q.como(U.parcerias);
      const msg = await q.falha("update public.parceiros set nivel = 'A' where id = $1", [p.id]);
      expect(msg).toMatch(/exige motivo/);
      await q.sql("update public.parceiros set nivel = 'A', nivel_ajuste_motivo = 'Carteira confirmada maior' where id = $1", [p.id]);
      await q.sistema();
      const h = await q.um("select valor_anterior, valor_novo, autor_id from public.historico where registro_id = $1 and campo = 'nivel'", [p.id]);
      expect(h).toEqual({ valor_anterior: "B", valor_novo: "A", autor_id: U.parcerias });
    }));

  it("restringe pacotes ao nível: Premium só C e B", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Premium SA", { carteira_icp: 20 });
      await q.como(U.parcerias);
      const msg = await q.falha("update public.parceiros set pacote = 'A' where id = $1", [p.id]);
      expect(msg).toMatch(/não está disponível/);
      await q.sql("update public.parceiros set pacote = 'B' where id = $1", [p.id]);
    }));

  it("Elite sem contato há 31 dias fica morno; o nível nunca muda; contato devolve a ativo", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Status SA", { carteira_icp: 80, ultimo_contato: "2000-01-01" });
      await q.sql("update public.parceiros set ultimo_contato = public.hoje() - 31 where id = $1", [p.id]);
      let r = await q.um("select status_atividade, nivel from public.parceiros where id = $1", [p.id]);
      expect(r).toEqual({ status_atividade: "morno", nivel: "A" });
      await q.sql("update public.parceiros set ultimo_contato = public.hoje() - 61 where id = $1", [p.id]);
      r = await q.um("select status_atividade, nivel from public.parceiros where id = $1", [p.id]);
      expect(r).toEqual({ status_atividade: "dormente", nivel: "A" });
      await q.como(U.parcerias);
      await q.sql("insert into public.pontos_contato (parceiro_id, tipo, texto, autor_id) values ($1, 'ligacao', 'retomada', $2)", [p.id, U.parcerias]);
      r = await q.um("select status_atividade, nivel, ultimo_contato = public.hoje() as hoje from public.parceiros where id = $1", [p.id]);
      expect(r).toEqual({ status_atividade: "ativo", nivel: "A", hoje: true });
    }));

  it("Select tolera 90 dias e pausa de comum acordo suspende a inatividade até a retomada", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Pausa SA", { carteira_icp: 5 });
      await q.sql("update public.parceiros set ultimo_contato = public.hoje() - 85 where id = $1", [p.id]);
      expect((await q.um("select status_atividade from public.parceiros where id = $1", [p.id])).status_atividade).toBe("ativo");
      await q.sql("update public.parceiros set ultimo_contato = public.hoje() - 200, pausado_ate = public.hoje() + 30 where id = $1", [p.id]);
      expect((await q.um("select status_atividade from public.parceiros where id = $1", [p.id])).status_atividade).toBe("pausado");
    }));

  it("indicação registrada também reativa o parceiro morno", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("update public.parceiros set ultimo_contato = public.hoje() - 40 where id = $1", [P.A]);
      expect((await q.um("select status_atividade from public.parceiros where id = $1", [P.A])).status_atividade).toBe("morno");
      await q.como(U.parceiroA);
      await q.sql("select public.registrar_indicacao(jsonb_build_object('empresa_grupo_id', $1::text, 'cliente_razao_social', 'Reativa SA'))", [await (async () => { await q.sistema(); const e = await empresa(q, "wise"); await q.como(U.parceiroA); return e; })()]);
      await q.sistema();
      expect((await q.um("select status_atividade from public.parceiros where id = $1", [P.A])).status_atividade).toBe("ativo");
    }));

  it("sugere parceiro estratégico por carteira acima de 100", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Grande SA", { carteira_icp: 101 });
      const i = await q.um("select estrategico, estrategico_sugerido, estrategico_motivo from public.parceiros_interno where parceiro_id = $1", [p.id]);
      expect(i.estrategico).toBe(false);
      expect(i.estrategico_sugerido).toBe(true);
      expect(i.estrategico_motivo).toMatch(/101/);
    }));

  it("sugere parceiro estratégico por 3 indicações que viraram reunião em 90 dias", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Ativo SA", { carteira_icp: 10 });
      const wise = await empresa(q, "wise");
      await q.como(U.parcerias);
      for (const c of ["R1", "R2", "R3"]) {
        const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social',$3::text)) as id", [p.id, wise, `Cliente ${c}`]);
        await q.sql("update public.indicacoes set etapa = 'reuniao' where id = $1", [r.id]);
      }
      await q.sistema();
      expect((await q.um("select estrategico_sugerido from public.parceiros_interno where parceiro_id = $1", [p.id])).estrategico_sugerido).toBe(true);
    }));
});

describe("Indicações e comissões das três empresas", () => {
  const casos = [
    ["wise", 10000, 4000, 1000],
    ["triade", 5000, 2000, 500],
    ["swallow", 80000, 4800, 1600],
  ] as const;
  for (const [codigo, base, parceiro, responsavel] of casos) {
    it(`calcula a comissão da ${codigo}: parceiro e responsável`, () =>
      transacao(async (q) => {
        const emp = await empresa(q, codigo);
        await q.como(U.parcerias);
        const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social',$3::text)) as id", [P.B, emp, `Cliente ${codigo}`]);
        let cs = await q.sql("select beneficiario, estado from public.comissoes where indicacao_id = $1 order by beneficiario", [r.id]);
        expect(cs).toEqual([{ beneficiario: "parceiro", estado: "aguardando_fechamento" }, { beneficiario: "responsavel", estado: "aguardando_fechamento" }]);
        await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = $2 where id = $1", [r.id, base]);
        cs = await q.sql("select beneficiario, valor::float, estado, responsavel_perfil_id from public.comissoes where indicacao_id = $1 order by beneficiario", [r.id]);
        expect(cs).toEqual([
          { beneficiario: "parceiro", valor: parceiro, estado: "aguardando_compensacao", responsavel_perfil_id: null },
          { beneficiario: "responsavel", valor: responsavel, estado: "aguardando_compensacao", responsavel_perfil_id: U.parcerias },
        ]);
      }));
  }

  it("ao compensar o primeiro pagamento, a comissão fica a pagar e o financeiro é avisado com obrigatoriedade", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "triade");
      await q.sql("update public.configuracoes set valor = '\"fin@externo.com\"' where chave = 'email_financeiro'");
      await q.como(U.parcerias);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Compensa SA')) as id", [P.B, emp]);
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 1000 where id = $1", [r.id]);
      await q.sql("update public.indicacoes set data_compensacao = public.hoje() where id = $1", [r.id]);
      await q.sistema();
      const cs = await q.sql("select estado from public.comissoes where indicacao_id = $1", [r.id]);
      expect(cs.every((c) => c.estado === "a_pagar")).toBe(true);
      const n = await q.sql("select usuario_id, email_destino, enviar_email from public.notificacoes where tipo = 'comissao_a_pagar' and dados->>'comissao_id' in (select id::text from public.comissoes where indicacao_id = $1)", [r.id]);
      expect(n.filter((x) => x.usuario_id === U.financeiro)).toHaveLength(2);
      expect(n.filter((x) => x.email_destino === "fin@externo.com")).toHaveLength(2);
      expect(n.every((x) => x.enviar_email)).toBe(true);
    }));

  it("regra alterada vale só para registros novos", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      const antiga = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Antiga SA')) as id", [P.B, emp]);
      await q.como(U.admin);
      await q.sql("update public.empresas_grupo set pct_parceiro = 30 where codigo = 'wise'");
      await q.como(U.parcerias);
      const nova = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Nova SA')) as id", [P.B, emp]);
      const pct = async (id: string) => (await q.um("select percentual::float as p from public.comissoes where indicacao_id = $1 and beneficiario = 'parceiro'", [id])).p;
      expect(await pct(antiga.id)).toBe(40);
      expect(await pct(nova.id)).toBe(30);
    }));

  it("indicação do grupo para o parceiro registra a comissão a receber pelo instrumento dele", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('sentido','grupo_para_parceiro','parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Para Alfa SA')) as id", [P.A, emp]);
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 2000 where id = $1", [r.id]);
      const cs = await q.sql("select beneficiario, percentual::float, valor::float from public.comissoes where indicacao_id = $1", [r.id]);
      expect(cs).toEqual([{ beneficiario: "grupo", percentual: 10, valor: 200 }]);
    }));

  it("cliente existente da Tríade não gera comissão", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "triade");
      await q.como(U.parcerias);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Já Cliente SA','cliente_existente',true)) as id", [P.B, emp]);
      expect(await q.sql("select * from public.comissoes where indicacao_id = $1", [r.id])).toHaveLength(0);
    }));

  it("instituição pública não gera comissão em nenhuma direção", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Prefeitura", { tipo_parceria: "institucional", natureza_juridica: "publica" });
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      for (const sentido of ["parceiro_para_grupo", "grupo_para_parceiro"]) {
        const r = await q.um("select public.registrar_indicacao(jsonb_build_object('sentido',$4::text,'parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social',$3::text)) as id", [p.id, emp, `Cliente público ${sentido}`, sentido]);
        expect(await q.sql("select * from public.comissoes where indicacao_id = $1", [r.id])).toHaveLength(0);
      }
    }));

  it("aplica o primeiro registro a cliente duplicado (por CNPJ ou nome) e só admin abre exceção após 6 meses", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      await q.sql("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Metalúrgica Única Ltda','cliente_cnpj','11.222.333/0001-81'))", [P.A, emp]);
      let msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Outro nome','cliente_cnpj','11222333000181'))", [P.B, emp]);
      expect(msg).toMatch(/Parceiro Alfa.*primeiro registro/);
      msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','METALURGICA UNICA LTDA'))", [P.B, emp]);
      expect(msg).toMatch(/primeiro registro/);
      // Parceiro recebe mensagem neutra, sem o nome do outro parceiro
      await q.como(U.parceiroB);
      msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('empresa_grupo_id',$1::text,'cliente_razao_social','Metalúrgica Única Ltda'))", [emp]);
      expect(msg).not.toMatch(/Alfa/);
      // Exceção: parcerias não pode; admin só após 6 meses sem interação
      await q.como(U.parcerias);
      msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Metalúrgica Única Ltda','excecao_justificativa','reengajou'))", [P.B, emp]);
      expect(msg).toMatch(/administradores/);
      await q.como(U.admin);
      msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Metalúrgica Única Ltda','excecao_justificativa','reengajou'))", [P.B, emp]);
      expect(msg).toMatch(/6 meses/);
      await q.sistema();
      await q.sql("update public.indicacoes set ultima_atualizacao = now() - interval '7 months', data = public.hoje() - 220 where cliente_id = (select id from public.clientes where cnpj_digitos = '11222333000181')");
      await q.sql("update public.clientes set ultima_interacao = public.hoje() - 220 where cnpj_digitos = '11222333000181'");
      await q.como(U.admin);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Metalúrgica Única Ltda','excecao_justificativa','Reengajado pelo Beta após 7 meses')) as id", [P.B, emp]);
      const i = await q.um("select excecao_duplicidade, excecao_por from public.indicacoes where id = $1", [r.id]);
      expect(i).toEqual({ excecao_duplicidade: "Reengajado pelo Beta após 7 meses", excecao_por: U.admin });
    }));

  it("não salva dados pessoais do cliente sem consentimento declarado", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parceiroA);
      const msg = await q.falha("select public.registrar_indicacao(jsonb_build_object('empresa_grupo_id',$1::text,'cliente_razao_social','LGPD SA','contato_nome','Fulano','contato_email','f@x.com'))", [emp]);
      expect(msg).toMatch(/consentimento/);
      await q.sql("select public.registrar_indicacao(jsonb_build_object('empresa_grupo_id',$1::text,'cliente_razao_social','LGPD SA','contato_nome','Fulano','consentimento',true))", [emp]);
      await q.sistema();
      await q.falha("insert into public.clientes (razao_social, email) values ('Sem consentimento', 'x@y.com')");
    }));

  it("parceiro atualiza indicação recebida: fica pendente até a Wise confirmar, e o responsável é avisado", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('sentido','grupo_para_parceiro','parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Recebida SA')) as id", [P.A, emp]);
      await q.como(U.parceiroA);
      await q.sql("select public.parceiro_atualizar_indicacao($1, '{\"etapa\":\"reuniao\",\"observacao\":\"reunião marcada\"}')", [r.id]);
      await q.como(U.parceiroB);
      await q.falha("select public.parceiro_atualizar_indicacao($1, '{\"etapa\":\"fechada\"}')", [r.id]);
      await q.sistema();
      let i = await q.um("select etapa, atualizacao_pendente from public.indicacoes where id = $1", [r.id]);
      expect(i.etapa).toBe("nova");
      expect(i.atualizacao_pendente.etapa).toBe("reuniao");
      const n = await q.sql("select * from public.notificacoes where usuario_id = $1 and tipo = 'indicacao_atualizada'", [U.parcerias]);
      expect(n.length).toBe(1);
      await q.como(U.parcerias);
      await q.sql("select public.confirmar_atualizacao_indicacao($1, true)", [r.id]);
      i = await q.um("select etapa, atualizacao_pendente, data_reuniao is not null as reuniao from public.indicacoes where id = $1", [r.id]);
      expect(i).toEqual({ etapa: "reuniao", atualizacao_pendente: null, reuniao: true });
    }));

  it("indicações sem atualização há 30 dias entram nos alertas do responsável", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Parada SA')) as id", [P.C, emp]);
      await q.sistema();
      await q.sql("update public.indicacoes set ultima_atualizacao = now() - interval '31 days' where id = $1", [r.id]);
      // a coluna é atualizada pelo gatilho só quando campos de negócio mudam
      const v = await q.um("select ultima_atualizacao < now() - interval '30 days' as parada from public.indicacoes where id = $1", [r.id]);
      expect(v.parada).toBe(true);
      const pend = await q.um("select public.pendencias_diarias() as p");
      const meu = pend.p.find((x: any) => x.usuario_id === U.parcerias);
      expect(meu.itens.indicacoes_paradas.some((x: any) => x.texto.includes("Parada SA"))).toBe(true);
    }));
});

describe("Contrapartidas, comprovações e alertas", () => {
  it("contrapartida vencida fica atrasada (alerta) sem suspender nada; validação deixa em dia até a próxima data", () =>
    transacao(async (q) => {
      await q.sistema();
      const cp = await q.um("select id from public.contrapartidas where parceiro_id = $1 and periodicidade = 'mensal' limit 1", [P.B]);
      await q.sql("update public.contrapartidas set proxima_data = public.hoje() - 1, estado = 'pendente' where id = $1", [cp.id]);
      const tarefasAntes = await q.um("select count(*)::int n from public.tarefas_onboarding where parceiro_id = $1", [P.B]);
      await q.sql("select public.rotina_diaria()");
      const c1 = await q.um("select estado, ativa from public.contrapartidas where id = $1", [cp.id]);
      expect(c1).toEqual({ estado: "atrasada", ativa: true });
      const p = await q.um("select pacote, etapa from public.parceiros where id = $1", [P.B]);
      expect(p).toEqual({ pacote: "B", etapa: "onboarding" });
      expect((await q.um("select count(*)::int n from public.tarefas_onboarding where parceiro_id = $1", [P.B])).n).toBe(tarefasAntes.n);
      const painel = await q.um("select public.painel_semanal() as p");
      expect(painel.p.contrapartidas_atrasadas.some((x: any) => x.id === cp.id)).toBe(true);
      // Parceiro envia, Wise valida
      await q.como(U.parceiroB);
      const comp = await q.um("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, enviada_por) values ($1, $2, 'https://insta/p/1', $3) returning id", [cp.id, P.B, U.parceiroB]);
      await q.sistema();
      expect((await q.um("select estado from public.contrapartidas where id = $1", [cp.id])).estado).toBe("enviada");
      await q.como(U.parcerias);
      await q.sql("update public.comprovacoes set estado = 'validada' where id = $1", [comp.id]);
      const c2 = await q.um("select estado, proxima_data > public.hoje() as futura from public.contrapartidas where id = $1", [cp.id]);
      expect(c2).toEqual({ estado: "validada", futura: true });
    }));

  it("comprovação recusada exige motivo e volta a contrapartida para pendente", () =>
    transacao(async (q) => {
      await q.sistema();
      const cp = await q.um("select id from public.contrapartidas where parceiro_id = $1 limit 1", [P.B]);
      await q.como(U.parceiroB);
      const comp = await q.um("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, enviada_por) values ($1, $2, 'https://x', $3) returning id", [cp.id, P.B, U.parceiroB]);
      await q.como(U.parcerias);
      await q.falha("update public.comprovacoes set estado = 'recusada' where id = $1", [comp.id]);
      await q.sql("update public.comprovacoes set estado = 'recusada', motivo_recusa = 'Print ilegível' where id = $1", [comp.id]);
      expect((await q.um("select estado from public.contrapartidas where id = $1", [cp.id])).estado).toBe("pendente");
    }));
});

describe("Próximos passos e rotina diária", () => {
  it("um próximo passo ativo por parceiro; vencido quando a data passa", () =>
    transacao(async (q) => {
      await q.como(U.consultor);
      await q.sql("insert into public.proximos_passos (parceiro_id, descricao, data) values ($1, 'Primeiro', public.hoje() + 1)", [P.D]);
      await q.sql("insert into public.proximos_passos (parceiro_id, descricao, data) values ($1, 'Segundo', public.hoje() + 2)", [P.D]);
      await q.sistema();
      const ps = await q.sql("select descricao, estado, responsavel_id from public.proximos_passos where parceiro_id = $1 order by descricao", [P.D]);
      expect(ps).toEqual([
        { descricao: "Primeiro", estado: "substituido", responsavel_id: U.parcerias },
        { descricao: "Segundo", estado: "aberto", responsavel_id: U.parcerias },
      ]);
      await q.sql("update public.proximos_passos set data = public.hoje() - 1 where parceiro_id = $1 and estado = 'aberto'", [P.D]);
      expect((await q.um("select estado from public.proximos_passos where parceiro_id = $1 and descricao = 'Segundo'", [P.D])).estado).toBe("vencido");
      const pend = await q.um("select public.pendencias_diarias() as p");
      const meu = pend.p.find((x: any) => x.usuario_id === U.parcerias);
      expect(meu.itens.followups_vencidos.some((x: any) => x.texto === "Segundo")).toBe(true);
    }));

  it("e-mail diário só para quem tem pendência, respeitando preferências e alertas obrigatórios", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("update public.parceiros set etapa = 'proposta_decisor' where id = $1", [P.D]);
      const pend = (await q.um("select public.pendencias_diarias() as p")).p;
      expect(pend.find((x: any) => x.usuario_id === U.comercial)).toBeUndefined();
      const dir = pend.find((x: any) => x.usuario_id === U.diretor);
      expect(dir.itens.aprovacoes_pendentes.some((x: any) => x.parceiro_id === P.D)).toBe(true);
      await q.sql("update public.perfis set alertas_desativados = '{aprovacoes_pendentes}' where id = $1", [U.diretor]);
      const pend2 = (await q.um("select public.pendencias_diarias() as p")).p;
      expect(pend2.find((x: any) => x.usuario_id === U.diretor).itens.aprovacoes_pendentes.length).toBeGreaterThan(0);
      // Diretor recebe aviso imediato obrigatório ao entrar em proposta com o decisor
      const n = await q.sql("select enviar_email from public.notificacoes where usuario_id = $1 and tipo = 'aprovacao_pendente'", [U.diretor]);
      expect(n).toEqual([{ enviar_email: true }]);
    }));

  it("negociação parada: 4 dias úteis em contato feito, considerando feriados", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select public.dias_uteis_entre('2026-11-13', '2026-11-23') as n")).n).toBe(5); // 15 e 20/11 feriados, fim de semana
      expect((await q.um("select public.add_dias_uteis('2026-12-24', 2) as d")).d.toISOString().slice(0, 10)).toBe("2026-12-29");
      const p = await novoParceiro(q, "Parado SA", { etapa: "contato_feito", responsavel_id: U.parcerias });
      await q.sql("update public.parceiros set etapa_desde = now() - interval '10 days' where id = $1", [p.id]);
      const painel = await q.um("select public.painel_semanal() as p");
      expect(painel.p.negociacoes_paradas.some((x: any) => x.parceiro_id === p.id)).toBe(true);
    }));
});

describe("Ficha de apresentação proposta pelo parceiro", () => {
  it("proposta fica pendente, não muda a ficha publicada e só vale após validação", () =>
    transacao(async (q) => {
      await q.sistema();
      const campo = await q.um("select id from public.campos_categoria where chave = 'o_que_faz'");
      await q.como(U.parceiroA);
      const valores = { [campo.id]: "Novo texto proposto" };
      const pr = await q.um("insert into public.propostas_ficha (parceiro_id, valores) values ($1, $2) returning id, estado", [P.A, valores]);
      expect(pr.estado).toBe("pendente");
      const pub = await q.um("select valor #>> '{}' as v from public.parceiro_campos where parceiro_id = $1 and campo_id = $2", [P.A, campo.id]);
      expect(pub.v).toBe("Parceiro Alfa implanta ERP para indústria.");
      // Nova proposta substitui a anterior
      const pr2 = await q.um("insert into public.propostas_ficha (parceiro_id, valores) values ($1, $2) returning id", [P.A, { [campo.id]: "Versão final" }]);
      await q.sistema();
      expect((await q.um("select estado from public.propostas_ficha where id = $1", [pr.id])).estado).toBe("substituida");
      await q.como(U.parcerias);
      await q.sql("select public.revisar_proposta_ficha($1, true)", [pr2.id]);
      const novo = await q.um("select valor #>> '{}' as v, versao from public.parceiro_campos where parceiro_id = $1 and campo_id = $2", [P.A, campo.id]);
      expect(novo).toEqual({ v: "Versão final", versao: 2 });
    }));

  it("parceiro não propõe alteração de campo interno nem da visão da Wise", () =>
    transacao(async (q) => {
      await q.sistema();
      const interno = await q.um("select id from public.campos_categoria where chave = 'principais_concorrentes'");
      const visao = await q.um("select id from public.campos_categoria where chave = 'visao_wise'");
      await q.como(U.parceiroA);
      await q.falha("insert into public.propostas_ficha (parceiro_id, valores) values ($1, $2)", [P.A, { [interno.id]: "x" }]);
      await q.falha("insert into public.propostas_ficha (parceiro_id, valores) values ($1, $2)", [P.A, { [visao.id]: "x" }]);
    }));
});

describe("Base Ativa", () => {
  it("fila com estratégicos à frente; início só por administrador; 2 encontros seguidos não realizados suspendem", () =>
    transacao(async (q) => {
      const p = await novoParceiro(q, "Fila Dois", { carteira_icp: 60, pacote: "A" });
      await q.sql("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [p.id, U.diretor]);
      await q.sql("update public.parceiros set etapa = 'onboarding', data_assinatura = public.hoje() - 100 where id = $1", [p.id]);
      let fila = await q.sql("select parceiro_id from public.v_fila_base_ativa order by posicao");
      expect(fila.map((f) => f.parceiro_id)).toEqual([P.A, p.id]); // A é estratégico
      await q.sql("update public.parceiros_interno set estrategico = false where parceiro_id = $1", [P.A]);
      fila = await q.sql("select parceiro_id from public.v_fila_base_ativa order by posicao");
      expect(fila.map((f) => f.parceiro_id)).toEqual([p.id, P.A]); // assinou antes
      const ciclo = await q.um("select id from public.ciclos_base_ativa where parceiro_id = $1", [p.id]);
      await q.como(U.parcerias);
      await q.falha("update public.ciclos_base_ativa set estado = 'em_ciclo' where id = $1", [ciclo.id]);
      await q.como(U.admin);
      await q.sql("update public.ciclos_base_ativa set estado = 'em_ciclo', inicio = public.hoje() where id = $1", [ciclo.id]);
      const enc = await q.sql("select numero from public.base_ativa_encontros where ciclo_id = $1 order by numero", [ciclo.id]);
      expect(enc).toHaveLength(6);
      await q.sql("update public.base_ativa_encontros set realizado = false, motivo_nao_realizado = 'indisponibilidade_parceiro' where ciclo_id = $1 and numero = 1", [ciclo.id]);
      await q.sql("update public.base_ativa_encontros set realizado = true where ciclo_id = $1 and numero = 2", [ciclo.id]);
      await q.sql("update public.base_ativa_encontros set realizado = false, motivo_nao_realizado = 'indisponibilidade_parceiro' where ciclo_id = $1 and numero = 3", [ciclo.id]);
      expect((await q.um("select estado from public.ciclos_base_ativa where id = $1", [ciclo.id])).estado).toBe("em_ciclo");
      await q.sql("update public.base_ativa_encontros set realizado = false, motivo_nao_realizado = 'indisponibilidade_parceiro' where ciclo_id = $1 and numero = 4", [ciclo.id]);
      expect((await q.um("select estado from public.ciclos_base_ativa where id = $1", [ciclo.id])).estado).toBe("suspenso");
    }));

  it("evento final conclui o ciclo, registra o certificado e agenda revisão em 6 meses", () =>
    transacao(async (q) => {
      await q.sistema();
      const ciclo = await q.um("select id from public.ciclos_base_ativa where parceiro_id = $1", [P.A]);
      const ct = await q.um("insert into public.contatos (nome) values ('Ana Responsável') returning id");
      await q.sql("insert into public.parceiro_contatos (parceiro_id, contato_id, papeis) values ($1, $2, '{responsavel_parceria}')", [P.A, ct.id]);
      await q.sql("update public.ciclos_base_ativa set estado = 'em_ciclo', inicio = public.hoje() - 84 where id = $1", [ciclo.id]);
      await q.sql("update public.ciclos_base_ativa set evento_data = public.hoje() where id = $1", [ciclo.id]);
      const c = await q.um("select estado, certificado_responsavel, revisao_em = (public.hoje() + interval '6 months')::date as rev from public.ciclos_base_ativa where id = $1", [ciclo.id]);
      expect(c).toEqual({ estado: "concluido", certificado_responsavel: "Ana Responsável", rev: true });
    }));
});

describe("Pedido de RFP e página pública", () => {
  async function pedidoComOpcoes(q: Q, parceiros: string[]) {
    await q.sistema();
    const emp = await empresa(q, "wise");
    const erp = (await q.um("select id from public.categorias where nome = 'ERP'")).id;
    await q.como(U.consultor);
    const ped = await q.um(
      "insert into public.pedidos_rfp (cliente_nome, consultor_id, empresa_grupo_id, necessidade, necessidade_resumida) values ('Indústria Cliente', $1, $2, 'Precisa de ERP', 'a gestão da produção') returning id",
      [U.consultor, emp],
    );
    let ordem = 0;
    for (const p of parceiros) {
      await q.sql("insert into public.pedido_rfp_opcoes (pedido_id, categoria_id, parceiro_id, ordem) values ($1, $2, $3, $4)", [ped.id, erp, p, ordem++]);
    }
    const blocos = [
      { tipo: "abertura", titulo: "Opções para a sua necessidade", texto: "Selecionamos fornecedores." },
      { tipo: "categoria", categoria_id: erp, titulo: "ERP", texto: "Três opções.", parceiros: parceiros.map((p) => ({ parceiro_id: p, nome: "Nome", texto: "Texto", destaques: ["a"] })) },
      { tipo: "consultor", nome: "Consultor Teste", email: "consultor@teste.wise", telefone: null, texto: "Fale comigo." },
    ];
    return { ped: ped.id as string, blocos, erp };
  }

  it("bloqueia menos de 3 opções quando há 3 ou mais assinados na categoria", () =>
    transacao(async (q) => {
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B]);
      const msg = await q.falha("select public.publicar_pagina_rfp($1, $2)", [ped, JSON.stringify(blocos)]);
      expect(msg).toMatch(/no mínimo 3/);
    }));

  it("nunca publica parceiro sem contrato assinado", () =>
    transacao(async (q) => {
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B, P.D]);
      const msg = await q.falha("select public.publicar_pagina_rfp($1, $2)", [ped, JSON.stringify(blocos)]);
      expect(msg).toMatch(/sem contrato assinado/);
      await q.como(U.consultor);
      const cand = await q.um("select public.rfp_candidatos() as c");
      expect(cand.c.map((x: any) => x.parceiro_id)).not.toContain(P.D);
      expect(JSON.stringify(cand.c)).not.toMatch(/Concorrente secreto/);
    }));

  it("permite menos de 3 quando não há assinados suficientes e registra a exceção", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("update public.parceiros set etapa = 'parceria_encerrada' where id in ($1, $2)", [P.C, P.E]);
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B]);
      const r = await q.um("select public.publicar_pagina_rfp($1, $2) as r", [ped, JSON.stringify(blocos)]);
      expect(r.r.excecoes[0].disponiveis).toBe(2);
    }));

  it("publica com 3 opções, cria indicações, aviso de relação comercial e link de 30 dias", () =>
    transacao(async (q) => {
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B, P.C]);
      const r = (await q.um("select public.publicar_pagina_rfp($1, $2) as r", [ped, JSON.stringify(blocos)])).r;
      expect(r.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      const pag = await q.um("select blocos, (expira_em - publicada_em) as validade from public.paginas_rfp where pedido_id = $1", [ped]);
      expect(pag.blocos.some((b: any) => b.tipo === "aviso" && /relação comercial/.test(b.texto))).toBe(true);
      expect(pag.validade.days).toBe(30);
      const ind = await q.sql("select parceiro_id, sentido, origem from public.indicacoes where pedido_rfp_id = $1 order by parceiro_id", [ped]);
      expect(ind).toEqual([P.A, P.B, P.C].sort().map((p) => ({ parceiro_id: p, sentido: "grupo_para_parceiro", origem: "rfp" })));
      // Parceiro vê o pedido em que foi apresentado, sem os outros parceiros
      await q.como(U.parceiroA);
      const meus = await q.sql("select * from public.meus_rfps()");
      expect(meus).toHaveLength(1);
      expect(meus[0].cliente_nome).toBe("Indústria Cliente");
      expect(JSON.stringify(meus)).not.toMatch(/Beta|Gama/);
      await q.como(U.parceiroB);
      expect(await q.sql("select * from public.meus_rfps()")).toHaveLength(1);
    }));

  it("página pública só devolve campos permitidos e registra aberturas e cliques", () =>
    transacao(async (q) => {
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B, P.C]);
      // texto de bloco com campo extra tentando vazar dados internos
      (blocos[1] as any).parceiros[0].nivel = "A";
      (blocos[1] as any).comissao = 40;
      const r = (await q.um("select public.publicar_pagina_rfp($1, $2) as r", [ped, JSON.stringify(blocos)])).r;
      await q.sistema();
      const pub = (await q.um("select public.rfp_pagina_publica($1, 'Mozilla/5.0') as p", [r.token])).p;
      expect(pub.estado).toBe("ok");
      const texto = JSON.stringify(pub);
      for (const proibido of ['"nivel"', "comiss", "estrateg", "pacote", "status", "anotac", "Concorrente secreto", "99999", "Anotação interna", "carteira", "Elite"]) {
        expect(texto).not.toContain(proibido);
      }
      const cat = pub.blocos.find((b: any) => b.tipo === "categoria");
      expect(Object.keys(cat.parceiros[0]).sort()).toEqual(["contato", "destaques", "disponivel", "nome", "parceiro_id", "texto"]);
      expect(cat.parceiros[0].contato).toBe("whatsapp");
      const clique = (await q.um("select public.rfp_registrar_clique($1, $2, 'Mozilla') as c", [r.token, P.A])).c;
      expect(clique.url).toBe(
        "https://wa.me/5544999990000?text=" +
          encodeURIComponent("Olá, sou cliente da Wise Makers e preciso resolver a gestão da produção. Eles indicaram o contato de vocês para eu conhecer melhor a solução."),
      );
      const ev = await q.sql("select tipo, parceiro_id from public.eventos_rfp e join public.paginas_rfp p on p.id = e.pagina_id where p.pedido_id = $1 order by e.id", [ped]);
      expect(ev).toEqual([{ tipo: "abertura", parceiro_id: null }, { tipo: "clique_whatsapp", parceiro_id: P.A }]);
      const avisados = await q.sql("select usuario_id from public.notificacoes where tipo = 'rfp_clique' order by usuario_id");
      expect(avisados.map((a) => a.usuario_id).sort()).toEqual([U.consultor, U.parceiroA, U.parceiroA2].sort());
      // Parceiro fora da página não recebe clique
      expect((await q.um("select public.rfp_registrar_clique($1, $2) as c", [r.token, P.E])).c.erro).toBe("indisponivel");
      // Contrato encerrado: parceiro indisponível, sem botão
      await q.sql("update public.parceiros set etapa = 'parceria_encerrada' where id = $1", [P.B]);
      const pub2 = (await q.um("select public.rfp_pagina_publica($1) as p", [r.token])).p;
      const b = pub2.blocos.find((x: any) => x.tipo === "categoria").parceiros.find((x: any) => x.parceiro_id === P.B);
      expect(b).toMatchObject({ disponivel: false, contato: null });
    }));

  it("token inválido, expirado e revogado não mostram conteúdo; renovação reabre por 30 dias", () =>
    transacao(async (q) => {
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B, P.C]);
      const r = (await q.um("select public.publicar_pagina_rfp($1, $2) as r", [ped, JSON.stringify(blocos)])).r;
      await q.sistema();
      expect((await q.um("select public.rfp_pagina_publica('token-invalido-com-tamanho-suficiente-123') as p")).p).toEqual({ estado: "nao_encontrada" });
      expect((await q.um("select public.rfp_pagina_publica('') as p")).p).toEqual({ estado: "nao_encontrada" });
      await q.sql("update public.paginas_rfp set expira_em = now() - interval '1 minute' where pedido_id = $1", [ped]);
      let p = (await q.um("select public.rfp_pagina_publica($1) as p", [r.token])).p;
      expect(p.estado).toBe("indisponivel");
      expect(p.blocos).toBeUndefined();
      expect(p.consultor.nome).toBe("Consultor Teste");
      await q.como(U.consultor);
      await q.sql("select public.renovar_pagina_rfp($1)", [ped]);
      await q.sistema();
      expect((await q.um("select public.rfp_pagina_publica($1) as p", [r.token])).p.estado).toBe("ok");
      await q.como(U.consultor);
      await q.sql("select public.revogar_pagina_rfp($1)", [ped]);
      await q.sistema();
      p = (await q.um("select public.rfp_pagina_publica($1) as p", [r.token])).p;
      expect(p.estado).toBe("indisponivel");
      expect((await q.um("select public.rfp_registrar_clique($1, $2) as c", [r.token, P.A])).c.erro).toBe("indisponivel");
      const h = await q.sql("select campo from public.historico where tabela = 'paginas_rfp' order by id");
      expect(h.map((x) => x.campo)).toEqual(["publicada", "renovada", "revogada"]);
    }));

  it("parceiro sem WhatsApp comercial: botão de e-mail e aviso ao consultor", () =>
    transacao(async (q) => {
      await q.sistema();
      const w = await q.um("select id from public.campos_categoria where chave = 'whatsapp_comercial'");
      const e = await q.um("select id from public.campos_categoria where chave = 'email_comercial'");
      await q.sql("delete from public.parceiro_campos where parceiro_id = $1 and campo_id = $2", [P.C, w.id]);
      await q.sql("insert into public.parceiro_campos (parceiro_id, campo_id, valor) values ($1, $2, '\"vendas@gama.com\"')", [P.C, e.id]);
      const { ped, blocos } = await pedidoComOpcoes(q, [P.A, P.B, P.C]);
      const r = (await q.um("select public.publicar_pagina_rfp($1, $2) as r", [ped, JSON.stringify(blocos)])).r;
      expect(r.avisos.join(" ")).toMatch(/Parceiro Gama não tem WhatsApp/);
      await q.sistema();
      const c = (await q.um("select public.rfp_registrar_clique($1, $2) as c", [r.token, P.C])).c;
      expect(c.tipo).toBe("clique_email");
      expect(c.url).toMatch(/^mailto:vendas@gama\.com\?subject=/);
    }));
});
