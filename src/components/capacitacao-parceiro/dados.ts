import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { baixarCertificado } from "@/lib/certificado";

// Capacitação no portal do parceiro (História 10). A RLS entrega só trilhas publicadas a parceiros assinados,
// o progresso e os certificados da própria pessoa e, ao responsável, os da empresa.
// As trilhas ficam só no portal: nada aqui aponta para o Wise Hub.

export type Trilha = {
  id: string;
  chave: string | null;
  titulo: string;
  descricao: string | null;
  versao: number;
  nota_minima: number;
  ordem: number;
};
export type Modulo = { id: string; trilha_id: string; ordem: number; titulo: string; tipo: string; caminho: string | null; link: string | null; texto: string | null };
export type Pergunta = { id: string; ordem: number; enunciado: string; opcoes: string[] };
export type Certificado = {
  id: string;
  perfil_id: string;
  trilha_id: string;
  versao: number;
  codigo: string;
  nome_pessoa: string;
  titulo_trilha: string;
  emitido_em: string;
  ativo: boolean;
};
export type Progresso = { perfil_id: string; modulo_id: string; concluido_em: string };
export type Tentativa = { id: string; versao: number; nota: number; aprovado: boolean; created_at: string };

export const HORAS_NOVA_TENTATIVA = 24;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useTrilhas() {
  return useQuery({
    queryKey: ["portal-trilhas"],
    queryFn: async () => {
      const trilhas = ok<any>(await supabase.from("trilhas").select("id, chave, titulo, descricao, versao, nota_minima, ordem")
        .eq("publicada", true).order("ordem").order("titulo")) as Trilha[];
      const modulos = trilhas.length
        ? (ok<any>(await supabase.from("trilha_modulos").select("id, trilha_id").in("trilha_id", trilhas.map((t) => t.id))) as { id: string; trilha_id: string }[])
        : [];
      return { trilhas, modulos };
    },
  });
}

export function useTrilha(param: string | undefined) {
  return useQuery({
    enabled: !!param,
    queryKey: ["portal-trilha", param],
    queryFn: async () => {
      const filtro = UUID.test(param!) ? { coluna: "id", valor: param! } : { coluna: "chave", valor: param! };
      const trilha = ok<any>(await supabase.from("trilhas").select("id, chave, titulo, descricao, versao, nota_minima, ordem")
        .eq(filtro.coluna, filtro.valor).eq("publicada", true).maybeSingle()) as Trilha | null;
      if (!trilha) return null;
      const [modulos, perguntas] = await Promise.all([
        supabase.from("trilha_modulos").select("id, trilha_id, ordem, titulo, tipo, caminho, link, texto").eq("trilha_id", trilha.id).order("ordem"),
        supabase.from("trilha_perguntas").select("id, ordem, enunciado, opcoes").eq("trilha_id", trilha.id).order("ordem"),
      ]);
      return {
        trilha,
        modulos: ok<any>(modulos) as Modulo[],
        perguntas: (ok<any>(perguntas) as any[]).map((p) => ({ ...p, opcoes: Array.isArray(p.opcoes) ? p.opcoes.map(String) : [] })) as Pergunta[],
      };
    },
  });
}

// Progresso e certificados: da própria pessoa ou, para o responsável, de toda a empresa
export function useProgresso(escopo: "eu" | "empresa") {
  const { perfil } = useAuth();
  const ativo = escopo === "eu" ? !!perfil?.id : !!perfil?.parceiro_id && !!perfil?.is_responsavel_parceiro;
  return useQuery({
    enabled: ativo,
    queryKey: ["portal-trilha-progresso", escopo, escopo === "eu" ? perfil?.id : perfil?.parceiro_id],
    queryFn: async () => {
      let qp = supabase.from("trilha_progresso").select("perfil_id, modulo_id, concluido_em");
      let qc = supabase.from("certificados").select("id, perfil_id, trilha_id, versao, codigo, nome_pessoa, titulo_trilha, emitido_em, ativo");
      if (escopo === "eu") {
        qp = qp.eq("perfil_id", perfil!.id);
        qc = qc.eq("perfil_id", perfil!.id);
      } else {
        qp = qp.eq("parceiro_id", perfil!.parceiro_id);
        qc = qc.eq("parceiro_id", perfil!.parceiro_id);
      }
      const [p, c] = await Promise.all([qp, qc.order("emitido_em", { ascending: false })]);
      return { progresso: ok<any>(p) as Progresso[], certificados: ok<any>(c) as Certificado[] };
    },
  });
}

export function useUltimaTentativa(trilhaId: string | undefined) {
  const { perfil } = useAuth();
  return useQuery({
    enabled: !!trilhaId && !!perfil?.id,
    queryKey: ["portal-trilha-tentativa", trilhaId, perfil?.id],
    queryFn: async () => ok<any>(await supabase.from("trilha_tentativas").select("id, versao, nota, aprovado, created_at")
      .eq("trilha_id", trilhaId).eq("perfil_id", perfil!.id).order("created_at", { ascending: false }).limit(1).maybeSingle()) as Tentativa | null,
  });
}

// Quando a pessoa pode refazer o teste depois de uma reprovação (null = pode agora)
export function liberaNovaTentativaEm(t: Tentativa | null | undefined): Date | null {
  if (!t || t.aprovado) return null;
  const libera = new Date(new Date(t.created_at).getTime() + HORAS_NOVA_TENTATIVA * 3_600_000);
  return libera.getTime() > Date.now() ? libera : null;
}

export async function baixarCertificadoPdf(c: Certificado, parceiro?: string | null) {
  try {
    await baixarCertificado({
      nome: c.nome_pessoa, trilha: c.titulo_trilha, versao: c.versao, data: c.emitido_em, codigo: c.codigo, parceiro: parceiro ?? null,
    });
  } catch (e) {
    toastErro(e);
    return;
  }
  toast.success("Certificado gerado.");
}
