// Fila de espera da landing page dos parceiros (07/11/2026): o cadastro entra na fila, o time aprova e o parceiro nasce.
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

async function erp(q: Q) {
  return (await q.um("select id from public.categorias where tipo = 'comercial' and nome = 'ERP'")).id as string;
}
function dados(categoria: string, extra: Record<string, unknown> = {}) {
  return {
    nome: "Bruno Lima", email: "bruno@softfila.com.br", whatsapp: "(44) 98888-1111", empresa: "Soft Fila", cnpj: "11.444.777/0001-61",
    categoria_id: categoria, clientes_ativos: "80", cargo: "CEO", utm_source: "meta", utm_content: "video-3",
    aceite_termo: true, aceite_privacidade: true, ...extra,
  };
}

describe("Fila de espera dos parceiros", () => {
  it("o cadastro entra na fila sem criar parceiro nem acesso, e avisa os administradores", () =>
    transacao(async (q) => {
      await q.sistema();
      const r = (await q.um("select public.entrar_fila_landing($1::jsonb) as r", [JSON.stringify(dados(await erp(q)))])).r;
      const c = await q.um("select status, parceiro_id, utm_content, categoria_nome from public.cadastros_landing where id = $1", [r.cadastro_id]);
      expect(c).toMatchObject({ status: "fila", parceiro_id: null, utm_content: "video-3", categoria_nome: "ERP" });
      expect((await q.um("select count(*)::int n from public.parceiros where public.somente_digitos(cnpj) = '11444777000161'")).n).toBe(0);
      expect((await q.um("select count(*)::int n from public.convites where email = 'bruno@softfila.com.br'")).n).toBe(0);
      expect((await q.um("select count(*)::int n from public.notificacoes where tipo = 'fila_landing'")).n).toBeGreaterThan(0);
    }));

  it("recusa a mesma empresa duas vezes na fila e cadastro sem aceite", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = await erp(q);
      await q.um("select public.entrar_fila_landing($1::jsonb)", [JSON.stringify(dados(cat))]);
      await q.falha("select public.entrar_fila_landing($1::jsonb)", [JSON.stringify(dados(cat, { email: "outro@softfila.com.br" }))]);
      await q.falha("select public.entrar_fila_landing($1::jsonb)", [JSON.stringify(dados(cat, { cnpj: "11.222.333/0001-81", aceite_termo: false }))]);
    }));

  it("a aprovação cria o parceiro em onboarding, com aceite eletrônico, e marca o cadastro como aprovado", () =>
    transacao(async (q) => {
      await q.sistema();
      const r = (await q.um("select public.entrar_fila_landing($1::jsonb) as r", [JSON.stringify(dados(await erp(q)))])).r;
      await q.como(U.parcerias);
      await q.sql("update public.cadastros_landing set status = 'contatado', observacao = 'Falei no WhatsApp' where id = $1", [r.cadastro_id]);
      const a = (await q.um("select public.aprovar_cadastro_landing($1) as a", [r.cadastro_id])).a;
      expect(a).toMatchObject({ email: "bruno@softfila.com.br", empresa: "Soft Fila" });
      await q.sistema();
      const p = await q.um("select etapa, nivel, pacote, origem from public.parceiros where id = $1", [a.parceiro_id]);
      expect(p).toMatchObject({ etapa: "onboarding", nivel: "C", pacote: "C", origem: "landing_saas" });
      expect((await q.um("select tipo from public.aprovacoes where parceiro_id = $1", [a.parceiro_id])).tipo).toBe("aceite_eletronico");
      const c = await q.um("select status, parceiro_id is not null as tem, observacao from public.cadastros_landing where id = $1", [r.cadastro_id]);
      expect(c).toMatchObject({ status: "aprovado", tem: true, observacao: "Falei no WhatsApp" });
      await q.como(U.parcerias);
      await q.falha("select public.aprovar_cadastro_landing($1)", [r.cadastro_id]);
    }));

  it("parceiro não vê nem mexe na fila, e o time não aprova pelo update direto", () =>
    transacao(async (q) => {
      await q.sistema();
      const r = (await q.um("select public.entrar_fila_landing($1::jsonb) as r", [JSON.stringify(dados(await erp(q)))])).r;
      await q.como(U.parceiroA);
      expect(await q.sql("select id from public.cadastros_landing")).toEqual([]);
      await q.falha("select public.aprovar_cadastro_landing($1)", [r.cadastro_id]);
      await q.como(U.parcerias);
      await q.falha("update public.cadastros_landing set status = 'aprovado' where id = $1", [r.cadastro_id]);
    }));
});
