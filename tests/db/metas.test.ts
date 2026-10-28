// Metas em cascata (revisão de 28/10/2026): cadastro por trimestre, funil reverso, fases, marcos e contrapartidas.
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

const TRI = "to_char(public.hoje(), 'YYYY-\"T\"Q')";

async function parceiroNaEtapa(q: Q, nome: string, etapa: string, responsavel: string) {
  await q.sistema();
  const r = await q.um(
    `insert into public.parceiros (nome_fantasia, tipo_parceria, responsavel_id, etapa, etapa_desde)
     values ($1, 'comercial', $2, $3, now()) returning id`, [nome, responsavel, etapa]);
  return r.id as string;
}

describe("Cadastro de metas", () => {
  it("só trimestre e só indicadores de resultado", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      await q.sql("insert into public.metas (indicador_chave, periodo, valor) values ('assinados', '2027-T1', 4)");
      expect(await q.falha("insert into public.metas (indicador_chave, periodo, valor) values ('assinados', '2027', 12)")).toMatch(/metas_periodo_trimestre/);
      expect(await q.falha("insert into public.metas (indicador_chave, periodo, valor) values ('nota_scorecard', '2027-T1', 70)")).toMatch(/não recebe meta/);
      await q.como(U.parcerias);
      await q.falha("insert into public.metas (indicador_chave, periodo, valor) values ('ativados', '2027-T1', 2)");
      expect(await q.falha(`insert into public.metas_pessoa (perfil_id, trimestre, indicador, valor) values ($1, '2027-T1', 'receita', 1000)`, [U.parcerias]))
        .toBeTruthy();
    }));

  it("metas do trimestre: realizado no período, acumulado e ano como soma dos trimestres", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(`insert into public.metas (indicador_chave, periodo, valor) values ('assinados', ${TRI}, 10), ('clientes_icp', ${TRI}, 1)`);
      await q.como(U.parcerias);
      const m = (await q.um("select public.metas_trimestre() as m")).m;
      const assin = m.itens.find((i: any) => i.chave === "assinados");
      expect(assin.meta).toBe(10);
      expect(assin.realizado).toBe(4); // A, B, C e E assinados há 10 dias
      expect(assin.acumulado).toBe(4);
      expect(m.itens[0].chave).toBe("clientes_icp"); // número principal primeiro
      expect(m.itens.some((i: any) => i.chave === "roi")).toBe(false); // ROI só para administrador
      await q.como(U.admin);
      const a = (await q.um("select public.metas_trimestre() as m")).m;
      expect(a.itens.some((i: any) => i.chave === "roi")).toBe(true);
      await q.como(U.parceiroA);
      await q.falha("select public.metas_trimestre()");
    }));
});

describe("Funil reverso", () => {
  it("projeta pela chance de cada etapa e diz quantas reuniões faltam", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(`insert into public.metas (indicador_chave, periodo, valor) values ('assinados', ${TRI}, 10)`);
      await q.sql("update public.parceiros set responsavel_id = $1 where data_assinatura is null", [U.admin]); // tira D da carteira de parcerias
      await parceiroNaEtapa(q, "Proposta 1", "proposta_decisor", U.parcerias);
      await parceiroNaEtapa(q, "Proposta 2", "proposta_decisor", U.parcerias);
      await parceiroNaEtapa(q, "Reunião 1", "reuniao_realizada", U.parcerias);
      await q.sql(`insert into public.metas_pessoa (perfil_id, trimestre, indicador, valor) values ($1, ${TRI}, 'assinados', 6)`, [U.parcerias]);
      await q.como(U.parcerias);
      const f = (await q.um("select public.funil_reverso(null, $1) as f", [U.parcerias])).f;
      expect(f.meta).toBe(6);
      expect(f.assinados).toBe(4);
      expect(f.faltam).toBe(2);
      expect(f.projecao).toBe(1.6); // 2 x 60% + 1 x 35% = 1,55
      expect(f.lacuna).toBe(0.5); // arredondado: 2 menos 1,55 = 0,45
      expect(f.reunioes_necessarias).toBe(2); // 0,45 / 35%
      await q.falha("select public.funil_reverso(null, $1)", [U.admin]);
    }));

  it("negociação parada segue o prazo de cada etapa em dias úteis", () =>
    transacao(async (q) => {
      const id = await parceiroNaEtapa(q, "Parada na reunião", "reuniao_realizada", U.parcerias);
      await q.sql("update public.parceiros set etapa_desde = now() - interval '20 days' where id = $1", [id]);
      await q.como(U.parcerias);
      let painel = (await q.um("select public.painel_semanal() as p")).p;
      expect(painel.negociacoes_paradas.some((x: any) => x.parceiro_id === id)).toBe(true);
      await q.sistema();
      await q.sql("update public.etapas_funil set prazo_dias_uteis = null where codigo = 'reuniao_realizada'");
      await q.como(U.parcerias);
      painel = (await q.um("select public.painel_semanal() as p")).p;
      expect(painel.negociacoes_paradas.some((x: any) => x.parceiro_id === id)).toBe(false);
    }));
});

describe("Fase do programa", () => {
  it("critérios editáveis; critério manual conta quando marcado", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      await q.sql("update public.criterios_fase set valor = 0 where fase = 'experimentacao' and indicador is not null");
      expect((await q.um("select public.sugerir_fase() as s")).s.pronta).toBe(true);
      await q.sql("insert into public.criterios_fase (fase, descricao, ordem) values ('experimentacao', 'Revisão do playbook feita', 9)");
      expect((await q.um("select public.sugerir_fase() as s")).s.pronta).toBe(false);
      await q.sql("update public.criterios_fase set atingido = true where descricao = 'Revisão do playbook feita'");
      expect((await q.um("select public.sugerir_fase() as s")).s.pronta).toBe(true);
      await q.como(U.parcerias);
      expect((await q.sql("update public.criterios_fase set valor = 1 where fase = 'tracao' returning id")).length).toBe(0);
    }));
});

describe("Marcos do onboarding configuráveis", () => {
  it("prazo e critério do marco vêm da configuração", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("update public.marcos_onboarding_config set dias = 45, regra = '{\"indicacoes\": 0}' where tipo = 'marco_30'");
      const id = (await q.um(
        "insert into public.parceiros (nome_fantasia, tipo_parceria, responsavel_id, pacote, nivel) values ('Novo Onb', 'comercial', $1, 'C', 'C') returning id",
        [U.parcerias])).id;
      await q.sql("update public.parceiros set data_assinatura = current_date where id = $1", [id]);
      await q.sql("select public.iniciar_onboarding($1)", [id]);
      const m = await q.um("select prazo - public.hoje() as dias from public.marcos_onboarding where parceiro_id = $1 and tipo = 'marco_30'", [id]);
      expect(m.dias).toBe(45);
      await q.sql("select public.verificar_marcos_onboarding($1)", [id]);
      expect((await q.um("select cumprido_em is not null as ok from public.marcos_onboarding where parceiro_id = $1 and tipo = 'marco_30'", [id])).ok).toBe(true);
      expect((await q.um("select cumprido_em is not null as ok from public.marcos_onboarding where parceiro_id = $1 and tipo = 'marco_60'", [id])).ok).toBe(false);
    }));
});

describe("Contrapartidas com meta estruturada", () => {
  it("modo valor usa a última comprovação validada; contagem soma as validadas", () =>
    transacao(async (q) => {
      await q.sistema();
      const c = (await q.um(
        `insert into public.contrapartidas (parceiro_id, nome, periodicidade, comprovacao, meta_quantidade, meta_unidade, meta_prazo_dias, meta_modo)
         values ($1, 'Usuários no Hub', 'unica', 'Print', 10, 'usuários ativos', 90, 'valor') returning id`, [P.A])).id;
      await q.sql("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, quantidade, estado, validada_em) values ($1, $2, 'https://a', 4, 'validada', now() - interval '2 days')", [c, P.A]);
      await q.sql("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, quantidade, estado, validada_em) values ($1, $2, 'https://b', 7, 'validada', now())", [c, P.A]);
      await q.sql("insert into public.comprovacoes (contrapartida_id, parceiro_id, link, quantidade, estado) values ($1, $2, 'https://c', 12, 'enviada')", [c, P.A]);
      const r = await q.um("select public.meta_progresso(c) as p, public.meta_prazo(c) - c.created_at::date as d from public.contrapartidas c where id = $1", [c]);
      expect(Number(r.p)).toBe(7);
      expect(r.d).toBe(90);
      await q.sql("update public.contrapartidas set meta_modo = 'contagem' where id = $1", [c]);
      expect(Number((await q.um("select public.meta_progresso(c) as p from public.contrapartidas c where id = $1", [c])).p)).toBe(2);
    }));
});
