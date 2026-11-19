import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { FilaParceiros } from "@/components/config/FilaParceiros";

// P-21 a P-25: quem se cadastrou na página dos parceiros espera contato pelo WhatsApp, conversa de entrada e aprovação.
export default function FilaCandidatos() {
  const { isParcerias } = useAuth();
  const cfg = useQuery({
    queryKey: ["config-landing", "agenda"],
    enabled: isParcerias,
    queryFn: async () => {
      const { data, error } = await supabase.from("config_landing").select("agenda_url").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as { agenda_url: string | null } | null;
    },
  });
  if (!isParcerias) {
    return (<div><Cabecalho titulo="Fila de cadastros" /><Vazio titulo="Sem permissão">A fila de candidatos é do time de parcerias e dos administradores.</Vazio></div>);
  }
  return (
    <div>
      <Cabecalho titulo="Fila de cadastros"
        descricao="Quem se cadastrou para ser parceiro e com quem ainda falta falar? Chame no WhatsApp, mande a agenda da conversa de entrada e, depois dela, aprove: o parceiro e o acesso são criados na hora." />
      {cfg.isLoading ? <Carregando /> : cfg.error ? <ErroCarga erro={cfg.error} /> : <FilaParceiros agendaUrl={cfg.data?.agenda_url ?? null} />}
    </div>
  );
}
