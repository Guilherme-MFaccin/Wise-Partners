import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { data, moeda } from "@/lib/formato";
import { ETAPAS_INDICACAO, ORIGENS_INDICACAO, SENTIDOS, rotulo } from "@/lib/rotulos";
import { Numero, Secao } from "../ui";

type Indicacao = {
  id: string; sentido: string; origem: string; etapa: string; data: string; data_reuniao: string | null; valor_base: number | null;
  aderente_icp: boolean | null; empresa_grupo_id: string; clientes: { razao_social: string } | null; empresas_grupo: { nome: string } | null;
};
type Comissao = { beneficiario: string; valor: number | null; estado: string };

const pct = (n: number, t: number) => (t ? `${Math.round((n / t) * 100)}%` : "0%");

// Indicações do parceiro nos dois sentidos e indicadores de qualidade (FR-057).
export function AbaIndicacoes({ parceiroId }: { parceiroId: string }) {
  const { veComissao } = useAuth();
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "indicacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicacoes")
        .select("id, sentido, origem, etapa, data, data_reuniao, valor_base, aderente_icp, empresa_grupo_id, clientes(razao_social), empresas_grupo(nome)")
        .eq("parceiro_id", parceiroId)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[] as Indicacao[];
    },
  });
  // Comissões só são consultadas por quem pode vê-las (a RLS também protege)
  const comissoes = useQuery({
    queryKey: ["parceiro", parceiroId, "comissoes"],
    enabled: veComissao,
    queryFn: async () => {
      const { data, error } = await supabase.from("comissoes").select("beneficiario, valor, estado").eq("parceiro_id", parceiroId);
      if (error) throw error;
      return (data ?? []) as Comissao[];
    },
  });

  if (q.isLoading) return <Carregando />;
  const lista = q.data ?? [];
  const total = lista.length;
  const noIcp = lista.filter((i) => i.aderente_icp === true).length;
  const comReuniao = lista.filter((i) => !!i.data_reuniao).length;
  const fechadas = lista.filter((i) => i.etapa === "fechada");
  const receita = new Map<string, number>();
  for (const i of fechadas) {
    const nome = i.empresas_grupo?.nome ?? "Empresa";
    receita.set(nome, (receita.get(nome) ?? 0) + Number(i.valor_base ?? 0));
  }
  const soma = (f: (c: Comissao) => boolean) => (comissoes.data ?? []).filter(f).reduce((s, c) => s + Number(c.valor ?? 0), 0);
  const pendentes = ["aguardando_compensacao", "a_pagar", "nf_recebida"];

  return (
    <div className="space-y-4">
      <Secao titulo="Indicadores de qualidade" acoes={
        <Button asChild size="sm" variant="outline">
          <Link to={`/app/indicacoes?parceiro=${parceiroId}`}>Ver todas as indicações <ArrowRight /></Link>
        </Button>
      }>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Numero rotulo="Indicações" valor={total} />
          <Numero rotulo="No ICP" valor={pct(noIcp, total)} detalhe={`${noIcp} de ${total}`} />
          <Numero rotulo="Com reunião" valor={pct(comReuniao, total)} detalhe={`${comReuniao} de ${total}`} />
          <Numero rotulo="Fechadas" valor={pct(fechadas.length, total)} detalhe={`${fechadas.length} de ${total}`} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-neutro-300">Receita gerada por empresa (valor base das fechadas)</p>
          {receita.size ? (
            <div className="flex flex-wrap gap-2">
              {[...receita.entries()].map(([nome, v]) => <Pilula key={nome} tom="menta">{nome}: {moeda(v)}</Pilula>)}
            </div>
          ) : <p className="text-sm text-muted-foreground">Nenhuma indicação fechada.</p>}
        </div>
        {veComissao && comissoes.data && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Numero rotulo="Comissão paga ao parceiro" valor={moeda(soma((c) => c.beneficiario === "parceiro" && c.estado === "paga"))} />
            <Numero rotulo="Comissão a pagar ao parceiro" valor={moeda(soma((c) => c.beneficiario === "parceiro" && pendentes.includes(c.estado)))} />
            <Numero rotulo="Comissão recebida do parceiro" valor={moeda(soma((c) => c.beneficiario === "grupo" && c.estado === "paga"))} />
            <Numero rotulo="Comissão a receber do parceiro" valor={moeda(soma((c) => c.beneficiario === "grupo" && pendentes.includes(c.estado)))} />
          </div>
        )}
      </Secao>

      {!lista.length ? (
        <Vazio titulo="Nenhuma indicação registrada." />
      ) : (
        <>
          <div className="hidden rounded-[14px] border border-white/10 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Empresa do grupo</TableHead>
                  <TableHead>Sentido</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="max-w-[220px] truncate font-medium">{i.clientes?.razao_social}</TableCell>
                    <TableCell>{i.empresas_grupo?.nome}</TableCell>
                    <TableCell className="text-sm">{rotulo(SENTIDOS, i.sentido)}</TableCell>
                    <TableCell className="text-sm">{rotulo(ORIGENS_INDICACAO, i.origem)}</TableCell>
                    <TableCell><SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} /></TableCell>
                    <TableCell className="text-sm">{data(i.data)}</TableCell>
                    <TableCell className="text-right text-sm">{moeda(i.valor_base)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">
            {lista.map((i) => (
              <div key={i.id} className="rounded-[14px] border border-white/10 bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-semibold">{i.clientes?.razao_social}</p>
                  <SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i.empresas_grupo?.nome} · {rotulo(SENTIDOS, i.sentido)} · {rotulo(ORIGENS_INDICACAO, i.origem)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{data(i.data)}{i.valor_base ? ` · ${moeda(i.valor_base)}` : ""}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
