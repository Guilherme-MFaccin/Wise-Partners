// Dados do editor das páginas públicas (Programa, Páginas): configuração das duas páginas, cases e um link de exemplo.
// A RLS é a fronteira: o time de parcerias lê; só o administrador grava (config_landing, config_landing_cliente, cases_resultado).
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";
import type { Conteudo, ResumoCases } from "@/lib/paginas";
import type { FormatoVideo } from "@/lib/landing";

export const CHAVES = {
  parceiros: ["paginas", "config-landing"] as const,
  cliente: ["paginas", "config-landing-cliente"] as const,
  comunidade: ["paginas", "config-comunidade"] as const,
  cases: ["paginas", "cases"] as const,
  resumo: ["paginas", "cases", "resumo"] as const,
  link: ["paginas", "link-exemplo"] as const,
};

export type ConfigParceiros = {
  publicada: boolean; modo_cadastro: "fila"; agenda_url: string | null; video_url: string | null; video_formato: FormatoVideo;
  pixel_meta_id: string | null; capi_ativa: boolean; ga4_id: string | null;
  termo_versao: string; termo_texto: string; privacidade_versao: string; privacidade_texto: string; contato_privacidade: string;
  conteudo: Conteudo | null; updated_at: string;
};

export type ConfigCliente = {
  publicada: boolean; video_url: string | null; video_formato: FormatoVideo; agenda_url: string | null; hub_url: string;
  icp_min_vendedores: number; icp_faturamento_min: string | null; valor_diagnostico: number | string; valor_hub: number | string;
  preco_mes1: number | string; preco_mes1_tabela: number | string; preco_mes2: number | string; preco_continuidade: number | string;
  conteudo: Conteudo | null; updated_at: string;
};

export type ConfigComunidadePagina = {
  publicada: boolean; video_url: string | null; video_formato: FormatoVideo; conteudo: Conteudo | null;
  termo_uso_versao: string; termo_uso_texto: string; updated_at: string;
};

export function useConfigComunidade() {
  return useQuery({
    queryKey: CHAVES.comunidade,
    queryFn: async () => ok<any>(await (supabase.from("config_comunidade" as any) as any).select("*").eq("id", 1).maybeSingle()) as ConfigComunidadePagina | null,
  });
}

export type CaseLinha = {
  id: string; empresa: string; segmento: string; crescimento: number | string; periodo: string; ordem: number; ativo: boolean;
};

export function useConfigParceiros() {
  return useQuery({
    queryKey: CHAVES.parceiros,
    queryFn: async () => ok<any>(await supabase.from("config_landing").select("*").eq("id", 1).maybeSingle()) as ConfigParceiros | null,
  });
}

export function useConfigCliente() {
  return useQuery({
    queryKey: CHAVES.cliente,
    queryFn: async () => ok<any>(await supabase.from("config_landing_cliente").select("*").eq("id", 1).maybeSingle()) as ConfigCliente | null,
  });
}

export function useCases() {
  return useQuery({
    queryKey: CHAVES.cases,
    queryFn: async () => ok<any>(await supabase.from("cases_resultado").select("id, empresa, segmento, crescimento, periodo, ordem, ativo")
      .order("ordem").order("empresa")) as CaseLinha[],
  });
}

// Lista ativa e média, calculadas pelo banco (a mesma função que alimenta as páginas públicas)
export function useResumoCases() {
  return useQuery({
    queryKey: CHAVES.resumo,
    queryFn: async () => ok<any>(await supabase.rpc("resumo_cases")) as ResumoCases,
  });
}

// Um link ativo de parceiro, só para abrir a página do cliente (a página é a mesma para todos os links)
export function useLinkExemplo() {
  return useQuery({
    queryKey: CHAVES.link,
    queryFn: async () => {
      const r = ok<any>(await supabase.from("links_cliente").select("codigo").eq("ativo", true).limit(1)) as { codigo: string }[];
      return r[0]?.codigo ?? null;
    },
  });
}

// Formulário com cópia de base: sabe se há mudança não salva e volta ao que está no banco quando os dados mudam
export function useFormulario<T>(dados: T | null | undefined) {
  const [base, setBase] = useState<T | null>(null);
  const [f, setF] = useState<T | null>(null);
  const sujo = !!f && !!base && JSON.stringify(f) !== JSON.stringify(base);
  useEffect(() => {
    if (dados && !sujo) {
      setBase(dados);
      setF(dados);
    }
    // Só reage a dados novos do banco; edição em curso não é sobrescrita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);
  return {
    f, sujo,
    set: <K extends keyof T>(k: K, v: T[K]) => setF((x) => (x ? { ...x, [k]: v } : x)),
    atualizar: (fn: (x: T) => T) => setF((x) => (x ? fn(x) : x)),
    descartar: () => setF(base),
    salvo: () => setBase(f),
  };
}
