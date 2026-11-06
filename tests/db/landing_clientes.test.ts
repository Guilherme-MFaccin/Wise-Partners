// Landing page do cliente do parceiro (FO-10): link por parceiro, cadastro com ICP, autodiagnóstico 5x5 e o que o parceiro vê.
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

const PILARES = ["identidade", "demanda", "conversao", "expansao", "governanca"];
const CRITERIOS = ["estrategia", "processo", "dados", "tecnologia", "pessoas"];

function respostas(nota: (p: number, c: number) => number) {
  const r: Record<string, number> = {};
  PILARES.forEach((p, i) => CRITERIOS.forEach((c, j) => { r[`${p}.${c}`] = nota(i, j); }));
  return r;
}

async function link(q: Q, parceiro = P.A) {
  await q.sistema();
  return (await q.um("select public.garantir_link_cliente($1) as c", [parceiro])).c as string;
}

function dados(codigo: string, extra: Record<string, unknown> = {}) {
  return {
    codigo, nome: "Carla Lima", email: "carla@industria.com.br", whatsapp: "(44) 98888-0000", empresa: "Indústria Exemplo",
    cnpj: "11.222.333/0001-81", cargo: "Diretora comercial", faturamento_faixa: "250k_500k", vendedores: "6",
    segmento: "Indústria", desafio: "Previsibilidade", autoriza_parceiro: false, aceite_privacidade: true, utm_source: "whatsapp", ...extra,
  };
}

describe("Página do cliente do parceiro", () => {
  it("cria um link por parceiro com contrato e recusa parceiro sem contrato", () =>
    transacao(async (q) => {
      const a1 = await link(q);
      const a2 = await link(q);
      expect(a1).toBe(a2);
      expect(a1).toMatch(/^[a-z0-9]{10}$/);
      await q.falha("select public.garantir_link_cliente($1)", [P.D]);
    }));

  it("no ICP libera a agenda; fora do ICP vai para o autodiagnóstico", () =>
    transacao(async (q) => {
      const c = await link(q);
      await q.sql("update public.config_landing_cliente set agenda_url = 'https://calendar.app.google/teste' where id = 1");
      const icp = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r", [JSON.stringify(dados(c))])).r;
      expect(icp).toMatchObject({ icp: true, agenda_url: "https://calendar.app.google/teste", parceiro: "Parceiro Alfa" });
      const fora = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r", [JSON.stringify(dados(c, { vendedores: "3" }))])).r;
      expect(fora).toMatchObject({ icp: false, agenda_url: null });
      const s = await q.sql("select caminho, status from public.cadastros_cliente where parceiro_id = $1 order by vendedores desc", [P.A]);
      expect(s).toEqual([{ caminho: "agenda", status: "agenda_liberada" }, { caminho: "autodiagnostico", status: "cadastrado" }]);
      expect((await q.um("select count(*)::int n from public.notificacoes where tipo = 'cliente_link'")).n).toBeGreaterThan(0);
    }));

  it("respeita a faixa mínima de faturamento quando configurada", () =>
    transacao(async (q) => {
      const c = await link(q);
      await q.sql("update public.config_landing_cliente set icp_faturamento_min = '500k_1m' where id = 1");
      const r = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r", [JSON.stringify(dados(c, { vendedores: "10" }))])).r;
      expect(r.icp).toBe(false);
    }));

  it("recusa link inválido, sem aceite, CNPJ inválido e campos vazios", () =>
    transacao(async (q) => {
      const c = await link(q);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados("naoexiste"))]);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados(c, { aceite_privacidade: false }))]);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados(c, { cnpj: "123" }))]);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados(c, { desafio: " " }))]);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados(c, { faturamento_faixa: "x" }))]);
    }));

  it("calcula a Matriz 5x5 no banco, com o pilar mais frágil e o nível", () =>
    transacao(async (q) => {
      const c = await link(q);
      const r = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r", [JSON.stringify(dados(c, { vendedores: "2" }))])).r;
      await q.falha("select public.registrar_diagnostico_cliente($1, 'errada', $2::jsonb)", [r.id, JSON.stringify(respostas(() => 3))]);
      await q.falha("select public.registrar_diagnostico_cliente($1, $2, $3::jsonb)", [r.id, r.chave, JSON.stringify({ "identidade.estrategia": 3 })]);
      const res = (await q.um("select public.registrar_diagnostico_cliente($1, $2, $3::jsonb) as r",
        [r.id, r.chave, JSON.stringify(respostas((p) => (p === 3 ? 1 : 4)))])).r;
      expect(res.pilar_mais_fragil).toBe("expansao");
      expect(res.pilares.find((x: any) => x.chave === "expansao")).toMatchObject({ media: 1, percentual: 0 });
      expect(res.pilares.find((x: any) => x.chave === "identidade")).toMatchObject({ media: 4, percentual: 75 });
      expect(res.media).toBe(3.4);
      expect(res.nivel).toBe("estruturado");
      expect(res.hub_url).toMatch(/^https:\/\//);
      expect((await q.um("select status from public.cadastros_cliente where id = $1", [r.id])).status).toBe("diagnostico_feito");
    }));

  it("o parceiro vê só os próprios clientes, e o resultado só com autorização; a chave não sai pela API", () =>
    transacao(async (q) => {
      const c = await link(q);
      const sem = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r", [JSON.stringify(dados(c, { vendedores: "1" }))])).r;
      const com = (await q.um("select public.cadastrar_cliente_parceiro($1::jsonb) as r",
        [JSON.stringify(dados(c, { vendedores: "1", empresa: "Autoriza SA", autoriza_parceiro: true }))])).r;
      for (const x of [sem, com]) await q.um("select public.registrar_diagnostico_cliente($1, $2, $3::jsonb)", [x.id, x.chave, JSON.stringify(respostas(() => 2))]);

      await q.como(U.parceiroA);
      const lista = await q.sql("select empresa, resultado is not null as tem from public.clientes_do_link()");
      expect(lista).toEqual(expect.arrayContaining([{ empresa: "Autoriza SA", tem: true }, { empresa: "Indústria Exemplo", tem: false }]));
      expect(await q.sql("select id, empresa from public.cadastros_cliente")).toEqual([]);
      await q.falha("select * from public.clientes_do_link($1)", [P.B]);
      await q.falha("select public.cadastrar_cliente_parceiro($1::jsonb)", [JSON.stringify(dados(c))]);

      await q.como(U.parceiroB);
      expect(await q.sql("select * from public.clientes_do_link()")).toEqual([]);

      await q.como(U.parcerias);
      expect((await q.sql("select empresa from public.cadastros_cliente")).length).toBe(2);
      await q.falha("select chave from public.cadastros_cliente");
    }));

  it("logo: o parceiro grava só na própria pasta", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      await q.um("select public.definir_logo_parceiro($1, $2)", [P.A, `${P.A}/logo.png`]);
      await q.falha("select public.definir_logo_parceiro($1, $2)", [P.A, `${P.B}/logo.png`]);
      await q.falha("select public.definir_logo_parceiro($1, $2)", [P.B, `${P.B}/logo.png`]);
      await q.sistema();
      expect((await q.um("select logo_caminho from public.parceiros where id = $1", [P.A])).logo_caminho).toBe(`${P.A}/logo.png`);
    }));
});
