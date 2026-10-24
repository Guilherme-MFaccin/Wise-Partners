import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Info, Loader2, Receipt, Target, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Barra, CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { calcularPeriodo, OPCOES_GESTAO, SeletorPeriodo, type Periodo } from "@/components/painel/periodo";
import { ListaCriterios, useSugestaoFase } from "@/components/gestao/FasePrograma";
import { exportarPlanilhaCsv, horas, meses, numero, roiPct, rotuloChave, type LinhaPlanilha } from "@/components/gestao/formato";
import { AcessoRestrito, Aviso } from "@/components/gestao/Restrito";
import { ok, toastErro } from "@/lib/erros";
import { data, moeda } from "@/lib/formato";
import { AGRUPAMENTOS_RESULTADO, FASES_PROGRAMA, ORIGENS_PARCEIRO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

// Métricas de resultado_canal() (migração 0015, Apêndice M)
type Metricas = {
  horas: number; horas_sem_custo: number; custo_horas: number; comissoes_parceiro: number; comissoes_responsavel: number;
  custos_diretos: number; custo_total: number; receita_clientes: number; comissoes_recebidas: number; receita_atribuida: number;
  receita_margem: number; roi: number | null; clientes_icp: number; custo_por_cliente: number | null; mensalidade_recorrente: number;
  tempo_retorno_meses: number | null;
};
type Resultado = {
  periodo: { inicio: string; fim: string };
  parametros: { margem_pct: number; rateio: boolean; horizonte_meses: number; prazo_padrao_meses: number };
  total: Metricas;
  grupos: (Metricas & { chave: string; rotulo: string })[];
  geral: Metricas | null;
  avisos: string[];
  fase: string | null;
  secundarios: { assinados: number; reunioes: number };
};

// Resultado do canal (História 1): só administradores. A função do banco recusa os demais papéis.
export default function Resultado() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <AcessoRestrito titulo="Resultado do canal" texto="Resultado do canal, custos e ROI são visíveis só para administradores." />;
  return <TelaResultado />;
}

function TelaResultado() {
  const [periodo, setPeriodo] = useState<Periodo>(() => calcularPeriodo("trimestre"));
  const [agrupar, setAgrupar] = useState("total");
  const [exportando, setExportando] = useState(false);

  const q = useQuery({
    queryKey: ["resultado-canal", periodo.inicio, periodo.fim, agrupar],
    queryFn: async () => ok<any>(await supabase.rpc("resultado_canal", { p_inicio: periodo.inicio, p_fim: periodo.fim, p_agrupar: agrupar })) as Resultado,
  });
  const r = q.data;
  const roiNegativo = r?.total.roi !== null && r?.total.roi !== undefined && Number(r.total.roi) < 0;
  const experimentacao = (r?.fase ?? "experimentacao") === "experimentacao";
  const sugestao = useSugestaoFase(!!r && roiNegativo && experimentacao);

  async function exportar() {
    setExportando(true);
    try {
      const linhas = ok<any>(await supabase.rpc("planilha_custos", { p_inicio: periodo.inicio, p_fim: periodo.fim })) as LinhaPlanilha[];
      exportarPlanilhaCsv(linhas ?? [], `planilha-custos-${periodo.inicio}-a-${periodo.fim}.csv`);
    } catch (e) {
      toastErro(e);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div>
      <Cabecalho
        titulo="Resultado do canal"
        descricao="Número principal, receita atribuída, custo do canal e ROI do período."
        acoes={
          <>
            <Button variant="outline" asChild><Link to="/app/custos"><Receipt /> Planilha de custos</Link></Button>
            <Button onClick={exportar} disabled={exportando}>{exportando ? <Loader2 className="animate-spin" /> : <Download />} Exportar planilha</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SeletorPeriodo valor={periodo} onChange={setPeriodo} opcoes={OPCOES_GESTAO} />
        <p className="text-xs text-muted-foreground">{data(periodo.inicio)} a {data(periodo.fim)}</p>
      </div>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}

      {r && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Fase do programa:</span>
            <Pilula tom="menta">{rotulo(FASES_PROGRAMA, r.fase ?? "experimentacao")}</Pilula>
          </div>

          {r.avisos.map((a) => (
            <Aviso key={a}><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {a}</Aviso>
          ))}

          {roiNegativo && experimentacao && (
            <Aviso tom="info">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
              <div className="min-w-0 flex-1 space-y-2">
                <p>
                  Na fase de experimentação, investimento maior que retorno é esperado: o canal ainda está sendo montado e os primeiros clientes
                  levam tempo para fechar.
                </p>
                {sugestao.data && sugestao.data.proxima && (
                  <div>
                    <p className="mb-1 font-semibold">O que falta para a fase de {rotulo(FASES_PROGRAMA, sugestao.data.proxima)}:</p>
                    <ListaCriterios criterios={sugestao.data.criterios} apenasFaltantes />
                  </div>
                )}
              </div>
            </Aviso>
          )}

          {/* Número principal */}
          <section className={cn(CLASSE_CARD, "border-menta-500/30 p-4 sm:p-5")}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-menta-400" />
                <h2 className="font-semibold">Clientes fechados no ICP via parceiros</h2>
              </div>
              <p className="text-4xl font-bold text-menta-400">{numero(r.total.clientes_icp)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Indicadores secundários: {numero(r.secundarios.assinados)} parceiros assinados · {numero(r.secundarios.reunioes)} reuniões com indicações no período
            </p>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Indicador rotulo="Receita atribuída" valor={moeda(r.total.receita_atribuida)}
              detalhe={`Clientes ${moeda(r.total.receita_clientes)} · comissões recebidas ${moeda(r.total.comissoes_recebidas)}`} />
            <Indicador rotulo="Custo total do canal" valor={moeda(r.total.custo_total)} />
            <Indicador rotulo="ROI" valor={<span className={cn(roiNegativo && "text-warning")}>{r.total.roi === null ? "Sem custo" : roiPct(r.total.roi)}</span>}
              detalhe={`Margem de contribuição de ${numero(r.parametros.margem_pct)}%`} />
            <Indicador rotulo="Custo por cliente no ICP" valor={r.total.custo_por_cliente === null ? "Sem clientes" : moeda(r.total.custo_por_cliente)} />
            <Indicador rotulo="Tempo de retorno" valor={r.total.tempo_retorno_meses === null ? "Sem receita recorrente" : meses(r.total.tempo_retorno_meses)}
              detalhe={`Mensalidade recorrente ${moeda(r.total.mensalidade_recorrente)}`} />
          </div>

          <ComposicaoCusto m={r.total} />

          <p className="text-xs text-muted-foreground">
            Parâmetros: horizonte de receita de {r.parametros.horizonte_meses} meses, prazo padrão do contrato de {r.parametros.prazo_padrao_meses} meses,
            rateio do custo geral {r.parametros.rateio ? "ligado" : "desligado"}. Altere em Configurações, Custos e remunerações.
          </p>

          {/* Agrupamento */}
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold">Resultado por grupo</h2>
              <Select value={agrupar} onValueChange={setAgrupar}>
                <SelectTrigger className="w-full sm:w-60" aria-label="Agrupar"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AGRUPAMENTOS_RESULTADO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {agrupar === "total" ? (
              <p className="text-sm text-muted-foreground">Escolha um agrupamento para ver os números por parceiro, nível, modelo de atuação, empresa ou origem.</p>
            ) : (
              <TabelaGrupos r={r} agrupar={agrupar} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ComposicaoCusto({ m }: { m: Metricas }) {
  const total = Math.max(1, Number(m.custo_total));
  const itens = [
    { rotulo: "Comissões ao parceiro", valor: m.comissoes_parceiro },
    { rotulo: "Comissões ao responsável", valor: m.comissoes_responsavel },
    {
      rotulo: "Horas da equipe", valor: m.custo_horas,
      detalhe: `${horas(m.horas)} registradas${Number(m.horas_sem_custo) > 0 ? ` · ${horas(m.horas_sem_custo)} com custo não informado` : ""}`,
    },
    { rotulo: "Custos diretos", valor: m.custos_diretos },
  ];
  return (
    <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
      <h2 className="mb-3 font-semibold">Composição do custo</h2>
      <div className="space-y-3">
        {itens.map((i) => (
          <div key={i.rotulo} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span>{i.rotulo}</span>
              <span className="shrink-0 font-semibold">{moeda(i.valor)}</span>
            </div>
            <Barra valor={Number(i.valor)} maximo={total} className="mt-1 h-1.5" cor="bg-menta-500/70" />
            {i.detalhe && <p className="mt-0.5 text-xs text-muted-foreground">{i.detalhe}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function rotuloGrupo(agrupar: string, chave: string, rot: string) {
  if (agrupar === "parceiro") return rot;
  if (agrupar === "origem") return ORIGENS_PARCEIRO[chave] ?? rotuloChave(chave);
  return rotuloChave(rot || chave);
}

function TabelaGrupos({ r, agrupar }: { r: Resultado; agrupar: string }) {
  const grupos = [...r.grupos].sort((a, b) => Number(b.receita_atribuida) - Number(a.receita_atribuida) || Number(b.custo_total) - Number(a.custo_total));
  const linha = (g: Metricas, nome: React.ReactNode, chave: string, classe?: string) => (
    <TableRow key={chave} className={classe}>
      <TableCell className="min-w-[10rem] font-medium">{nome}</TableCell>
      <TableCell className="text-right">{numero(g.clientes_icp)}</TableCell>
      <TableCell className="whitespace-nowrap text-right">{moeda(g.receita_atribuida)}</TableCell>
      <TableCell className="whitespace-nowrap text-right">{moeda(g.custo_total)}</TableCell>
      <TableCell className={cn("whitespace-nowrap text-right", g.roi !== null && Number(g.roi) < 0 && "text-warning")}>{g.roi === null ? "" : roiPct(g.roi)}</TableCell>
      <TableCell className="whitespace-nowrap text-right">{g.custo_por_cliente === null ? "" : moeda(g.custo_por_cliente)}</TableCell>
      <TableCell className="whitespace-nowrap text-right">{horas(g.horas)}</TableCell>
    </TableRow>
  );
  return (
    <div className="space-y-2">
      {agrupar === "modelo" && (
        <p className="text-xs text-muted-foreground">Parceiros com mais de um modelo de atuação entram em cada um deles; a soma dos grupos pode passar do total.</p>
      )}
      {agrupar === "parceiro" && r.parametros.rateio && (
        <p className="text-xs text-muted-foreground">Rateio ligado: o custo geral foi dividido igualmente entre os parceiros assinados do período.</p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{rotulo(AGRUPAMENTOS_RESULTADO, agrupar).replace(/^Por /, "").replace(/^./, (c) => c.toUpperCase())}</TableHead>
            <TableHead className="text-right">Clientes no ICP</TableHead>
            <TableHead className="text-right">Receita atribuída</TableHead>
            <TableHead className="text-right">Custo total</TableHead>
            <TableHead className="text-right">ROI</TableHead>
            <TableHead className="text-right">Custo por cliente</TableHead>
            <TableHead className="text-right">Horas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.length === 0 && (
            <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum lançamento ligado a parceiro no período.</TableCell></TableRow>
          )}
          {grupos.map((g) => linha(g,
            agrupar === "parceiro"
              ? <Link to={`/app/parceiros/${g.chave}`} className="hover:text-menta-400">{g.rotulo}</Link>
              : rotuloGrupo(agrupar, g.chave, g.rotulo),
            g.chave))}
          {r.geral && linha(r.geral, <span>Custo geral (sem parceiro){r.parametros.rateio && agrupar === "parceiro" ? ", rateado acima" : ""}</span>, "__geral", "bg-white/5")}
          {linha(r.total, "Total do canal", "__total", "font-semibold")}
        </TableBody>
      </Table>
    </div>
  );
}
