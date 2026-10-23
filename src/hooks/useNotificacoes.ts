import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useNaoLidas() {
  const { perfil } = useAuth();
  return useQuery({
    queryKey: ["notificacoes-nao-lidas", perfil?.id],
    enabled: !!perfil,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase.from("notificacoes").select("id", { count: "exact", head: true }).eq("lida", false).eq("usuario_id", perfil!.id);
      return count ?? 0;
    },
  });
}
