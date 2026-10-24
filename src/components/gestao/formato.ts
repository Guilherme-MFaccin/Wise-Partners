import Papa from "papaparse";
import { moeda } from "@/lib/formato";
import { baixarBlob } from "@/lib/pdf";
import {
  CATEGORIAS_CUSTO, CATEGORIAS_MATURIDADE, ETAPAS, ETAPAS_JORNADA, FAIXAS, ORIGENS_PARCEIRO, TIPOS_LINHA_CUSTO, rotulo,
} from "@/lib/rotulos";

// Formatação dos números das telas de gestão (painel por etapa, resultado do canal, custos).

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const NUM1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function numero(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return NUM.format(Number(v));
}

// Percentual já em pontos percentuais (ex.: 37.5 vira "37,5%")
export function pct(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return `${NUM1.format(Number(v))}%`;
}

// ROI vem como fração do banco (15.67 = 1.567%)
export function roiPct(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(v) * 100)}%`;
}

export function horas(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return `${NUM1.format(Number(v))} h`;
}

export function dias(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return `${NUM.format(n)} ${Math.abs(n) === 1 ? "dia" : "dias"}`;
}

export function meses(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  return `${NUM1.format(n)} ${n === 1 ? "mês" : "meses"}`;
}

// Custo-hora com 2 casas: valor mensal ÷ horas mensais × fator de encargos (Apêndice M)
export function custoHora(valorMensal: number, horasMensais: number, fator: number) {
  if (!horasMensais || horasMensais <= 0) return null;
  return (Number(valorMensal) / Number(horasMensais)) * Number(fator || 1);
}

// Rótulos das chaves que aparecem nos indicadores do tipo lista
const CHAVES_LISTA: Record<string, string> = {
  horas: "Horas", comissoes: "Comissões", diretos: "Custos diretos", total: "Total",
  indicacoes: "Indicações", reunioes: "Reuniões", propostas: "Propostas", vendas: "Vendas",
  parceiro: "Via parceiro", direta: "Venda direta",
  ativos_6m: "Ativos aos 6 meses", checados_6m: "Checados aos 6 meses", ativos_12m: "Ativos aos 12 meses",
  checados_12m: "Checados aos 12 meses", satisfacao: "Satisfação média",
  cadastrados: "Cadastrados", assinados: "Assinados",
  nps: "NPS", media: "Média", respostas: "Respostas", valor: "Realizado", meta: "Meta",
  sem: "Sem nível", sem_nivel: "Sem nível", sem_etapa: "Sem etapa", nao_informada: "Não informada", nao_informado: "Não informado",
  sem_empresa: "Sem empresa",
  A: "A (Elite)", B: "B (Premium)", C: "C (Select)",
};

export function rotuloChave(k: string) {
  return CHAVES_LISTA[k] ?? ORIGENS_PARCEIRO[k] ?? ETAPAS[k] ?? ETAPAS_JORNADA[k] ?? FAIXAS[k] ?? CATEGORIAS_MATURIDADE[k] ?? k;
}

// Cabeçalhos em português da exportação da planilha de custos (FR-106)
const COLUNAS_CSV: [string, string][] = [
  ["data", "Data"], ["tipo_linha", "Tipo de lançamento"], ["categoria", "Categoria"], ["parceiro", "Parceiro"],
  ["pessoa", "Pessoa"], ["atividade", "Atividade ou descrição"], ["etapa_jornada", "Etapa da jornada"], ["minutos", "Minutos"],
  ["custo_hora", "Custo-hora (R$)"], ["valor", "Valor (R$)"], ["empresa", "Empresa do grupo"], ["cliente", "Cliente"],
  ["cliente_icp", "Cliente no ICP"], ["mensalidade", "Mensalidade (R$)"], ["origem_id", "Identificador de origem"],
];

export type LinhaPlanilha = {
  data: string; tipo_linha: string; categoria: string | null; parceiro_id: string | null; parceiro: string | null;
  pessoa_id: string | null; pessoa: string | null; atividade: string | null; etapa_jornada: string | null; minutos: number | null;
  custo_hora: number | null; valor: number | null; empresa: string | null; cliente: string | null; cliente_icp: boolean | null;
  mensalidade: number | null; origem_id: string | null;
};

// Números no padrão brasileiro (vírgula decimal), separador ponto e vírgula: abre direto no Excel em português
function numeroCsv(v: number | null | undefined, casas = 2) {
  if (v === null || v === undefined) return "";
  return Number(v).toFixed(casas).replace(".", ",");
}

export function rotuloCategoria(tipo: string, categoria: string | null) {
  if (!categoria) return "";
  if (tipo === "custo_direto") return rotulo(CATEGORIAS_CUSTO, categoria);
  if (categoria === "horas") return "Horas";
  if (categoria === "comissoes") return "Comissões";
  if (categoria === "receita") return "Receita";
  return categoria;
}

export function exportarPlanilhaCsv(linhas: LinhaPlanilha[], nome: string) {
  const dados = linhas.map((l) => {
    const r: Record<string, string> = {};
    for (const [k, titulo] of COLUNAS_CSV) {
      const v = (l as Record<string, any>)[k];
      switch (k) {
        case "data": r[titulo] = v ? String(v).split("-").reverse().join("/") : ""; break;
        case "tipo_linha": r[titulo] = rotulo(TIPOS_LINHA_CUSTO, v); break;
        case "categoria": r[titulo] = rotuloCategoria(l.tipo_linha, v); break;
        case "etapa_jornada": r[titulo] = rotulo(ETAPAS_JORNADA, v); break;
        case "custo_hora": r[titulo] = numeroCsv(v, 4); break;
        case "valor": case "mensalidade": r[titulo] = numeroCsv(v); break;
        case "cliente_icp": r[titulo] = v === null || v === undefined ? "" : v ? "Sim" : "Não"; break;
        default: r[titulo] = v === null || v === undefined ? "" : String(v);
      }
    }
    return r;
  });
  const csv = Papa.unparse({ fields: COLUNAS_CSV.map(([, t]) => t), data: dados.map((d) => COLUNAS_CSV.map(([, t]) => d[t])) }, { delimiter: ";" });
  // BOM para o Excel reconhecer UTF-8
  baixarBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), nome);
}

export { moeda };
