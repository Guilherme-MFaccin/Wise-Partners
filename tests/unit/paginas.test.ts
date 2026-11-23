// Conteúdo editável das páginas públicas: padrão do código + o que o portal salvou, marcadores e textos sem travessão.
import { describe, expect, it } from "vitest";
import {
  BLOCOS_CLIENTE, BLOCOS_PARCEIROS, META_CLIENTE, META_PARCEIROS, PADRAO_CLIENTE, PADRAO_PARCEIROS, compactarConteudo, montarConteudo, perfilReuniao,
  preencher, reais, resolverDados, temTravessao,
} from "@/lib/paginas";

describe("paginas", () => {
  it("conteúdo vazio usa o padrão e o salvo substitui só o que mudou", () => {
    expect(montarConteudo(PADRAO_PARCEIROS, {})).toEqual(PADRAO_PARCEIROS);
    expect(montarConteudo(PADRAO_PARCEIROS, null)).toEqual(PADRAO_PARCEIROS);
    const c = montarConteudo(PADRAO_PARCEIROS, { secoes: { topo: { titulo: "Novo", texto: "  " }, cases: { visivel: false } }, perguntas: [{ pergunta: "P?", resposta: "R." }] });
    expect(c.secoes.topo.titulo).toBe("Novo");
    expect(c.secoes.topo.texto).toBe(PADRAO_PARCEIROS.secoes.topo.texto);
    expect(c.secoes.cases.visivel).toBe(false);
    expect(c.perguntas).toEqual([{ pergunta: "P?", resposta: "R." }]);
  });

  it("compactar grava só a diferença e volta ao mesmo conteúdo", () => {
    expect(compactarConteudo(PADRAO_CLIENTE, PADRAO_CLIENTE)).toEqual({});
    const editado = structuredClone(PADRAO_CLIENTE);
    editado.secoes.topo.titulo = "Outro título";
    editado.secoes.equipe.visivel = false;
    editado.secoes.comparacao.itens = [{ titulo: "Linha única", texto: "" }];
    const salvo = compactarConteudo(PADRAO_CLIENTE, editado);
    expect(salvo).toEqual({ secoes: { topo: { titulo: "Outro título" }, equipe: { visivel: false }, comparacao: { itens: [{ titulo: "Linha única", texto: "" }] } } });
    expect(montarConteudo(PADRAO_CLIENTE, salvo)).toEqual(editado);
  });

  it("gera o texto do perfil da reunião a partir da configuração", () => {
    expect(perfilReuniao({ min_vendedores: 3, faturamento_min: "250k_500k" })).toBe("a partir de 3 vendedores e R$ 250 mil de faturamento por mês");
    expect(perfilReuniao({ min_vendedores: 1, faturamento_min: null })).toBe("a partir de 1 vendedor");
    expect(perfilReuniao({ min_vendedores: 5, faturamento_min: "1m_5m" })).toBe("a partir de 5 vendedores e R$ 1 milhão de faturamento por mês");
  });

  it("troca os marcadores pelos valores e mantém os desconhecidos", () => {
    const { vars } = resolverDados({ valores: { diagnostico: 2000, hub: 3000, total: 5000 }, icp: null, cases: { itens: [], quantidade: 8, media: 35 } });
    expect(preencher("Vale {valor_total}, média {media_cases} em {qtd_cases}. {outro}", vars)).toBe("Vale R$ 5.000, média +35% em 8. {outro}");
    expect(reais(2500.5)).toBe("R$ 2.500,50");
  });

  it("nenhum texto padrão tem travessão, cita parceiro pelo nome ou promete a marca do parceiro", () => {
    for (const p of [PADRAO_PARCEIROS, PADRAO_CLIENTE]) {
      expect(temTravessao(p)).toBe(false);
      const t = JSON.stringify(p);
      expect(t).not.toMatch(/sua marca|com a marca|logo da|CRM e ERP|seu software|seu sistema|time de implantação/i);
    }
  });

  it("o editor descreve todos os blocos das duas páginas", () => {
    expect(META_PARCEIROS.map((m) => m.chave)).toEqual([...BLOCOS_PARCEIROS]);
    expect(META_CLIENTE.map((m) => m.chave)).toEqual([...BLOCOS_CLIENTE]);
  });
});

describe("página da comunidade", () => {
  it("todo bloco tem descrição no editor, nenhum texto tem travessão e o padrão volta igual", async () => {
    const { BLOCOS_COMUNIDADE, META_COMUNIDADE, PADRAO_COMUNIDADE, compactarConteudo: compactar, montarConteudo: montar, temTravessao: travessao } = await import("@/lib/paginas");
    expect(META_COMUNIDADE.map((m) => m.chave).sort()).toEqual([...BLOCOS_COMUNIDADE].sort());
    expect(travessao(PADRAO_COMUNIDADE)).toBe(false);
    expect(compactar(PADRAO_COMUNIDADE, PADRAO_COMUNIDADE)).toEqual({});
    expect(montar(PADRAO_COMUNIDADE, { secoes: { grupo: { visivel: false } } }).secoes.grupo.visivel).toBe(false);
  });
});

describe("navegação da área logada", () => {
  it("quem não é parceiro vê Catálogo, Indicar e Conhecer, com o Catálogo primeiro", async () => {
    const { SECOES_PARCEIRO, ORDEM_MEMBRO } = await import("@/lib/navegacao");
    const doMembro = SECOES_PARCEIRO.filter((s) => s.abas.some((a) => a.membro)).map((s) => s.id);
    expect(doMembro.sort()).toEqual([...ORDEM_MEMBRO].sort());
    expect(ORDEM_MEMBRO[0]).toBe("catalogo");
    const indicar = SECOES_PARCEIRO.flatMap((s) => s.abas).filter((a) => a.indicar).map((a) => a.to);
    expect(indicar).toEqual(["/parceiro/indicar", "/parceiro/indicacoes"]);
  });
});
