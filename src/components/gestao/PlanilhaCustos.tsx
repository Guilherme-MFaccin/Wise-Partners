import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { calcularPeriodo, OPCOES_GESTAO, SeletorPeriodo, type Periodo } from "@/components/painel/periodo";
import { ok } from "@/lib/erros";
import { data, minutosParaHoras, moeda } from "@/lib/formato";
import { ETAPAS_JORNADA, TIPOS_LINHA_CUSTO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { exportarPlanilhaCsv, rotuloCategoria, type LinhaPlanilha } from "./formato";

const TODOS = "__todos";
const SEM = "__sem";
const RECEITAS = new Set(["receita", "comissao_recebida"]);
const LIMITE = 300;

type Filtros = { tipo: string; parceiro: string; pessoa: string; atividade: string };
const VAZIOS: Filtros = { tipo: TODOS, parceiro: TODOS, pessoa: TODOS, atividade: TODOS };

function opcoesDistintas(linhas: LinhaPlanilha[], id: (l: LinhaPlanilha) => string | null, nome: (l: LinhaPlanilha) => string | null) {
  const m = new Map<string, string>();
  for (const l of linhas) {
    const k = id(l);
    if (k) m.set(k, nome(l) ?? k);
  }
  return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
}

// Planilha de custos do período (FR-106): uma linha por lançamento, com filtros e totais. Exporta exatamente o que está na tela.
export function PlanilhaCustos() {
  const [periodo, setPeriodo] = useState<Periodo>(() => calcularPeriodo("mes"));
  const [f, setF] = useState<Filtros>(VAZIOS);
  const [todas, setTodas] = useState(false);
  const set = (k: keyof Filtros, v: string) => setF((x) => ({ ...x, [k]: v }));

  const q = useQuery({
    queryKey: ["planilha-custos", periodo.inicio, periodo.fim],
    queryFn: async () => (ok<any>(await supabase.rpc("planilha_custos", { p_inicio: periodo.inicio, p_fim: periodo.fim })) ?? []) as LinhaPlanilha[],
  });
  const linhas = useMemo(() => q.data ?? [], [q.data]);

  const parceiros = useMemo(() => opcoesDistintas(linhas, (l) => l.parceiro_id, (l) => l.parceiro), [linhas]);
  const pessoas = useMemo(() => opcoesDistintas(linhas, (l) => l.pessoa_id, (l) => l.pessoa), [linhas]);
  const atividades = useMemo(() => opcoesDistintas(linhas.filter((l) => l.tipo_linha === "hora"), (l) => l.atividade, (l) => l.atividade), [linhas]);

  const filtradas = useMemo(() => linhas.filter((l) =>
    (f.tipo === TODOS || l.tipo_linha === f.tipo)
    && (f.parceiro === TODOS || (f.parceiro === SEM ? !l.parceiro_id : l.parceiro_id === f.parceiro))
    && (f.pessoa === TODOS || (f.pessoa === SEM ? !l.pessoa_id : l.pessoa_id === f.pessoa))
    && (f.atividade === TODOS || l.atividade === f.atividade)), [linhas, f]);

  const totais = useMemo(() => {
    let custo = 0; let receita = 0; let minutos = 0; let minSemCusto = 0;
    const porTipo: Record<string, number> = {};
    for (const l of filtradas) {
      const v = Number(l.valor ?? 0);
      porTipo[l.tipo_linha] = (porTipo[l.tipo_linha] ?? 0) + v;
      if (RECEITAS.has(l.tipo_linha)) receita += v; else custo += v;
      if (l.tipo_linha === "hora") {
        minutos += Number(l.minutos ?? 0);
        if (l.custo_hora === null) minSemCusto += Number(l.minutos ?? 0);
      }
    }
    return { custo, receita, minutos, minSemCusto, porTipo };
  }, [filtradas]);

  const filtrado = JSON.stringify(f) !== JSON.stringify(VAZIOS);
  const visiveis = todas ? filtradas : filtradas.slice(0, LIMITE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SeletorPeriodo valor={periodo} onChange={setPeriodo} opcoes={OPCOES_GESTAO} />
        <Button variant="outline" size="sm" disabled={!filtradas.length}
          onClick={() => exportarPlanilhaCsv(filtradas, `planilha-custos-${periodo.inicio}-a-${periodo.fim}${filtrado ? "-filtrada" : ""}.csv`)}>
          <Download /> Exportar o que está na tela
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={f.tipo} onValueChange={(v) => set("tipo", v)}>
          <SelectTrigger aria-label="Tipo de lançamento"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os tipos</SelectItem>
            {Object.entries(TIPOS_LINHA_CUSTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.parceiro} onValueChange={(v) => set("parceiro", v)}>
          <SelectTrigger aria-label="Parceiro"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os parceiros</SelectItem>
            <SelectItem value={SEM}>Sem parceiro (custo geral)</SelectItem>
            {parceiros.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.pessoa} onValueChange={(v) => set("pessoa", v)}>
          <SelectTrigger aria-label="Pessoa"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as pessoas</SelectItem>
            <SelectItem value={SEM}>Sem pessoa</SelectItem>
            {pessoas.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.atividade} onValueChange={(v) => set("atividade", v)}>
          <SelectTrigger aria-label="Atividade"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as atividades</SelectItem>
            {atividades.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {filtrado && <Button variant="ghost" size="sm" onClick={() => setF(VAZIOS)}>Limpar filtros</Button>}

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}

      {q.isSuccess && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador rotulo="Custo do filtro" valor={moeda(totais.custo)} detalhe={`${filtradas.length} ${filtradas.length === 1 ? "lançamento" : "lançamentos"}`} />
            <Indicador rotulo="Receita do filtro" valor={moeda(totais.receita)} />
            <Indicador rotulo="Horas registradas" valor={minutosParaHoras(totais.minutos)}
              detalhe={totais.minSemCusto > 0 ? `${minutosParaHoras(totais.minSemCusto)} sem custo-hora` : undefined} />
            <Indicador rotulo="Custo das horas" valor={moeda(totais.porTipo.hora ?? 0)} />
          </div>
          {Object.keys(totais.porTipo).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(totais.porTipo).map(([t, v]) => (
                <Pilula key={t} tom={RECEITAS.has(t) ? "menta" : "neutro"}>{rotulo(TIPOS_LINHA_CUSTO, t)}: {moeda(v)}</Pilula>
              ))}
            </div>
          )}
          {filtradas.length === 0 ? (
            <Vazio titulo="Nenhum lançamento no período ou no filtro" />
          ) : (
            <div className={cn(CLASSE_CARD, "overflow-hidden")}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Pessoa</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                    <TableHead className="text-right">Custo-hora</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((l, i) => (
                    <TableRow key={`${l.origem_id}-${l.tipo_linha}-${l.data}-${i}`}>
                      <TableCell className="whitespace-nowrap">{data(l.data)}</TableCell>
                      <TableCell className="whitespace-nowrap">{rotulo(TIPOS_LINHA_CUSTO, l.tipo_linha)}</TableCell>
                      <TableCell className="min-w-[12rem] max-w-[22rem]">
                        <span className="block truncate">
                          {l.atividade ?? (l.cliente ? `${l.cliente}${l.empresa ? ` · ${l.empresa}` : ""}` : rotuloCategoria(l.tipo_linha, l.categoria))}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[l.tipo_linha === "custo_direto" ? rotuloCategoria(l.tipo_linha, l.categoria) : null,
                            l.etapa_jornada ? rotulo(ETAPAS_JORNADA, l.etapa_jornada) : null,
                            l.tipo_linha === "receita" && l.cliente_icp ? "Cliente no ICP" : null].filter(Boolean).join(" · ")}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {l.parceiro_id ? <Link to={`/app/parceiros/${l.parceiro_id}`} className="hover:text-menta-400">{l.parceiro}</Link> : <span className="text-muted-foreground">Geral</span>}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">{l.pessoa ?? ""}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{l.minutos ? minutosParaHoras(l.minutos) : ""}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        {l.tipo_linha === "hora" ? (l.custo_hora === null ? <span className="text-warning">não informado</span> : moeda(l.custo_hora)) : ""}
                      </TableCell>
                      <TableCell className={cn("whitespace-nowrap text-right font-medium", RECEITAS.has(l.tipo_linha) && "text-menta-400")}>
                        {l.tipo_linha === "hora" && l.custo_hora === null ? "" : moeda(l.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!todas && filtradas.length > LIMITE && (
                <div className="border-t border-white/10 p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setTodas(true)}>Mostrar todos os {filtradas.length} lançamentos</Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
