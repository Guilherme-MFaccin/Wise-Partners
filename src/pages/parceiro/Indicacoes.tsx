import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { data, moeda } from "@/lib/formato";
import { ESTADOS_COMISSAO, ETAPAS_INDICACAO, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { SeloEstado } from "@/components/comum/Selos";
import { NovaIndicacaoDialog } from "@/components/portal/NovaIndicacaoDialog";
import { AtualizarIndicacaoDialog, type IndicacaoRecebida } from "@/components/portal/AtualizarIndicacaoDialog";

type Indicacao = {
  id: string;
  sentido: "parceiro_para_grupo" | "grupo_para_parceiro";
  etapa: string;
  data: string;
  valor_base: number | null;
  data_reuniao: string | null;
  atualizacao_pendente: Record<string, any> | null;
  cliente: { razao_social: string } | null;
  empresa: { nome: string } | null;
  comissoes: { id: string; beneficiario: string; estado: string; valor: number | null }[];
};

export default function Indicacoes() {
  const { perfil } = useAuth();
  const [nova, setNova] = useState(false);
  const [atualizando, setAtualizando] = useState<IndicacaoRecebida | null>(null);

  // Só colunas que o parceiro pode ver; a RLS limita às indicações e comissões da própria empresa
  const q = useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-indicacoes", perfil?.parceiro_id],
    queryFn: async () =>
      ok<any>(await supabase.from("indicacoes")
        .select("id, sentido, etapa, data, valor_base, data_reuniao, atualizacao_pendente, cliente:clientes(razao_social), empresa:empresas_grupo(nome), comissoes(id, beneficiario, estado, valor)")
        .eq("parceiro_id", perfil!.parceiro_id).order("data", { ascending: false })) as Indicacao[],
  });

  const lista = q.data ?? [];
  const feitas = lista.filter((i) => i.sentido === "parceiro_para_grupo");
  const recebidas = lista.filter((i) => i.sentido === "grupo_para_parceiro");

  return (
    <div>
      <Cabecalho titulo="Indicações" descricao="Clientes que vocês indicaram ao grupo e clientes que o grupo indicou a vocês."
        acoes={<Button onClick={() => setNova(true)}><Plus /> Nova indicação</Button>} />
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : (
        <Tabs defaultValue="feitas">
          <TabsList className="mb-4 h-auto flex-wrap justify-start">
            <TabsTrigger value="feitas">Feitas ({feitas.length})</TabsTrigger>
            <TabsTrigger value="recebidas">Recebidas ({recebidas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="feitas">
            {feitas.length === 0 ? <Vazio titulo="Nenhuma indicação feita">Use "Nova indicação" para indicar um cliente à Wise Makers, à Tríade ou à Swallow.</Vazio> : (
              <ul className="grid gap-3">
                {feitas.map((i) => {
                  const comissao = (i.comissoes ?? []).find((c) => c.beneficiario === "parceiro");
                  return (
                    <li key={i.id} className="rounded-[14px] border border-white/10 bg-card p-4">
                      <Topo i={i} />
                      <p className="mt-2 text-sm">
                        <span className="text-muted-foreground">Sua comissão: </span>
                        {comissao ? (
                          <>{rotulo(ESTADOS_COMISSAO, comissao.estado)}{comissao.valor !== null && <> · {moeda(comissao.valor)}</>}</>
                        ) : <span className="text-muted-foreground">calculada quando o negócio fechar</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="recebidas">
            {recebidas.length === 0 ? <Vazio titulo="Nenhuma indicação recebida" /> : (
              <ul className="grid gap-3">
                {recebidas.map((i) => (
                  <li key={i.id} className="rounded-[14px] border border-white/10 bg-card p-4">
                    <Topo i={i} />
                    {i.valor_base !== null && <p className="mt-1 text-sm text-muted-foreground">Valor: {moeda(i.valor_base)}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {i.atualizacao_pendente ? (
                        <p className="inline-flex items-center gap-2 text-sm text-warning">
                          <Clock className="h-4 w-4" /> Atualização para {rotulo(ETAPAS_INDICACAO, i.atualizacao_pendente.etapa)} aguardando confirmação da Wise
                        </p>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => setAtualizando(i)}><RefreshCw /> Atualizar resultado</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}
      <NovaIndicacaoDialog aberto={nova} onClose={() => setNova(false)} />
      <AtualizarIndicacaoDialog indicacao={atualizando} onClose={() => setAtualizando(null)} />
    </div>
  );
}

function Topo({ i }: { i: Indicacao }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold">{i.cliente?.razao_social ?? "Cliente"}</p>
        <p className="text-sm text-muted-foreground">{i.empresa?.nome} · {data(i.data)}</p>
      </div>
      <SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} />
    </div>
  );
}
