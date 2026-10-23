import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CicloCard, type Ciclo } from "@/components/base-ativa/CicloCard";
import { FilaItem, type ItemFila } from "@/components/base-ativa/FilaItem";

type Aba = "fila" | "em_ciclo" | "suspenso" | "concluido";

// Base Ativa (História 7, FR-061): fila, ciclos de 12 semanas com 6 encontros e evento final.
export default function BaseAtiva() {
  const [aba, setAba] = useState<Aba>("fila");

  const fila = useQuery({
    queryKey: ["base-ativa", "fila"],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_fila_base_ativa").select("*").order("posicao");
      if (error) throw error;
      return (data ?? []) as ItemFila[];
    },
  });

  const ciclos = useQuery({
    queryKey: ["base-ativa", "ciclos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ciclos_base_ativa")
        .select("*, parceiro:parceiros(id, nome_fantasia), encontros:base_ativa_encontros(*)")
        .in("estado", ["em_ciclo", "suspenso", "concluido"])
        .order("inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Ciclo[];
    },
  });

  const porEstado = (e: Aba) => (ciclos.data ?? []).filter((c) => c.estado === e);
  const contagem: Record<Aba, number> = {
    fila: fila.data?.length ?? 0,
    em_ciclo: porEstado("em_ciclo").length,
    suspenso: porEstado("suspenso").length,
    concluido: porEstado("concluido").length,
  };
  const consulta = aba === "fila" ? fila : ciclos;

  return (
    <div>
      <Cabecalho
        titulo="Base Ativa"
        descricao="Entrega do pacote A: ciclo de 12 semanas com 6 encontros quinzenais e o evento final com a base do parceiro. Estratégicos à frente na fila, depois a ordem de assinatura."
      />

      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="fila">Fila ({contagem.fila})</TabsTrigger>
          <TabsTrigger value="em_ciclo">Em ciclo ({contagem.em_ciclo})</TabsTrigger>
          <TabsTrigger value="suspenso">Suspensos ({contagem.suspenso})</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos ({contagem.concluido})</TabsTrigger>
        </TabsList>
      </Tabs>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}

      {aba === "fila" && fila.isSuccess && (
        fila.data.length === 0
          ? <Vazio titulo="Fila vazia">Parceiros do pacote A entram na fila ao chegar ao onboarding.</Vazio>
          : <ul className="space-y-3">{fila.data.map((f) => <FilaItem key={f.ciclo_id} item={f} />)}</ul>
      )}

      {aba !== "fila" && ciclos.isSuccess && (
        porEstado(aba).length === 0
          ? <Vazio titulo="Nenhum ciclo nesta situação" />
          : <ul className="space-y-3">{porEstado(aba).map((c) => <CicloCard key={c.id} ciclo={c} />)}</ul>
      )}
    </div>
  );
}
