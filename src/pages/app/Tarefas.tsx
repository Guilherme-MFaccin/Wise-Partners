import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlarmClock, ArrowRight, BadgeCheck, CalendarClock, CalendarX, Check, ClipboardCheck, FileSignature, FileText, Gavel, HeartPulse,
  Loader2, MessageCircle, Receipt, RefreshCw, Rocket, Stethoscope, TimerOff, TrendingDown, UserPlus, Wallet, X, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Fila de exceções (P-09): o banco entrega a fila pronta (fila_tarefas); a tela filtra, agrupa por urgência e resolve.
type Tarefa = {
  chave: string; tipo: string; grupo: "decidir" | "responder" | "acompanhar"; prioridade: number; titulo: string; detalhe: string | null;
  parceiro_id: string | null; parceiro: string | null; responsavel_id: string | null; responsavel: string | null;
  desde: string | null; prazo: string | null; ref_id: string; link: string;
};

const GRUPOS = [
  { id: "todas", rotulo: "Todas" },
  { id: "decidir", rotulo: "Decidir" },
  { id: "responder", rotulo: "Responder" },
  { id: "acompanhar", rotulo: "Acompanhar" },
] as const;

const ICONES: Record<string, LucideIcon> = {
  assinatura: FileSignature, desligamento: Gavel, rebaixamento: TrendingDown, comprovacao: ClipboardCheck, ficha: FileText,
  atualizacao_indicacao: RefreshCw, candidato: UserPlus, diagnostico: Stethoscope, sla: TimerOff, indicacao_parada: MessageCircle,
  checagem: BadgeCheck, comissao: Wallet, proximo_passo: AlarmClock, tarefa_onboarding: CalendarClock, onboarding_parado: Rocket,
  negociacao_parada: Receipt, cadencia: CalendarX, acao_wise: CalendarClock, contrapartida: CalendarX, em_risco: HeartPulse,
};

// Só o Diretor decide assinatura e desligamento: para ele, essas tarefas são "minhas" mesmo sem ser o responsável do parceiro
const DO_DIRETOR = new Set(["assinatura", "desligamento"]);

function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function Quando({ t, hoje }: { t: Tarefa; hoje: string }) {
  if (t.prazo) {
    const d = diasEntre(hoje, t.prazo);
    if (d < 0) return <span className="font-semibold text-red-300">Atrasada há {-d} {-d === 1 ? "dia" : "dias"}</span>;
    if (d === 0) return <span className="font-semibold text-warning">Vence hoje</span>;
    return <span>Vence em {data(t.prazo)}</span>;
  }
  if (t.desde) {
    const d = diasEntre(t.desde, hoje);
    return <span>{d <= 0 ? "Desde hoje" : `Há ${d} ${d === 1 ? "dia" : "dias"}`}</span>;
  }
  return null;
}

export default function Tarefas() {
  const { perfil, isParcerias } = useAuth();
  const hoje = hojeISO();
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]["id"]>("todas");
  const [escopo, setEscopo] = useState<"minhas" | "todas">(isParcerias && perfil?.papel !== "admin" ? "minhas" : "todas");

  const fila = useQuery({
    queryKey: ["tarefas"],
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("fila_tarefas" as any);
      if (error) throw error;
      return (r ?? []) as Tarefa[];
    },
    refetchOnWindowFocus: true,
  });

  const minha = (t: Tarefa) => t.responsavel_id === perfil?.id || t.responsavel_id === null || (!!perfil?.is_diretor && DO_DIRETOR.has(t.tipo));
  const noEscopo = useMemo(() => (fila.data ?? []).filter((t) => escopo === "todas" || minha(t)), [fila.data, escopo, perfil?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const contagem = (g: string) => (g === "todas" ? noEscopo.length : noEscopo.filter((t) => t.grupo === g).length);
  const lista = noEscopo.filter((t) => grupo === "todas" || t.grupo === grupo);

  // Agora: o que trava alguém ou o que é de prioridade média e já venceu. Esta semana: o resto da prioridade média. Quando der: o que só pede atenção.
  const urgente = (t: Tarefa) => t.prioridade === 1 || (t.prioridade === 2 && !!t.prazo && t.prazo < hoje);
  const blocos = [
    { id: "agora", titulo: "Agora", itens: lista.filter(urgente) },
    { id: "semana", titulo: "Esta semana", itens: lista.filter((t) => !urgente(t) && t.prioridade === 2) },
    { id: "depois", titulo: "Quando der", itens: lista.filter((t) => !urgente(t) && t.prioridade >= 3) },
  ].filter((b) => b.itens.length > 0);

  return (
    <div>
      <Cabecalho titulo="Tarefas" descricao="O que fugiu da regra e precisa de alguém da Wise hoje? O que segue a regra não aparece aqui." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Tipo de tarefa" className="flex gap-1 overflow-x-auto rounded-[10px] border border-white/10 bg-card p-1 [scrollbar-width:none]">
          {GRUPOS.map((g) => (
            <button key={g.id} type="button" role="tab" aria-selected={grupo === g.id} onClick={() => setGrupo(g.id)}
              className={cn("flex min-h-9 shrink-0 items-center gap-2 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white",
                grupo === g.id && "bg-white/10 text-white")}>
              {g.rotulo}
              <span className="tabular-nums text-xs text-neutro-300">{fila.isSuccess ? contagem(g.id) : ""}</span>
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="De quem" className="flex shrink-0 gap-1 rounded-[10px] border border-white/10 bg-card p-1">
          {(["minhas", "todas"] as const).map((e) => (
            <button key={e} type="button" role="radio" aria-checked={escopo === e} onClick={() => setEscopo(e)}
              className={cn("min-h-9 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", escopo === e && "bg-white/10 text-white")}>
              {e === "minhas" ? "Minhas" : "De todos"}
            </button>
          ))}
        </div>
      </div>

      {fila.isLoading && <Carregando texto="Montando a fila..." />}
      {fila.error && <ErroCarga erro={fila.error} />}
      {fila.isSuccess && lista.length === 0 && (
        <div className="rounded-[14px] border border-white/10 bg-card px-6 py-12 text-center">
          <Check className="mx-auto h-8 w-8 text-menta-400" aria-hidden />
          <p className="mt-3 font-semibold">{noEscopo.length === 0 ? "Nada fugiu da regra." : "Nada neste filtro."}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {noEscopo.length === 0 && escopo === "minhas" && (fila.data?.length ?? 0) > 0
              ? `Há ${fila.data!.length} ${fila.data!.length === 1 ? "tarefa" : "tarefas"} de outras pessoas em "De todos".`
              : "Quando algo atrasar ou esperar uma decisão, aparece aqui com o que fazer."}
          </p>
        </div>
      )}

      <div className="space-y-8">
        {blocos.map((b) => (
          <section key={b.id} aria-labelledby={`bloco-${b.id}`}>
            <h2 id={`bloco-${b.id}`} className="mb-2 flex items-baseline gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-neutro-300">
              {b.titulo} <span className="tabular-nums">{b.itens.length}</span>
            </h2>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-[14px] border border-white/10 bg-card">
              {b.itens.map((t) => <LinhaTarefa key={t.chave} t={t} hoje={hoje} />)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LinhaTarefa({ t, hoje }: { t: Tarefa; hoje: string }) {
  const Icone = ICONES[t.tipo] ?? AlarmClock;
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          t.grupo === "decidir" ? "bg-menta-500/10 text-menta-400" : t.grupo === "responder" ? "bg-warning/10 text-warning" : "bg-white/5 text-neutro-300")}>
          <Icone className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{t.titulo}</p>
          <p className="mt-0.5 break-words text-sm text-neutro-300">
            {t.parceiro_id && t.parceiro && (
              <><Link to={`/app/parceiros/${t.parceiro_id}`} className="text-foreground hover:text-menta-400">{t.parceiro}</Link>{t.detalhe ? " · " : ""}</>
            )}
            {t.detalhe}
          </p>
          <p className="mt-1 text-xs text-neutro-300">
            <Quando t={t} hoje={hoje} />{t.responsavel ? ` · ${t.responsavel}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-11 sm:pl-0">
        <Acoes t={t} />
      </div>
    </li>
  );
}

// Ações que se resolvem na própria fila; o resto abre o lugar certo (ficha, indicação, candidato, diagnóstico)
function Acoes({ t }: { t: Tarefa }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");

  const resolver = useMutation({
    mutationFn: async (acao: "concluir" | "validar" | "recusar" | "aprovar") => {
      let r: { error: any };
      if (t.tipo === "proximo_passo") r = await supabase.from("proximos_passos").update({ estado: "feito" }).eq("id", t.ref_id);
      else if (t.tipo === "tarefa_onboarding") r = await supabase.from("tarefas_onboarding").update({ feita: true, feita_em: new Date().toISOString() }).eq("id", t.ref_id);
      else if (t.tipo === "comprovacao") {
        r = await supabase.from("comprovacoes").update(acao === "validar" ? { estado: "validada" } : { estado: "recusada", motivo_recusa: motivo.trim() }).eq("id", t.ref_id);
      } else if (t.tipo === "assinatura") {
        r = await supabase.from("aprovacoes").insert({ parceiro_id: t.ref_id, tipo: "assinatura", aprovado_por: perfil!.id, observacao: null });
      } else return;
      if (r.error) throw r.error;
    },
    onSuccess: (_d, acao) => {
      toast.success(acao === "recusar" ? "Comprovação recusada. O parceiro foi avisado." : acao === "aprovar" ? "Assinatura aprovada." : "Feito.");
      setRecusando(false);
      qc.invalidateQueries({ queryKey: ["tarefas"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: toastErro,
  });
  const ocupado = resolver.isPending;
  const girando = ocupado ? <Loader2 className="animate-spin" /> : null;

  if (t.tipo === "comprovacao" && recusando) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-72">
        <Input autoFocus placeholder="Motivo da recusa" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo da recusa" />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" disabled={!motivo.trim() || ocupado} onClick={() => resolver.mutate("recusar")}>{girando}Recusar</Button>
          <Button size="sm" variant="ghost" onClick={() => setRecusando(false)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  const abrir = (
    <Button asChild size="sm" variant="outline">
      <Link to={t.link}>Abrir <ArrowRight /></Link>
    </Button>
  );
  if (t.tipo === "proximo_passo" || t.tipo === "tarefa_onboarding") {
    return <>{abrir}<Button size="sm" disabled={ocupado} onClick={() => resolver.mutate("concluir")}>{girando ?? <Check />}Concluir</Button></>;
  }
  if (t.tipo === "comprovacao") {
    return (
      <>
        {abrir}
        <Button size="sm" variant="outline" disabled={ocupado} onClick={() => { setMotivo(""); setRecusando(true); }}><X /> Recusar</Button>
        <Button size="sm" disabled={ocupado} onClick={() => resolver.mutate("validar")}>{girando ?? <Check />}Validar</Button>
      </>
    );
  }
  if (t.tipo === "assinatura" && perfil?.is_diretor) {
    return <>{abrir}<Button size="sm" disabled={ocupado} onClick={() => resolver.mutate("aprovar")}>{girando ?? <Check />}Aprovar</Button></>;
  }
  return abrir;
}
