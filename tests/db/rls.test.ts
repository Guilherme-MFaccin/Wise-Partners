// Princípio II (não negociável): cada público vê só o que é seu. Um teste por linha da matriz
// do briefing técnico (seção 3), com usuários de cada papel e dois parceiros distintos.
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Parceiro: só a própria parceria", () => {
  it("vê apenas o próprio parceiro, mesmo tentando o id de outro", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const ps = await q.sql("select id from public.parceiros");
      expect(ps.map((p) => p.id)).toEqual([P.A]);
      expect(await q.sql("select * from public.parceiros where id = $1", [P.B])).toHaveLength(0);
      expect(await q.sql("select * from public.parceiro_categorias where parceiro_id = $1", [P.B])).toHaveLength(0);
      expect(await q.sql("select * from public.contrapartidas where parceiro_id = $1", [P.B])).toHaveLength(0);
      expect(await q.sql("select * from public.indicacoes where parceiro_id = $1", [P.B])).toHaveLength(0);
      expect(await q.sql("select * from public.tarefas_onboarding where parceiro_id = $1", [P.B])).toHaveLength(0);
      expect(await q.sql("select * from public.ciclos_base_ativa where parceiro_id <> $1", [P.A])).toHaveLength(0);
    }));

  it("nunca vê marcação estratégica, anotações, instrumento, histórico nem pontos de contato", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      expect(await q.sql("select * from public.parceiros_interno")).toHaveLength(0);
      expect(await q.sql("select * from public.parceiros_instrumento")).toHaveLength(0);
      expect(await q.sql("select * from public.historico")).toHaveLength(0);
      expect(await q.sql("select * from public.pontos_contato")).toHaveLength(0);
      expect(await q.sql("select * from public.proximos_passos")).toHaveLength(0);
      expect(await q.sql("select * from public.quadros_identificacao")).toHaveLength(0);
      expect(await q.sql("select * from public.aprovacoes")).toHaveLength(0);
      expect(await q.sql("select * from public.pedidos_rfp")).toHaveLength(0);
      expect(await q.sql("select * from public.pedido_rfp_opcoes")).toHaveLength(0);
    }));

  it("vê só a própria comissão como beneficiário, nunca a do responsável pela parceria", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const cs = await q.sql("select beneficiario, parceiro_id from public.comissoes");
      expect(cs.length).toBe(1);
      expect(cs[0]).toEqual({ beneficiario: "parceiro", parceiro_id: P.A });
    }));

  it("não vê campos internos da ficha (ex.: principais concorrentes)", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const campos = await q.sql("select chave from public.campos_categoria where interno");
      expect(campos).toHaveLength(0);
      const valores = await q.sql("select valor::text from public.parceiro_campos");
      expect(valores.some((v) => v.valor.includes("Concorrente secreto"))).toBe(false);
      expect(valores.length).toBeGreaterThan(0);
    }));

  it("vê só documentos marcados como visíveis, inclusive no armazenamento", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const docs = await q.sql("select nome from public.documentos");
      expect(docs.map((d) => d.nome)).toEqual(["Certificado"]);
      const arqs = await q.sql("select name from storage.objects where bucket_id = 'documentos'");
      expect(arqs.map((a) => a.name)).toEqual([`${P.A}/cert.pdf`]);
    }));

  it("vê clientes só das próprias indicações", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const cl = await q.sql("select razao_social from public.clientes");
      expect(cl.map((c) => c.razao_social)).toEqual(["Cliente do Alfa"]);
    }));

  it("lê só os parâmetros públicos da configuração", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const cfg = await q.sql("select chave from public.configuracoes order by chave");
      expect(cfg.map((c) => c.chave)).toEqual(["calendario_eventos", "calendario_mentoria", "materiais_parceiro", "wise_hub_url"]);
      expect(await q.sql("select * from public.catalogo_contrapartidas")).toHaveLength(0);
      expect(await q.sql("select * from public.textos_email")).toHaveLength(0);
    }));

  it("vê usuários da própria empresa e o responsável Wise, nunca outros", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const ids = (await q.sql("select id from public.perfis order by email")).map((p) => p.id).sort();
      expect(ids).toEqual([U.parceiroA, U.parceiroA2, U.parcerias].sort());
    }));

  it("não altera a ficha publicada nem dados do parceiro diretamente", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const r = await q.sql("update public.parceiros set nome_fantasia = 'Hackeado' where id = $1 returning id", [P.A]);
      expect(r).toHaveLength(0);
      const r2 = await q.sql("update public.parceiro_campos set valor = '\"x\"' where parceiro_id = $1 returning 1", [P.A]);
      expect(r2).toHaveLength(0);
      await q.falha("insert into public.parceiro_campos (parceiro_id, campo_id, valor) select $1, id, '\"x\"' from public.campos_categoria limit 1", [P.A]);
    }));

  it("não propõe ficha nem envia comprovação em nome de outro parceiro", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const msg = await q.falha("insert into public.propostas_ficha (parceiro_id, valores) values ($1, '{}')", [P.B]);
      expect(msg).toMatch(/row-level security/);
      await q.sistema();
      const cpB = await q.um("select id from public.contrapartidas where parceiro_id = $1 limit 1", [P.B]);
      await q.como(U.parceiroA);
      await q.falha("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, enviada_por) values ($1, $2, 'http://x', $3)", [cpB.id, P.B, U.parceiroA]);
      await q.falha("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, enviada_por) values ($1, $2, 'http://x', $3)", [cpB.id, P.A, U.parceiroA]);
      await q.falha("insert into storage.objects (bucket_id, name) values ('comprovacoes', $1::text || '/x.png')", [P.B]);
      const ok = await q.sql("insert into storage.objects (bucket_id, name) values ('comprovacoes', $1::text || '/x.png') returning id", [P.A]);
      expect(ok).toHaveLength(1);
    }));

  it("não valida a própria comprovação", () =>
    transacao(async (q) => {
      await q.sistema();
      const cp = await q.um("select id from public.contrapartidas where parceiro_id = $1 limit 1", [P.A]);
      await q.como(U.parceiroA);
      const c = await q.um("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, enviada_por) values ($1, $2, 'http://x', $3) returning id", [cp.id, P.A, U.parceiroA]);
      const r = await q.sql("update public.comprovacoes set estado = 'validada' where id = $1 returning id", [c.id]);
      expect(r).toHaveLength(0);
    }));

  it("indica para o grupo pela função, sempre como origem portal do parceiro e para si mesmo", () =>
    transacao(async (q) => {
      await q.sistema();
      const emp = await q.um("select id from public.empresas_grupo where codigo = 'triade'");
      await q.como(U.parceiroA);
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id', $1::text, 'sentido', 'grupo_para_parceiro', 'empresa_grupo_id', $2::text, 'cliente_razao_social', 'Novo Cliente SA')) as id", [P.B, emp.id]);
      await q.sistema();
      const i = await q.um("select parceiro_id, sentido, origem from public.indicacoes where id = $1", [r.id]);
      expect(i).toEqual({ parceiro_id: P.A, sentido: "parceiro_para_grupo", origem: "portal_parceiro" });
      await q.como(U.parceiroA);
      await q.falha("insert into public.indicacoes (sentido, parceiro_id, empresa_grupo_id, cliente_id, origem) select 'parceiro_para_grupo', $1, $2, id, 'outra' from public.clientes limit 1", [P.A, emp.id]);
    }));

  it("usuário de parceiro desativado perde o acesso e o histórico é mantido", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      await q.sql("select public.definir_acesso_usuario_parceiro($1, false)", [U.parceiroA2]);
      await q.como(U.parceiroA2);
      expect(await q.sql("select * from public.parceiros")).toHaveLength(0);
      expect(await q.sql("select * from public.comissoes")).toHaveLength(0);
      await q.sistema();
      const h = await q.sql("select * from public.historico where tabela = 'perfis' and registro_id = $1 and campo = 'ativo'", [U.parceiroA2]);
      expect(h[0].valor_novo).toBe("false");
      // Responsável de outra empresa não desativa usuários do parceiro A
      await q.como(U.parceiroB);
      await q.falha("select public.definir_acesso_usuario_parceiro($1, false)", [U.parceiroA]);
      // Usuário comum do parceiro não desativa ninguém
      await q.como(U.parceiroA2);
      await q.falha("select public.definir_acesso_usuario_parceiro($1, false)", [U.parceiroA]);
    }));

  it("não muda o próprio papel nem se vincula a outro parceiro", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA2);
      await q.falha("update public.perfis set papel = 'admin' where id = $1", [U.parceiroA2]);
      await q.falha("update public.perfis set parceiro_id = $2 where id = $1", [U.parceiroA2, P.B]);
      const r = await q.sql("update public.perfis set telefone = '44 9999' where id = $1 returning id", [U.parceiroA2]);
      expect(r).toHaveLength(1);
    }));
});

describe("Consultor, gerente de conta e comercial: sem comissões", () => {
  for (const papel of ["consultor", "comercial"] as const) {
    it(`${papel} lê parceiros e anotações internas, mas nenhum valor de comissão`, () =>
      transacao(async (q) => {
        await q.como(U[papel]);
        expect((await q.sql("select id from public.parceiros")).length).toBe(5);
        expect((await q.sql("select * from public.parceiros_interno where estrategico")).length).toBe(1);
        expect(await q.sql("select * from public.comissoes")).toHaveLength(0);
        expect(await q.sql("select * from public.parceiros_instrumento")).toHaveLength(0);
        const painel = await q.um("select public.painel_semanal() as p");
        expect(painel.p.comissoes).toBeNull();
        expect(await q.sql("select * from public.historico")).toHaveLength(0);
        // Leem indicações, sem valores de comissão (que ficam só na tabela comissoes)
        expect((await q.sql("select * from public.indicacoes")).length).toBeGreaterThan(0);
      }));
  }

  it("consultor registra ponto de contato, mas não altera o parceiro nem aprova assinatura", () =>
    transacao(async (q) => {
      await q.como(U.consultor);
      const r = await q.sql("insert into public.pontos_contato (parceiro_id, tipo, texto, autor_id) values ($1, 'ligacao', 'ok', $2) returning id", [P.B, U.consultor]);
      expect(r).toHaveLength(1);
      expect(await q.sql("update public.parceiros set etapa = 'retornou' where id = $1 returning id", [P.D])).toHaveLength(0);
      await q.falha("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [P.D, U.consultor]);
      await q.falha("insert into public.pontos_contato (parceiro_id, tipo, texto, autor_id) values ($1, 'ligacao', 'ok', $2)", [P.B, U.parcerias]);
    }));

  it("comercial não registra ponto de contato e não vê contratos", () =>
    transacao(async (q) => {
      await q.como(U.comercial);
      await q.falha("insert into public.pontos_contato (parceiro_id, tipo, texto, autor_id) values ($1, 'ligacao', 'ok', $2)", [P.B, U.comercial]);
      expect(await q.sql("select * from public.quadros_identificacao")).toHaveLength(0);
      expect(await q.sql("select * from public.contratos_gerados")).toHaveLength(0);
      expect(await q.sql("select * from public.contrapartidas")).toHaveLength(0);
    }));

  it("consultor cria e gere os próprios pedidos de RFP e lê os dos outros sem poder alterá-los", () =>
    transacao(async (q) => {
      await q.sistema();
      const emp = await q.um("select id from public.empresas_grupo where codigo = 'triade'");
      await q.como(U.consultor2);
      const ped = await q.um("insert into public.pedidos_rfp (cliente_nome, consultor_id, empresa_grupo_id, necessidade) values ('Cliente X', $1, $2, 'ERP') returning id", [U.consultor2, emp.id]);
      await q.como(U.consultor);
      expect(await q.sql("select id from public.pedidos_rfp where id = $1", [ped.id])).toHaveLength(1);
      expect(await q.sql("update public.pedidos_rfp set necessidade = 'x' where id = $1 returning id", [ped.id])).toHaveLength(0);
      await q.falha("select public.publicar_pagina_rfp($1, '[]')", [ped.id]);
      await q.falha("insert into public.pedidos_rfp (cliente_nome, consultor_id, empresa_grupo_id, necessidade) values ('Y', $1, $2, 'z')", [U.consultor2, emp.id]);
    }));

  it("comercial não cria pedidos de RFP nem indicações em nome de financeiro", () =>
    transacao(async (q) => {
      await q.sistema();
      const emp = await q.um("select id from public.empresas_grupo where codigo = 'wise'");
      await q.como(U.comercial);
      await q.falha("insert into public.pedidos_rfp (cliente_nome, consultor_id, empresa_grupo_id, necessidade) values ('Y', $1, $2, 'z')", [U.comercial, emp.id]);
      // Comercial registra indicações (matriz: ler e criar)
      const r = await q.um("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Cliente Comercial')) as id", [P.C, emp.id]);
      expect(r.id).toBeTruthy();
      await q.como(U.financeiro);
      await q.falha("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Cliente Fin'))", [P.C, emp.id]);
    }));
});

describe("Financeiro: só comissões a pagar em diante", () => {
  it("lê comissões a pagar ao parceiro e ao responsável, nunca as do grupo nem as anteriores", () =>
    transacao(async (q) => {
      await q.sistema();
      // Uma comissão ainda aguardando fechamento
      const emp = await q.um("select id from public.empresas_grupo where codigo = 'swallow'");
      await q.sql("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: U.parcerias })]);
      await q.sql("select public.registrar_indicacao(jsonb_build_object('parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social','Cliente Swallow'))", [P.A, emp.id]);
      await q.como(U.financeiro);
      const cs = await q.sql("select estado, beneficiario from public.comissoes");
      expect(cs.length).toBe(4); // A e B: parceiro e responsável
      expect(cs.every((c) => c.estado === "a_pagar" && c.beneficiario !== "grupo")).toBe(true);
      expect(await q.sql("select * from public.parceiros_interno")).toHaveLength(0);
      expect(await q.sql("select * from public.pontos_contato")).toHaveLength(0);
      expect(await q.sql("select * from public.parceiros_instrumento")).toHaveLength(0);
    }));

  it("registra nota fiscal e pagamento, mas não muda outros estados nem valores", () =>
    transacao(async (q) => {
      await q.como(U.financeiro);
      const c = await q.um("select id from public.comissoes limit 1");
      await q.sql("select public.atualizar_estado_comissao($1, 'nf_recebida')", [c.id]);
      await q.sql("select public.atualizar_estado_comissao($1, 'paga')", [c.id]);
      await q.falha("select public.atualizar_estado_comissao($1, 'a_pagar')", [c.id]);
      expect(await q.sql("update public.comissoes set valor = 1 where id = $1 returning id", [c.id])).toHaveLength(0);
    }));
});

describe("Time de parcerias, administrador e Diretor", () => {
  it("parcerias vê todas as comissões, mas não aprova assinatura", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      expect((await q.sql("select * from public.comissoes")).length).toBe(4);
      expect((await q.sql("select * from public.parceiros_instrumento where programa_proprio")).length).toBe(1);
      const msg = await q.falha("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [P.D, U.parcerias]);
      expect(msg).toMatch(/row-level security/);
    }));

  it("administrador sem a marcação de Diretor também não aprova; o Diretor aprova", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      await q.falha("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [P.D, U.admin]);
      await q.como(U.diretor);
      const r = await q.sql("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2) returning id", [P.D, U.diretor]);
      expect(r).toHaveLength(1);
      // Nem o Diretor registra aprovação em nome de outra pessoa
      await q.falha("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [P.D, U.admin]);
    }));

  it("parcerias lê a configuração, mas só o administrador altera", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      expect((await q.sql("select * from public.configuracoes")).length).toBeGreaterThan(5);
      expect(await q.sql("update public.empresas_grupo set pct_parceiro = 99 returning id")).toHaveLength(0);
      await q.como(U.admin);
      expect((await q.sql("update public.empresas_grupo set pct_parceiro = 41 where codigo = 'wise' returning id")).length).toBe(1);
    }));

  it("só administrador muda papel de usuários", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      await q.falha("update public.perfis set papel = 'admin' where id = $1", [U.parcerias]);
      expect(await q.sql("update public.perfis set papel = 'admin' where id = $1 returning id", [U.consultor])).toHaveLength(0);
      await q.como(U.admin);
      expect(await q.sql("update public.perfis set papel = 'comercial' where id = $1 returning id", [U.consultor])).toHaveLength(1);
    }));
});

describe("Usuário inativo e anônimo", () => {
  it("usuário inativo não vê nada", () =>
    transacao(async (q) => {
      await q.como(U.inativo);
      for (const t of ["parceiros", "indicacoes", "comissoes", "pontos_contato", "configuracoes", "categorias"]) {
        expect(await q.sql(`select * from public.${t}`)).toHaveLength(0);
      }
    }));

  it("anônimo (cliente) não lê nenhuma tabela nem chama funções internas", () =>
    transacao(async (q) => {
      await q.como(null);
      for (const t of ["parceiros", "comissoes", "paginas_rfp", "pedidos_rfp", "clientes", "perfis"]) {
        const msg = await q.falha(`select * from public.${t}`);
        expect(msg).toMatch(/permission denied/);
      }
      await q.falha("select public.rfp_pagina_publica('x')");
      await q.falha("select public.rfp_registrar_clique('x', gen_random_uuid())");
      await q.falha("select public.pendencias_diarias()");
      await q.falha("select public.registrar_indicacao('{}')");
    }));

  it("usuário autenticado não chama as funções exclusivas das rotinas", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      await q.falha("select public.rfp_pagina_publica('x')");
      await q.falha("select public.pendencias_diarias()");
      await q.falha("select public.rotina_diaria()");
      await q.falha("select public.notificar($1, 'x', 'x', 'x', 'x')", [U.admin]);
    }));
});
