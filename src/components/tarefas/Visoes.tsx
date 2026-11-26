import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Flag, Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  PRIORIDADES, STATUS, aberta, diasAte, iniciais, rotuloPrioridade, rotuloStatus, type Pessoa, type Prioridade, type Status, type Tarefa,
} from "./dados";

// Grupo de tarefas numa visão: coluna do quadro ou bloco da lista
export type Grupo = { id: string; rotulo: string; cor?: string; tarefas: Tarefa[]; soltavel: boolean };

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export function dataCurta(d: string) {
  const [, m, dia] = d.split("-").map(Number);
  return `${dia} ${MESES[m - 1]}`;
}

export function SeloPrazo({ t, hoje }: { t: Tarefa; hoje: string }) {
  if (!t.prazo) return null;
  const d = diasAte(t.prazo, hoje);
  const atrasada = aberta(t) && d < 0;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] tabular-nums",
      atrasada ? "bg-destructive/15 text-red-300" : d === 0 && aberta(t) ? "bg-warning/15 text-warning" : "bg-white/5 text-neutro-300")}>
      <CalendarDays className="h-3 w-3" aria-hidden />
      {atrasada ? `Atrasada ${-d}d` : d === 0 ? "Hoje" : d === 1 ? "Amanhã" : dataCurta(t.prazo)}
    </span>
  );
}

export function Avatar({ pessoa, tamanho = "h-6 w-6" }: { pessoa?: Pessoa; tamanho?: string }) {
  return (
    <span title={pessoa?.nome ?? "Sem responsável"} aria-label={pessoa?.nome ?? "Sem responsável"}
      className={cn("flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold", tamanho, pessoa ? "bg-menta-500/20 text-menta-300" : "border border-dashed border-white/25 text-neutro-300")}>
      {pessoa ? iniciais(pessoa.nome) : "?"}
    </span>
  );
}

function Bandeira({ p }: { p: Prioridade }) {
  const d = PRIORIDADES.find((x) => x.id === p)!;
  return <Flag className={cn("h-3.5 w-3.5 shrink-0", d.cor)} aria-label={`Prioridade ${d.rotulo.toLowerCase()}`} fill={p === "urgente" || p === "alta" ? "currentColor" : "none"} />;
}

export function Cartao({ t, hoje, pessoas, abrir, arrastando }: { t: Tarefa; hoje: string; pessoas: Map<string, Pessoa>; abrir: (id: string) => void; arrastando?: boolean }) {
  const feitos = t.checklist.filter((c) => c.feito).length;
  return (
    <button type="button" onClick={() => abrir(t.id)}
      className={cn("w-full rounded-[10px] border border-white/10 bg-card p-3 text-left transition-colors hover:border-white/25",
        arrastando && "rotate-1 shadow-xl", !aberta(t) && "opacity-60")}>
      <div className="flex items-start gap-2">
        <Bandeira p={t.prioridade} />
        <p className={cn("min-w-0 flex-1 text-sm font-medium leading-snug [overflow-wrap:anywhere]", t.status === "feito" && "line-through")}>{t.titulo}</p>
      </div>
      {(t.parceiro?.nome_fantasia || t.detalhe) && (
        <p className="mt-1 line-clamp-2 pl-5 text-xs text-neutro-300">{t.parceiro?.nome_fantasia}{t.parceiro && t.detalhe ? " · " : ""}{t.detalhe}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
        <SeloPrazo t={t} hoje={hoje} />
        {t.checklist.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] tabular-nums text-neutro-300"><CheckSquare className="h-3 w-3" aria-hidden />{feitos}/{t.checklist.length}</span>
        )}
        {t.origem === "regra" && <span className="inline-flex items-center gap-1 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] text-violet-300"><Workflow className="h-3 w-3" aria-hidden />Regra</span>}
        {t.etiquetas.slice(0, 2).map((e) => <span key={e} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-neutro-300">#{e}</span>)}
        <span className="ml-auto"><Avatar pessoa={t.responsavel_id ? pessoas.get(t.responsavel_id) : undefined} /></span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------- quadro (kanban)
function Arrastavel({ t, ativo, children }: { t: Tarefa; ativo: boolean; children: React.ReactNode }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: t.id, disabled: !ativo });
  return <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-manipulation", isDragging && "opacity-40")}>{children}</div>;
}

function Coluna({ g, children, novo }: { g: Grupo; children: React.ReactNode; novo?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: g.id, disabled: !g.soltavel });
  return (
    <section ref={setNodeRef} aria-label={`${g.rotulo}, ${g.tarefas.length} tarefas`}
      className={cn("flex w-[78vw] max-w-[300px] shrink-0 flex-col rounded-[14px] border border-white/10 bg-white/[0.02] sm:w-72", isOver && "border-menta-500/60 bg-menta-500/5")}>
      <header className="flex items-center gap-2 px-3 py-2.5">
        {g.cor && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", g.cor)} aria-hidden />}
        <h3 className="min-w-0 truncate text-sm font-semibold">{g.rotulo}</h3>
        <span className="text-xs tabular-nums text-neutro-300">{g.tarefas.length}</span>
        {novo && <button type="button" onClick={novo} className="ml-auto rounded p-1 text-neutro-300 hover:bg-white/5 hover:text-white" aria-label={`Nova tarefa em ${g.rotulo}`}><Plus className="h-4 w-4" /></button>}
      </header>
      <div className="flex max-h-[calc(100dvh-20rem)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">{children}</div>
    </section>
  );
}

export function Quadro({ grupos, hoje, pessoas, abrir, mover, novo }: {
  grupos: Grupo[]; hoje: string; pessoas: Map<string, Pessoa>; abrir: (id: string) => void;
  mover?: (tarefaId: string, grupoId: string) => void; novo?: (grupoId: string) => void;
}) {
  const [ativa, setAtiva] = useState<Tarefa | null>(null);
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const todas = useMemo(() => new Map(grupos.flatMap((g) => g.tarefas.map((t) => [t.id, t] as const))), [grupos]);
  function soltar(e: DragEndEvent) {
    setAtiva(null);
    if (e.over && mover) mover(String(e.active.id), String(e.over.id));
  }
  return (
    <DndContext sensors={sensores} onDragStart={(e) => setAtiva(todas.get(String(e.active.id)) ?? null)} onDragEnd={soltar} onDragCancel={() => setAtiva(null)}
      accessibility={{ screenReaderInstructions: { draggable: "Para mover, aperte espaço, use as setas e aperte espaço de novo para soltar." } }}>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
        {grupos.map((g) => (
          <Coluna key={g.id} g={g} novo={novo && g.soltavel ? () => novo(g.id) : undefined}>
            {g.tarefas.length === 0 && <p className="px-2 py-4 text-center text-xs text-neutro-300">Nada aqui</p>}
            {g.tarefas.map((t) => (
              <Arrastavel key={t.id} t={t} ativo={!!mover}><Cartao t={t} hoje={hoje} pessoas={pessoas} abrir={abrir} /></Arrastavel>
            ))}
          </Coluna>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{ativa && <div className="w-72"><Cartao t={ativa} hoje={hoje} pessoas={pessoas} abrir={() => {}} arrastando /></div>}</DragOverlay>
    </DndContext>
  );
}

// ---------------------------------------------------------------- lista
export function Lista({ grupos, hoje, pessoas, abrir, concluir }: {
  grupos: Grupo[]; hoje: string; pessoas: Map<string, Pessoa>; abrir: (id: string) => void; concluir: (t: Tarefa, feito: boolean) => void;
}) {
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  return (
    <div className="space-y-4">
      {grupos.map((g) => {
        const fechado = fechados.has(g.id);
        return (
          <section key={g.id} className="overflow-hidden rounded-[14px] border border-white/10 bg-card">
            <button type="button" aria-expanded={!fechado}
              onClick={() => setFechados((s) => { const n = new Set(s); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}
              className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-2.5 text-left hover:bg-white/[0.03]">
              <ChevronRight className={cn("h-4 w-4 text-neutro-300 transition-transform", !fechado && "rotate-90")} aria-hidden />
              {g.cor && <span className={cn("h-2.5 w-2.5 rounded-full", g.cor)} aria-hidden />}
              <span className="text-sm font-semibold">{g.rotulo}</span>
              <span className="text-xs tabular-nums text-neutro-300">{g.tarefas.length}</span>
            </button>
            {!fechado && (
              g.tarefas.length === 0 ? <p className="px-4 py-3 text-sm text-neutro-300">Nada aqui.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="text-xs text-neutro-300">
                      <tr className="border-b border-white/10">
                        <th scope="col" className="w-10 px-3 py-2"><span className="sr-only">Concluir</span></th>
                        <th scope="col" className="px-2 py-2 text-left font-medium">Tarefa</th>
                        <th scope="col" className="w-28 px-2 py-2 text-left font-medium">Estado</th>
                        <th scope="col" className="w-24 px-2 py-2 text-left font-medium">Prioridade</th>
                        <th scope="col" className="w-40 px-2 py-2 text-left font-medium">Responsável</th>
                        <th scope="col" className="w-32 px-2 py-2 text-left font-medium">Prazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {g.tarefas.map((t) => {
                        const p = t.responsavel_id ? pessoas.get(t.responsavel_id) : undefined;
                        return (
                          <tr key={t.id} className="cursor-pointer hover:bg-white/[0.03]" onClick={() => abrir(t.id)}>
                            <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={t.status === "feito"} onCheckedChange={(v) => concluir(t, !!v)} aria-label={`Concluir ${t.titulo}`} />
                            </td>
                            <td className="px-2 py-2">
                              <span className={cn("font-medium", t.status === "feito" && "line-through text-neutro-300")}>{t.titulo}</span>
                              {t.parceiro?.nome_fantasia && <span className="ml-2 text-xs text-neutro-300">{t.parceiro.nome_fantasia}</span>}
                              {t.origem === "regra" && <span className="ml-2 rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] text-violet-300">Regra</span>}
                            </td>
                            <td className="px-2 py-2"><span className="inline-flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", STATUS.find((s) => s.id === t.status)?.cor)} aria-hidden />{rotuloStatus(t.status)}</span></td>
                            <td className="px-2 py-2"><span className="inline-flex items-center gap-1.5"><Bandeira p={t.prioridade} />{rotuloPrioridade(t.prioridade)}</span></td>
                            <td className="px-2 py-2"><span className="inline-flex items-center gap-2"><Avatar pessoa={p} /><span className="truncate">{p?.nome ?? "Sem responsável"}</span></span></td>
                            <td className="px-2 py-2">{t.prazo ? <SeloPrazo t={t} hoje={hoje} /> : <span className="text-neutro-300">Sem prazo</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- calendário (pelo prazo)
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export function Calendario({ tarefas, hoje, abrir }: { tarefas: Tarefa[]; hoje: string; abrir: (id: string) => void }) {
  const [mes, setMes] = useState(() => hoje.slice(0, 7));
  const [ano, m] = mes.split("-").map(Number);
  const primeiro = new Date(Date.UTC(ano, m - 1, 1));
  const inicio = new Date(primeiro); inicio.setUTCDate(1 - primeiro.getUTCDay());
  const dias = Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setUTCDate(inicio.getUTCDate() + i); return d.toISOString().slice(0, 10); });
  const porDia = new Map<string, Tarefa[]>();
  tarefas.forEach((t) => { if (t.prazo) porDia.set(t.prazo, [...(porDia.get(t.prazo) ?? []), t]); });
  const semPrazo = tarefas.filter((t) => !t.prazo).length;
  const andar = (n: number) => { const d = new Date(Date.UTC(ano, m - 1 + n, 1)); setMes(d.toISOString().slice(0, 7)); };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => andar(-1)} aria-label="Mês anterior"><ChevronLeft /></Button>
        <Button size="icon" variant="outline" onClick={() => andar(1)} aria-label="Próximo mês"><ChevronRight /></Button>
        <Button size="sm" variant="ghost" onClick={() => setMes(hoje.slice(0, 7))}>Hoje</Button>
        <h3 className="ml-1 font-semibold capitalize">{primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}</h3>
        {semPrazo > 0 && <span className="ml-auto text-xs text-neutro-300">{semPrazo} sem prazo não aparecem no calendário</span>}
      </div>
      <div className="overflow-x-auto rounded-[14px] border border-white/10">
        <div className="grid min-w-[700px] grid-cols-7">
          {DIAS.map((d) => <div key={d} className="border-b border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs font-semibold text-neutro-300">{d}</div>)}
          {dias.map((d) => {
            const lista = porDia.get(d) ?? [];
            const fora = d.slice(0, 7) !== mes;
            return (
              <div key={d} className={cn("min-h-24 border-b border-r border-white/5 p-1.5", fora && "bg-black/20")}>
                <p className={cn("mb-1 text-xs tabular-nums", d === hoje ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-menta-500 font-bold text-primary-foreground" : fora ? "text-neutro-500" : "text-neutro-300")}>
                  {Number(d.slice(8))}
                </p>
                <div className="space-y-1">
                  {lista.slice(0, 3).map((t) => (
                    <button key={t.id} type="button" onClick={() => abrir(t.id)}
                      className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px]", t.status === "feito" ? "bg-white/5 text-neutro-300 line-through" : d < hoje ? "bg-destructive/15 text-red-200" : "bg-white/10 text-neutro-100")}>
                      {t.titulo}
                    </button>
                  ))}
                  {lista.length > 3 && <p className="px-1 text-[11px] text-neutro-300">mais {lista.length - 3}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const COR_STATUS = Object.fromEntries(STATUS.map((s) => [s.id, s.cor])) as Record<Status, string>;
