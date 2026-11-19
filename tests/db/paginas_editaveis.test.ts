// Páginas públicas editáveis (20/11/2026): conteúdo das duas páginas, valores de referência e cases num lugar só.
// Time interno lê os cases; só o administrador grava. Conteúdo: parcerias lê, só admin grava. Parceiro e anônimo não veem nada.
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Cases de resultado", () => {
  it("a migração carrega os 8 cases e o banco entrega a média pronta", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select count(*)::int n from public.cases_resultado where ativo")).n).toBe(8);
      const r = (await q.um("select public.resumo_cases() as r")).r;
      expect(r.quantidade).toBe(8);
      expect(r.media).toBe(35);
      expect(r.itens[0]).toMatchObject({ empresa: "Florart's Decor", periodo: "jan/25 a out/26" });
      // Case desligado sai da lista e da média
      await q.sql("update public.cases_resultado set ativo = false where empresa = 'Florart''s Decor'");
      const s = (await q.um("select public.resumo_cases() as r")).r;
      expect(s.quantidade).toBe(7);
      expect(s.media).toBe(27);
    }));

  it("time interno lê; parceiro e anônimo não leem", () =>
    transacao(async (q) => {
      for (const u of [U.admin, U.parcerias, U.consultor, U.comercial, U.financeiro]) {
        await q.como(u);
        expect((await q.um("select count(*)::int n from public.cases_resultado")).n).toBe(8);
      }
      await q.como(U.parceiroA);
      expect(await q.sql("select id from public.cases_resultado")).toEqual([]);
      await q.como(null);
      await q.falha("select id from public.cases_resultado");
      await q.falha("select public.resumo_cases()");
    }));

  it("só o administrador inclui, altera e apaga", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      await q.falha("insert into public.cases_resultado (empresa, segmento, crescimento, periodo) values ('X', 'Y', 10, 'jan/26 a mar/26')");
      await q.sql("update public.cases_resultado set crescimento = 99 where empresa = 'Nicopel'");
      await q.sql("delete from public.cases_resultado where empresa = 'Nicopel'");
      await q.sistema();
      expect((await q.um("select crescimento::float c from public.cases_resultado where empresa = 'Nicopel'")).c).toBe(16.5);

      await q.como(U.admin);
      await q.sql("insert into public.cases_resultado (empresa, segmento, crescimento, periodo, ordem) values ('Nova', 'Serviços', 30, 'jan/26 a out/26', 9)");
      await q.sql("update public.cases_resultado set crescimento = 17 where empresa = 'Nicopel'");
      await q.sql("delete from public.cases_resultado where empresa = 'Powerfit'");
      expect((await q.um("select count(*)::int n from public.cases_resultado")).n).toBe(8);
      expect((await q.um("select crescimento::float c from public.cases_resultado where empresa = 'Nicopel'")).c).toBe(17);
    }));

  it("recusa travessão e meia-risca nos textos", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      expect(await q.falha(`insert into public.cases_resultado (empresa, segmento, crescimento, periodo) values ('X', 'Y', 10, 'jan/26 ' || chr(8211) || ' mar/26')`)).toMatch(/sem_travessao/);
      expect(await q.falha(`insert into public.cases_resultado (empresa, segmento, crescimento, periodo) values ('X', 'A ' || chr(8212) || ' B', 10, 'jan/26')`)).toMatch(/sem_travessao/);
    }));
});

describe("Conteúdo editável das páginas", () => {
  const conteudo = JSON.stringify({ secoes: { topo: { titulo: "Título novo" }, cases: { visivel: false } }, perguntas: [{ pergunta: "P?", resposta: "R." }] });

  it("começa vazio, com os valores de referência e o perfil da reunião", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select conteudo from public.config_landing where id = 1")).conteudo).toEqual({});
      const c = await q.um("select conteudo, valor_diagnostico::float d, valor_hub::float h, icp_min_vendedores v, icp_faturamento_min f from public.config_landing_cliente where id = 1");
      expect(c).toMatchObject({ conteudo: {}, d: 2000, h: 3000, v: 3, f: "250k_500k" });
    }));

  it("parcerias lê e não grava; administrador grava; parceiro e anônimo não veem", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      expect((await q.um("select conteudo from public.config_landing_cliente where id = 1")).conteudo).toEqual({});
      await q.sql("update public.config_landing set conteudo = $1::jsonb where id = 1", [conteudo]);
      await q.sql("update public.config_landing_cliente set conteudo = $1::jsonb, valor_hub = 1 where id = 1", [conteudo]);
      expect((await q.um("select conteudo from public.config_landing where id = 1")).conteudo).toEqual({});
      expect((await q.um("select valor_hub::float v from public.config_landing_cliente where id = 1")).v).toBe(3000);

      await q.como(U.admin);
      await q.sql("update public.config_landing set conteudo = $1::jsonb where id = 1", [conteudo]);
      await q.sql("update public.config_landing_cliente set conteudo = $1::jsonb, valor_diagnostico = 2500 where id = 1", [conteudo]);
      expect((await q.um("select conteudo from public.config_landing where id = 1")).conteudo.secoes.topo.titulo).toBe("Título novo");
      expect((await q.um("select valor_diagnostico::float v from public.config_landing_cliente where id = 1")).v).toBe(2500);

      for (const u of [U.parceiroA, U.consultor]) {
        await q.como(u);
        expect(await q.sql("select conteudo from public.config_landing")).toEqual([]);
        expect(await q.sql("select conteudo from public.config_landing_cliente")).toEqual([]);
      }
      await q.como(null);
      expect(await q.sql("select conteudo from public.config_landing")).toEqual([]);
    }));

  it("recusa conteúdo com travessão, que não seja objeto ou valor negativo", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      const ruim = JSON.stringify({ secoes: { topo: { titulo: `Sem custo ${String.fromCharCode(8212)} nunca` } } });
      expect(await q.falha("update public.config_landing set conteudo = $1::jsonb where id = 1", [ruim])).toMatch(/conteudo_valido/);
      expect(await q.falha("update public.config_landing_cliente set conteudo = '[]'::jsonb where id = 1")).toMatch(/conteudo_valido/);
      await q.falha("update public.config_landing_cliente set valor_hub = -1 where id = 1");
    }));
});

describe("Cadastro de parceiro de qualquer categoria", () => {
  it("a fila aceita categoria institucional", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = (await q.um("select id from public.categorias where tipo = 'institucional' and nome = 'Sistema S'")).id;
      const r = (await q.um("select public.entrar_fila_landing($1::jsonb) as r", [JSON.stringify({
        nome: "Paula", email: "paula@entidade.org.br", whatsapp: "(44) 97777-0000", empresa: "Entidade Exemplo", cnpj: "11.444.777/0001-61",
        categoria_id: cat, clientes_ativos: "900", aceite_termo: true, aceite_privacidade: true,
      })])).r;
      expect((await q.um("select categoria_nome from public.cadastros_landing where id = $1", [r.cadastro_id])).categoria_nome).toBe("Sistema S");
      expect(await q.falha("select public.entrar_fila_landing($1::jsonb)", [JSON.stringify({
        nome: "Paula", email: "outra@entidade.org.br", whatsapp: "(44) 97777-0000", empresa: "Outra", cnpj: "11.222.333/0001-81",
        categoria_id: null, aceite_termo: true, aceite_privacidade: true,
      })])).toMatch(/categoria da sua empresa/);
      expect((await q.um("select count(*)::int n from public.categorias where nome = 'Outra categoria'")).n).toBe(1);
    }));
});
