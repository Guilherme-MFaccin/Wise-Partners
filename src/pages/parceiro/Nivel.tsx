import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDashed, Info, Package } from "lucide-react";
import { data } from "@/lib/formato";
import { GRUPOS_REQUISITO, PACOTES, nomeNivel, rotulo } from "@/lib/rotulos";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula, SeloNivel } from "@/components/comum/Selos";
import { useMeuNivel, type CumpreNivel } from "@/components/portal/dadosV2";

const ORDEM_GRUPOS = ["resultado", "capacitacao", "regras"];

// Meu nível (FR-124): nível atual pelo nome, requisitos cumpridos e faltantes, nível acima,
// observação e pacote pendente. Nunca mostra notas internas, faixa nem maturidade.
export default function Nivel() {
  const q = useMeuNivel();
  if (q.isLoading) return <Carregando />;
  if (q.error || !q.data) return <ErroCarga erro={q.error ?? "Nível não encontrado."} />;
  const n = q.data;

  if (n.tipo !== "comercial") {
    return (
      <div className="space-y-6">
        <Cabecalho titulo="Meu nível" />
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível atual</p>
          <div className="mt-2"><SeloNivel tipo={n.tipo} nivel={n.nivel} className="text-sm" /></div>
          <p className="mt-3 text-sm text-muted-foreground">
            Na parceria institucional, o nível segue o que foi combinado no termo de parceria. Converse com o seu responsável na Wise sobre os próximos passos.
          </p>
        </section>
      </div>
    );
  }

  const nomeAcima = n.acima ? nomeNivel("comercial", n.acima.nivel) : null;

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Meu nível" descricao="O nível acompanha os resultados da parceria. Veja o que já está cumprido e o que falta." />

      <section className="grid gap-4 rounded-[14px] border border-white/10 bg-card p-4 sm:grid-cols-3 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível atual</p>
          <div className="mt-2">{n.nivel ? <SeloNivel tipo="comercial" nivel={n.nivel} className="px-3 py-1 text-sm" /> : <span className="text-sm">A definir</span>}</div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pacote</p>
          <p className="mt-2 font-semibold">{rotulo(PACOTES, n.pacote) || "A definir"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Situação</p>
          <div className="mt-2">
            {n.em_observacao_ate ? <Pilula tom="alerta">Em observação</Pilula>
              : n.atual?.cumpre ? <Pilula tom="menta">Requisitos em dia</Pilula>
              : <Pilula>Requisitos em andamento</Pilula>}
          </div>
        </div>
      </section>

      {n.em_observacao_ate && (
        <div className="flex gap-3 rounded-[14px] border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Na última revisão trimestral, alguns requisitos do nível {nomeNivel("comercial", n.nivel)} não foram cumpridos.
            O nível continua o mesmo, em observação até {data(n.em_observacao_ate)}. Cumprindo os requisitos abaixo até lá, a observação termina.
          </p>
        </div>
      )}

      {n.pacote_pendente && (
        <div className="flex gap-3 rounded-[14px] border border-white/10 bg-white/5 p-4 text-sm">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
          <p>
            Mudança de pacote programada: {rotulo(PACOTES, n.pacote_pendente)}
            {n.pacote_pendente_em ? `, a partir de ${data(n.pacote_pendente_em)}` : ""}. Até lá, as entregas do pacote atual continuam valendo.
          </p>
        </div>
      )}

      {n.atual && (
        <BlocoRequisitos titulo={`Requisitos do nível ${nomeNivel("comercial", n.atual.nivel)}`}
          descricao={n.atual.cumpre ? "Tudo em dia para manter o nível na próxima revisão." : "O que manter para seguir neste nível na revisão trimestral."}
          nivel={n.atual} />
      )}

      {n.acima ? (
        <BlocoRequisitos titulo={`Para chegar ao ${nomeAcima}`}
          descricao={n.acima.cumpre
            ? `Vocês já cumprem os requisitos do ${nomeAcima}. A subida é registrada pela Wise.`
            : `Ao cumprir todos os requisitos abaixo, a parceria sobe para o ${nomeAcima}. O pacote só muda se vocês escolherem um pacote superior.`}
          nivel={n.acima} destaque />
      ) : n.nivel === "A" ? (
        <div className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
          <p>Vocês estão no nível mais alto do programa. Mantenha os requisitos em dia para continuar no Elite.</p>
        </div>
      ) : null}

      <p className="flex gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          A revisão de nível é trimestral. Os requisitos completos estão em <Link to="/parceiro/regras" className="text-menta-400 hover:underline">Regras do programa</Link>.
        </span>
      </p>
    </div>
  );
}

function BlocoRequisitos({ titulo, descricao, nivel, destaque }: { titulo: string; descricao: string; nivel: CumpreNivel; destaque?: boolean }) {
  const grupos = ORDEM_GRUPOS.filter((g) => nivel.grupos?.[g]).map((g) => [g, nivel.grupos[g]] as const);
  return (
    <section className={`rounded-[14px] border bg-card p-4 sm:p-5 ${destaque ? "border-menta-500/30" : "border-white/10"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {destaque && <ArrowUpRight className="h-5 w-5 text-menta-400" />}
        <h2 className="font-semibold">{titulo}</h2>
        {nivel.cumpre && <Pilula tom="menta">Cumprido</Pilula>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {grupos.map(([g, info]) => (
          <li key={g} className="rounded-[10px] border border-white/10 p-3">
            <div className="flex items-center gap-2">
              {info.cumprido ? <CheckCircle2 className="h-4 w-4 shrink-0 text-menta-400" /> : <CircleDashed className="h-4 w-4 shrink-0 text-warning" />}
              <p className="text-sm font-semibold">{rotulo(GRUPOS_REQUISITO, g)}</p>
              <span className="ml-auto text-xs text-muted-foreground">{info.cumprido ? "Cumprido" : "Falta"}</span>
            </div>
            {info.descricao && <p className="mt-2 text-sm text-muted-foreground">{info.descricao}</p>}
            {!info.cumprido && info.faltante?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {info.faltante.map((f) => <li key={f} className="flex gap-2"><span className="text-warning">•</span><span>{f}</span></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
