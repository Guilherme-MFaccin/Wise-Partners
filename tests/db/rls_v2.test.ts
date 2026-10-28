// Matriz de acesso da v2 (briefing técnico, seções 5 e 10): uma verificação por célula nova.
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

const PAPEIS = {
  admin: U.admin,
  parcerias: U.parcerias,
  consultor: U.consultor,
  comercial: U.comercial,
  financeiro: U.financeiro,
  parceiroA: U.parceiroA,
  parceiroB: U.parceiroB,
  anonimo: null,
} as const;
type Papel = keyof typeof PAPEIS;

// Cria uma linha de cada tabela nova ligada ao parceiro A
async function semear(q: Q) {
  await q.sistema();
  const emp = (await q.um("select id from public.empresas_grupo where codigo = 'wise'")).id;
  await q.sql("insert into public.remuneracoes (perfil_id, valor_mensal, vigente_desde) values ($1, 3000, '2026-01-01')", [U.parcerias]);
  const tipo = (await q.um("select id from public.tipos_atividade where chave = 'ligacao'")).id;
  await q.sql("insert into public.atividades (parceiro_id, tipo_atividade_id, minutos, pessoa_id) values ($1, $2, 15, $3)", [P.A, tipo, U.parcerias]);
  await q.sql("insert into public.custos_diretos (data, categoria, valor, descricao, parceiro_id) values (current_date, 'evento', 100, 'Café', $1)", [P.A]);
  await q.sql(`insert into public.scorecards (parceiro_id, notas) values ($1, '{"base_icp":1,"complementaridade":1,"valores":1,"capacidade_venda":1,"disponibilidade":1,"presenca_regional":1,"reputacao":1}')`, [P.A]);
  await q.sql(`insert into public.avaliacoes_maturidade (parceiro_id, notas) values ($1, '{"objetivo":3,"modelo":3,"aderencia":3,"capacitacao":3,"mercado":3,"programa":3,"relacionamento":3,"resultado":3}')`, [P.A]);
  await q.sql("insert into public.fluxos_desligamento (parceiro_id, tipo, estado, em_risco_em) values ($1, 'inatividade', 'em_risco', current_date)", [P.A]);
  await q.sql("insert into public.pontos_ranking (parceiro_id, evento, pontos, referencia_id, data) values ($1, 'cliente_icp', 10, gen_random_uuid(), current_date)", [P.A]);
  await q.sql("select public.calcular_faixas()");
  await q.sql("insert into public.premiacoes (ano, categoria, parceiro_id) values (2026, 'Parceiro do ano', $1)", [P.A]);
  await q.sql("insert into public.revisoes_nivel (parceiro_id, trimestre, nivel_no_inicio, resultado, detalhes) values ($1, '2026-T4', 'A', 'observacao', '{\"nota_interna\": 1}')", [P.A]);
  await q.sql("insert into public.pesquisas_satisfacao (perfil_id, parceiro_id, trimestre, nota, comentario) values ($1, $2, '2026-T4', 9, 'Ótimo')", [U.parceiroA, P.A]);
  const t = (await q.um("select id from public.trilhas where chave = 'como_vender'")).id;
  const perg = await q.um("insert into public.trilha_perguntas (trilha_id, enunciado, opcoes) values ($1, 'Quem é o cliente ideal?', '[\"a\",\"b\"]') returning id", [t]);
  await q.sql("insert into public.trilha_gabarito (pergunta_id, correta) values ($1, 1)", [perg.id]);
  const base = await q.um("insert into public.base_wise_cruzamento (cnpj_raiz, razao_social, tipo, empresa_grupo_id) values ('11222333', 'Cliente Wise SA', 'cliente', $1) returning id", [emp]);
  const ac = await q.um("insert into public.aceites_cruzamento (parceiro_id, perfil_id, versao_termo) values ($1, $2, 1) returning id", [P.A, U.parceiroA]);
  const cz = await q.um("insert into public.cruzamentos (parceiro_id, aceite_id, total_enviado, totais) values ($1, $2, 30, '{\"coincidencias\":1}') returning id", [P.A, ac.id]);
  await q.sql("insert into public.coincidencias_cruzamento (cruzamento_id, parceiro_id, base_wise_id, tipo_parceiro, quadrante, acao_sugerida, expira_em) values ($1, $2, $3, 'cliente', 'cliente_comum', 'Case', current_date + 180)", [cz.id, P.A, base.id]);
  await q.sql("insert into public.metas (indicador_chave, periodo, valor) values ('clientes_icp', '2026-T4', 12)");
  await q.sql("insert into public.metas_pessoa (perfil_id, trimestre, indicador, valor) values ($1, '2026-T4', 'clientes_icp', 3)", [U.parcerias]);
}

async function conta(q: Q, papel: Papel, tabela: string, filtro = "true") {
  await q.sql("savepoint conta");
  await q.como(PAPEIS[papel]);
  try {
    const r = await q.um(`select count(*)::int as n from public.${tabela} where ${filtro}`);
    return r.n as number;
  } catch {
    await q.sql("rollback to savepoint conta");
    return -1; // sem permissão na tabela
  } finally {
    await q.sistema();
  }
}

// Quem lê cada tabela (linhas do parceiro A, quando a tabela é por parceiro)
const MATRIZ: { tabela: string; filtro?: string; leem: Papel[] }[] = [
  { tabela: "remuneracoes", leem: ["admin"] },
  { tabela: "atividades_custo", leem: ["admin"] },
  { tabela: "custos_diretos", leem: ["admin"] },
  { tabela: "criterios_scorecard", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "scorecards", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor"] },
  { tabela: "revisoes_nivel", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor"] },
  { tabela: "requisitos_nivel", leem: ["admin", "parcerias", "consultor", "comercial", "parceiroA", "parceiroB"] },
  { tabela: "planos_onboarding", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor", "parceiroA"] },
  { tabela: "marcos_onboarding", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor", "parceiroA"] },
  { tabela: "trilha_gabarito", leem: ["admin"] },
  { tabela: "links_indicacao", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor", "parceiroA"] },
  { tabela: "acoes_wise", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor", "parceiroA"] },
  { tabela: "catalogo_acoes_wise", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "pontos_ranking", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor"] },
  { tabela: "premiacoes", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "faixas", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor"] },
  { tabela: "regua_atendimento", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "fluxos_desligamento", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias"] },
  { tabela: "indicadores", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "metas", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "fase_programa", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "pesquisas_satisfacao", leem: ["admin", "parcerias", "parceiroA"] },
  { tabela: "avaliacoes_maturidade", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "consultor"] },
  { tabela: "versoes_regras", leem: ["admin", "parcerias", "consultor", "comercial", "parceiroA", "parceiroB"] },
  { tabela: "metas_pessoa", leem: ["admin", "parcerias"] },
  { tabela: "criterios_fase", leem: ["admin", "parcerias", "consultor"] },
  { tabela: "marcos_onboarding_config", leem: ["admin", "parcerias", "consultor", "comercial", "financeiro", "parceiroA", "parceiroB"] },
  { tabela: "base_wise_cruzamento", leem: ["admin", "parcerias"] },
  { tabela: "aceites_cruzamento", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "parceiroA"] },
  { tabela: "cruzamentos", filtro: `parceiro_id = '${P.A}'`, leem: ["admin", "parcerias", "parceiroA"] },
  { tabela: "coincidencias_cruzamento", leem: ["admin", "parcerias"] },
  { tabela: "alertas_rotina", leem: [] },
];

describe("Matriz de acesso da v2", () => {
  for (const linha of MATRIZ) {
    it(`${linha.tabela}: só ${linha.leem.join(", ") || "as rotinas"} leem`, () =>
      transacao(async (q) => {
        await semear(q);
        await q.sql("select public.rotina_diaria()");
        const total = (await q.um(`select count(*)::int n from public.${linha.tabela} where ${linha.filtro ?? "true"}`)).n;
        if (linha.leem.length) expect(total, `sem dados de teste em ${linha.tabela}`).toBeGreaterThan(0);
        for (const papel of Object.keys(PAPEIS) as Papel[]) {
          const n = await conta(q, papel, linha.tabela, linha.filtro);
          if (linha.leem.includes(papel)) expect(n, `${papel} deveria ler ${linha.tabela}`).toBeGreaterThan(0);
          else expect(n, `${papel} não deveria ler ${linha.tabela}`).toBeLessThanOrEqual(0);
        }
      }));
  }
});

describe("Parceiros e dados uns dos outros", () => {
  it("parceiro B não lê nada do parceiro A nas tabelas novas", () =>
    transacao(async (q) => {
      await semear(q);
      const tabelas = ["planos_onboarding", "marcos_onboarding", "links_indicacao", "acoes_wise", "aceites_cruzamento", "cruzamentos",
        "pesquisas_satisfacao", "certificados", "trilha_progresso", "trilha_tentativas", "checagens_cliente", "comunicado_leituras"];
      for (const t of tabelas) {
        expect(await conta(q, "parceiroB", t, `parceiro_id = '${P.A}'`), t).toBeLessThanOrEqual(0);
      }
    }));

  it("ranking para o parceiro mostra posição, nome e pontos, nunca nível nem faixa dos outros", () =>
    transacao(async (q) => {
      await semear(q);
      await q.como(U.parceiroB);
      const r = (await q.um("select public.ranking() as r")).r;
      const texto = JSON.stringify(r);
      expect(texto).toContain("Parceiro Alfa");
      expect(texto).not.toMatch(/"nivel"|"faixa"/);
    }));

  it("revisão de nível para o parceiro mostra resultado e faltantes, sem notas internas", () =>
    transacao(async (q) => {
      await semear(q);
      await q.como(U.parceiroA);
      const r = (await q.um("select public.meu_nivel() as r")).r;
      expect(JSON.stringify(r)).not.toContain("nota_interna");
      await q.como(U.parceiroB);
      await q.falha("select public.situacao_nivel($1)", [P.A]);
    }));
});

describe("Funções exclusivas", () => {
  it("só administrador vê resultado do canal e planilha de custos", () =>
    transacao(async (q) => {
      for (const papel of ["parcerias", "consultor", "comercial", "financeiro", "parceiroA"] as Papel[]) {
        await q.como(PAPEIS[papel]);
        await q.falha("select public.resultado_canal('2026-01-01', '2026-12-31')");
        await q.falha("select * from public.planilha_custos('2026-01-01', '2026-12-31')");
        await q.falha("select public.custo_hora_em($1, current_date)", [U.parcerias]);
      }
      await q.como(U.admin);
      await q.sql("select public.resultado_canal('2026-01-01', '2026-12-31')");
    }));

  it("todo papel interno abre o painel por etapa; indicadores só de admin vêm sem valor para os outros", () =>
    transacao(async (q) => {
      for (const u of [U.admin, U.parcerias, U.consultor, U.comercial, U.financeiro]) {
        await q.como(u);
        const p = (await q.um("select public.painel_v2() as p")).p;
        const roi = p.indicadores.find((i: any) => i.chave === "roi");
        if (u === U.admin) expect(roi).toBeTruthy();
        else expect(roi?.valor ?? null).toBeNull();
      }
      await q.como(U.parceiroA);
      await q.falha("select public.painel_v2()");
    }));

  it("anônimo e autenticado não executam config(); anônimo não chama as funções novas", () =>
    transacao(async (q) => {
      await q.como(null);
      await q.falha("select public.config('email_financeiro')");
      await q.falha("select public.config_int('meta_assinados', 1)");
      await q.falha("select public.link_indicacao_publico('x')");
      await q.falha("select public.indicacao_publica('x', '{}', 'h')");
      await q.falha("select public.ranking()");
      await q.como(U.parcerias);
      await q.falha("select public.config('email_financeiro')");
      await q.falha("select public.registrar_coincidencias($1, gen_random_uuid(), '[]', '{}')", [P.A]);
      await q.falha("select public._registrar_indicacao_core('{}', 'parcerias', null, 'link_parceiro')");
      await q.falha("select public.rotina_trimestral()");
    }));

  it("parceiro não lê o gabarito nem pelas perguntas, e a configuração continua restrita", () =>
    transacao(async (q) => {
      await semear(q);
      await q.como(U.parceiroA);
      const p = await q.sql("select * from public.trilha_perguntas");
      for (const x of p) expect(x).not.toHaveProperty("correta");
      const cfg = await q.sql("select chave from public.configuracoes where chave in ('email_financeiro', 'pontos_ranking', 'margem_contribuicao_pct')");
      expect(cfg).toHaveLength(0);
    }));
});
