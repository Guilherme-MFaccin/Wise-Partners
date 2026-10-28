import { describe, expect, it } from "vitest";
import { casaBusca, ordenarSecoes } from "@/components/comum/NavegacaoSecoes";

describe("casaBusca", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(casaBusca("Ações da Wise", "ACOES")).toBe(true);
    expect(casaBusca("Régua de atendimento", "regua")).toBe(true);
  });
  it("casa pelo início das palavras", () => {
    expect(casaBusca("Custos e remunerações", "acoes")).toBe(false);
    expect(casaBusca("Modelos de contrato", "contr")).toBe(true);
    expect(casaBusca("Textos de e-mail", "mail")).toBe(true);
  });
  it("exige todas as palavras buscadas", () => {
    expect(casaBusca("Etapas e motivos de perda", "etapa perda")).toBe(true);
    expect(casaBusca("Etapas e motivos de perda", "etapa nivel")).toBe(false);
  });
  it("busca vazia casa tudo", () => {
    expect(casaBusca("Backup", "  ")).toBe(true);
  });
});

describe("ordenarSecoes", () => {
  it("ordena em pt-BR e mantém as fixas no topo", () => {
    const { fixas, demais } = ordenarSecoes([
      { id: "s", rotulo: "Scorecard" }, { id: "v", rotulo: "Visão geral", fixa: true },
      { id: "a", rotulo: "Ações da Wise" }, { id: "b", rotulo: "Backup" }, { id: "r", rotulo: "Régua" },
    ]);
    expect(fixas.map((s) => s.id)).toEqual(["v"]);
    expect(demais.map((s) => s.id)).toEqual(["a", "b", "r", "s"]);
  });
});
