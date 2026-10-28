import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, Flag, PartyPopper, Users } from "lucide-react";
import { data, hojeISO } from "@/lib/formato";
import { SITUACOES_ONBOARDING, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ACAO_MARCOS, descricaoMarco, nomeMarco, useMarcosConfig, usePlanoOnboarding, type Marco, type MarcoConfig } from "@/components/portal/dadosV2";

// Plano de onboarding em 90 dias (Apêndice F), só leitura: encontros, marcos e o que fazer agora.
export default function Onboarding() {
  const q = usePlanoOnboarding();
  const { data: cfg } = useMarcosConfig();
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const plano = q.data?.plano;
  const marcos = q.data?.marcos ?? [];
  if (!plano) {
    return (
      <div>
        <Cabecalho titulo="Onboarding" />
        <Vazio titulo="Sem plano de onboarding">O plano de 90 dias aparece aqui quando a parceria comercial entra em onboarding.</Vazio>
      </div>
    );
  }

  const hoje = hojeISO();
  const total = marcos.length || 1;
  const feitos = marcos.filter((m) => m.cumprido_em).length;
  const proximo = marcos.find((m) => !m.cumprido_em);
  const prazoFinal = plano.estendido_ate ?? plano.prazo_final;

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Onboarding" descricao="O que falta para a parceria ficar ativa? O plano dos primeiros 90 dias: quatro encontros com a Wise e três marcos." />

      <section className="grid gap-4 rounded-[14px] border border-white/10 bg-card p-4 sm:grid-cols-4 sm:p-5">
        <Info titulo="Situação">
          <Pilula tom={plano.situacao === "ativado" ? "menta" : plano.situacao === "nao_ativado" ? "alerta" : "info"}>
            {rotulo(SITUACOES_ONBOARDING, plano.situacao)}
          </Pilula>
        </Info>
        <Info titulo="Início">{data(plano.inicio)}</Info>
        <Info titulo={plano.estendido_ate ? "Prazo estendido" : "Prazo"}>{data(prazoFinal)}</Info>
        <Info titulo="Progresso">{feitos} de {marcos.length}</Info>
        <div className="sm:col-span-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-menta-500 transition-all" style={{ width: `${Math.round((feitos / total) * 100)}%` }} />
          </div>
        </div>
      </section>

      {plano.situacao === "ativado" ? (
        <div className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" />
          <p>Parceria ativada{plano.ativado_em ? ` em ${data(plano.ativado_em)}` : ""}: a primeira indicação no perfil de cliente da Wise virou reunião. Parabéns!</p>
        </div>
      ) : proximo ? (
        <section className="rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-menta-400">O que fazer agora</p>
          <p className="mt-1 font-semibold">{nomeMarco(cfg, proximo.tipo)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{descricaoMarco(cfg, proximo.tipo)}</p>
          <p className="mt-2 text-sm">
            {proximo.prazo < hoje ? <span className="text-warning">Prazo vencido em {data(proximo.prazo)}.</span> : <>Até {data(proximo.prazo)}.</>}
            {proximo.tipo.startsWith("encontro_") && " O seu responsável na Wise agenda o encontro com vocês."}
          </p>
          {ACAO_MARCOS[proximo.tipo] && (
            <Button asChild size="sm" className="mt-3">
              <Link to={ACAO_MARCOS[proximo.tipo]!.to}>{ACAO_MARCOS[proximo.tipo]!.texto} <ArrowRight /></Link>
            </Button>
          )}
        </section>
      ) : null}

      {plano.situacao === "nao_ativado" && (
        <p className="rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
          O prazo do onboarding terminou sem a primeira indicação que virou reunião. Converse com o seu responsável na Wise para retomar.
        </p>
      )}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Plano de 90 dias</h2>
        <ol className="mt-4 space-y-0">
          {marcos.map((m, i) => <ItemMarco key={m.id} m={m} cfg={cfg} hoje={hoje} ultimo={i === marcos.length - 1} />)}
        </ol>
        {plano.estendido_ate && (
          <p className="mt-4 text-sm text-muted-foreground">O plano foi estendido até {data(plano.estendido_ate)} para a ativação.</p>
        )}
      </section>
    </div>
  );
}

function ItemMarco({ m, cfg, hoje, ultimo }: { m: Marco; cfg: MarcoConfig[] | undefined; hoje: string; ultimo: boolean }) {
  const encontro = m.tipo.startsWith("encontro_");
  const vencido = !m.cumprido_em && m.prazo < hoje;
  const Icone = m.cumprido_em ? CheckCircle2 : encontro ? Users : Flag;
  return (
    <li className="relative flex gap-3 pb-5">
      {!ultimo && <span className="absolute left-[11px] top-7 h-[calc(100%-1.5rem)] w-px bg-white/10" aria-hidden />}
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${m.cumprido_em ? "bg-menta-500/15 text-menta-400" : "bg-white/5 text-muted-foreground"}`}>
        {m.cumprido_em ? <Icone className="h-4 w-4" /> : encontro ? <Users className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold ${m.cumprido_em ? "text-muted-foreground" : ""}`}>{nomeMarco(cfg, m.tipo)}</p>
          {m.cumprido_em ? <Pilula tom="menta">Cumprido em {data(m.cumprido_em)}</Pilula>
            : vencido ? <Pilula tom="alerta">Vencido</Pilula> : null}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> até {data(m.prazo)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{descricaoMarco(cfg, m.tipo)}</p>
      </div>
    </li>
  );
}

function Info({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{titulo}</p>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}
