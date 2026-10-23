import type { BlocoRfp } from "@/lib/ia";
import { semTravessao, somenteDigitos } from "@/lib/formato";
import { CAMPOS_FICHA, textoCampo, type BlocoPublico, type Candidato } from "./tipos";

export type CategoriaPagina = {
  categoria_id: string;
  nome: string;
  motivo: string;
  parceiros: { parceiro_id: string; nome: string }[];
};

export type ContextoPagina = {
  clienteNome: string;
  necessidade: string;
  necessidadeResumida: string;
  consultor: { nome: string; email: string | null; telefone: string | null };
  aviso: string;
  categorias: CategoriaPagina[];
  candidatos: Candidato[];
};

function linhas(t: string): string[] {
  return t.split(/\r?\n|;/).map((l) => l.replace(/^[\s*•-]+/, "").trim()).filter(Boolean);
}

// Entrada da tarefa montar_pagina_rfp
export function entradaMontarPagina(ctx: ContextoPagina) {
  const porId = new Map(ctx.candidatos.map((c) => [c.parceiro_id, c]));
  return {
    pedido: { cliente_nome: ctx.clienteNome, necessidade: ctx.necessidade, necessidade_resumida: ctx.necessidadeResumida },
    consultor: ctx.consultor,
    categorias: ctx.categorias.map((cat) => ({
      categoria_id: cat.categoria_id,
      nome: cat.nome,
      parceiros: cat.parceiros.map((p) => {
        const c = porId.get(p.parceiro_id);
        return {
          parceiro_id: p.parceiro_id,
          nome: p.nome,
          visao_wise: textoCampo(c, CAMPOS_FICHA.visao_wise),
          o_que_faz: textoCampo(c, CAMPOS_FICHA.o_que_faz),
          diferenciais: textoCampo(c, CAMPOS_FICHA.diferenciais),
          para_quem: textoCampo(c, CAMPOS_FICHA.para_quem),
          cases: textoCampo(c, CAMPOS_FICHA.cases),
        };
      }),
    })),
    aviso: ctx.aviso,
  };
}

// Montagem sem IA, a partir das mesmas fichas (usada quando a IA falha).
export function montarBlocosPadrao(ctx: ContextoPagina): BlocoRfp[] {
  const porId = new Map(ctx.candidatos.map((c) => [c.parceiro_id, c]));
  const necessidade = ctx.necessidadeResumida || ctx.necessidade;
  const blocos: BlocoRfp[] = [
    {
      tipo: "abertura",
      titulo: `Opções selecionadas para ${ctx.clienteNome}`,
      texto: `Reunimos fornecedores parceiros da Wise Makers que podem ajudar a resolver ${necessidade}. Cada opção é apresentada na nossa perspectiva, para você conversar com elas e decidir com tranquilidade.`,
    },
  ];
  for (const cat of ctx.categorias) {
    blocos.push({
      tipo: "categoria",
      categoria_id: cat.categoria_id,
      titulo: cat.nome,
      texto: cat.motivo ?? "",
      parceiros: cat.parceiros.map((p) => {
        const c = porId.get(p.parceiro_id);
        return {
          parceiro_id: p.parceiro_id,
          nome: p.nome,
          texto: textoCampo(c, CAMPOS_FICHA.visao_wise) || textoCampo(c, CAMPOS_FICHA.o_que_faz),
          destaques: linhas(textoCampo(c, CAMPOS_FICHA.diferenciais)).slice(0, 3),
        };
      }),
    });
  }
  blocos.push({ tipo: "aviso", texto: ctx.aviso });
  blocos.push({
    tipo: "consultor",
    nome: ctx.consultor.nome,
    email: ctx.consultor.email,
    telefone: ctx.consultor.telefone,
    texto: "Se quiser ajuda para comparar as opções, fale comigo.",
  });
  return blocos.map(limparBloco);
}

function limparBloco(b: BlocoRfp): BlocoRfp {
  switch (b.tipo) {
    case "abertura":
      return { tipo: "abertura", titulo: semTravessao(b.titulo ?? ""), texto: semTravessao(b.texto ?? "") };
    case "aviso":
      return { tipo: "aviso", texto: semTravessao(b.texto ?? "") };
    case "consultor":
      return { tipo: "consultor", nome: b.nome ?? "", email: b.email ?? null, telefone: b.telefone ?? null, texto: semTravessao(b.texto ?? "") };
    case "categoria":
      return {
        tipo: "categoria",
        categoria_id: b.categoria_id,
        titulo: semTravessao(b.titulo ?? ""),
        texto: semTravessao(b.texto ?? ""),
        parceiros: (b.parceiros ?? []).map((p) => ({
          parceiro_id: p.parceiro_id,
          nome: p.nome,
          texto: semTravessao(p.texto ?? ""),
          destaques: (p.destaques ?? []).map((d) => semTravessao(String(d))).filter(Boolean),
        })),
      };
  }
}

// Normaliza a resposta da IA: só blocos padrão, só parceiros da seleção (com o nome oficial),
// categorias que faltarem entram pela montagem padrão, e aviso e consultor sempre presentes.
export function normalizarBlocosIA(blocosIA: BlocoRfp[] | undefined, ctx: ContextoPagina): BlocoRfp[] {
  const padrao = montarBlocosPadrao(ctx);
  const ia = (blocosIA ?? []).filter((b) => b && ["abertura", "categoria", "aviso", "consultor"].includes(b.tipo));
  const abertura = ia.find((b) => b.tipo === "abertura") ?? padrao[0];
  const resultado: BlocoRfp[] = [limparBloco(abertura)];
  for (const cat of ctx.categorias) {
    const bIA = ia.find((b) => b.tipo === "categoria" && b.categoria_id === cat.categoria_id) as Extract<BlocoRfp, { tipo: "categoria" }> | undefined;
    const bPadrao = padrao.find((b) => b.tipo === "categoria" && b.categoria_id === cat.categoria_id) as Extract<BlocoRfp, { tipo: "categoria" }>;
    if (!bIA) {
      resultado.push(bPadrao);
      continue;
    }
    resultado.push(limparBloco({
      tipo: "categoria",
      categoria_id: cat.categoria_id,
      titulo: bIA.titulo || cat.nome,
      texto: bIA.texto ?? "",
      parceiros: cat.parceiros.map((p) => {
        const pIA = (bIA.parceiros ?? []).find((x) => x.parceiro_id === p.parceiro_id);
        const pPadrao = bPadrao.parceiros.find((x) => x.parceiro_id === p.parceiro_id)!;
        return {
          parceiro_id: p.parceiro_id,
          nome: p.nome,
          texto: pIA?.texto || pPadrao.texto,
          destaques: Array.isArray(pIA?.destaques) && pIA.destaques.length ? pIA.destaques : pPadrao.destaques,
        };
      }),
    }));
  }
  const aviso = ia.find((b) => b.tipo === "aviso") as Extract<BlocoRfp, { tipo: "aviso" }> | undefined;
  resultado.push(limparBloco({ tipo: "aviso", texto: aviso?.texto?.trim() ? aviso.texto : ctx.aviso }));
  const consultor = ia.find((b) => b.tipo === "consultor") as Extract<BlocoRfp, { tipo: "consultor" }> | undefined;
  resultado.push(limparBloco({
    tipo: "consultor",
    nome: ctx.consultor.nome,
    email: ctx.consultor.email,
    telefone: ctx.consultor.telefone,
    texto: consultor?.texto ?? "Se quiser ajuda para comparar as opções, fale comigo.",
  }));
  return resultado;
}

// Converte os blocos do editor para o formato da página pública, para a pré-visualização.
export function blocosParaPrevia(blocos: BlocoRfp[], candidatos: Candidato[]): BlocoPublico[] {
  const porId = new Map(candidatos.map((c) => [c.parceiro_id, c]));
  return blocos.map((b): BlocoPublico => {
    if (b.tipo !== "categoria") return b as BlocoPublico;
    return {
      tipo: "categoria",
      titulo: b.titulo,
      texto: b.texto,
      parceiros: b.parceiros.map((p) => {
        const c = porId.get(p.parceiro_id);
        const contato = somenteDigitos(textoCampo(c, CAMPOS_FICHA.whatsapp)) ? "whatsapp" : textoCampo(c, CAMPOS_FICHA.email) ? "email" : null;
        return { ...p, destaques: p.destaques.filter((d) => d.trim()), disponivel: !!c, contato };
      }),
    };
  });
}

// Parceiros presentes nos blocos de categoria (para comparar com a seleção atual)
export function parceirosNosBlocos(blocos: BlocoRfp[]): string[] {
  return blocos.flatMap((b) => (b.tipo === "categoria" ? b.parceiros.map((p) => `${b.categoria_id}:${p.parceiro_id}`) : []));
}

// Ajusta os blocos à seleção atual sem perder os textos já editados: remove parceiros e categorias
// que saíram, acrescenta os que entraram com o texto padrão da ficha.
export function sincronizarBlocos(blocos: BlocoRfp[], ctx: ContextoPagina): BlocoRfp[] {
  const padrao = montarBlocosPadrao(ctx);
  const abertura = blocos.find((b) => b.tipo === "abertura") ?? padrao[0];
  const categorias: BlocoRfp[] = ctx.categorias.map((cat) => {
    const atual = blocos.find((b) => b.tipo === "categoria" && b.categoria_id === cat.categoria_id) as Extract<BlocoRfp, { tipo: "categoria" }> | undefined;
    const base = padrao.find((b) => b.tipo === "categoria" && b.categoria_id === cat.categoria_id) as Extract<BlocoRfp, { tipo: "categoria" }>;
    if (!atual) return base;
    return {
      ...atual,
      parceiros: cat.parceiros.map((p) => atual.parceiros.find((x) => x.parceiro_id === p.parceiro_id) ?? base.parceiros.find((x) => x.parceiro_id === p.parceiro_id)!),
    };
  });
  const aviso = blocos.find((b) => b.tipo === "aviso") ?? padrao.find((b) => b.tipo === "aviso")!;
  const consultor = blocos.find((b) => b.tipo === "consultor") ?? padrao.find((b) => b.tipo === "consultor")!;
  return [abertura, ...categorias, aviso, consultor];
}

// Limpa os blocos antes de publicar: destaques vazios e espaços sobrando.
export function blocosParaPublicar(blocos: BlocoRfp[]): BlocoRfp[] {
  return blocos.map((b) =>
    b.tipo === "categoria"
      ? { ...b, parceiros: b.parceiros.map((p) => ({ ...p, texto: p.texto.trim(), destaques: p.destaques.map((d) => d.trim()).filter(Boolean) })) }
      : b,
  );
}

// Categorias e parceiros selecionados (opções salvas), na ordem das categorias sugeridas.
export function categoriasDaSelecao(
  opcoes: { categoria_id: string; parceiro_id: string; ordem: number; selecionado: boolean }[],
  sugeridas: { categoria_id: string; motivo: string }[],
  nomeCategoria: (id: string) => string,
  nomeParceiro: (id: string) => string,
): CategoriaPagina[] {
  const selecionadas = opcoes.filter((o) => o.selecionado);
  const ids: string[] = sugeridas.map((s) => s.categoria_id).filter((id) => selecionadas.some((o) => o.categoria_id === id));
  for (const o of selecionadas) if (!ids.includes(o.categoria_id)) ids.push(o.categoria_id);
  return ids.map((id) => ({
    categoria_id: id,
    nome: nomeCategoria(id),
    motivo: sugeridas.find((s) => s.categoria_id === id)?.motivo ?? "",
    parceiros: selecionadas.filter((o) => o.categoria_id === id).sort((a, b) => a.ordem - b.ordem)
      .map((o) => ({ parceiro_id: o.parceiro_id, nome: nomeParceiro(o.parceiro_id) })),
  }));
}
