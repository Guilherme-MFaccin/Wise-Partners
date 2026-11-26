// Proposta comercial da Wise (26/11/2026): preços da jornada e regra de comissão para quem está logado; cases B2C fora da prova
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Proposta comercial", () => {
  it("a jornada chega com os preços e a comissão da Wise, para qualquer conta logada", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const j = (await q.um("select public.jornada_wise() j")).j;
      expect(j).toMatchObject({ diagnostico: 5000, preco_mes1: 4997, preco_mes1_tabela: 7000, preco_mes2: 4997, preco_continuidade: 3997, pct_pontual: 6, pct_continuo: 40 });
      await q.sistema();
      expect((await q.um("select pct_responsavel_pontual::float p, pct_responsavel::float c from public.empresas_grupo where codigo = 'wise'"))).toEqual({ p: 1.5, c: 10 });
    }));

  it("na Swallow o parceiro fica com 6% e o gerente com 1,5% do projeto", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select pct_parceiro::float p, pct_responsavel::float g from public.empresas_grupo where codigo = 'swallow'"))).toEqual({ p: 6, g: 1.5 });
    }));

  it("Chamego e Totonho ficam na base, mas fora dos cases ativos", () =>
    transacao(async (q) => {
      await q.sistema();
      const ativos = (await q.sql("select empresa from public.cases_resultado where ativo")).map((c: any) => c.empresa);
      expect(ativos).not.toContain("Chamego Bandeiras");
      expect(ativos).not.toContain("Totonho Locações");
      expect((await q.um("select count(*)::int n from public.cases_resultado where empresa in ('Chamego Bandeiras', 'Totonho Locações')")).n).toBe(2);
    }));
});
