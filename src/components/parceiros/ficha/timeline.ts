import { supabase } from "@/integrations/supabase/client";
import { data as fmtData, dataHora, moeda } from "@/lib/formato";
import {
  ESTADOS_COMISSAO, ESTADOS_CONTRAPARTIDA, ETAPAS, ETAPAS_INDICACAO, PACOTES, STATUS_ATIVIDADE, TIPOS_CONTATO, TIPOS_DOCUMENTO,
  TIPOS_PARCERIA, SENTIDOS, nomeNivel, rotulo,
} from "@/lib/rotulos";
import { nomePerfil, type PerfilResumo } from "../dados";

// Linha do tempo do parceiro: pontos de contato, histórico, documentos e indicações.

export type Anexo = { caminho: string; nome: string; tipo?: string };
export type ResumoPonto = {
  resumo?: string;
  decisoes?: string[];
  pendencias_wise?: string[];
  pendencias_parceiro?: string[];
  proximo_passo?: { descricao: string; data: string | null } | null;
  sugestoes_ficha?: { campo: string; valor: string; motivo?: string }[];
};
export type PontoContato = {
  id: string;
  tipo: string;
  data: string;
  participantes: string | null;
  texto: string | null;
  resumo: ResumoPonto | null;
  anexos: Anexo[] | null;
  autor_id: string | null;
  tipo_atividade_id: string | null;
};
export type Historico = {
  id: number;
  tabela: string;
  campo: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  autor_id: string | null;
  created_at: string;
};
export type DocumentoLinha = { id: string; tipo: string; nome: string; versao: number; created_at: string; autor_id: string | null };
export type IndicacaoLinha = {
  id: string;
  sentido: string;
  etapa: string;
  data: string;
  valor_base: number | null;
  created_at: string;
  clientes: { razao_social: string } | null;
  empresas_grupo: { nome: string } | null;
};

export type DadosTimeline = {
  pontos: PontoContato[];
  historico: Historico[];
  documentos: DocumentoLinha[];
  indicacoes: IndicacaoLinha[];
};

export type ItemTimeline =
  | { tipo: "ponto"; data: string; chave: string; ponto: PontoContato }
  | { tipo: "historico"; data: string; chave: string; hist: Historico }
  | { tipo: "documento"; data: string; chave: string; doc: DocumentoLinha }
  | { tipo: "indicacao"; data: string; chave: string; ind: IndicacaoLinha };

// Cada consulta tolera falta de permissão (a RLS devolve vazio).
export async function carregarTimeline(parceiroId: string, limite?: number): Promise<DadosTimeline> {
  const lim = <T,>(q: T) => (limite ? (q as any).limit(limite) : q);
  const [pontos, historico, documentos, indicacoes] = await Promise.all([
    lim(supabase.from("pontos_contato").select("*").eq("parceiro_id", parceiroId).order("data", { ascending: false })),
    lim(supabase.from("historico").select("*").eq("parceiro_id", parceiroId).order("created_at", { ascending: false })),
    lim(supabase.from("documentos").select("id, tipo, nome, versao, created_at, autor_id").eq("parceiro_id", parceiroId).order("created_at", { ascending: false })),
    lim(supabase.from("indicacoes").select("id, sentido, etapa, data, valor_base, created_at, clientes(razao_social), empresas_grupo(nome)")
      .eq("parceiro_id", parceiroId).order("data", { ascending: false })),
  ]);
  for (const r of [pontos, historico, documentos, indicacoes]) if (r.error) throw r.error;
  return {
    pontos: pontos.data ?? [],
    historico: historico.data ?? [],
    documentos: documentos.data ?? [],
    indicacoes: indicacoes.data ?? [],
  };
}

// Junta tudo em ordem cronológica (mais recente primeiro). Criação de documentos e indicações já
// aparece como item próprio, então esses registros do histórico não se repetem.
export function montarTimeline(d: DadosTimeline): ItemTimeline[] {
  const itens: ItemTimeline[] = [
    ...d.pontos.map((p) => ({ tipo: "ponto" as const, data: p.data, chave: `p${p.id}`, ponto: p })),
    ...d.historico
      .filter((h) => !(["documentos", "indicacoes"].includes(h.tabela) && h.campo === "criado"))
      .map((h) => ({ tipo: "historico" as const, data: h.created_at, chave: `h${h.id}`, hist: h })),
    ...d.documentos.map((doc) => ({ tipo: "documento" as const, data: doc.created_at, chave: `d${doc.id}`, doc })),
    ...d.indicacoes.map((ind) => ({ tipo: "indicacao" as const, data: ind.data || ind.created_at, chave: `i${ind.id}`, ind })),
  ];
  return itens.sort((a, b) => dataOrdenavel(b.data) - dataOrdenavel(a.data));
}

function dataOrdenavel(d: string) {
  // Datas puras (AAAA-MM-DD) contam como meio-dia, para não cair no dia anterior
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d).getTime();
}

// ---------------------------------------------------------------------------
// Tradução do histórico
// ---------------------------------------------------------------------------
const TABELAS: Record<string, string> = {
  parceiros: "Parceiro", parceiros_interno: "Dados internos", parceiros_instrumento: "Instrumento do parceiro",
  contrapartidas: "Contrapartida", comprovacoes: "Comprovação", indicacoes: "Indicação", comissoes: "Comissão",
  propostas_ficha: "Proposta de ficha", parceiro_campos: "Ficha", aprovacoes: "Aprovação do Diretor",
  contratos_gerados: "Minuta de contrato", documentos: "Documento", quadros_identificacao: "Quadro de Identificação",
  perfis: "Usuário do parceiro", parceiro_categorias: "Categoria", ciclos_base_ativa: "Base Ativa",
};

const CAMPOS: Record<string, string> = {
  criado: "Registro criado", excluido: "Registro excluído", nome_fantasia: "Nome fantasia", razao_social: "Razão social", cnpj: "CNPJ",
  etapa: "Etapa", nivel: "Nível", nivel_ajuste_motivo: "Motivo do ajuste de nível", pacote: "Pacote",
  status_atividade: "Status de atividade", motivo_inatividade: "Motivo da inatividade", pausado_ate: "Pausado até",
  responsavel_id: "Responsável", carteira_icp: "Carteira no ICP", data_assinatura: "Data de assinatura", motivo_perda: "Motivo da perda",
  tipo_parceria: "Tipo de parceria", estrategico: "Estratégico", estrategico_sugerido: "Sugestão de estratégico",
  programa_proprio: "Programa próprio", instrumento_nome: "Nome do instrumento", comissao_pct: "Comissão (%)",
  comissao_base: "Base da comissão", comissao_condicao: "Condição da comissão", estado: "Estado", proxima_data: "Próxima data",
  ativa: "Ativa", nome: "Nome", motivo_recusa: "Motivo da recusa", principal: "Categoria principal", valor_base: "Valor base",
  data_reuniao: "Data da reunião", data_fechamento: "Data de fechamento", data_compensacao: "Data de compensação",
  cliente_existente: "Cliente existente", excecao_duplicidade: "Exceção de duplicidade", atualizacao_pendente: "Atualização do parceiro",
  valor: "Valor", percentual: "Percentual", tipo: "Tipo", versao: "Versão", caminho_docx: "Arquivo", inicio: "Início",
  evento_data: "Data do evento", revisao_em: "Revisão", email: "E-mail", papel: "Papel", is_responsavel_parceiro: "Responsável do parceiro",
};

export function rotuloTabela(t: string) {
  return TABELAS[t] ?? t;
}

export function rotuloCampoHistorico(campo: string) {
  if (campo.startsWith("ficha: ")) return campo.slice(7);
  return CAMPOS[campo] ?? campo;
}

export function valorHistorico(h: Pick<Historico, "tabela" | "campo">, v: string | null, perfis: PerfilResumo[] | undefined, tipoParceria?: string) {
  if (v === null || v === undefined || v === "") return "vazio";
  const { tabela, campo } = h;
  if (campo === "etapa") return rotulo(tabela === "indicacoes" ? ETAPAS_INDICACAO : ETAPAS, v);
  if (campo === "nivel") return nomeNivel(tipoParceria, v);
  if (campo === "pacote") return rotulo(PACOTES, v);
  if (campo === "status_atividade") return rotulo(STATUS_ATIVIDADE, v);
  if (campo === "tipo_parceria") return rotulo(TIPOS_PARCERIA, v);
  if (campo === "responsavel_id") return nomePerfil(perfis, v) || "outro usuário";
  if (campo === "estado") {
    if (tabela === "comissoes") return rotulo(ESTADOS_COMISSAO, v);
    return rotulo(ESTADOS_CONTRAPARTIDA, v);
  }
  if (campo === "valor_base" || campo === "valor") return moeda(v);
  if (v === "true") return "Sim";
  if (v === "false") return "Não";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return fmtData(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return dataHora(v);
  // Valores de campos da ficha chegam como JSON
  if (tabela === "parceiro_campos") {
    try {
      const j = JSON.parse(v);
      if (Array.isArray(j)) return j.join(", ");
      if (j === true) return "Sim";
      if (j === false) return "Não";
      return String(j);
    } catch {
      return v;
    }
  }
  return v;
}

// Frase curta de um item, usada no contexto em texto e no PDF
export function descreverItem(i: ItemTimeline, perfis: PerfilResumo[] | undefined, tipoParceria?: string): string {
  switch (i.tipo) {
    case "ponto": {
      const p = i.ponto;
      const base = p.resumo?.resumo || p.texto || "";
      const curto = base.length > 280 ? base.slice(0, 277) + "..." : base;
      return `${dataHora(p.data)} · ${rotulo(TIPOS_CONTATO, p.tipo)}${p.participantes ? ` com ${p.participantes}` : ""}: ${curto.replace(/\s+/g, " ").trim()}`;
    }
    case "historico": {
      const h = i.hist;
      if (h.campo === "criado") return `${dataHora(h.created_at)} · ${rotuloTabela(h.tabela)} criado: ${h.valor_novo ?? ""}`;
      return `${dataHora(h.created_at)} · ${rotuloTabela(h.tabela)}, ${rotuloCampoHistorico(h.campo)}: ${valorHistorico(h, h.valor_anterior, perfis, tipoParceria)} para ${valorHistorico(h, h.valor_novo, perfis, tipoParceria)}`;
    }
    case "documento":
      return `${dataHora(i.doc.created_at)} · Documento adicionado: ${rotulo(TIPOS_DOCUMENTO, i.doc.tipo)} "${i.doc.nome}" (versão ${i.doc.versao})`;
    case "indicacao":
      return `${fmtData(i.ind.data)} · Indicação ${rotulo(SENTIDOS, i.ind.sentido).toLowerCase()}: ${i.ind.clientes?.razao_social ?? "cliente"} (${i.ind.empresas_grupo?.nome ?? ""}), ${rotulo(ETAPAS_INDICACAO, i.ind.etapa)}`;
  }
}
