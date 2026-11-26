// Ver como (26/11/2026): só o administrador e o gerente listam as contas; administradores não aparecem; o tipo de acesso
// segue as mesmas regras da navegação (cliente do grupo, empresa da comunidade, parceiro por nível, time da Wise)
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Ver como", () => {
  it("lista as contas com o tipo de acesso, sem administradores, e só para a gestão", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(`update public.parceiros set nivel = 'A', pacote = 'C', nivel_ajuste_motivo = 'Teste do ver como', data_assinatura = coalesce(data_assinatura, public.hoje() - 10) where id = '${P.A}'`);
      await q.como(U.parcerias);
      const contas = await q.sql("select perfil_id, papel, tipo from public.contas_para_ver_como()");
      expect(contas.some((c: any) => c.papel === "admin")).toBe(false);
      expect(contas.find((c: any) => c.perfil_id === U.parceiroA)?.tipo).toBe("parceiro_elite");
      expect(contas.find((c: any) => c.perfil_id === U.consultor)?.tipo).toBe("consultor");
      await q.como(U.consultor);
      expect(await q.sql("select * from public.contas_para_ver_como()")).toEqual([]);
      await q.como(U.parceiroA);
      expect(await q.sql("select * from public.contas_para_ver_como()")).toEqual([]);
    }));
});
