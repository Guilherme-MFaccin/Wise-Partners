import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/comum/Logo";
import { BlocoConsultor, ConteudoPaginaRfp } from "@/components/rfp/ConteudoPaginaRfp";
import type { DadosPaginaPublica, ParceiroPublico } from "@/components/rfp/tipos";

// Página pública do cliente (/r/:token), sem login. Os dados vêm da Edge Function rfp-publica,
// que devolve só os blocos publicados e a disponibilidade de contato de cada parceiro.
export default function PaginaRfp() {
  const { token = "" } = useParams();
  const [falandoCom, setFalandoCom] = useState<string | null>(null);

  // Título da aba e bloqueio de indexação
  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = "Wise Makers | Opções selecionadas para você";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = tituloAnterior;
      meta.remove();
    };
  }, []);

  // Cada carregamento registra uma abertura: sem novas tentativas nem recarga automática.
  const { data, isLoading } = useQuery({
    queryKey: ["rfp-publica", token],
    queryFn: async (): Promise<DadosPaginaPublica> => {
      const { data, error } = await supabase.functions.invoke("rfp-publica", { body: { token } });
      if (error || !data) return { estado: "nao_encontrada" };
      return data as DadosPaginaPublica;
    },
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  async function falar(p: ParceiroPublico) {
    setFalandoCom(p.parceiro_id);
    try {
      const { data: r, error } = await supabase.functions.invoke("rfp-clique", { body: { token, parceiro_id: p.parceiro_id } });
      if (error || !r?.url) {
        toast.error("Este contato não está disponível no momento. Fale com o seu consultor da Wise Makers.");
        setFalandoCom(null);
        return;
      }
      window.location.href = r.url;
    } catch {
      toast.error("Não foi possível abrir o contato agora. Tente novamente em instantes.");
    }
    setFalandoCom(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Logo className="h-8" />
        <Loader2 className="h-5 w-5 animate-spin text-menta-400" />
      </div>
    );
  }

  if (!data || data.estado !== "ok") {
    const c = data?.consultor;
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
          <Logo className="h-8" />
          <div className="rounded-[14px] border border-white/10 bg-card p-6">
            <p className="text-lg font-semibold">Este link não está mais disponível.</p>
            <p className="mt-2 text-sm text-neutro-300">Fale com o seu consultor da Wise Makers.</p>
          </div>
          {c && (c.nome || c.email || c.telefone) && (
            <BlocoConsultor nome={c.nome} email={c.email} telefone={c.telefone} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <ConteudoPaginaRfp
        clienteNome={data.cliente_nome ?? ""}
        necessidadeResumida={data.necessidade_resumida ?? ""}
        blocos={data.blocos ?? []}
        onFalar={falar}
        falandoCom={falandoCom}
      />
    </div>
  );
}
