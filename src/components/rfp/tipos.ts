import type { BlocoRfp } from "@/lib/ia";

// Parceiro elegível devolvido por rfp_candidatos(): assinado, sem encerramento e com ficha publicada.
// Os campos vêm pelo rótulo (ex.: "Visão da Wise") e só incluem campos marcados para RFP e não internos.
export type Candidato = {
  parceiro_id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  categorias: { categoria_id: string; nome: string; principal: boolean }[] | null;
  campos: Record<string, any> | null;
};

export type PedidoRfp = {
  id: string;
  cliente_id: string | null;
  cliente_nome: string;
  consultor_id: string;
  empresa_grupo_id: string;
  necessidade: string;
  necessidade_resumida: string | null;
  porte: string | null;
  regiao: string | null;
  prazo: string | null;
  restricoes: string | null;
  categorias_sugeridas: CategoriaSugerida[];
  excecoes: { categoria_id: string; categoria: string; selecionados: number; disponiveis: number; registrada_em: string }[];
  sem_fornecedor: SemFornecedor[];
  estado: "rascunho" | "publicado" | "encerrado";
  created_at: string;
};

export type CategoriaSugerida = { categoria_id: string; nome?: string; motivo: string };
export type SemFornecedor = { necessidade: string; categoria_sugerida: string | null };

// Opção de parceiro numa categoria do pedido (pedido_rfp_opcoes)
export type OpcaoRfp = {
  categoria_id: string;
  parceiro_id: string;
  ordem: number;
  aderencia: number | null;
  justificativa: string | null;
  selecionado: boolean;
};

export type PaginaRfp = {
  id: string;
  pedido_id: string;
  token: string | null;
  blocos: BlocoRfp[];
  publicada_em: string | null;
  expira_em: string | null;
  revogada: boolean;
  revogada_em: string | null;
  aberturas: number;
};

// Formato que a página pública recebe (rfp_pagina_publica). A pré-visualização usa o mesmo formato.
export type ParceiroPublico = {
  parceiro_id: string;
  nome: string;
  texto: string;
  destaques: string[];
  disponivel: boolean;
  contato: "whatsapp" | "email" | null;
};

export type BlocoPublico =
  | { tipo: "abertura"; titulo: string; texto: string }
  | { tipo: "categoria"; titulo: string; texto: string; parceiros: ParceiroPublico[] }
  | { tipo: "aviso"; texto: string }
  | { tipo: "consultor"; texto: string; nome: string; email: string | null; telefone: string | null };

export type DadosPaginaPublica = {
  estado: "ok" | "indisponivel" | "nao_encontrada";
  cliente_nome?: string;
  necessidade_resumida?: string;
  blocos?: BlocoPublico[];
  consultor?: { nome: string | null; email: string | null; telefone: string | null };
  expira_em?: string;
};

// Rótulos dos campos da ficha usados para montar a página (chaves de rfp_candidatos().campos)
export const CAMPOS_FICHA = {
  visao_wise: "Visão da Wise",
  o_que_faz: "O que a empresa faz",
  diferenciais: "Diferenciais",
  para_quem: "Para quem é indicado",
  cases: "Cases",
  whatsapp: "WhatsApp comercial para clientes",
  email: "E-mail comercial para clientes",
};

export function textoCampo(c: Candidato | undefined, rotulo: string): string {
  const v = c?.campos?.[rotulo];
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v).trim();
}

export const AVISO_PADRAO =
  "A Wise Makers mantém relação comercial com os fornecedores apresentados nesta página. A decisão de contratação é sempre sua, e recomendamos conversar com mais de uma opção antes de decidir.";
