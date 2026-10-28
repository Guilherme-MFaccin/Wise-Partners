import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarClock } from "lucide-react";
import { Pilula, SeloNivel, SeloStatus } from "@/components/comum/Selos";
import { data } from "@/lib/formato";
import { ETAPAS, ETAPAS_FUNIL, ETAPAS_PAUSA, ETAPAS_PERDA, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { SeletorEtapa, useTrocaEtapa } from "./SeletorEtapa";
import type { Categoria, Etapa, ParceiroCategoria, ParceiroLista, ProximoPasso } from "./dados";

// Quadro por etapa do funil: uma faixa contínua, na ordem do funil, com rolagem horizontal dentro do quadro
// (a página não rola para o lado). Colunas de largura fixa. A partir de md o quadro ocupa a altura da tela e cada
// coluna rola por dentro, para a barra horizontal ficar sempre à vista; no celular a rolagem encaixa coluna a coluna.
// Os cartões são arrastados entre as colunas, a nutrição e as perdas (mouse, ou toque longo no celular); quem usa
// teclado troca a etapa pelo seletor do cartão. As regras de cada etapa continuam no banco (useTrocaEtapa).
const ZONA_PERDAS = "perdas";
const PERDA_PADRAO = "sem_interesse";

export function QuadroFunil({
  parceiros, etapas, vinculos, categorias, passos, podeEditar,
}: {
  parceiros: ParceiroLista[];
  etapas: Etapa[];
  vinculos: ParceiroCategoria[];
  categorias: Categoria[];
  passos: ProximoPasso[];
  podeEditar: boolean;
}) {
  // Etapa já escolhida e ainda não confirmada pelo banco: o cartão muda de coluna na hora e volta se a regra recusar
  const [movidos, setMovidos] = useState<Record<string, string>>({});
  useEffect(() => setMovidos({}), [parceiros]);
  const troca = useTrocaEtapa((id, etapa) => setMovidos((m) => {
    const n = { ...m };
    if (etapa) n[id] = etapa;
    else delete n[id];
    return n;
  }));
  const lista = useMemo(() => parceiros.map((p) => (movidos[p.id] ? { ...p, etapa: movidos[p.id] } : p)), [parceiros, movidos]);
  const [arrastado, setArrastado] = useState<ParceiroLista | null>(null);

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const principal = new Map(vinculos.filter((v) => v.principal).map((v) => [v.parceiro_id, nomeCategoria.get(v.categoria_id) ?? ""]));
  const passoPor = new Map(passos.map((p) => [p.parceiro_id, p]));
  // Sequência do funil, pausa (nutrição) e perdas pelos rótulos; o nome vem do banco quando houver
  const nomeEtapa = (c: string) => etapas.find((e) => e.codigo === c)?.nome ?? rotulo(ETAPAS, c);
  const funil = ETAPAS_FUNIL.map((c) => ({ codigo: c, nome: nomeEtapa(c) }));
  const perdas = ETAPAS_PERDA.map((c) => ({ codigo: c, nome: nomeEtapa(c) }));
  const perdidos = lista.filter((p) => ETAPAS_PERDA.includes(p.etapa));
  const emNutricao = lista.filter((p) => ETAPAS_PAUSA.includes(p.etapa))
    .sort((a, b) => (a.nutricao_ate ?? "9999").localeCompare(b.nutricao_ate ?? "9999"));
  const nomeZona = (id: string) => (id === ZONA_PERDAS ? "Perdas" : nomeEtapa(id));
  const nomeParceiro = (id: string | number) => lista.find((p) => p.id === id)?.nome_fantasia ?? "Parceiro";

  function aoComecar(ev: DragStartEvent) {
    setArrastado(lista.find((p) => p.id === ev.active.id) ?? null);
  }

  function aoSoltar(ev: DragEndEvent) {
    setArrastado(null);
    const p = lista.find((x) => x.id === ev.active.id);
    if (!p || !ev.over) return;
    const zona = String(ev.over.id);
    if (zona === ZONA_PERDAS) {
      if (!ETAPAS_PERDA.includes(p.etapa)) troca.escolher(p, PERDA_PADRAO);
      return;
    }
    troca.escolher(p, zona);
  }

  const avisos: Announcements = {
    onDragStart: ({ active }) => `${nomeParceiro(active.id)} selecionado para mudar de etapa.`,
    onDragOver: ({ active, over }) => (over ? `${nomeParceiro(active.id)} sobre ${nomeZona(String(over.id))}.` : `${nomeParceiro(active.id)} fora das colunas.`),
    onDragEnd: ({ active, over }) => (over ? `${nomeParceiro(active.id)} solto em ${nomeZona(String(over.id))}.` : `${nomeParceiro(active.id)} não mudou de etapa.`),
    onDragCancel: ({ active }) => `${nomeParceiro(active.id)} não mudou de etapa.`,
  };

  const cartao = (p: ParceiroLista, mostrarEtapa = false) => (
    <CartaoArrastavel key={p.id} id={p.id} ativo={podeEditar}>
      <CartaoFunil parceiro={p} categoria={principal.get(p.id)} passo={passoPor.get(p.id)} podeEditar={podeEditar}
        etapaNome={mostrarEtapa ? perdas.find((e) => e.codigo === p.etapa)?.nome : undefined} />
    </CartaoArrastavel>
  );

  return (
    <DndContext
      sensors={sensores}
      // Rolagem automática só bem perto da borda, para dar para soltar nas colunas da ponta sem passar delas
      autoScroll={{ threshold: { x: 0.06, y: 0.12 }, acceleration: 5 }}
      onDragStart={aoComecar}
      onDragEnd={aoSoltar}
      onDragCancel={() => setArrastado(null)}
      accessibility={{
        announcements: avisos,
        screenReaderInstructions: { draggable: "Use o seletor de etapa do cartão para mudar o parceiro de etapa pelo teclado." },
      }}
    >
      <div className="space-y-6">
        <div
          className="-mx-1 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto px-1 pb-3 sm:snap-none md:h-[calc(100dvh-15rem)] md:min-h-[420px]"
          tabIndex={0}
          role="region"
          aria-label="Quadro do funil de parceiros, role para o lado para ver todas as etapas"
        >
          {funil.map((e) => {
            const daEtapa = lista.filter((p) => p.etapa === e.codigo);
            return (
              <Zona key={e.codigo} id={e.codigo} ativo={podeEditar}
                className="flex w-[272px] shrink-0 snap-start flex-col rounded-[14px] border border-white/10 bg-card/60 p-3 md:max-h-full">
                <header className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h3 className="text-sm font-semibold">{e.nome}</h3>
                  <Pilula tom={daEtapa.length ? "menta" : "neutro"}>{daEtapa.length}</Pilula>
                </header>
                <div className="min-h-[48px] space-y-2 md:-mr-1 md:min-h-0 md:overflow-y-auto md:pr-1">
                  {daEtapa.length ? daEtapa.map((p) => cartao(p)) : <p className="px-1 pb-1 text-xs text-muted-foreground">Nenhum parceiro.</p>}
                </div>
              </Zona>
            );
          })}
        </div>

        <Zona id="nutricao" ativo={podeEditar} className="rounded-[14px] border border-white/10 bg-card/60 p-3">
          <header className="mb-3 flex items-center justify-between gap-2 px-1">
            <h3 className="text-sm font-semibold">{nomeEtapa("nutricao")}</h3>
            <Pilula tom={emNutricao.length ? "info" : "neutro"}>{emNutricao.length}</Pilula>
          </header>
          {emNutricao.length ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{emNutricao.map((p) => cartao(p))}</div>
          ) : (
            <p className="px-1 pb-1 text-xs text-muted-foreground">Nenhum parceiro em nutrição.</p>
          )}
        </Zona>

        <Zona id={ZONA_PERDAS} ativo={podeEditar} className="rounded-[14px] border border-white/10 bg-card/60 p-3">
          <header className="mb-3 flex items-center justify-between gap-2 px-1">
            <h3 className="text-sm font-semibold">Perdas</h3>
            <span className="text-xs text-muted-foreground">
              {perdas.map((e) => `${e.nome}: ${lista.filter((p) => p.etapa === e.codigo).length}`).join(" · ")}
            </span>
          </header>
          {perdidos.length ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">{perdidos.map((p) => cartao(p, true))}</div>
          ) : (
            <p className="px-1 pb-1 text-xs text-muted-foreground">Nenhuma perda registrada.</p>
          )}
        </Zona>
      </div>

      <DragOverlay dropAnimation={null}>
        {arrastado ? (
          <div className="w-[248px] rotate-2 cursor-grabbing shadow-2xl">
            <CartaoFunil parceiro={arrastado} categoria={principal.get(arrastado.id)} passo={passoPor.get(arrastado.id)} podeEditar={false} />
          </div>
        ) : null}
      </DragOverlay>
      {troca.dialogos}
    </DndContext>
  );
}

// Coluna ou área que recebe cartões; destaca a borda quando um cartão está por cima
function Zona({ id, ativo, className, children }: { id: string; ativo: boolean; className: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !ativo });
  return (
    <section ref={setNodeRef} className={cn(className, "transition-colors", isOver && "border-menta-500/70 bg-menta-500/5")}>
      {children}
    </section>
  );
}

function CartaoArrastavel({ id, ativo, children }: { id: string; ativo: boolean; children: ReactNode }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id, disabled: !ativo });
  return (
    <div ref={setNodeRef} {...listeners} className={cn(ativo && "cursor-grab select-none", isDragging && "opacity-40")}>
      {children}
    </div>
  );
}

function CartaoFunil({
  parceiro: p, categoria, passo, podeEditar, etapaNome,
}: { parceiro: ParceiroLista; categoria?: string; passo?: ProximoPasso; podeEditar: boolean; etapaNome?: string }) {
  const vencido = passo?.estado === "vencido";
  return (
    <div className="min-w-0 rounded-[10px] border border-white/10 bg-card p-3">
      <Link to={`/app/parceiros/${p.id}`} draggable={false} className="block truncate font-semibold hover:text-menta-400 hover:underline">
        {p.nome_fantasia}
      </Link>
      {categoria && <p className="truncate text-xs text-muted-foreground">{categoria}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.nivel && <SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} />}
        <SeloStatus status={p.status_atividade} />
        {etapaNome && <Pilula tom="perigo">{etapaNome}</Pilula>}
      </div>
      {p.etapa === "nutricao" && p.nutricao_ate && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-sky-300">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" /> Retomada em {data(p.nutricao_ate)}
        </p>
      )}
      {passo && (
        <p className={cn("mt-2 flex items-start gap-1.5 text-xs", vencido ? "text-red-300" : "text-muted-foreground")}>
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-words">
            {data(passo.data)}{vencido ? " (vencido)" : ""}: {passo.descricao}
          </span>
        </p>
      )}
      {etapaNome && p.motivo_perda && <p className="mt-1 text-xs text-muted-foreground">{p.motivo_perda}</p>}
      {podeEditar && (
        <div className="mt-3">
          <SeletorEtapa parceiro={p} className="w-full text-xs" />
        </div>
      )}
    </div>
  );
}
