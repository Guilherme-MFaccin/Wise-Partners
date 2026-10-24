import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Route, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaCompleta } from "@/components/painel/ListaCompleta";
import { PainelJornada, type PainelV2 } from "@/components/painel/PainelJornada";
import { calcularPeriodo, SeletorPeriodo, type Periodo } from "@/components/painel/periodo";
import { normalizarPainel } from "@/components/painel/pauta";
import { PautaDialog } from "@/components/painel/PautaDialog";
import { mensagemErro } from "@/lib/erros";
import { data } from "@/lib/formato";

type Aba = "jornada" | "lista";

// Painel semanal: por etapa da jornada (painel_v2, História 7) e a lista completa da v1 (painel_semanal).
// Os dois respeitam a RLS de quem consulta; a pauta da semana continua usando o painel da v1.
export default function Painel() {
  const { veComissao } = useAuth();
  const [params, setParams] = useSearchParams();
  const aba: Aba = params.get("aba") === "lista" ? "lista" : "jornada";
  const [periodo, setPeriodo] = useState<Periodo>(() => calcularPeriodo("7d"));
  const [pautaAberta, setPautaAberta] = useState(false);

  const v1 = useQuery({
    queryKey: ["painel", periodo.inicio, periodo.fim],
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("painel_semanal", { p_inicio: periodo.inicio, p_fim: periodo.fim });
      if (error) throw error;
      return r;
    },
  });
  const p = useMemo(() => (v1.data ? normalizarPainel(v1.data) : null), [v1.data]);

  const v2 = useQuery({
    queryKey: ["painel-v2", periodo.inicio, periodo.fim],
    enabled: aba === "jornada",
    retry: false,
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("painel_v2", { p_inicio: periodo.inicio, p_fim: periodo.fim });
      if (error) throw error;
      return r as PainelV2;
    },
  });

  function mudarAba(v: string) {
    const n = new URLSearchParams(params);
    if (v === "lista") n.set("aba", "lista");
    else n.delete("aba");
    setParams(n, { replace: true });
  }

  return (
    <div>
      <Cabecalho
        titulo="Painel"
        descricao="Indicadores por etapa da jornada do parceiro para a reunião semanal do Wise Partners."
        acoes={
          <Button onClick={() => setPautaAberta(true)} disabled={!p}>
            <Sparkles /> Pauta da semana
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SeletorPeriodo valor={periodo} onChange={setPeriodo} />
        <p className="text-xs text-muted-foreground">Período: {data(periodo.inicio)} a {data(periodo.fim)}</p>
      </div>

      <Tabs value={aba} onValueChange={mudarAba}>
        <TabsList className="mb-4 h-auto flex-wrap">
          <TabsTrigger value="jornada" className="gap-1.5"><Route className="h-4 w-4" /> Por etapa da jornada</TabsTrigger>
          <TabsTrigger value="lista" className="gap-1.5"><ListChecks className="h-4 w-4" /> Lista completa</TabsTrigger>
        </TabsList>

        <TabsContent value="jornada">
          {v2.isLoading && <Carregando />}
          {v2.error && (
            (v2.error as any)?.code === "42501" ? (
              <Vazio titulo="Painel por etapa indisponível para o seu perfil">
                {mensagemErro(v2.error)} A lista completa continua disponível.
                <div className="mt-3"><Button size="sm" variant="outline" onClick={() => mudarAba("lista")}>Abrir a lista completa</Button></div>
              </Vazio>
            ) : <ErroCarga erro={v2.error} />
          )}
          {v2.data && <PainelJornada dados={v2.data} />}
        </TabsContent>

        <TabsContent value="lista">
          {v1.isLoading && <Carregando />}
          {v1.error && <ErroCarga erro={v1.error} />}
          {p && <ListaCompleta p={p} periodo={periodo} veComissao={veComissao} />}
        </TabsContent>
      </Tabs>

      <PautaDialog aberto={pautaAberta} onOpenChange={setPautaAberta} painel={p} />
    </div>
  );
}
