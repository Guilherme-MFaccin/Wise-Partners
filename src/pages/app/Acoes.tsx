import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Lock, Pencil, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { nomePerfil, perfisInternos, usePerfis } from "@/components/parceiros/dados";
import {
  atrasada, chaveGrupo, concluida, encerrada, rotuloEstado, rotuloGrupo, useAcoesConjuntas,
  type AcaoConjunta, type Agrupamento,
} from "@/components/acoes/dados";
import { ConcluirAcaoDialog } from "@/components/acoes/ConcluirAcaoDialog";
import { EditarAcaoDialog } from "@/components/acoes/EditarAcaoDialog";
import { data as fmtData, hojeISO } from "@/lib/formato";
import { ESTADOS_ACAO_WISE, ESTADOS_CONTRAPARTIDA, PERIODICIDADES, TIPOS_ACAO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

const TODOS = "__todos";
type Filtros = { lado: string; estado: string; parceiro: string | null; responsavel: string; de: string; ate: string };

function inicioMes() {
  return hojeISO().slice(0, 8) + "01";
}
const FILTROS_PADRAO = (): Filtros => ({ lado: TODOS, estado: "abertas", parceiro: null, responsavel: TODOS, de: "", ate: "" });

type Tom = "neutro" | "menta" | "alerta" | "perigo" | "info";
function tomEstado(a: AcaoConjunta, hoje: string): Tom {
  if (atrasada(a, hoje)) return "perigo";
  if (concluida(a)) return "menta";
  if (a.estado === "enviada") return "info";
  if (a.estado === "recusada") return "alerta";
  return "neutro";
}

// Calendário geral das ações conjuntas: contrapartidas (lado do parceiro) e ações da Wise.
export default function Acoes() {
  const { perfil, isParcerias } = useAuth();
  const papel = perfil?.papel;
  if (papel && !["admin", "parcerias", "consultor"].includes(papel)) {
    return (
      <div>
        <Cabecalho titulo="Ações conjuntas" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> O calendário de ações é do time de parcerias e dos consultores.</span>
        </Vazio>
      </div>
    );
  }
  return <TelaAcoes podeEditar={isParcerias} />;
}

function TelaAcoes({ podeEditar }: { podeEditar: boolean }) {
  const consulta = useAcoesConjuntas();
  const { data: perfis = [] } = usePerfis();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [agrupar, setAgrupar] = useState<Agrupamento>("mes");
  const [concluir, setConcluir] = useState<AcaoConjunta | null>(null);
  const [editar, setEditar] = useState<AcaoConjunta | null>(null);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setFiltros((x) => ({ ...x, [k]: v }));
  const hoje = hojeISO();

  const todas = useMemo(() => consulta.data ?? [], [consulta.data]);

  const lista = useMemo(() => {
    const f = filtros;
    return todas
      .filter((a) => {
        if (f.lado !== TODOS && a.lado !== f.lado) return false;
        if (f.parceiro && a.parceiro_id !== f.parceiro) return false;
        if (f.responsavel !== TODOS && a.responsavel_id !== f.responsavel) return false;
        if (f.de && (!a.data_prevista || a.data_prevista < f.de)) return false;
        if (f.ate && (!a.data_prevista || a.data_prevista > f.ate)) return false;
        if (f.estado === "abertas") return !encerrada(a);
        if (f.estado === "atrasadas") return atrasada(a, hoje);
        if (f.estado === "concluidas") return concluida(a);
        if (f.estado.startsWith("wise:")) return a.lado === "wise" && a.estado === f.estado.slice(5);
        if (f.estado.startsWith("parceiro:")) return a.lado === "parceiro" && a.estado === f.estado.slice(9);
        return true;
      })
      .sort((a, b) => (a.data_prevista ?? "9999").localeCompare(b.data_prevista ?? "9999") || a.parceiro_nome.localeCompare(b.parceiro_nome));
  }, [todas, filtros, hoje]);

  const grupos = useMemo(() => {
    const m = new Map<string, AcaoConjunta[]>();
    for (const a of lista) {
      const k = chaveGrupo(a.data_prevista, agrupar);
      m.set(k, [...(m.get(k) ?? []), a]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [lista, agrupar]);

  const abertas = todas.filter((a) => !encerrada(a));
  const resumo = [
    { rotulo: "Ações da Wise em aberto", valor: abertas.filter((a) => a.lado === "wise").length },
    { rotulo: "Ações dos parceiros em aberto", valor: abertas.filter((a) => a.lado === "parceiro").length },
    { rotulo: "Atrasadas da Wise", valor: todas.filter((a) => a.lado === "wise" && atrasada(a, hoje)).length },
    { rotulo: "Atrasadas dos parceiros", valor: todas.filter((a) => a.lado === "parceiro" && atrasada(a, hoje)).length },
  ];

  const padrao = FILTROS_PADRAO();
  const temFiltro = JSON.stringify(filtros) !== JSON.stringify(padrao);

  return (
    <div>
      <Cabecalho
        titulo="Ações conjuntas"
        descricao="Calendário geral do plano de ações: as da Wise e as contrapartidas dos parceiros. Ações da Wise nunca contam como obrigação do parceiro."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {resumo.map((r) => <Indicador key={r.rotulo} rotulo={r.rotulo} valor={r.valor} />)}
      </div>

      <section className={cn(CLASSE_CARD, "mb-4 space-y-3 p-4")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Filtro rotulo="Lado">
            <Select value={filtros.lado} onValueChange={(v) => set("lado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Os dois lados</SelectItem>
                <SelectItem value="wise">Wise</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Estado">
            <Select value={filtros.estado} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="abertas">Em aberto</SelectItem>
                <SelectItem value="atrasadas">Atrasadas</SelectItem>
                <SelectItem value="concluidas">Concluídas</SelectItem>
                <SelectGroup>
                  <SelectLabel>Ações da Wise</SelectLabel>
                  {Object.entries(ESTADOS_ACAO_WISE).map(([k, v]) => <SelectItem key={k} value={`wise:${k}`}>{v}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Contrapartidas do parceiro</SelectLabel>
                  {Object.entries(ESTADOS_CONTRAPARTIDA).map(([k, v]) => <SelectItem key={k} value={`parceiro:${k}`}>{v}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Parceiro">
            <div className="flex gap-1">
              <ParceiroBusca valor={filtros.parceiro} onChange={(v) => set("parceiro", v)} placeholder="Todos" />
              {filtros.parceiro && (
                <Button variant="ghost" size="icon" aria-label="Limpar parceiro" onClick={() => set("parceiro", null)}><X /></Button>
              )}
            </div>
          </Filtro>
          <Filtro rotulo="Responsável">
            <Select value={filtros.responsavel} onValueChange={(v) => set("responsavel", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {perfisInternos(perfis).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Período (data prevista)">
            <div className="flex items-center gap-2">
              <Input type="date" aria-label="De" className="min-w-0" value={filtros.de} onChange={(e) => set("de", e.target.value)} />
              <span className="text-sm text-muted-foreground">a</span>
              <Input type="date" aria-label="Até" className="min-w-0" value={filtros.ate} onChange={(e) => set("ate", e.target.value)} />
            </div>
          </Filtro>
          <Filtro rotulo="Agrupar por">
            <Tabs value={agrupar} onValueChange={(v) => setAgrupar(v as Agrupamento)}>
              <TabsList className="w-full">
                <TabsTrigger value="mes" className="flex-1">Mês</TabsTrigger>
                <TabsTrigger value="semana" className="flex-1">Semana</TabsTrigger>
              </TabsList>
            </Tabs>
          </Filtro>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {lista.length} ação(ões)
            {!filtros.de && <button type="button" className="ml-2 text-menta-400 hover:underline" onClick={() => set("de", inicioMes())}>A partir deste mês</button>}
          </span>
          {temFiltro && <Button variant="ghost" size="sm" onClick={() => setFiltros(padrao)}><X /> Limpar filtros</Button>}
        </div>
        <p className="text-xs text-muted-foreground">
          Responsável: nas ações da Wise, quem conduz a ação; nas contrapartidas, o responsável pela parceria.
        </p>
      </section>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && lista.length === 0 && <Vazio titulo="Nenhuma ação encontrada">Ajuste os filtros para ver outras ações.</Vazio>}

      <div className="space-y-6">
        {grupos.map(([chave, itens]) => {
          const atrasadas = itens.filter((a) => atrasada(a, hoje)).length;
          return (
            <section key={chave}>
              <h2 className="mb-2 flex flex-wrap items-center gap-2 text-base font-semibold">
                <CalendarClock className="h-4 w-4 text-menta-400" /> {rotuloGrupo(chave, agrupar)}
                <span className="text-sm font-normal text-muted-foreground">{itens.length}</span>
                {atrasadas > 0 && <Pilula tom="perigo">{atrasadas} atrasada(s)</Pilula>}
              </h2>
              <ul className="space-y-2">
                {itens.map((a) => (
                  <ItemAcao
                    key={`${a.lado}-${a.id}`}
                    a={a}
                    hoje={hoje}
                    responsavel={nomePerfil(perfis, a.responsavel_id)}
                    podeEditar={podeEditar}
                    onConcluir={() => setConcluir(a)}
                    onEditar={() => setEditar(a)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <ConcluirAcaoDialog acao={concluir} onFechar={() => setConcluir(null)} />
      <EditarAcaoDialog acao={editar} onFechar={() => setEditar(null)} />
    </div>
  );
}

function ItemAcao({ a, hoje, responsavel, podeEditar, onConcluir, onEditar }: {
  a: AcaoConjunta; hoje: string; responsavel: string; podeEditar: boolean; onConcluir: () => void; onEditar: () => void;
}) {
  const atraso = atrasada(a, hoje);
  const res = a.resultado ?? {};
  const resultado = [
    res.alcance != null && `alcance ${res.alcance}`,
    res.inscritos != null && `${res.inscritos} inscritos`,
  ].filter(Boolean).join(" · ");
  return (
    <li className={cn(CLASSE_CARD, "flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-start", atraso && "border-destructive/50 bg-destructive/5")}>
      <div className="w-24 shrink-0 text-sm">
        <p className={cn("font-semibold", atraso && "text-red-300")}>{a.data_prevista ? fmtData(a.data_prevista) : "Sem data"}</p>
        {a.concluida_em && <p className="text-xs text-muted-foreground">feita em {fmtData(a.concluida_em)}</p>}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Pilula tom={a.lado === "wise" ? "menta" : "info"}>{a.lado === "wise" ? "Wise" : "Parceiro"}</Pilula>
          <span className="break-words font-medium">{a.nome}</span>
          <Pilula tom={tomEstado(a, hoje)}>{atraso && a.estado !== "atrasada" ? `${rotuloEstado(a)} · atrasada` : rotuloEstado(a)}</Pilula>
          {atraso && <AlertTriangle className="h-4 w-4 text-red-300" aria-label="Atrasada" />}
        </div>
        <p className="text-sm">
          <Link to={`/app/parceiros/${a.parceiro_id}?aba=acoes`} className="text-menta-400 hover:underline">{a.parceiro_nome}</Link>
        </p>
        <p className="text-xs text-muted-foreground">
          {[
            a.lado === "wise" ? rotulo(TIPOS_ACAO, a.tipo) : "Contrapartida",
            rotulo(PERIODICIDADES, a.periodicidade),
            responsavel && `Responsável: ${responsavel}`,
            a.comprovacao_esperada && `Comprovação: ${a.comprovacao_esperada}`,
          ].filter(Boolean).join(" · ")}
        </p>
        {(resultado || a.comprovacao_link || a.observacao) && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {resultado && <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-menta-400" /> {resultado}</span>}
            {a.comprovacao_link && (
              <a href={a.comprovacao_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-menta-400 hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Comprovação
              </a>
            )}
            {a.observacao && <span className="text-muted-foreground">{a.observacao}</span>}
          </p>
        )}
      </div>
      {podeEditar && a.lado === "wise" && !encerrada(a) && (
        <div className="flex flex-wrap gap-2 sm:flex-col">
          <Button size="sm" onClick={onConcluir}><CheckCircle2 /> Concluir</Button>
          <Button size="sm" variant="outline" onClick={onEditar}><Pencil /> Editar</Button>
        </div>
      )}
    </li>
  );
}

function Filtro({ rotulo: r, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">{r}</Label>
      {children}
    </div>
  );
}
