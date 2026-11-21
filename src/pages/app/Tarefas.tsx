import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Columns3, Filter, List, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { hojeISO } from "@/lib/formato";
import { cn } from "@/lib/utils";
import {
  FAIXAS_PRAZO, GRUPOS_REGRA, PRIORIDADES, STATUS, aberta, faixaPrazo, useAtualizarTarefa, usePessoas, useTarefas,
  type Prioridade, type Status, type Tarefa,
} from "@/components/tarefas/dados";
import { Calendario, Lista, Quadro, type Grupo } from "@/components/tarefas/Visoes";
import { DetalheTarefa, NovaTarefa } from "@/components/tarefas/Detalhe";

// Gerenciador de tarefas (P-08, P-09), no modelo do ClickUp e do Monday: quadro, lista e calendário; agrupar por
// estado, responsável, prioridade, prazo, parceiro ou origem; filtros combináveis; arrastar para mudar estado, dono ou prioridade.
type Visao = "quadro" | "lista" | "calendario";
type Agrupar = "status" | "responsavel" | "prioridade" | "prazo" | "parceiro" | "origem";
type Filtros = {
  responsaveis: string[]; prioridades: Prioridade[]; status: Status[]; prazo: "" | "atrasada" | "hoje" | "semana" | "sem";
  origem: "" | "manual" | "regra"; grupo: "" | "decidir" | "responder" | "acompanhar"; etiqueta: string; concluidas: boolean;
};
type Prefs = { visao: Visao; agrupar: Agrupar; filtros: Filtros };

const AGRUPAR: { id: Agrupar; rotulo: string }[] = [
  { id: "status", rotulo: "Estado" }, { id: "responsavel", rotulo: "Responsável" }, { id: "prioridade", rotulo: "Prioridade" },
  { id: "prazo", rotulo: "Prazo" }, { id: "parceiro", rotulo: "Parceiro" }, { id: "origem", rotulo: "Origem" },
];
const SEM_FILTRO: Filtros = { responsaveis: [], prioridades: [], status: [], prazo: "", origem: "", grupo: "", etiqueta: "", concluidas: false };
const SEM_RESP = "__sem__";

function lerPrefs(chave: string, padrao: Prefs): Prefs {
  try { const v = localStorage.getItem(chave); return v ? { ...padrao, ...JSON.parse(v), filtros: { ...padrao.filtros, ...JSON.parse(v).filtros } } : padrao; }
  catch { return padrao; }
}

export default function Tarefas() {
  const { perfil, isParcerias } = useAuth();
  const hoje = hojeISO();
  const chave = `tarefas-prefs-${perfil?.id ?? "x"}`;
  // Gerente e administradores abrem no quadro de todos; os demais, nas próprias tarefas
  const padrao: Prefs = { visao: "quadro", agrupar: "status", filtros: { ...SEM_FILTRO, responsaveis: isParcerias ? [] : [perfil?.id ?? ""] } };
  const [prefs, setPrefs] = useState<Prefs>(() => lerPrefs(chave, padrao));
  useEffect(() => { try { localStorage.setItem(chave, JSON.stringify(prefs)); } catch { /* sem armazenamento */ } }, [chave, prefs]);
  const [busca, setBusca] = useState("");
  const [params, setParams] = useSearchParams();
  const [nova, setNova] = useState<Partial<Tarefa> | null>(null);

  const q = useTarefas();
  const pessoasQ = usePessoas();
  const atualizar = useAtualizarTarefa();
  const pessoas = useMemo(() => pessoasQ.data ?? [], [pessoasQ.data]);
  const porPessoa = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas]);
  const f = prefs.filtros;
  const setF = (m: Partial<Filtros>) => setPrefs((p) => ({ ...p, filtros: { ...p.filtros, ...m } }));

  const todas = useMemo(() => q.data ?? [], [q.data]);
  const etiquetas = useMemo(() => [...new Set(todas.flatMap((t) => t.etiquetas))].sort(), [todas]);
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todas.filter((t) =>
      (f.concluidas || aberta(t))
      && (!f.responsaveis.length || f.responsaveis.includes(t.responsavel_id ?? SEM_RESP))
      && (!f.prioridades.length || f.prioridades.includes(t.prioridade))
      && (!f.status.length || f.status.includes(t.status))
      && (!f.prazo || faixaPrazo(t, hoje) === f.prazo)
      && (!f.origem || t.origem === f.origem)
      && (!f.grupo || t.grupo === f.grupo)
      && (!f.etiqueta || t.etiquetas.includes(f.etiqueta))
      && (!termo || `${t.titulo} ${t.detalhe ?? ""} ${t.parceiro?.nome_fantasia ?? ""}`.toLowerCase().includes(termo)));
  }, [todas, f, busca, hoje]);

  // Dentro de cada grupo: atrasadas primeiro, depois prioridade e prazo
  const ordenar = (l: Tarefa[]) => [...l].sort((a, b) =>
    (PRIORIDADES.find((x) => x.id === a.prioridade)!.peso - PRIORIDADES.find((x) => x.id === b.prioridade)!.peso)
    || (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999") || a.ordem - b.ordem);

  const grupos: Grupo[] = useMemo(() => {
    const por = (fn: (t: Tarefa) => string) => { const m = new Map<string, Tarefa[]>(); filtradas.forEach((t) => m.set(fn(t), [...(m.get(fn(t)) ?? []), t])); return m; };
    switch (prefs.agrupar) {
      case "status": {
        const m = por((t) => t.status);
        return STATUS.filter((s) => (f.concluidas || (s.id !== "feito" && s.id !== "cancelada")) || m.has(s.id))
          .filter((s) => s.id !== "cancelada" || m.has(s.id))
          .map((s) => ({ id: s.id, rotulo: s.rotulo, cor: s.cor, tarefas: ordenar(m.get(s.id) ?? []), soltavel: true }));
      }
      case "prioridade": {
        const m = por((t) => t.prioridade);
        return PRIORIDADES.map((p) => ({ id: p.id, rotulo: p.rotulo, tarefas: ordenar(m.get(p.id) ?? []), soltavel: true }));
      }
      case "responsavel": {
        const m = por((t) => t.responsavel_id ?? SEM_RESP);
        const ids = [...m.keys()].sort((a, b) => (a === perfil?.id ? -1 : b === perfil?.id ? 1 : (porPessoa.get(a)?.nome ?? "zz").localeCompare(porPessoa.get(b)?.nome ?? "zz")));
        const lista = ids.map((id) => ({ id, rotulo: id === SEM_RESP ? "Sem responsável" : `${porPessoa.get(id)?.nome ?? "Outra pessoa"}${id === perfil?.id ? " (você)" : ""}`, tarefas: ordenar(m.get(id) ?? []), soltavel: true }));
        if (perfil && !m.has(perfil.id)) lista.unshift({ id: perfil.id, rotulo: `${perfil.nome} (você)`, tarefas: [], soltavel: true });
        return lista;
      }
      case "prazo": {
        const m = por((t) => faixaPrazo(t, hoje));
        return FAIXAS_PRAZO.map((x) => ({ id: x.id, rotulo: x.rotulo, cor: x.id === "atrasada" ? "bg-destructive" : x.id === "hoje" ? "bg-warning" : undefined, tarefas: ordenar(m.get(x.id) ?? []), soltavel: false }));
      }
      case "parceiro": {
        const m = por((t) => t.parceiro?.nome_fantasia ?? "Sem parceiro");
        return [...m.keys()].sort((a, b) => (a === "Sem parceiro" ? 1 : b === "Sem parceiro" ? -1 : a.localeCompare(b))).map((k) => ({ id: k, rotulo: k, tarefas: ordenar(m.get(k)!), soltavel: false }));
      }
      case "origem": {
        const m = por((t) => (t.origem === "manual" ? "manual" : t.grupo ?? "acompanhar"));
        return [["manual", "Criadas pelo time"], ["decidir", "Regra: decidir"], ["responder", "Regra: responder"], ["acompanhar", "Regra: acompanhar"]]
          .map(([id, rotulo]) => ({ id, rotulo, tarefas: ordenar(m.get(id) ?? []), soltavel: false }));
      }
    }
  }, [filtradas, prefs.agrupar, f.concluidas, perfil, porPessoa, hoje]);

  function mover(id: string, grupoId: string) {
    const campo = prefs.agrupar === "status" ? "status" : prefs.agrupar === "prioridade" ? "prioridade" : prefs.agrupar === "responsavel" ? "responsavel_id" : null;
    if (!campo) return;
    const valor = campo === "responsavel_id" && grupoId === SEM_RESP ? null : grupoId;
    const t = todas.find((x) => x.id === id);
    if (t && (t as any)[campo] !== valor) atualizar.mutate({ id, mudanca: { [campo]: valor } as Partial<Tarefa> });
  }
  function novaNoGrupo(grupoId: string) {
    const campo = prefs.agrupar === "status" ? "status" : prefs.agrupar === "prioridade" ? "prioridade" : "responsavel_id";
    setNova({ [campo]: campo === "responsavel_id" && grupoId === SEM_RESP ? null : grupoId });
  }

  const abertas = todas.filter(aberta);
  const resumo = [
    { rotulo: "Minhas abertas", valor: abertas.filter((t) => t.responsavel_id === perfil?.id).length, aplicar: () => setF({ ...SEM_FILTRO, responsaveis: [perfil?.id ?? ""] }) },
    { rotulo: "Atrasadas", valor: abertas.filter((t) => faixaPrazo(t, hoje) === "atrasada").length, aplicar: () => setF({ ...SEM_FILTRO, prazo: "atrasada" }), alerta: true },
    { rotulo: "Vencem hoje", valor: abertas.filter((t) => faixaPrazo(t, hoje) === "hoje").length, aplicar: () => setF({ ...SEM_FILTRO, prazo: "hoje" }) },
    { rotulo: "Sem responsável", valor: abertas.filter((t) => !t.responsavel_id).length, aplicar: () => setF({ ...SEM_FILTRO, responsaveis: [SEM_RESP] }) },
  ];
  const nFiltros = f.responsaveis.length + f.prioridades.length + f.status.length + (f.prazo ? 1 : 0) + (f.origem ? 1 : 0) + (f.grupo ? 1 : 0) + (f.etiqueta ? 1 : 0) + (f.concluidas ? 1 : 0);
  const aberto = todas.find((t) => t.id === params.get("tarefa")) ?? null;
  const abrir = (id: string) => setParams((p) => { const n = new URLSearchParams(p); n.set("tarefa", id); return n; }, { replace: false });
  const fechar = () => setParams((p) => { const n = new URLSearchParams(p); n.delete("tarefa"); return n; }, { replace: true });
  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  return (
    <div>
      <Cabecalho titulo="Tarefas"
        descricao="O que cada pessoa da Wise tem para fazer, em que pé está e o que atrasou? As tarefas das regras chegam sozinhas e se fecham quando o caso se resolve."
        acoes={<Button onClick={() => setNova({})}><Plus /> Nova tarefa</Button>} />

      <dl className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {resumo.map((r) => (
          <button key={r.rotulo} type="button" onClick={r.aplicar} className="rounded-[12px] border border-white/10 bg-card px-4 py-3 text-left hover:border-white/25">
            <dt className="text-xs text-neutro-300">{r.rotulo}</dt>
            <dd className={cn("mt-0.5 text-2xl font-bold tabular-nums", r.alerta && r.valor > 0 && "text-red-300")}>{q.isSuccess ? r.valor : ""}</dd>
          </button>
        ))}
      </dl>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div role="radiogroup" aria-label="Visão" className="flex w-fit shrink-0 gap-1 rounded-[10px] border border-white/10 bg-card p-1">
          {([["quadro", "Quadro", Columns3], ["lista", "Lista", List], ["calendario", "Calendário", CalendarDays]] as const).map(([v, r, I]) => (
            <button key={v} type="button" role="radio" aria-checked={prefs.visao === v} onClick={() => setPrefs((p) => ({ ...p, visao: v }))}
              className={cn("flex min-h-9 items-center gap-1.5 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", prefs.visao === v && "bg-white/10 text-white")}>
              <I className="h-4 w-4" aria-hidden />{r}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {prefs.visao !== "calendario" && (
            <div className="flex items-center gap-2">
              <Label htmlFor="agrupar" className="shrink-0 text-sm text-neutro-300">Agrupar por</Label>
              <Select value={prefs.agrupar} onValueChange={(v) => setPrefs((p) => ({ ...p, agrupar: v as Agrupar }))}>
                <SelectTrigger id="agrupar" className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{AGRUPAR.map((a) => <SelectItem key={a.id} value={a.id}>{a.rotulo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9"><Filter /> Filtros{nFiltros ? <span className="rounded-full bg-menta-500 px-1.5 text-[11px] font-bold text-neutro-900">{nFiltros}</span> : null}</Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-[70dvh] w-[min(92vw,420px)] space-y-4 overflow-y-auto">
              <BlocoFiltro titulo="Responsável">
                {[{ id: perfil?.id ?? "", nome: "Eu" }, ...pessoas.filter((p) => p.id !== perfil?.id), { id: SEM_RESP, nome: "Sem responsável" }].map((p) => (
                  <Marca key={p.id} rotulo={p.nome} marcado={f.responsaveis.includes(p.id)} aoMudar={() => setF({ responsaveis: alternar(f.responsaveis, p.id) })} />
                ))}
              </BlocoFiltro>
              <BlocoFiltro titulo="Prioridade">
                {PRIORIDADES.map((p) => <Marca key={p.id} rotulo={p.rotulo} marcado={f.prioridades.includes(p.id)} aoMudar={() => setF({ prioridades: alternar(f.prioridades, p.id) })} />)}
              </BlocoFiltro>
              <BlocoFiltro titulo="Estado">
                {STATUS.map((s) => <Marca key={s.id} rotulo={s.rotulo} marcado={f.status.includes(s.id)} aoMudar={() => setF({ status: alternar(f.status, s.id), concluidas: f.concluidas || s.id === "feito" || s.id === "cancelada" })} />)}
              </BlocoFiltro>
              <div className="grid gap-3 sm:grid-cols-2">
                <FiltroSelect id="f-prazo" rotulo="Prazo" valor={f.prazo} aoMudar={(v) => setF({ prazo: v as Filtros["prazo"] })}
                  opcoes={[["", "Qualquer"], ["atrasada", "Atrasadas"], ["hoje", "Hoje"], ["semana", "Próximos 7 dias"], ["sem", "Sem prazo"]]} />
                <FiltroSelect id="f-origem" rotulo="Origem" valor={f.origem} aoMudar={(v) => setF({ origem: v as Filtros["origem"] })}
                  opcoes={[["", "Todas"], ["manual", "Criadas pelo time"], ["regra", "Nascidas de regra"]]} />
                <FiltroSelect id="f-grupo" rotulo="Tipo de regra" valor={f.grupo} aoMudar={(v) => setF({ grupo: v as Filtros["grupo"] })}
                  opcoes={[["", "Todos"], ...Object.entries(GRUPOS_REGRA)]} />
                <FiltroSelect id="f-etq" rotulo="Etiqueta" valor={f.etiqueta} aoMudar={(v) => setF({ etiqueta: v })}
                  opcoes={[["", "Todas"], ...etiquetas.map((e) => [e, `#${e}`])]} />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">Mostrar concluídas e canceladas (30 dias)
                <Switch checked={f.concluidas} onCheckedChange={(v) => setF({ concluidas: v })} />
              </label>
              <Button variant="ghost" size="sm" onClick={() => setF(SEM_FILTRO)} disabled={!nFiltros}>Limpar filtros</Button>
            </PopoverContent>
          </Popover>
          {nFiltros > 0 && <Button variant="ghost" size="sm" className="h-9" onClick={() => setF(SEM_FILTRO)}><X /> Limpar</Button>}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-300" aria-hidden />
            <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar tarefa ou parceiro" aria-label="Buscar tarefa ou parceiro" className="h-9 pl-9" />
          </div>
        </div>
      </div>

      {(q.isLoading || pessoasQ.isLoading) && <Carregando texto="Carregando as tarefas..." />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && filtradas.length === 0 && (
        <div className="mb-4 rounded-[14px] border border-white/10 bg-card px-6 py-8 text-center">
          <p className="font-semibold">{todas.some(aberta) ? "Nenhuma tarefa com estes filtros." : "Nenhuma tarefa aberta."}</p>
          <p className="mt-1 text-sm text-neutro-300">{nFiltros || busca ? "Mude os filtros ou limpe a busca." : "Crie uma tarefa ou espere as regras apontarem algo."}</p>
        </div>
      )}
      {q.isSuccess && (
        prefs.visao === "quadro" ? (
          <Quadro grupos={grupos} hoje={hoje} pessoas={porPessoa} abrir={abrir}
            mover={["status", "prioridade", "responsavel"].includes(prefs.agrupar) ? mover : undefined}
            novo={["status", "prioridade", "responsavel"].includes(prefs.agrupar) ? novaNoGrupo : undefined} />
        ) : prefs.visao === "lista" ? (
          <Lista grupos={grupos} hoje={hoje} pessoas={porPessoa} abrir={abrir} concluir={(t, feito) => atualizar.mutate({ id: t.id, mudanca: { status: feito ? "feito" : "a_fazer" } })} />
        ) : (
          <Calendario tarefas={filtradas} hoje={hoje} abrir={abrir} />
        )
      )}

      <DetalheTarefa tarefa={aberto} pessoas={pessoas} fechar={fechar} />
      <NovaTarefa aberto={!!nova} inicial={nova ?? {}} pessoas={pessoas} fechar={() => setNova(null)} />
    </div>
  );
}

function BlocoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-neutro-300">{titulo}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
    </fieldset>
  );
}
function Marca({ rotulo, marcado, aoMudar }: { rotulo: string; marcado: boolean; aoMudar: () => void }) {
  return <label className="flex items-center gap-2 text-sm"><Checkbox checked={marcado} onCheckedChange={aoMudar} />{rotulo}</label>;
}
function FiltroSelect({ id, rotulo, valor, opcoes, aoMudar }: { id: string; rotulo: string; valor: string; opcoes: string[][]; aoMudar: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-neutro-300">{rotulo}</Label>
      <Select value={valor || "__todos__"} onValueChange={(v) => aoMudar(v === "__todos__" ? "" : v)}>
        <SelectTrigger id={id} className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>{opcoes.map(([v, r]) => <SelectItem key={v || "__todos__"} value={v || "__todos__"}>{r}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
