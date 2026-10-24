// Cruzamento de carteiras: a comparação devolve só as coincidências; nada da lista sai da função.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  cnpjValido, compararCarteiras, extrairDaPlanilha, normalizarItens, quadrante, type LinhaBase,
} from "../../supabase/functions/_shared/cruzamento";

// Gera CNPJs válidos a partir de uma raiz de 8 dígitos (filial 0001)
function cnpj(raiz: string) {
  const d = (raiz + "0001").split("").map(Number);
  const dv = (n: number[]) => {
    const pesos = n.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const r = n.reduce((a, x, i) => a + x * pesos[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  d.push(dv(d));
  d.push(dv(d));
  return d.join("");
}
const raiz = (k: number) => String(20000000 + k * 104729).slice(0, 8);

describe("cruzamento de carteiras", () => {
  it("valida CNPJ pelos dígitos verificadores", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido(cnpj(raiz(3)))).toBe(true);
  });

  it("50 CNPJs com 5 coincidências: devolve só as 5, com totais por quadrante", () => {
    const linhas: unknown[][] = [["Razão social", "CNPJ", "Tipo", "Contato"]];
    for (let k = 1; k <= 50; k++) linhas.push([`Empresa ${k}`, cnpj(raiz(k)), k % 2 ? "Cliente" : "prospect", `pessoa${k}@x.com`]);
    const { itens, problemas } = extrairDaPlanilha(linhas);
    expect(problemas).toEqual([]);
    expect(itens).toHaveLength(50);
    // Só raiz e tipo: nenhum nome, e-mail ou CNPJ completo
    expect(JSON.stringify(itens)).not.toMatch(/Empresa|@|0001/);

    const base: LinhaBase[] = [
      { id: "b1", cnpj_raiz: raiz(1), tipo: "cliente" },   // cliente x cliente
      { id: "b2", cnpj_raiz: raiz(2), tipo: "cliente" },   // cliente x prospect
      { id: "b3", cnpj_raiz: raiz(3), tipo: "prospect" },  // prospect x cliente
      { id: "b4", cnpj_raiz: raiz(4), tipo: "prospect" },  // prospect x prospect
      { id: "b5", cnpj_raiz: raiz(5), tipo: "cliente" },
      { id: "b6", cnpj_raiz: "99999999", tipo: "cliente" },
    ];
    const r = compararCarteiras(itens, base);
    expect(r.total_enviado).toBe(50);
    expect(r.coincidencias.map((c) => c.base_wise_id)).toEqual(["b1", "b2", "b3", "b4", "b5"]);
    expect(r.totais).toEqual({ cliente_comum: 2, wise_apresenta: 1, parceiro_apresenta: 1, acao_conjunta: 1 });
    // O resultado não carrega nenhuma das 45 raízes que não coincidiram
    const saida = JSON.stringify(r);
    for (let k = 6; k <= 50; k++) expect(saida.includes(raiz(k))).toBe(false);
  });

  it("recusa no navegador arquivo sem colunas, CNPJ inválido e acima do máximo", () => {
    expect(extrairDaPlanilha([["Nome", "Telefone"]]).semColuna).toBe(true);
    const r = extrairDaPlanilha([["CNPJ", "Tipo"], ["11.222.333/0001-82", "cliente"], [cnpj(raiz(1)), "fornecedor"]]);
    expect(r.problemas).toEqual(["Linha 2: CNPJ inválido", "Linha 3: tipo deve ser cliente ou prospect"]);
    const muitas: unknown[][] = [["CNPJ", "Tipo"]];
    for (let k = 1; k <= 30; k++) muitas.push([cnpj(raiz(k)), "cliente"]);
    expect(extrairDaPlanilha(muitas, 20).problemas[0]).toMatch(/máximo é 20/);
  });

  it("no servidor, aceita só raiz de 8 dígitos e tipo; raiz repetida vale uma vez, cliente prevalece", () => {
    const { itens, invalidos } = normalizarItens([
      { raiz: "12345678", tipo: "prospect" }, { raiz: "12345678", tipo: "cliente" },
      { raiz: "1234567", tipo: "cliente" }, { raiz: "12345678000190", tipo: "cliente" }, { raiz: "87654321", tipo: "lead" },
    ]);
    expect(itens).toEqual([{ raiz: "12345678", tipo: "cliente" }]);
    expect(invalidos).toBe(3);
    expect(quadrante("cliente", "prospect")).toBe("wise_apresenta");
  });

  it("a Edge Function não registra nada em log", () => {
    const fonte = readFileSync("supabase/functions/cruzamento-carteiras/index.ts", "utf8")
      + readFileSync("supabase/functions/_shared/cruzamento.ts", "utf8");
    expect(fonte).not.toMatch(/console\.|\.storage\.|\.from\("(?!base_wise_cruzamento)/);
  });
});
