import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { FilaParceiros } from "@/components/config/FilaParceiros";

// Entrada única (26/11/2026): todo cadastro da página do portal cai aqui. Cliente do grupo e empresa da comunidade: o gerente
// confere e adiciona (P-106, P-107). Parceiro: WhatsApp, conversa de entrada e aprovação (P-21 a P-25).
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
    return (<div><Cabecalho titulo="Fila de cadastros" /><Vazio titulo="Sem permissão">A fila de cadastros é do gerente da comunidade, do time de parcerias e dos administradores.</Vazio></div>);
  }
  return (
    <div>
      <Cabecalho titulo="Fila de cadastros"
        descricao="Quem se cadastrou pela página do portal e o que falta para cada empresa entrar? Cliente do grupo e empresa da comunidade: confira e adicione. Parceiro: chame no WhatsApp, faça a conversa de entrada e aprove." />
      {cfg.isLoading ? <Carregando /> : cfg.error ? <ErroCarga erro={cfg.error} /> : <FilaParceiros agendaUrl={cfg.data?.agenda_url ?? null} />}
    </div>
  );
}
