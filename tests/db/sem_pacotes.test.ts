// Hierarquia antiga fora do portal (26/11/2026): os pacotes saíram e os benefícios seguem o nível (FO-19).
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

describe("Sem pacotes", () => {
  it("nenhuma tabela, coluna, função, régua ou texto de e-mail fala de pacote", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select to_regclass('public.pacotes') t")).t).toBeNull();
      expect((await q.sql("select table_name, column_name from information_schema.columns where table_schema = 'public' and column_name ilike '%pacote%'"))).toEqual([]);
      expect((await q.sql(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                           where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ilike '%pacote%'`))).toEqual([]);
      expect((await q.sql("select chave from public.regua_atendimento where chave ilike '%pacote%' or descricao ilike '%pacote%'"))).toEqual([]);
      expect((await q.sql("select chave from public.textos_email where corpo ilike '%pacote%' or assunto ilike '%pacote%'"))).toEqual([]);
    }));

  it("as entregas, o Wise Hub e as tarefas de onboarding ficam no nível, com o que antes era de cada pacote", () =>
    transacao(async (q) => {
      await q.sistema();
      const n = await q.sql("select codigo, wise_hub, jsonb_array_length(entregas) e, jsonb_array_length(tarefas_onboarding) t from public.niveis where tipo_parceria = 'comercial' order by codigo");
      expect(n).toEqual([
        { codigo: "A", wise_hub: true, e: 10, t: 7 },
        { codigo: "B", wise_hub: true, e: 8, t: 6 },
        { codigo: "C", wise_hub: false, e: 4, t: 3 },
      ]);
      const r = await q.um("select public.regras_retrato() r");
      expect(r.r.beneficios.map((b: any) => b.nome)).toEqual(["Select", "Premium", "Elite"]);
      expect(r.r.regua.map((x: any) => x.chave).sort()).toEqual(["nivel:A", "nivel:A:ciclo", "nivel:B", "nivel:C"]);
      expect(JSON.stringify(r.r)).not.toMatch(/pacote/i);
    }));

  it("o parceiro vê no Meu nível o que o nível dele inclui", () =>
    transacao(async (q) => {
      await q.como(U.parceiroA);
      const m = (await q.um("select public.meu_nivel() m")).m;
      expect(m.nivel).toBe("A");
      expect(m.wise_hub).toBe(true);
      expect(m.entregas.length).toBe(10);
      expect(JSON.stringify(m)).not.toMatch(/pacote/i);
    }));

  it("régua e contrapartidas seguem o nível do parceiro", () =>
    transacao(async (q) => {
      await q.sistema();
      expect((await q.um("select public.regua_status($1) r", [P.C])).r).toMatchObject({ aplica: true, cadencia_dias: 90 });
      expect((await q.um("select public.regua_status($1) r", [P.B])).r).toMatchObject({ aplica: true });
    }));
});
