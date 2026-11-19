// Documento "Modelo de negócio e arquitetura de processos" (19/11/2026): só o time interno lê; ninguém grava pelo app.
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Documentos internos", () => {
  it("o time interno lê o documento e o parceiro não vê nada", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("insert into public.documentos_internos (chave, titulo, versao, html) values ('modelo-e-processos', 'Modelo e processos', 'v12', '<p>doc</p>')");
      for (const u of [U.admin, U.parcerias, U.consultor, U.financeiro]) {
        await q.como(u);
        expect((await q.um("select versao from public.documentos_internos where chave = 'modelo-e-processos'")).versao).toBe("v12");
      }
      await q.como(U.parceiroA);
      expect(await q.sql("select chave from public.documentos_internos")).toEqual([]);
    }));

  it("ninguém grava pelo app, nem o administrador", () =>
    transacao(async (q) => {
      await q.como(U.admin);
      await q.falha("insert into public.documentos_internos (chave, titulo, versao, html) values ('x', 'x', 'x', 'x')");
    }));
});
