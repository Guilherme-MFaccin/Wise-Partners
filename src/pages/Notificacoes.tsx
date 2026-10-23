import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastErro } from "@/lib/erros";
import { haQuanto, dataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Notificacao = { id: string; tipo: string; titulo: string; mensagem: string | null; link: string | null; lida: boolean; created_at: string };

// Notificações do usuário (área interna e portal do parceiro usam a mesma tela).
export default function Notificacoes() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<"nao_lidas" | "todas">("nao_lidas");

  const consulta = useQuery({
    queryKey: ["notificacoes", perfil?.id],
    enabled: !!perfil,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("id, tipo, titulo, mensagem, link, lida, created_at")
        .eq("usuario_id", perfil!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Notificacao[];
    },
  });

  const atualizarListas = () => {
    qc.invalidateQueries({ queryKey: ["notificacoes"] });
    qc.invalidateQueries({ queryKey: ["notificacoes-nao-lidas"] });
  };

  const marcar = useMutation({
    mutationFn: async (ids: string[] | "todas") => {
      let q = supabase.from("notificacoes").update({ lida: true }).eq("usuario_id", perfil!.id).eq("lida", false);
      if (ids !== "todas") q = q.in("id", ids);
      const { error } = await q;
      if (error) throw error;
      return ids;
    },
    onSuccess: (ids) => {
      if (ids === "todas") toast.success("Todas as notificações foram marcadas como lidas.");
      atualizarListas();
    },
    onError: toastErro,
  });

  function abrir(n: Notificacao) {
    if (!n.lida) marcar.mutate([n.id]);
    if (!n.link) return;
    if (/^https?:\/\//.test(n.link)) window.open(n.link, "_blank", "noopener");
    else navigate(n.link);
  }

  const todas = consulta.data ?? [];
  const naoLidas = todas.filter((n) => !n.lida).length;
  const lista = filtro === "nao_lidas" ? todas.filter((n) => !n.lida) : todas;

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho
        titulo="Notificações"
        acoes={naoLidas > 0 && (
          <Button variant="outline" disabled={marcar.isPending} onClick={() => marcar.mutate("todas")}>
            <CheckCheck /> Marcar todas como lidas
          </Button>
        )}
      />

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)} className="mb-4">
        <TabsList>
          <TabsTrigger value="nao_lidas">Não lidas ({naoLidas})</TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && lista.length === 0 && (
        <Vazio titulo={filtro === "nao_lidas" ? "Nenhuma notificação não lida" : "Nenhuma notificação"} />
      )}

      <ul className="space-y-2">
        {lista.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => abrir(n)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[14px] border p-4 text-left transition-colors hover:border-menta-500/40",
                n.lida ? "border-white/10 bg-card/60" : "border-menta-500/30 bg-card",
              )}>
              <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.lida ? "bg-transparent" : "bg-menta-500")} aria-hidden />
              <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", n.lida ? "text-muted-foreground" : "text-menta-400")} />
              <span className="min-w-0 flex-1">
                <span className={cn("block break-words", n.lida ? "text-muted-foreground" : "font-semibold")}>{n.titulo}</span>
                {n.mensagem && <span className="mt-0.5 block break-words text-sm text-muted-foreground">{n.mensagem}</span>}
                <span className="mt-1 block text-xs text-muted-foreground" title={dataHora(n.created_at)}>{haQuanto(n.created_at)}</span>
              </span>
              {n.link && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
