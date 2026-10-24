import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file";
import { supabase } from "@/integrations/supabase/client";
import { cnpjValido, tipoDoTexto, type TipoEmpresa } from "../../../supabase/functions/_shared/cruzamento";
import type { EmpresaGrupo } from "@/components/indicacoes/dados";

export type BaseWise = {
  id: string; cnpj_raiz: string; razao_social: string; tipo: TipoEmpresa; empresa_grupo_id: string; importado_em: string; importado_por: string | null;
};

export type Coincidencia = {
  id: string;
  cruzamento_id: string;
  parceiro_id: string;
  base_wise_id: string;
  tipo_parceiro: TipoEmpresa;
  quadrante: "cliente_comum" | "wise_apresenta" | "parceiro_apresenta" | "acao_conjunta";
  acao_sugerida: string;
  virou: "indicacao" | "acao" | null;
  referencia_id: string | null;
  descartada: boolean;
  decidido_por: string | null;
  decidido_em: string | null;
  observacao: string | null;
  expira_em: string;
  base: Pick<BaseWise, "razao_social" | "cnpj_raiz" | "tipo" | "empresa_grupo_id"> | null;
};

export type Cruzamento = {
  id: string; parceiro_id: string; aceite_id: string; executado_em: string; executado_por: string | null; total_enviado: number;
  totais: Record<string, any>;
};

export const ROTULO_TIPO_EMPRESA: Record<string, string> = { cliente: "Cliente", prospect: "Prospect" };

export function formatarRaiz(r: string | null | undefined) {
  const d = (r ?? "").replace(/\D/g, "");
  return d.length === 8 ? d.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3") : r ?? "";
}

export function decidida(c: Pick<Coincidencia, "virou" | "descartada">) {
  return !!c.virou || c.descartada;
}

// Contagens da base por empresa e tipo (consultas de contagem, sem baixar as linhas)
export function useContagensBase(empresas: EmpresaGrupo[]) {
  return useQuery({
    queryKey: ["cruzamento", "base", "contagens", empresas.map((e) => e.id)],
    enabled: empresas.length > 0,
    queryFn: async () => {
      const pares = empresas.flatMap((e) => (["cliente", "prospect"] as const).map((t) => ({ e: e.id, t })));
      const r = await Promise.all(pares.map(({ e, t }) =>
        supabase.from("base_wise_cruzamento").select("id", { count: "exact", head: true }).eq("empresa_grupo_id", e).eq("tipo", t)));
      const mapa = new Map<string, number>();
      r.forEach((x, i) => {
        if (x.error) throw x.error;
        mapa.set(`${pares[i].e}:${pares[i].t}`, x.count ?? 0);
      });
      return mapa;
    },
  });
}

export function useCoincidencias() {
  return useQuery({
    queryKey: ["cruzamento", "coincidencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coincidencias_cruzamento")
        .select("*, base:base_wise_cruzamento(razao_social, cnpj_raiz, tipo, empresa_grupo_id)")
        .order("expira_em");
      if (error) throw error;
      return (data ?? []) as unknown as Coincidencia[];
    },
  });
}

export function useCruzamentos() {
  return useQuery({
    queryKey: ["cruzamento", "cruzamentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cruzamentos").select("*").order("executado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cruzamento[];
    },
  });
}

// ---------------------------------------------------------------------------
// Importação da base da Wise (CSV ou XLSX): só a raiz do CNPJ é guardada
// ---------------------------------------------------------------------------
export type LinhaBase = { cnpj_raiz: string; razao_social: string; tipo: TipoEmpresa; empresa_grupo_id: string };

function norm(t: unknown) {
  return String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export async function lerPlanilha(f: File): Promise<unknown[][]> {
  if (/\.xlsx$/i.test(f.name)) return (await readXlsxFile(f)) as unknown[][];
  if (/\.xls$/i.test(f.name)) throw new Error("Formato .xls antigo não é aceito. Salve como .xlsx ou .csv.");
  const texto = await f.text();
  const r = Papa.parse<string[]>(texto, { skipEmptyLines: "greedy" });
  return r.data;
}

function empresaDoTexto(v: unknown, empresas: EmpresaGrupo[]) {
  const s = norm(v);
  if (!s) return null;
  return empresas.find((e) => e.codigo === s || norm(e.nome) === s || norm(e.nome).startsWith(s) || s.startsWith(e.codigo)) ?? null;
}

export function validarBase(linhas: unknown[][], empresas: EmpresaGrupo[], empresaPadrao: string | null) {
  const problemas: string[] = [];
  if (!linhas.length) return { itens: [] as LinhaBase[], problemas: ["Arquivo vazio."], repetidas: 0, lidas: 0 };
  const cab = linhas[0].map(norm);
  const iCnpj = cab.findIndex((c) => c.includes("cnpj"));
  const iRazaoSocial = cab.findIndex((c) => c.includes("razao"));
  const iRazao = iRazaoSocial >= 0 ? iRazaoSocial : cab.findIndex((c) => c.includes("nome"));
  const iTipo = cab.findIndex((c) => c.includes("tipo"));
  const iEmpresa = cab.findIndex((c, i) => c.includes("empresa") && i !== iRazao);
  const faltam = [iCnpj < 0 && "CNPJ", iRazao < 0 && "Razão social", iTipo < 0 && "Tipo", iEmpresa < 0 && !empresaPadrao && "Empresa"].filter(Boolean);
  if (faltam.length) {
    return { itens: [] as LinhaBase[], problemas: [`Colunas não encontradas: ${faltam.join(", ")}.`], repetidas: 0, lidas: 0 };
  }
  const mapa = new Map<string, LinhaBase>();
  let lidas = 0;
  let repetidas = 0;
  linhas.slice(1).forEach((l, k) => {
    const n = k + 2;
    const cnpjTxt = String(l[iCnpj] ?? "").trim();
    const razao = String(l[iRazao] ?? "").trim();
    if (!cnpjTxt && !razao) return;
    lidas++;
    const dig = cnpjTxt.replace(/\D/g, "");
    // CNPJ completo validado pelos dígitos; raiz de 8 dígitos aceita como está
    let raiz: string | null = null;
    if (dig.length === 8) raiz = dig;
    else if (cnpjValido(dig.padStart(14, "0"))) raiz = dig.padStart(14, "0").slice(0, 8);
    if (!raiz) return void problemas.push(`Linha ${n}: CNPJ inválido`);
    if (!razao) return void problemas.push(`Linha ${n}: razão social vazia`);
    const tipo = tipoDoTexto(l[iTipo]);
    if (!tipo) return void problemas.push(`Linha ${n}: tipo deve ser cliente ou prospect`);
    const textoEmpresa = iEmpresa >= 0 ? l[iEmpresa] : "";
    const empresa = norm(textoEmpresa) ? empresaDoTexto(textoEmpresa, empresas)?.id : empresaPadrao;
    if (!empresa) return void problemas.push(`Linha ${n}: empresa deve ser ${empresas.map((e) => e.codigo).join(", ")}`);
    const chave = `${raiz}:${empresa}`;
    const anterior = mapa.get(chave);
    if (anterior) {
      repetidas++;
      // Mesma raiz como cliente e prospect na mesma empresa: vale cliente
      if (anterior.tipo === "cliente") return;
    }
    mapa.set(chave, { cnpj_raiz: raiz, razao_social: razao.slice(0, 300), tipo, empresa_grupo_id: empresa });
  });
  return { itens: [...mapa.values()], problemas, repetidas, lidas };
}
