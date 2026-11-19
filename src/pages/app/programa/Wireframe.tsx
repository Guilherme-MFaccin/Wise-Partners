import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleHelp, Monitor } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SECOES_INTERNAS, SECOES_PARCEIRO, type Aba } from "@/lib/navegacao";
import { AJUSTES, AREAS, JORNADAS, TELAS, type Area, type Bloco, type Passo, type Tela } from "@/lib/wireframe";
import { cn } from "@/lib/utils";

// Wireframe do portal (P-60): mapa, jornadas, o desenho de cada tela e o que foi ajustado para não contradizer o to-be.
// Os dados ficam em src/lib/wireframe.ts; as seções e abas vêm de src/lib/navegacao.ts (as mesmas do menu).
const ABAS = [
  { id: "mapa", rotulo: "Mapa do portal" },
  { id: "jornadas", rotulo: "Jornadas" },
  { id: "telas", rotulo: "Telas" },
  { id: "coerencia", rotulo: "Coerência" },
] as const;
type AbaId = (typeof ABAS)[number]["id"];

const porRota = new Map(TELAS.map((t) => [t.rota, t]));
const porId = new Map(TELAS.map((t) => [t.id, t]));
const ORDEM_AREAS: Area[] = ["publica", "acesso", "interna", "parceiro"];

export default function Wireframe() {
  const [params, setParams] = useSearchParams();
  const aba = (ABAS.some((a) => a.id === params.get("aba")) ? params.get("aba") : "mapa") as AbaId;
  const telaId = params.get("tela") ?? TELAS[0].id;
  const ir = (a: AbaId, tela?: string) => {
    setParams(tela ? { aba: a, tela } : { aba: a }, { replace: false });
    window.scrollTo({ top: 0 });
  };
  const corrigidos = AJUSTES.filter((x) => x.situacao === "corrigido").length;

  return (
    <div>
      <Cabecalho titulo="Wireframe do portal"
        descricao={`Como o portal está organizado, que caminho cada pessoa faz e o que cada tela mostra? ${TELAS.length} telas, ${JORNADAS.length} jornadas e ${corrigidos} ajustes de coerência com o to-be.`} />
      <div role="tablist" aria-label="Partes do wireframe" className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-white/10 bg-card p-1 [scrollbar-width:none]">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => ir(a.id)}
            className={cn("min-h-9 shrink-0 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", aba === a.id && "bg-white/10 text-white")}>
            {a.rotulo}
          </button>
        ))}
      </div>
      {aba === "mapa" && <Mapa abrir={(id) => ir("telas", id)} />}
      {aba === "jornadas" && <Jornadas abrir={(id) => ir("telas", id)} />}
      {aba === "telas" && <Telas telaId={telaId} escolher={(id) => ir("telas", id)} />}
      {aba === "coerencia" && <Coerencia />}
    </div>
  );
}

// ---------------------------------------------------------------- mapa
function Mapa({ abrir }: { abrir: (id: string) => void }) {
  const Item = ({ rotulo, tela }: { rotulo: string; tela?: Tela }) => (
    <li>
      <button type="button" disabled={!tela} onClick={() => tela && abrir(tela.id)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-[8px] px-2 text-left text-sm text-neutro-100 hover:bg-white/5 disabled:cursor-default disabled:text-neutro-300 disabled:hover:bg-transparent">
        <span className="min-w-0 truncate">{rotulo}</span>
        {tela && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutro-300" aria-hidden />}
      </button>
    </li>
  );
  const Secoes = ({ secoes }: { secoes: { id: string; rotulo: string; abas: Aba[] }[] }) => (
    <div className="space-y-4">
      {secoes.map((s) => (
        <div key={s.id}>
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.08em] text-menta-400">{s.rotulo}</p>
          <ul className="mt-1">{s.abas.map((a) => <Item key={a.to} rotulo={a.rotulo} tela={porRota.get(a.to)} />)}</ul>
        </div>
      ))}
    </div>
  );
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ORDEM_AREAS.map((area) => (
        <section key={area} className="rounded-[14px] border border-white/10 bg-card p-4" aria-labelledby={`area-${area}`}>
          <h2 id={`area-${area}`} className="font-semibold">{AREAS[area].nome}</h2>
          <p className="mt-1 text-sm text-neutro-300">{AREAS[area].descricao}</p>
          <div className="mt-4">
            {area === "interna" ? <Secoes secoes={SECOES_INTERNAS} />
              : area === "parceiro" ? <Secoes secoes={SECOES_PARCEIRO} />
              : <ul>{TELAS.filter((t) => t.area === area).map((t) => <Item key={t.id} rotulo={t.nome} tela={t} />)}</ul>}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- jornadas
const TOM_ATOR: Record<Passo["quem"], string> = {
  Candidato: "bg-sky-500/15 text-sky-300", Parceiro: "bg-menta-500/15 text-menta-300", "Cliente do parceiro": "bg-warning/15 text-warning",
  Wise: "bg-white/10 text-neutro-100", Portal: "bg-violet-500/15 text-violet-300", "Cliente da Wise": "bg-warning/15 text-warning",
};

function Jornadas({ abrir }: { abrir: (id: string) => void }) {
  return (
    <div className="space-y-6">
      {JORNADAS.map((j) => (
        <section key={j.id} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5" aria-labelledby={`jornada-${j.id}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={`jornada-${j.id}`} className="text-lg font-semibold">{j.nome}</h2>
            <p className="text-xs tabular-nums text-neutro-300">{j.processos.join(", ")}</p>
          </div>
          <p className="mt-1 text-sm text-neutro-300">{j.resumo}</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {j.passos.map((p, i) => {
              const t = p.tela ? porId.get(p.tela) : undefined;
              return (
                <li key={i} className="flex flex-col gap-2 rounded-[10px] border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-bold tabular-nums">{i + 1}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", TOM_ATOR[p.quem])}>{p.quem}</span>
                  </div>
                  <p className="text-sm leading-snug">{p.texto}</p>
                  {t && (
                    <button type="button" onClick={() => abrir(t.id)} className="mt-auto inline-flex items-center gap-1 self-start text-xs text-menta-400 hover:underline">
                      <Monitor className="h-3.5 w-3.5" aria-hidden /> {t.nome}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- telas
function secaoDa(t: Tela) {
  const lista = t.area === "interna" ? SECOES_INTERNAS : t.area === "parceiro" ? SECOES_PARCEIRO : [];
  return lista.find((s) => s.abas.some((a) => a.to === t.rota || (t.rota.startsWith(a.to + "/") && a.to !== "/app" && a.to !== "/parceiro")));
}

function Telas({ telaId, escolher }: { telaId: string; escolher: (id: string) => void }) {
  const tela = porId.get(telaId);
  const grupos = useMemo(() => ORDEM_AREAS.map((a) => ({ area: a, telas: TELAS.filter((t) => t.area === a) })), []);
  if (!tela) return <Vazio titulo="Tela não encontrada">Escolha outra tela na lista.</Vazio>;
  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="mb-4 lg:hidden">
        <Select value={tela.id} onValueChange={escolher}>
          <SelectTrigger aria-label="Escolher tela"><SelectValue /></SelectTrigger>
          <SelectContent>
            {grupos.map((g) => (
              <SelectGroup key={g.area}>
                <SelectLabel>{AREAS[g.area].nome}</SelectLabel>
                {g.telas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav aria-label="Telas" className="hidden max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[14px] border border-white/10 bg-card p-2 lg:sticky lg:top-20 lg:block">
        {grupos.map((g) => (
          <div key={g.area} className="mb-2">
            <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutro-300">{AREAS[g.area].nome}</p>
            {g.telas.map((t) => (
              <button key={t.id} type="button" onClick={() => escolher(t.id)} aria-current={t.id === tela.id ? "page" : undefined}
                className={cn("block min-h-9 w-full truncate rounded-[8px] px-2 text-left text-sm text-neutro-300 hover:bg-white/5 hover:text-white",
                  t.id === tela.id && "bg-menta-500/10 text-menta-400 hover:bg-menta-500/10 hover:text-menta-400")}>
                {t.nome}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="min-w-0 space-y-4">
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{tela.nome}</h2>
            <Pilula>{AREAS[tela.area].nome}</Pilula>
          </div>
          <p className="mt-1 text-sm text-menta-300">{tela.pergunta}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-neutro-300">Endereço</dt><dd className="break-all font-mono text-xs">{tela.rota}</dd></div>
            <div><dt className="text-xs text-neutro-300">Quem usa</dt><dd>{tela.quem}</dd></div>
            <div><dt className="text-xs text-neutro-300">Processos</dt><dd className="tabular-nums">{tela.processos.join(", ")}</dd></div>
          </dl>
          {tela.nota && <p className="mt-3 border-l-2 border-menta-500/50 pl-3 text-sm text-neutro-100">{tela.nota}</p>}
        </section>
        <Moldura tela={tela} />
        <p className="text-xs text-neutro-300">Toda tela com dados tem os estados carregando, vazio, erro e sem permissão.</p>
      </div>
    </div>
  );
}

// Desenho de baixa fidelidade: a moldura da área (menu e abas para as áreas logadas) e os blocos da tela
function Moldura({ tela }: { tela: Tela }) {
  const secao = secaoDa(tela);
  const lista = tela.area === "interna" ? SECOES_INTERNAS : tela.area === "parceiro" ? SECOES_PARCEIRO : null;
  return (
    <figure className="overflow-hidden rounded-[14px] border border-white/15 bg-background" aria-label={`Wireframe da tela ${tela.nome}`}>
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-3 min-w-0 truncate rounded-full bg-white/5 px-3 py-0.5 font-mono text-[11px] text-neutro-300">partners.wisemakers.com.br{tela.rota.startsWith("/") ? tela.rota : ""}</span>
      </div>
      <div className={cn("grid", lista && "md:grid-cols-[150px_minmax(0,1fr)]")}>
        {lista && (
          <div className="hidden border-r border-white/10 p-3 md:block" aria-hidden>
            <div className="mb-4 h-4 w-20 rounded bg-white/10" />
            {lista.map((s) => (
              <div key={s.id} className={cn("mb-1 truncate rounded px-2 py-1.5 text-[11px]", s.id === secao?.id ? "bg-menta-500/15 text-menta-300" : "text-neutro-300")}>{s.rotulo}</div>
            ))}
          </div>
        )}
        <div className="min-w-0 p-3 sm:p-4">
          {secao && secao.abas.length > 1 && (
            <div className="mb-3 flex gap-3 overflow-hidden border-b border-white/10 text-[11px]" aria-hidden>
              {secao.abas.map((a) => (
                <span key={a.to} className={cn("shrink-0 border-b-2 border-transparent pb-1.5 text-neutro-300", porRota.get(a.to)?.id === tela.id && "border-menta-500 text-white")}>{a.rotulo}</span>
              ))}
            </div>
          )}
          {tela.area !== "publica" && (
            <div className="mb-3">
              <div className="text-base font-bold">{tela.nome}</div>
              <div className="text-[11px] text-neutro-300">{tela.pergunta}</div>
            </div>
          )}
          <div className="grid grid-cols-12 gap-2">
            {tela.blocos.map((bl, i) => <BlocoWire key={i} bloco={bl} />)}
          </div>
        </div>
      </div>
    </figure>
  );
}

const SPAN: Record<number, string> = { 12: "col-span-12", 8: "col-span-12 md:col-span-8", 6: "col-span-12 md:col-span-6", 4: "col-span-12 md:col-span-4" };
const ROTULO_TIPO: Record<Bloco["tipo"], string> = {
  topo: "Topo", abas: "Abas", filtros: "Filtros", indicadores: "Números", lista: "Lista", tabela: "Tabela", cartoes: "Cartões", formulario: "Formulário",
  grafico: "Gráfico", texto: "Texto", acoes: "Ações", passos: "Passos", video: "Vídeo", kanban: "Quadro", calendario: "Calendário", editor: "Editor",
};

function BlocoWire({ bloco }: { bloco: Bloco }) {
  const itens = bloco.itens ?? [];
  const horizontal = ["indicadores", "cartoes", "passos", "kanban", "filtros"].includes(bloco.tipo);
  return (
    <div className={cn(SPAN[bloco.largura ?? 12], "min-w-0 rounded-[8px] border border-dashed border-white/20 bg-white/[0.02] p-2.5")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-semibold">{bloco.rotulo}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-neutro-300">{ROTULO_TIPO[bloco.tipo]}</span>
      </div>
      {bloco.tipo === "video" ? (
        <div className="mt-2 flex aspect-video items-center justify-center rounded bg-white/5 text-[11px] text-neutro-300">vídeo</div>
      ) : bloco.tipo === "grafico" ? (
        <div className="mt-2 flex h-20 items-end gap-1" aria-hidden>{[40, 65, 50, 80, 60, 90, 70].map((h, i) => <span key={i} className="flex-1 rounded-t bg-white/10" style={{ height: `${h}%` }} />)}</div>
      ) : itens.length > 0 ? (
        <ul className={cn("mt-2 gap-1.5", horizontal ? "flex flex-wrap" : "space-y-1.5")}>
          {itens.map((t) => (
            <li key={t} className={cn("rounded bg-white/5 px-2 py-1 text-[11px] leading-snug text-neutro-100", horizontal && "min-w-0 flex-1 basis-28")}>{t}</li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 space-y-1.5" aria-hidden>
          <div className="h-2 w-11/12 rounded bg-white/10" /><div className="h-2 w-3/4 rounded bg-white/10" /><div className="h-2 w-2/3 rounded bg-white/10" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- coerência
function Coerencia() {
  const grupos = [
    { id: "corrigido", titulo: "Corrigido no portal", icone: CheckCircle2, itens: AJUSTES.filter((x) => x.situacao === "corrigido") },
    { id: "decisao", titulo: "Depende de decisão sua", icone: CircleHelp, itens: AJUSTES.filter((x) => x.situacao === "decisao") },
  ];
  return (
    <div className="space-y-8">
      <p className="max-w-[72ch] text-sm text-neutro-300">Onde o portal contradizia os processos do to-be ou o canvas, e o que mudou. Cada item cita o processo ou o bloco do canvas que serviu de base.</p>
      {grupos.map((g) => (
        <section key={g.id} aria-labelledby={`coerencia-${g.id}`}>
          <h2 id={`coerencia-${g.id}`} className="mb-3 flex items-center gap-2 font-semibold">
            <g.icone className={cn("h-4 w-4", g.id === "corrigido" ? "text-menta-400" : "text-warning")} aria-hidden /> {g.titulo}
            <span className="tabular-nums text-sm font-normal text-neutro-300">{g.itens.length}</span>
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {g.itens.map((x) => (
              <li key={x.tema} className="rounded-[14px] border border-white/10 bg-card p-4">
                <p className="font-semibold">{x.tema}</p>
                <dl className="mt-2 space-y-2 text-sm">
                  <div><dt className="text-xs text-neutro-300">Antes</dt><dd>{x.antes}</dd></div>
                  <div><dt className="text-xs text-neutro-300">{x.situacao === "corrigido" ? "Agora" : "O que falta"}</dt><dd>{x.agora}</dd></div>
                  <div><dt className="text-xs text-neutro-300">Base</dt><dd className="text-neutro-300">{x.base}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
