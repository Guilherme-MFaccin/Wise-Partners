// Gerenciador de tarefas (21/11/2026): exceções viram tarefas, fecham sozinhas, e as permissões de edição
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

const PASSO = (pid: string) => `insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id, estado)
  values ('${pid}', 'Ligar para o parceiro', public.hoje() - 3, '${U.parcerias}', 'aberto') returning id`;

describe("Sincronização das regras", () => {
  it("a exceção vira tarefa e fecha sozinha quando se resolve", () =>
    transacao(async (q) => {
      await q.sistema();
      const passo = (await q.um(PASSO(P.A))).id;
      await q.como(U.parcerias);
      await q.sql("select public.sincronizar_tarefas(true)");
      const t = await q.um(`select id, origem, status, prioridade, responsavel_id from public.tarefas where chave_regra = 'proximo_passo:${passo}'`);
      expect(t).toMatchObject({ origem: "regra", status: "a_fazer", prioridade: "normal", responsavel_id: U.parcerias });
      await q.sistema();
      await q.sql(`update public.proximos_passos set estado = 'feito' where id = '${passo}'`);
      await q.como(U.parcerias);
      await q.sql("select public.sincronizar_tarefas(true)");
      const f = await q.um(`select status, resolvida_pela_regra, concluida_em is not null as concluida from public.tarefas where id = '${t.id}'`);
      expect(f).toMatchObject({ status: "feito", resolvida_pela_regra: true, concluida: true });
    }));

  it("fechada à mão com o caso ainda aberto, não volta antes de 7 dias", () =>
    transacao(async (q) => {
      await q.sistema();
      const passo = (await q.um(PASSO(P.A))).id;
      await q.como(U.parcerias);
      await q.sql("select public.sincronizar_tarefas(true)");
      await q.sql(`update public.tarefas set status = 'feito' where chave_regra = 'proximo_passo:${passo}'`);
      await q.sql("select public.sincronizar_tarefas(true)");
      expect((await q.um(`select count(*)::int n from public.tarefas where chave_regra = 'proximo_passo:${passo}'`)).n).toBe(1);
      await q.sistema();
      await q.sql(`update public.tarefas set concluida_em = now() - interval '8 days' where chave_regra = 'proximo_passo:${passo}'`);
      await q.como(U.parcerias);
      await q.sql("select public.sincronizar_tarefas(true)");
      expect((await q.um(`select count(*)::int n from public.tarefas where chave_regra = 'proximo_passo:${passo}' and status = 'a_fazer'`)).n).toBe(1);
    }));
});

describe("Permissões", () => {
  it("o time interno cria e vê; o parceiro não vê nada; ninguém cria tarefa de regra à mão", () =>
    transacao(async (q) => {
      await q.como(U.consultor);
      await q.sql(`insert into public.tarefas (titulo, responsavel_id) values ('Preparar diagnóstico', '${U.consultor}')`);
      expect((await q.sql("select id from public.tarefas where titulo = 'Preparar diagnóstico'")).length).toBe(1);
      await q.falha("insert into public.tarefas (titulo, origem) values ('Falsa', 'regra')");
      await q.como(U.parceiroA);
      expect(await q.sql("select id from public.tarefas")).toEqual([]);
      expect(await q.um("select public.sincronizar_tarefas(true) n")).toMatchObject({ n: 0 });
    }));

  it("o consultor edita as suas e não as de outra pessoa; a gestão edita todas", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      const t = (await q.um(`insert into public.tarefas (titulo, responsavel_id) values ('Da gestão', '${U.parcerias}') returning id`)).id;
      await q.como(U.consultor);
      await q.sql(`update public.tarefas set status = 'fazendo' where id = '${t}'`);
      await q.como(U.parcerias);
      expect((await q.um(`select status from public.tarefas where id = '${t}'`)).status).toBe("a_fazer");
      await q.sql(`update public.tarefas set status = 'fazendo', responsavel_id = '${U.consultor}' where id = '${t}'`);
      await q.como(U.consultor);
      await q.sql(`update public.tarefas set status = 'feito' where id = '${t}'`);
      expect((await q.um(`select status, concluida_em is not null c from public.tarefas where id = '${t}'`))).toMatchObject({ status: "feito", c: true });
    }));

  it("comentários: o interno comenta como ele mesmo; travessão é recusado", () =>
    transacao(async (q) => {
      await q.como(U.parcerias);
      const t = (await q.um("insert into public.tarefas (titulo) values ('Com comentário') returning id")).id;
      await q.sql(`insert into public.tarefa_comentarios (tarefa_id, texto) values ('${t}', 'Combinado com o parceiro')`);
      await q.falha(`insert into public.tarefa_comentarios (tarefa_id, texto, autor_id) values ('${t}', 'Outro', '${U.consultor}')`);
      await q.falha(`insert into public.tarefa_comentarios (tarefa_id, texto) values ('${t}', 'texto ${String.fromCharCode(8212)} com travessão')`);
    }));
});
