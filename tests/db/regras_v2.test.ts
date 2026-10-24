// Regras da v2 aplicadas no banco (briefing técnico, seção 10).
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

async function empresa(q: Q, codigo: string) {
  return (await q.um("select id from public.empresas_grupo where codigo = $1", [codigo])).id as string;
}

// Atalhos de "máquina do tempo": mudam datas sem disparar gatilhos (só como sistema)
async function semGatilhos(q: Q, fn: () => Promise<void>) {
  await q.sistema();
  await q.sql("set local session_replication_role = replica");
  try {
    await fn();
  } finally {
    await q.sql("set local session_replication_role = origin");
  }
}

async function novoUsuarioParceiro(q: Q, parceiro: string, email: string, responsavel = true) {
  await q.sistema();
  const id = (await q.um("select gen_random_uuid() as id")).id as string;
  await q.sql("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  await q.sql("insert into public.perfis (id, nome, email, papel, parceiro_id, is_responsavel_parceiro) values ($1, $2, $2, 'parceiro', $3, $4)",
    [id, email, parceiro, responsavel]);
  return id;
}

async function certificar(q: Q, perfil: string, parceiro: string) {
  await q.sistema();
  const t = (await q.um("select id, titulo from public.trilhas where chave = 'como_vender'"));
  await q.sql("insert into public.certificados (perfil_id, parceiro_id, trilha_id, versao, nome_pessoa, titulo_trilha) values ($1, $2, $3, 1, 'Pessoa', $4)",
    [perfil, parceiro, t.id, t.titulo]);
}

const ICP_TODOS = { vendedores: true, faturamento: true, estruturacao: true, produto: true, nao_varejo_baixo: true };

async function indicacao(q: Q, parceiro: string, razao: string, extra: Record<string, any> = {}) {
  const emp = await empresa(q, "wise");
  await q.como(U.parcerias);
  const r = await q.um("select public.registrar_indicacao($1::jsonb) as id",
    [JSON.stringify({ parceiro_id: parceiro, empresa_grupo_id: emp, cliente_razao_social: razao, ...extra })]);
  return r.id as string;
}

describe("Scorecard e nível de entrada (Apêndice A)", () => {
  const notas = (q75: boolean | "37" | "87") =>
    q75 === true
      ? { base_icp: 1, complementaridade: 1, valores: 1, capacidade_venda: 1, disponibilidade: 1, presenca_regional: 0, reputacao: 0 }
      : q75 === "37"
        ? { base_icp: 1, complementaridade: 0.5, valores: 0.5, capacidade_venda: 1, disponibilidade: 0, presenca_regional: 0, reputacao: 0 }
        : { base_icp: 0.5, complementaridade: 1, valores: 1, capacidade_venda: 1, disponibilidade: 1, presenca_regional: 1, reputacao: 0 };

  async function avaliar(q: Q, carteira: number, n: Record<string, number>) {
    await q.sistema();
    const p = await q.um("insert into public.parceiros (nome_fantasia, carteira_icp) values ($1, $2) returning id", [`Score ${carteira} ${Math.random()}`, carteira]);
    await q.como(U.parcerias);
    const s = await q.um("insert into public.scorecards (parceiro_id, notas) values ($1, $2) returning *", [p.id, JSON.stringify(n)]);
    await q.sistema();
    const par = await q.um("select nivel, nivel_entrada from public.parceiros where id = $1", [p.id]);
    return { s, par, id: p.id as string };
  }

  it("base 60 e qualidade 75%: Elite", () =>
    transacao(async (q) => {
      const { s, par } = await avaliar(q, 60, notas(true));
      expect(Number(s.nota_qualidade)).toBe(75);
      expect(s.nivel_entrada_sugerido).toBe("A");
      expect(par).toEqual({ nivel: "A", nivel_entrada: "A" });
    }));

  it("base 60 e qualidade 37,5%: um nível abaixo (Premium)", () =>
    transacao(async (q) => {
      const { s, par } = await avaliar(q, 60, notas("37"));
      expect(Number(s.nota_qualidade)).toBe(37.5);
      expect(par.nivel_entrada).toBe("B");
    }));

  it("base 20 e qualidade 87,5%: a qualidade não eleva acima da faixa (Premium)", () =>
    transacao(async (q) => {
      const { s, par } = await avaliar(q, 20, notas("87"));
      expect(Number(s.nota_qualidade)).toBe(87.5);
      expect(par.nivel_entrada).toBe("B");
    }));

  it("base baixa com qualidade baixa fica em Select, nunca abaixo", () =>
    transacao(async (q) => {
      const { par } = await avaliar(q, 3, notas("37"));
      expect(par.nivel_entrada).toBe("C");
    }));

  it("nota zero em complementaridade sugere não elegível; proposta exige scorecard completo e, se não elegível, administrador com motivo", () =>
    transacao(async (q) => {
      const { s, id } = await avaliar(q, 60, { ...notas(true), complementaridade: 0 });
      expect(s.nao_elegivel_sugerido).toBe(true);
      await q.sistema();
      await q.sql("update public.parceiros set etapa = 'qualificacao' where id = $1", [id]);
      await q.como(U.parcerias);
      let msg = await q.falha("update public.parceiros set etapa = 'proposta_decisor' where id = $1", [id]);
      expect(msg).toMatch(/elegível|elegivel|administrador/i);
      await q.como(U.admin);
      msg = await q.falha("update public.parceiros set etapa = 'proposta_decisor' where id = $1", [id]);
      expect(msg).toMatch(/motivo|justific/i);
      await q.sql("update public.parceiros set etapa = 'proposta_decisor', elegibilidade_motivo = 'Atua em nicho sem sobreposição real' where id = $1", [id]);
      // Sem scorecard completo, parcerias não avança para proposta
      await q.sistema();
      const p2 = await q.um("insert into public.parceiros (nome_fantasia, carteira_icp, etapa) values ('Sem score', 10, 'qualificacao') returning id");
      await q.como(U.parcerias);
      await q.sql("insert into public.scorecards (parceiro_id, notas) values ($1, '{\"base_icp\": 0}')", [p2.id]);
      msg = await q.falha("update public.parceiros set etapa = 'proposta_decisor' where id = $1", [p2.id]);
      expect(msg).toMatch(/scorecard/i);
    }));
});

describe("Nível por resultado (Apêndice B)", () => {
  it("subida imediata no dia em que cumpre todos os grupos do nível acima", () =>
    transacao(async (q) => {
      const resp = await novoUsuarioParceiro(q, P.C, "gama@parceiro.com");
      let id = await indicacao(q, P.C, "Subida SA", { cliente_cnpj: "45.723.174/0001-10", necessidade: "Estruturar o comercial" });
      await q.sql("select public.validar_indicacao($1, '{\"icp_confirmado\": true}')", [id]);
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 5000 where id = $1", [id]);
      await q.sistema();
      // Sem certificação do responsável ainda não sobe
      expect((await q.um("select nivel from public.parceiros where id = $1", [P.C])).nivel).toBe("C");
      await certificar(q, resp, P.C);
      id = await indicacao(q, P.C, "Outra SA");
      await q.sistema();
      const p = await q.um("select nivel, pacote from public.parceiros where id = $1", [P.C]);
      expect(p).toEqual({ nivel: "B", pacote: "C" }); // o pacote não muda sozinho
      const rv = await q.sql("select resultado from public.revisoes_nivel where parceiro_id = $1", [P.C]);
      expect(rv.map((r) => r.resultado)).toEqual(["subida"]);
    }));

  it("isenção nos primeiros 180 dias; observação; proposta de rebaixamento sem mudança automática; pacote depois da descida", () =>
    transacao(async (q) => {
      await semGatilhos(q, async () => {
        await q.sql("update public.parceiros set data_assinatura = public.hoje() - 300 where id = $1", [P.B]);
      });
      await q.sql("select public.revisao_trimestral(public.hoje())");
      const r1 = await q.sql("select parceiro_id, resultado from public.revisoes_nivel where parceiro_id in ($1, $2)", [P.A, P.B]);
      expect(r1.find((r) => r.parceiro_id === P.A)?.resultado).toBe("isento");
      expect(r1.find((r) => r.parceiro_id === P.B)?.resultado).toBe("observacao");
      expect((await q.um("select em_observacao_ate is not null as obs, nivel from public.parceiros where id = $1", [P.B]))).toEqual({ obs: true, nivel: "B" });
      // Próximo trimestre, ainda sem cumprir: proposta, sem mudar o nível
      await q.sql("select public.revisao_trimestral((date_trunc('quarter', public.hoje()) + interval '3 months')::date)");
      const prop = await q.um("select id, resultado from public.revisoes_nivel where parceiro_id = $1 and resultado = 'proposta_rebaixamento'", [P.B]);
      expect(prop).toBeTruthy();
      expect((await q.um("select nivel from public.parceiros where id = $1", [P.B])).nivel).toBe("B");
      // Decisão de uma pessoa, com motivo
      await q.como(U.consultor);
      await q.falha("select public.decidir_rebaixamento($1, true, 'x')", [prop.id]);
      await q.como(U.parcerias);
      await q.falha("select public.decidir_rebaixamento($1, true, '')", [prop.id]);
      await q.sql("select public.decidir_rebaixamento($1, true, 'Sem indicações há dois trimestres')", [prop.id]);
      await q.sistema();
      const p = await q.um("select nivel, pacote, pacote_pendente, pacote_pendente_em - public.hoje() as dias from public.parceiros where id = $1", [P.B]);
      expect(p).toEqual({ nivel: "C", pacote: "B", pacote_pendente: "C", dias: 30 });
      await q.sql("update public.parceiros set pacote_pendente_em = public.hoje() where id = $1", [P.B]);
      await q.sql("select public.aplicar_pacotes_pendentes()");
      expect((await q.um("select pacote, pacote_pendente from public.parceiros where id = $1", [P.B]))).toEqual({ pacote: "C", pacote_pendente: null });
    }));
});

describe("Indicações v2 (Apêndice E)", () => {
  it("nota de qualidade e indicação qualificada", () =>
    transacao(async (q) => {
      const id = await indicacao(q, P.A, "Qualidade SA", {
        cliente_cnpj: "45.723.174/0001-10", contato_nome: "Ana", consentimento: true, necessidade: "Time sem processo", aderencia_icp: ICP_TODOS,
      });
      let i = await q.um("select nota_qualidade, qualificada from public.indicacoes where id = $1", [id]);
      expect(i).toEqual({ nota_qualidade: 70, qualificada: false });
      await q.sql("select public.validar_indicacao($1, '{\"icp_confirmado\": true}')", [id]);
      await q.sql("update public.indicacoes set etapa = 'reuniao' where id = $1", [id]);
      i = await q.um("select nota_qualidade, qualificada from public.indicacoes where id = $1", [id]);
      expect(i).toEqual({ nota_qualidade: 90, qualificada: true });
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 1000 where id = $1", [id]);
      expect((await q.um("select nota_qualidade from public.indicacoes where id = $1", [id])).nota_qualidade).toBe(100);
    }));

  it("SLA vencido nos dois sentidos gera um aviso por prazo", () =>
    transacao(async (q) => {
      const ida = await indicacao(q, P.A, "SLA Ida SA");
      const emp = await empresa(q, "wise");
      await q.como(U.parcerias);
      const volta = (await q.um("select public.registrar_indicacao($1::jsonb) as id",
        [JSON.stringify({ sentido: "grupo_para_parceiro", parceiro_id: P.A, empresa_grupo_id: emp, cliente_razao_social: "SLA Volta SA" })])).id;
      await semGatilhos(q, async () => {
        await q.sql("update public.indicacoes set data = public.hoje() - 10, created_at = now() - interval '10 days', sla = '{}' where id in ($1, $2)", [ida, volta]);
      });
      await q.sql("update public.indicacoes set sla = public.calcular_sla(i) from public.indicacoes i where i.id = indicacoes.id and indicacoes.id in ($1, $2)", [ida, volta]);
      const v1 = await q.um("select public.sla_vencidos(i) as v from public.indicacoes i where id = $1", [ida]);
      expect(v1.v).toEqual(expect.arrayContaining(["validacao", "retorno_parceiro"]));
      const v2 = await q.um("select public.sla_vencidos(i) as v from public.indicacoes i where id = $1", [volta]);
      expect(v2.v).toEqual(expect.arrayContaining(["primeiro_contato_parceiro", "atualizacao_parceiro"]));
      await q.sql("select public.rotina_diaria()");
      await q.sql("select public.rotina_diaria()");
      const n = await q.um("select count(*)::int n from public.notificacoes where tipo = 'sla_vencido' and dados->>'indicacao_id' = $1 and usuario_id = $2", [ida, U.parcerias]);
      expect(n.n).toBe(2); // validação e retorno, uma vez cada, mesmo com a rotina rodando duas vezes
      const np = await q.um("select count(*)::int n from public.notificacoes where tipo = 'sla_vencido' and dados->>'indicacao_id' = $1 and usuario_id = $2", [volta, U.parceiroA]);
      expect(np.n).toBeGreaterThanOrEqual(2);
      const pend = await q.um("select public.pendencias_diarias() as p");
      const meu = pend.p.find((x: any) => x.usuario_id === U.parcerias);
      expect(meu.itens.sla_vencido.some((x: any) => x.texto.includes("SLA Ida SA"))).toBe(true);
    }));

  it("pontos do ranking são únicos por evento", () =>
    transacao(async (q) => {
      const id = await indicacao(q, P.A, "Pontos SA", { cliente_cnpj: "45.723.174/0001-10", necessidade: "Processo", aderencia_icp: ICP_TODOS });
      await q.sql("select public.validar_indicacao($1, '{\"icp_confirmado\": true}')", [id]);
      await q.sql("update public.indicacoes set etapa = 'reuniao' where id = $1", [id]);
      await q.sql("update public.indicacoes set observacoes = 'ok' where id = $1", [id]);
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 1000 where id = $1", [id]);
      await q.sql("update public.indicacoes set valor_base = 2000 where id = $1", [id]);
      await q.sistema();
      await q.sql("select public.lancar_pontos($1, 'reuniao', $2, public.hoje())", [P.A, id]);
      const pts = await q.sql("select evento, pontos from public.pontos_ranking where referencia_id = $1 order by evento", [id]);
      expect(pts).toEqual([
        { evento: "cliente_icp", pontos: 10 },
        { evento: "indicacao_qualificada", pontos: 2 },
        { evento: "reuniao", pontos: 3 },
      ]);
    }));
});

describe("Onboarding e ativação (Apêndice F)", () => {
  it("ativa na primeira indicação no ICP que virou reunião; reunião futura só ativa no dia", () =>
    transacao(async (q) => {
      const futura = await indicacao(q, P.E, "Futura SA");
      await q.sql("select public.validar_indicacao($1, '{\"icp_confirmado\": true}')", [futura]);
      await q.sql("update public.indicacoes set data_reuniao = public.hoje() + 3, etapa = 'reuniao' where id = $1", [futura]);
      await q.sistema();
      expect((await q.um("select situacao from public.planos_onboarding where parceiro_id = $1", [P.E])).situacao).toBe("em_andamento");
      await semGatilhos(q, async () => {
        await q.sql("update public.indicacoes set data_reuniao = public.hoje() where id = $1", [futura]);
      });
      await q.sql("select public.rotina_diaria()");
      const pl = await q.um("select situacao, indicacao_ativacao_id from public.planos_onboarding where parceiro_id = $1", [P.E]);
      expect(pl).toEqual({ situacao: "ativado", indicacao_ativacao_id: futura });
      expect((await q.um("select etapa from public.parceiros where id = $1", [P.E])).etapa).toBe("parceria_ativa");
    }));

  it("90 dias sem ativação: estende até 120, avisa e cria próximo passo; depois de 120 fica não ativado", () =>
    transacao(async (q) => {
      await semGatilhos(q, async () => {
        await q.sql("update public.planos_onboarding set inicio = public.hoje() - 91, prazo_final = public.hoje() - 1 where parceiro_id = $1", [P.C]);
      });
      await q.sql("select public.rotina_diaria()");
      const pl = await q.um("select situacao, estendido_ate - inicio as dias, alertado_90 from public.planos_onboarding where parceiro_id = $1", [P.C]);
      expect(pl).toEqual({ situacao: "em_andamento", dias: 120, alertado_90: true });
      expect((await q.sql("select * from public.proximos_passos where parceiro_id = $1 and descricao like 'Onboarding sem ativação%'", [P.C])).length).toBe(1);
      expect((await q.sql("select * from public.notificacoes where tipo = 'onboarding_sem_ativacao' and dados = '{}' and usuario_id = $1", [U.parcerias])).length).toBeGreaterThan(0);
      await semGatilhos(q, async () => {
        await q.sql("update public.planos_onboarding set estendido_ate = public.hoje() - 1 where parceiro_id = $1", [P.C]);
      });
      await q.sql("select public.rotina_diaria()");
      expect((await q.um("select situacao from public.planos_onboarding where parceiro_id = $1", [P.C])).situacao).toBe("nao_ativado");
    }));
});

describe("Faixas, ranking e desligamento (Apêndices C, D e K)", () => {
  it("faixas com 20 parceiros pontuados: 1 destaque, 3 potencial, 16 base", () =>
    transacao(async (q) => {
      const ids: string[] = [];
      await semGatilhos(q, async () => {
        for (let k = 1; k <= 20; k++) {
          const p = await q.um(
            "insert into public.parceiros (nome_fantasia, tipo_parceria, etapa, data_assinatura, nivel, pacote) values ($1, 'comercial', 'parceria_ativa', public.hoje() - 30, 'C', 'C') returning id",
            [`Faixa ${k}`]);
          ids.push(p.id);
          await q.sql("insert into public.pontos_ranking (parceiro_id, evento, pontos, referencia_id, data) values ($1, 'cliente_icp', $2, gen_random_uuid(), public.hoje())", [p.id, k]);
        }
      });
      await q.sql("select public.calcular_faixas()");
      const f = await q.sql("select faixa, count(*)::int n from public.faixas where parceiro_id = any($1::uuid[]) group by faixa order by faixa", [ids]);
      expect(f).toEqual([{ faixa: "base", n: 16 }, { faixa: "destaque", n: 1 }, { faixa: "potencial", n: 3 }]);
      expect((await q.um("select parceiro_id from public.faixas where faixa = 'destaque'")).parceiro_id).toBe(ids[19]);
    }));

  it("fluxo de desligamento completo: risco, duas tentativas, sugestão, aprovação do Diretor, aviso e encerramento", () =>
    transacao(async (q) => {
      await semGatilhos(q, async () => {
        await q.sql("update public.parceiros set data_assinatura = public.hoje() - 200 where id = $1", [P.B]);
        await q.sql("update public.indicacoes set created_at = now() - interval '200 days' where parceiro_id = $1", [P.B]);
      });
      await q.sql("select public.avaliar_desligamentos()");
      const f = await q.um("select id, estado from public.fluxos_desligamento where parceiro_id = $1", [P.B]);
      expect(f.estado).toBe("tentativa_1");
      expect((await q.sql("select * from public.fluxos_desligamento where parceiro_id in ($1, $2, $3)", [P.A, P.C, P.E])).length).toBe(0);
      await q.como(U.parcerias);
      expect(await q.falha("select public.registrar_tentativa_retomada($1)", [f.id])).toMatch(/15 dias/);
      await semGatilhos(q, async () => {
        await q.sql("update public.fluxos_desligamento set tentativa_1_em = public.hoje() - 16 where id = $1", [f.id]);
      });
      await q.como(U.parcerias);
      await q.sql("select public.registrar_tentativa_retomada($1, 'Ligação sem retorno')", [f.id]);
      await q.sistema();
      await q.sql("select public.avaliar_desligamentos()");
      expect((await q.um("select estado from public.fluxos_desligamento where id = $1", [f.id])).estado).toBe("tentativa_2");
      await semGatilhos(q, async () => {
        await q.sql("update public.fluxos_desligamento set tentativa_2_em = public.hoje() - 31 where id = $1", [f.id]);
        await q.sql("update public.pontos_contato set created_at = now() - interval '40 days', data = now() - interval '40 days' where parceiro_id = $1", [P.B]);
      });
      await q.sql("select public.avaliar_desligamentos()");
      expect((await q.um("select estado from public.fluxos_desligamento where id = $1", [f.id])).estado).toBe("sugerido");
      expect((await q.sql("select * from public.notificacoes where tipo = 'desligamento_para_aprovar' and usuario_id = $1", [U.diretor])).length).toBe(1);
      // Só o Diretor decide
      for (const u of [U.parcerias, U.admin]) {
        await q.como(u);
        await q.falha("select public.decidir_desligamento($1, true)", [f.id]);
      }
      await q.como(U.diretor);
      await q.sql("select public.decidir_desligamento($1, true)", [f.id]);
      await q.como(U.admin);
      const texto = (await q.um("select public.gerar_aviso_desligamento($1) as t", [f.id])).t as string;
      expect(texto).toMatch(/13\.4/);
      expect(texto).not.toMatch(/[\u2013\u2014]/);
      await q.sistema();
      expect((await q.um("select public.elegivel_rfp($1) as e", [P.B])).e).toBe(false);
      expect((await q.um("select data_encerramento - public.hoje() as d from public.fluxos_desligamento where id = $1", [f.id])).d).toBe(30);
      await q.sql("update public.fluxos_desligamento set data_encerramento = public.hoje() where id = $1", [f.id]);
      await q.sql("select public.avaliar_desligamentos()");
      const p = await q.um("select etapa, motivo_perda from public.parceiros where id = $1", [P.B]);
      expect(p).toEqual({ etapa: "parceria_encerrada", motivo_perda: "Desligamento por inatividade" });
      expect((await q.sql("select * from public.links_indicacao where parceiro_id = $1 and ativo", [P.B])).length).toBe(0);
      expect((await q.sql("select * from public.perfis where parceiro_id = $1 and ativo", [P.B])).length).toBe(0);
      // Indicações abertas e comissões continuam
      expect((await q.sql("select * from public.comissoes where parceiro_id = $1 and estado <> 'cancelada'", [P.B])).length).toBeGreaterThan(0);
    }));

  it("indicação qualificada durante o fluxo cancela o desligamento", () =>
    transacao(async (q) => {
      await semGatilhos(q, async () => {
        await q.sql("update public.parceiros set data_assinatura = public.hoje() - 200 where id = $1", [P.B]);
        await q.sql("update public.indicacoes set created_at = now() - interval '200 days' where parceiro_id = $1", [P.B]);
      });
      await q.sql("select public.avaliar_desligamentos()");
      const id = await indicacao(q, P.B, "Retomada SA", { cliente_cnpj: "45.723.174/0001-10", necessidade: "Processo" });
      await q.sql("select public.validar_indicacao($1, '{\"icp_confirmado\": true}')", [id]);
      await q.sistema();
      expect((await q.um("select estado from public.fluxos_desligamento where parceiro_id = $1", [P.B])).estado).toBe("cancelado");
    }));
});

describe("Resultado do canal (História 1)", () => {
  it("ROI do exemplo: receita 72.000, custo 4.318,18, ROI 1.567% e custo por cliente 4.318,18", () =>
    transacao(async (q) => {
      // Tira do período as indicações dos dados fictícios
      await semGatilhos(q, async () => {
        await q.sql("update public.indicacoes set data_fechamento = '2026-01-15'");
      });
      const g = "00000000-0000-4000-a000-0000000000aa";
      await q.sql("insert into auth.users (id, email) values ($1, 'guilherme@wisemakers.com.br')", [g]);
      await q.sql("insert into public.perfis (id, nome, email, papel) values ($1, 'Guilherme Faccin', 'guilherme@wisemakers.com.br', 'parcerias') on conflict (id) do update set papel = 'parcerias', ativo = true", [g]);
      expect(Number((await q.um("select public.custo_hora_em($1, '2026-10-20') as c", [g])).c)).toBeCloseTo(4500 / 220, 10);
      const tipo = (await q.um("select id from public.tipos_atividade where chave = 'gestao_geral'")).id;
      await q.sql("insert into public.atividades (parceiro_id, tipo_atividade_id, data, minutos, pessoa_id) values (null, $1, '2026-10-20', 2400, $2)", [tipo, g]);
      const id = await indicacao(q, P.A, "ROI SA");
      await semGatilhos(q, async () => {
        await q.sql("update public.indicacoes set data = '2026-10-01' where id = $1", [id]);
      });
      await q.sql("update public.indicacoes set etapa = 'fechada', valor_base = 6000, prazo_meses = 12, icp_confirmado = true, data_fechamento = '2026-10-20' where id = $1", [id]);
      await q.sql("insert into public.custos_diretos (data, categoria, valor, descricao, parceiro_id) values ('2026-10-20', 'evento', 500, 'Café da manhã com a carteira', $1)", [P.A]);
      await q.como(U.admin);
      const r = (await q.um("select public.resultado_canal('2026-10-01', '2026-10-31') as r")).r;
      expect(Number(r.total.receita_atribuida)).toBe(72000);
      expect(Number(r.total.comissoes_parceiro)).toBe(2400);
      expect(Number(r.total.comissoes_responsavel)).toBe(600);
      expect(Number(r.total.custo_horas)).toBe(818.18);
      expect(Number(r.total.custo_total)).toBe(4318.18);
      expect(Math.round(Number(r.total.roi) * 100)).toBe(1567);
      expect(Number(r.total.custo_por_cliente)).toBe(4318.18);
      expect(Number(r.total.tempo_retorno_meses)).toBe(0.72);
      const porParceiro = (await q.um("select public.resultado_canal('2026-10-01', '2026-10-31', 'parceiro') as r")).r;
      expect(porParceiro.grupos.find((x: any) => x.chave === P.A).receita_atribuida).toBe(72000);
      expect(Number(porParceiro.geral.custo_horas)).toBe(818.18);
      const linhas = await q.sql("select tipo_linha, valor from public.planilha_custos('2026-10-01', '2026-10-31') order by tipo_linha");
      expect(linhas.map((l) => l.tipo_linha)).toEqual(["comissao_parceiro", "comissao_responsavel", "custo_direto", "hora", "receita"]);
    }));

  it("horas de quem não tem custo-hora entram somadas e geram aviso", () =>
    transacao(async (q) => {
      const tipo = (await q.um("select id from public.tipos_atividade where chave = 'ligacao'")).id;
      await q.sql("insert into public.atividades (parceiro_id, tipo_atividade_id, data, minutos, pessoa_id) values ($1, $2, '2026-10-20', 90, $3)", [P.A, tipo, U.consultor]);
      await q.como(U.admin);
      const r = (await q.um("select public.resultado_canal('2026-10-01', '2026-10-31') as r")).r;
      expect(Number(r.total.horas_sem_custo)).toBe(1.5);
      expect(r.avisos.join(" ")).toMatch(/subestimado/);
    }));
});

describe("Cruzamento de carteiras (História 14)", () => {
  const raiz = (k: number) => String(10000000 + k * 7919).padStart(8, "0");

  it("50 CNPJs com 5 coincidências: só as 5 ficam gravadas, e o parceiro vê só os totais", () =>
    transacao(async (q) => {
      const emp = await empresa(q, "wise");
      const enviados = Array.from({ length: 50 }, (_, k) => raiz(k + 1));
      const base: string[] = [];
      for (let k = 0; k < 5; k++) {
        const b = await q.um("insert into public.base_wise_cruzamento (cnpj_raiz, razao_social, tipo, empresa_grupo_id) values ($1, $2, $3, $4) returning id",
          [enviados[k * 10], `Base ${k}`, k % 2 ? "prospect" : "cliente", emp]);
        base.push(b.id);
      }
      await q.sql("update public.parceiros set aceita_cruzamento_contrato = true where id = $1", [P.A]);
      await q.como(U.parceiroB);
      expect(await q.falha("select public.aceitar_termo_cruzamento()")).toMatch(/cláusula|contrato/);
      await q.como(U.parceiroA);
      const aceite = (await q.um("select public.aceitar_termo_cruzamento() as id")).id;
      // A Edge Function compara em memória e manda só as coincidências e o total enviado
      const coincidencias = base.map((id, k) => ({ base_wise_id: id, tipo_parceiro: k < 3 ? "cliente" : "prospect" }));
      await q.sistema();
      expect(await q.falha("select public.registrar_coincidencias($1, $2, '[]', '{\"total_enviado\": 19}')", [P.A, aceite])).toMatch(/entre 20/);
      const r = (await q.um("select public.registrar_coincidencias($1, $2, $3, '{\"total_enviado\": 50}') as r", [P.A, aceite, JSON.stringify(coincidencias)])).r;
      expect(r.totais).toMatchObject({ total_enviado: 50, coincidencias: 5 });
      // Nenhum dos 45 não coincidentes existe em tabela ou armazenamento
      const tabelas = await q.sql("select table_schema, table_name from information_schema.tables where table_schema in ('public', 'storage') and table_type = 'BASE TABLE'");
      const naoCoincidentes = enviados.filter((_, k) => k % 10 !== 0);
      expect(naoCoincidentes).toHaveLength(45);
      for (const t of tabelas) {
        const linhas = await q.sql(`select t::text as l from ${t.table_schema}.${t.table_name} t`);
        const texto = linhas.map((x) => x.l).join("\n");
        for (const c of naoCoincidentes) expect(texto.includes(c), `${c} em ${t.table_name}`).toBe(false);
      }
      // Segundo envio no mesmo mês: recusado
      await q.como(U.parceiroA);
      expect(await q.falha("select public.aceitar_termo_cruzamento()")).toMatch(/30 dias/);
      // Parceiro vê totais, nunca as coincidências
      const meus = await q.sql("select totais from public.cruzamentos");
      expect(meus).toHaveLength(1);
      expect(await q.sql("select * from public.coincidencias_cruzamento")).toHaveLength(0);
      // Exclusão sob pedido, imediata
      expect((await q.um("select public.excluir_cruzamentos() as n")).n).toBe(5);
    }));
});

describe("Link exclusivo de indicação (/i/:token)", () => {
  it("token inválido, revogado, limite estourado, campo oculto e duplicidade devolvem a mesma resposta e não gravam indicação", () =>
    transacao(async (q) => {
      await q.sistema();
      const token = (await q.um("select token from public.links_indicacao where parceiro_id = $1 and ativo", [P.A])).token as string;
      const dados = (extra: Record<string, any> = {}) => JSON.stringify({ cliente_razao_social: "Link SA", contato_nome: "Bia", consentimento: true, ...extra });
      const contar = async () => (await q.um("select (select count(*) from public.indicacoes)::int + (select count(*) from public.clientes)::int as n")).n;
      const envia = async (t: string, d: string, h = "ip1") => (await q.um("select public.indicacao_publica($1, $2::jsonb, $3) as r", [t, d, h])).r;

      expect((await q.um("select public.link_indicacao_publico($1) as r", [token])).r.estado).toBe("ok");
      expect((await q.um("select public.link_indicacao_publico('x') as r")).r).toEqual({ estado: "indisponivel" });

      const antes = await contar();
      expect(await envia("x".repeat(40), dados())).toEqual({ ok: true });
      expect(await envia(token, dados({ website: "http://spam" }))).toEqual({ ok: true });
      expect(await envia(token, dados({ consentimento: false }))).toEqual({ ok: true });
      expect(await contar()).toBe(antes);

      // Válido: grava com origem link_parceiro e avisa o parceiro
      expect(await envia(token, dados({ cliente_cnpj: "45.723.174/0001-10" }))).toEqual({ ok: true });
      const i = await q.um("select origem, parceiro_id, sentido from public.indicacoes where link_id is not null");
      expect(i).toEqual({ origem: "link_parceiro", parceiro_id: P.A, sentido: "parceiro_para_grupo" });
      // Mesmo CNPJ em 24 horas: descartado
      const depois = await contar();
      expect(await envia(token, dados({ cliente_cnpj: "45723174000110", cliente_razao_social: "Outro nome" }))).toEqual({ ok: true });
      expect(await contar()).toBe(depois);
      // Cliente protegido por outro parceiro: neutro, sem gravar, aviso ao responsável
      const tokenB = (await q.um("select token from public.links_indicacao where parceiro_id = $1 and ativo", [P.B])).token as string;
      expect(await envia(tokenB, dados({ cliente_cnpj: "45723174000110" }), "ip2")).toEqual({ ok: true });
      expect(await contar()).toBe(depois);
      expect((await q.sql("select * from public.notificacoes where tipo = 'indicacao_duplicada'")).length).toBe(1);
      // Limite por hora
      await q.sql("update public.configuracoes set valor = '1' where chave = 'link_limite_hora'");
      expect(await envia(token, dados({ cliente_razao_social: "Limite SA" }), "ip3")).toEqual({ ok: true });
      const aposPrimeiro = await contar();
      expect(await envia(token, dados({ cliente_razao_social: "Limite Dois SA" }), "ip3")).toEqual({ ok: true });
      expect(await contar()).toBe(aposPrimeiro);
      // Revogado
      await q.como(U.parcerias);
      await q.sql("select public.revogar_link_indicacao($1)", [P.A]);
      await q.sistema();
      expect(await envia(token, dados({ cliente_razao_social: "Revogado SA" }), "ip4")).toEqual({ ok: true });
      expect(await contar()).toBe(aposPrimeiro);
      expect((await q.um("select public.link_indicacao_publico($1) as r", [token])).r).toEqual({ estado: "indisponivel" });
    }));
});

describe("Ações da Wise e decisões do cruzamento", () => {
  it("concluir ação mescla alcance e inscritos e mantém comprovada com o link já guardado", () =>
    transacao(async (q) => {
      await q.sistema();
      const a = (await q.um("select id from public.acoes_wise where parceiro_id = $1 limit 1", [P.A])).id;
      await q.como(U.parcerias);
      await q.sql("select public.concluir_acao_wise($1, '{\"comprovacao_link\": \"https://x.com/post\", \"alcance\": 10, \"inscritos\": 3}')", [a]);
      await q.sql("select public.concluir_acao_wise($1, '{\"observacao\": \"ajuste\", \"inscritos\": 4}')", [a]);
      await q.sistema();
      const r = await q.um("select estado, resultado from public.acoes_wise where id = $1", [a]);
      expect(r).toEqual({ estado: "comprovada", resultado: { alcance: 10, inscritos: 4 } });
    }));

  it("decisão de coincidência pode ser desfeita", () =>
    transacao(async (q) => {
      const emp = (await q.um("select id from public.empresas_grupo where codigo = 'wise'")).id;
      const b = await q.um("insert into public.base_wise_cruzamento (cnpj_raiz, razao_social, tipo, empresa_grupo_id) values ('12345678', 'X', 'cliente', $1) returning id", [emp]);
      const ac = await q.um("insert into public.aceites_cruzamento (parceiro_id, perfil_id, versao_termo) values ($1, $2, 1) returning id", [P.A, U.parceiroA]);
      const cz = await q.um("insert into public.cruzamentos (parceiro_id, aceite_id, total_enviado) values ($1, $2, 20) returning id", [P.A, ac.id]);
      const c = await q.um("insert into public.coincidencias_cruzamento (cruzamento_id, parceiro_id, base_wise_id, tipo_parceiro, quadrante, acao_sugerida, expira_em) values ($1, $2, $3, 'cliente', 'cliente_comum', 'Case', current_date + 10) returning id", [cz.id, P.A, b.id]);
      await q.como(U.parcerias);
      await q.sql("select public.decidir_coincidencia($1, 'descartar')", [c.id]);
      await q.sql("select public.decidir_coincidencia($1, null)", [c.id]);
      expect(await q.um("select descartada, virou from public.coincidencias_cruzamento where id = $1", [c.id])).toEqual({ descartada: false, virou: null });
    }));
});
