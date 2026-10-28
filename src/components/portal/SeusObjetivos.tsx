import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, CircleDashed, Target } from "lucide-react";
import { data, hojeISO } from "@/lib/formato";
import { GRUPOS_REQUISITO, nomeNivel, rotulo } from "@/lib/rotulos";
import { Pilula } from "@/components/comum/Selos";
import { BarraMeta } from "@/components/metas/BlocoMetas";
import { MetaContrapartida } from "@/components/metas/MetaContrapartida";
import { cn } from "@/lib/utils";
import type { Contrapartida } from "./dados";
import { descricaoMarco, nomeMarco, useMarcosConfig, type Marco, type MeuNivel, type Plano } from "./dadosV2";

const ORDEM_GRUPOS = ["resultado", "capacitacao", "regras"];

// "Seus objetivos" (revisão de metas de 28/10/2026): um só quadro com o que o parceiro precisa fazer agora.
// Nos primeiros 90 dias, os marcos do onboarding; depois, os requisitos do próximo nível. Sempre, as contrapartidas com meta.
export function SeusObjetivos({ plano, marcos, nivel, contrapartidas }: {
  plano: Plano | null | undefined; marcos: Marco[]; nivel: MeuNivel | undefined; contrapartidas: Contrapartida[];
}) {
  const { data: cfg } = useMarcosConfig();
  const hoje = hojeISO();
  const emOnboarding = plano?.situacao === "em_andamento";
  const comMeta = contrapartidas.filter((c) => c.meta_quantidade !== null && c.meta_quantidade !== undefined);
  const alvo = nivel?.tipo === "comercial" ? (nivel.acima ?? nivel.atual) : null;
  const subir = !!nivel?.acima;

  if (!emOnboarding && !alvo && comMeta.length === 0) return null;

  return (
    <section className="rounded-[14px] border border-menta-500/25 bg-card p-4 sm:p-5" aria-labelledby="t-objetivos">
      <h2 id="t-objetivos" className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-menta-400" /> Seus objetivos</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {emOnboarding ? "Primeiros 90 dias: cumprir os marcos deixa a parceria ativa." : "O que falta para o próximo passo da parceria."}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {emOnboarding ? (
          <Bloco titulo="Onboarding" link={{ to: "/parceiro/onboarding", texto: "Ver o plano de 90 dias" }}>
            <ProgressoContagem feitos={marcos.filter((m) => m.cumprido_em).length} total={marcos.length} rotulo="itens do plano cumpridos" />
            <ul className="mt-3 space-y-2">
              {marcos.filter((m) => m.tipo.startsWith("marco_")).map((m) => {
                const vencido = !m.cumprido_em && m.prazo < hoje;
                return (
                  <li key={m.id} className="flex gap-2">
                    {m.cumprido_em ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                      <span className={cn("font-medium", m.cumprido_em && "text-muted-foreground")}>{nomeMarco(cfg, m.tipo)}</span>
                      {!m.cumprido_em && <span className="block text-xs text-muted-foreground">{descricaoMarco(cfg, m.tipo)}</span>}
                    </span>
                    <span className={cn("shrink-0 text-xs", vencido ? "text-warning" : "text-muted-foreground")}>
                      {m.cumprido_em ? "feito" : vencido ? `venceu ${data(m.prazo)}` : `até ${data(m.prazo)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Bloco>
        ) : alvo ? (
          <Bloco titulo={subir ? `Para chegar ao ${nomeNivel("comercial", alvo.nivel)}` : `Para manter o ${nomeNivel("comercial", alvo.nivel)}`}
            link={{ to: "/parceiro/nivel", texto: "Ver meu nível" }}>
            {alvo.cumpre && <Pilula tom="menta" className="mb-2">{subir ? "Requisitos cumpridos" : "Em dia"}</Pilula>}
            <ul className="space-y-2">
              {ORDEM_GRUPOS.filter((g) => alvo.grupos?.[g]).map((g) => {
                const info = alvo.grupos[g];
                return (
                  <li key={g} className="flex gap-2">
                    {info.cumprido ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-warning" />}
                    <span className="min-w-0">
                      <span className="font-medium">{rotulo(GRUPOS_REQUISITO, g)}</span>
                      {!info.cumprido && info.faltante?.map((f) => <span key={f} className="block text-xs text-muted-foreground">{f}</span>)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {nivel?.resultado && (
              <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                Indicações qualificadas e clientes no perfil da Wise: {nivel.resultado.qualificadas_janela} e {nivel.resultado.clientes_janela} nos
                últimos {nivel.resultado.janela_dias} dias; {nivel.resultado.qualificadas_trimestre} e {nivel.resultado.clientes_trimestre} neste trimestre.
              </p>
            )}
          </Bloco>
        ) : null}

        {comMeta.length > 0 && (
          <Bloco titulo="Contrapartidas com meta" link={{ to: "/parceiro/acoes", texto: "Ver ações conjuntas" }}>
            <ul className="space-y-3">
              {comMeta.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <MetaContrapartida c={{ ...c, meta: null }} className="mt-1" />
                </li>
              ))}
            </ul>
          </Bloco>
        )}
      </div>
    </section>
  );
}

function ProgressoContagem({ feitos, total, rotulo: r }: { feitos: number; total: number; rotulo: string }) {
  return (
    <div>
      <p className="text-sm tabular-nums"><span className="font-semibold">{feitos} de {total}</span> <span className="text-muted-foreground">{r}</span></p>
      <BarraMeta valor={feitos} meta={Math.max(total, 1)} className="mt-1.5" />
    </div>
  );
}

function Bloco({ titulo, link, children }: { titulo: string; link: { to: string; texto: string }; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-[10px] bg-white/5 p-3 sm:p-4">
      <h3 className="mb-2 text-sm font-semibold">{titulo}</h3>
      <div className="flex-1 text-sm">{children}</div>
      <Link to={link.to} className="mt-3 inline-flex items-center gap-1 self-start text-sm text-menta-400 hover:underline">{link.texto} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </div>
  );
}
