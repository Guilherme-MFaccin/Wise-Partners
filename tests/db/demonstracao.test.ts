// Contas de demonstração (26/11/2026): uma por tipo de acesso, criadas pelos scripts de scripts/contas-demonstracao.
// O time real e as rotinas não veem as empresas nem as pessoas marcadas; quem está numa conta de demonstração vê.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

const passo1 = readFileSync("scripts/contas-demonstracao/1-empresas.sql", "utf8");
const passo3 = readFileSync("scripts/contas-demonstracao/3-marcar.sql", "utf8");

// Os três passos, com o Auth simulado pela inserção em auth.users (o gatilho cria o perfil a partir do convite)
async function criar(q: Q) {
  await q.sistema();
  await q.sql(passo1);
  await q.sql("insert into auth.users (id, email) select gen_random_uuid(), email from public.convites where email like 'demo.%@example.com'");
  await q.sql(passo3);
  const r = await q.sql("select id, email, public.tipo_acesso(p) tipo from public.perfis p where demonstracao");
  return Object.fromEntries(r.map((x: any) => [x.tipo, x.id])) as Record<string, string>;
}

describe("Contas de demonstração", () => {
  it("cria uma conta para cada tipo de acesso, todas marcadas, e os scripts podem rodar de novo", () =>
    transacao(async (q) => {
      const contas = await criar(q);
      expect(Object.keys(contas).sort()).toEqual(["cliente_grupo", "comercial", "consultor", "financeiro", "membro", "parceiro_elite",
        "parceiro_entrada", "parceiro_premium", "parceiro_select", "parcerias"]);
      await q.sql(passo1); await q.sql(passo3);
      expect((await q.um("select count(*)::int n from public.perfis where demonstracao")).n).toBe(10);
      expect((await q.um("select count(*)::int n from public.parceiros where demonstracao")).n).toBe(6);
      expect((await q.um("select vinculo_cliente from public.membros_comunidade where parceiro_id = 'de300000-0000-4000-a000-000000000005'")).vinculo_cliente).toBe("confirmado");
    }));

  it("o time real não vê as empresas nem as pessoas, e os números não mudam", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      const antes = await q.um("select (public.painel_semanal(current_date - 7, current_date)->>'assinados')::int a, (select count(*)::int from public.ranking(null, null)) r");
      await criar(q);
      await q.como(U.admin);
      expect((await q.um("select count(*)::int n from public.parceiros where nome_fantasia like 'Demonstração%'")).n).toBe(0);
      expect((await q.um("select count(*)::int n from public.perfis where email like 'demo.%'")).n).toBe(0);
      expect((await q.um("select count(*)::int n from public.membros_comunidade where email like 'demo.%'")).n).toBe(0);
      const depois = await q.um("select (public.painel_semanal(current_date - 7, current_date)->>'assinados')::int a, (select count(*)::int from public.ranking(null, null)) r");
      expect(depois).toEqual(antes);
      expect((await q.um("select count(*)::int n from public.fila_tarefas() f where f.parceiro_id::text like 'de300000%'")).n).toBe(0);
    }));

  it("o Ver como lista as contas com a marca, e dentro de uma delas o portal mostra as empresas de demonstração", () =>
    transacao(async (q) => {
      const contas = await criar(q);
      await q.como(U.admin);
      const lista = await q.sql("select tipo, demonstracao from public.contas_para_ver_como() where demonstracao");
      expect(lista).toHaveLength(10);
      await q.como(contas.parcerias);
      expect((await q.um("select count(*)::int n from public.parceiros where demonstracao")).n).toBe(6);
      expect((await q.sql("select nome from public.ranking(null, null)")).map((r: any) => r.nome)).toContain("Demonstração Parceiro Elite");
      await q.como(contas.parceiro_elite);
      expect((await q.um("select public.acesso_comunidade()->>'nivel' n")).n).toBe("elite");
    }));

  it("e-mail não sai para conta de demonstração, e a marca só muda pelo administrador", () =>
    transacao(async (q) => {
      const contas = await criar(q);
      await q.sistema();
      await q.sql("insert into public.notificacoes (usuario_id, tipo, titulo) values ($1, 'teste', 'Aviso')", [contas.parcerias]);
      expect((await q.um("select enviar_email from public.notificacoes where usuario_id = $1", [contas.parcerias])).enviar_email).toBe(false);
      await q.como(contas.parcerias);
      expect(await q.falha("update public.perfis set demonstracao = false where id = $1", [contas.parcerias])).toMatch(/administradores/);
    }));
});
