import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";

export const BUCKET_TRILHAS = "trilhas";

export type Trilha = {
  id: string;
  chave: string | null;
  titulo: string;
  descricao: string | null;
  versao: number;
  publicada: boolean;
  nota_minima: number;
  empresa_grupo_id: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type Modulo = {
  id: string;
  trilha_id: string;
  ordem: number;
  titulo: string;
  tipo: "video_arquivo" | "video_link" | "pdf" | "texto";
  caminho: string | null;
  link: string | null;
  texto: string | null;
};

export type Pergunta = { id: string; trilha_id: string; ordem: number; enunciado: string; opcoes: string[] };

export type Progresso = { perfil_id: string; modulo_id: string; parceiro_id: string | null; concluido_em: string };
export type Tentativa = {
  id: string; perfil_id: string; parceiro_id: string | null; trilha_id: string; versao: number; nota: number; aprovado: boolean; created_at: string;
};
export type Certificado = {
  id: string; perfil_id: string; parceiro_id: string | null; trilha_id: string; versao: number; codigo: string; nome_pessoa: string;
  titulo_trilha: string; emitido_em: string; caminho_pdf: string | null; ativo: boolean;
};

async function lista<T>(q: PromiseLike<{ data: any; error: any }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

export function useTrilhas() {
  return useQuery({
    queryKey: ["capacitacao", "trilhas"],
    queryFn: () => lista<Trilha>(supabase.from("trilhas").select("*").order("ordem").order("titulo")),
  });
}

export function useModulos(trilhaId: string | null) {
  return useQuery({
    queryKey: ["capacitacao", "modulos", trilhaId],
    enabled: !!trilhaId,
    queryFn: () => lista<Modulo>(supabase.from("trilha_modulos").select("*").eq("trilha_id", trilhaId!).order("ordem")),
  });
}

export function usePerguntas(trilhaId: string | null) {
  return useQuery({
    queryKey: ["capacitacao", "perguntas", trilhaId],
    enabled: !!trilhaId,
    queryFn: async () => {
      const rows = await lista<any>(supabase.from("trilha_perguntas").select("*").eq("trilha_id", trilhaId!).order("ordem"));
      return rows.map((r) => ({ ...r, opcoes: Array.isArray(r.opcoes) ? r.opcoes.map(String) : [] })) as Pergunta[];
    },
  });
}

// Gabarito: só administradores leem (a RLS devolve vazio para os demais)
export function useGabarito(perguntaIds: string[], habilitado: boolean) {
  return useQuery({
    queryKey: ["capacitacao", "gabarito", perguntaIds],
    enabled: habilitado && perguntaIds.length > 0,
    queryFn: async () => {
      const rows = await lista<{ pergunta_id: string; correta: number }>(
        supabase.from("trilha_gabarito").select("pergunta_id, correta").in("pergunta_id", perguntaIds),
      );
      return new Map(rows.map((r) => [r.pergunta_id, r.correta]));
    },
  });
}

export function useProgressoTrilha(trilhaId: string | null, moduloIds: string[]) {
  return useQuery({
    queryKey: ["capacitacao", "progresso", trilhaId, moduloIds],
    enabled: !!trilhaId,
    queryFn: async () => {
      const [prog, tent, cert] = await Promise.all([
        moduloIds.length
          ? lista<Progresso>(supabase.from("trilha_progresso").select("*").in("modulo_id", moduloIds))
          : Promise.resolve([] as Progresso[]),
        lista<Tentativa>(supabase.from("trilha_tentativas").select("id, perfil_id, parceiro_id, trilha_id, versao, nota, aprovado, created_at")
          .eq("trilha_id", trilhaId!).order("created_at", { ascending: false })),
        lista<Certificado>(supabase.from("certificados").select("*").eq("trilha_id", trilhaId!)),
      ]);
      return { prog, tent, cert };
    },
  });
}

export function useCertificados() {
  return useQuery({
    queryKey: ["capacitacao", "certificados"],
    queryFn: () => lista<Certificado>(supabase.from("certificados").select("*").order("emitido_em", { ascending: false })),
  });
}

// Arquivo privado da trilha por link temporário de 1 hora
export async function abrirArquivoTrilha(caminho: string) {
  const { data, error } = await supabase.storage.from(BUCKET_TRILHAS).createSignedUrl(caminho, 3600);
  if (error || !data?.signedUrl) {
    toastErro(error ?? new Error("Não foi possível gerar o link do arquivo."));
    return;
  }
  const w = window.open(data.signedUrl, "_blank", "noopener");
  if (!w) toast.message("Libere janelas pop-up para abrir o arquivo.");
}
