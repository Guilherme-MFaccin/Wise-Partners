import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlarmClock, BadgeCheck, CalendarCheck, Clock, FileSignature, FileText, Gauge, Handshake, Hourglass, Layers, ListOrdered,
  PauseCircle, Snowflake, Sparkles, TriangleAlert, Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula, SeloStatus } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Barra, Bloco, CLASSE_CARD, Indicador, ListaParceiros } from "@/components/painel/Blocos";
import { calcularPeriodo, SeletorPeriodo, type Periodo } from "@/components/painel/periodo";
import { normalizarPainel } from "@/components/painel/pauta";
import { PautaDialog } from "@/components/painel/PautaDialog";
import { data, minutosParaHoras, moeda } from "@/lib/formato";
import { ETAPAS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

// Painel semanal (História 3). Tudo vem de painel_semanal(), que respeita a RLS de quem consulta.
export default function Painel() {
  const { veComissao } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>(() => calcularPeriodo("7d"));
  const [pautaAberta, setPautaAberta] = useState(false);

  const consulta = useQuery({
    queryKey: ["painel", periodo.inicio, periodo.fim],
    queryFn: async () => {
      const { data: r, error } = await supabase.rpc("painel_semanal", { p_inicio: periodo.inicio, p_fim: periodo.fim });
      if (error) throw error;
      return r;
    },
  });
  const p = useMemo(() => (consulta.data ? normalizarPainel(consulta.data) : null), [consulta.data]);

  const periodoTexto = `${data(periodo.inicio)} a ${data(periodo.fim)}`;
  const linkPeriodo = `/app/indicacoes?de=${periodo.inicio}&ate=${periodo.fim}`;

  return (
    <div>
      <Cabecalho
        titulo="Painel"
        descricao="Indicadores para a reunião semanal do Wise Partners."
        acoes={
          <Button onClick={() => setPautaAberta(true)} disabled={!p}>
            <Sparkles /> Pauta da semana
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SeletorPeriodo valor={periodo} onChange={setPeriodo} />
        <p className="text-xs text-muted-foreground">Indicações, contratos, comissões e atividades do período: {periodoTexto}</p>
      </div>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}

      {p && (
        <div className="space-y-4">
          {/* Meta de assinados */}
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-menta-400" />
                <h2 className="font-semibold">Distância até a meta</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-bold text-foreground">{p.assinados}</span> de {p.meta_assinados} assinados
              </p>
            </div>
            <Barra valor={p.assinados} maximo={p.meta_assinados} className="mt-3 h-3" />
            <p className="mt-2 text-sm text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{Math.max(0, p.meta_assinados - p.assinados)}</span> parceiros assinados.
            </p>
          </section>

          {/* Funil */}
          <Funil funil={p.funil} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Bloco titulo="Aprovações pendentes do Diretor" icone={FileSignature} contagem={p.aprovacoes_pendentes.length}
              tom="alerta" link="/app/pendencias">
              <ListaParceiros vazio="Nenhuma aprovação pendente." linkMais="/app/pendencias"
                itens={p.aprovacoes_pendentes.map((a) => ({
                  chave: a.parceiro_id, parceiroId: a.parceiro_id, nome: a.parceiro, detalhe: `Em proposta com o decisor desde ${data(a.desde)}`,
                }))} />
            </Bloco>

            <Bloco titulo="Follow-ups vencidos" icone={AlarmClock} contagem={p.followups_vencidos.length} tom="perigo" link="/app/pendencias">
              <ListaParceiros vazio="Nenhum follow-up vencido." linkMais="/app/pendencias"
                itens={p.followups_vencidos.map((f) => ({
                  chave: f.id, parceiroId: f.parceiro_id, nome: f.parceiro, detalhe: `${data(f.data)} · ${f.descricao}`,
                }))} />
            </Bloco>

            <Bloco titulo="Parceiros esfriando" icone={Snowflake} contagem={p.esfriando.length} tom="alerta"
              descricao={p.sem_motivo_inatividade > 0
                ? <span className="text-warning">{p.sem_motivo_inatividade} sem motivo da inatividade registrado</span>
                : undefined}>
              <ListaParceiros vazio="Nenhum parceiro morno ou dormente."
                itens={p.esfriando.map((e) => ({
                  chave: e.parceiro_id, parceiroId: e.parceiro_id, nome: e.parceiro,
                  detalhe: e.motivo ? e.motivo : `Último contato: ${e.ultimo_contato ? data(e.ultimo_contato) : "nunca"}`,
                  aviso: (
                    <>
                      {!e.motivo?.trim() && <Pilula tom="perigo">Sem motivo</Pilula>}
                      <SeloStatus status={e.status} />
                    </>
                  ),
                }))} />
            </Bloco>

            <Bloco titulo="Negociações paradas" icone={PauseCircle} contagem={p.negociacoes_paradas.length} tom="alerta">
              <ListaParceiros vazio="Nenhuma negociação parada."
                itens={p.negociacoes_paradas.map((n) => ({
                  chave: n.parceiro_id, parceiroId: n.parceiro_id, nome: n.parceiro,
                  detalhe: `${rotulo(ETAPAS, n.etapa)} desde ${data(n.desde)}`,
                }))} />
            </Bloco>

            <Bloco titulo="Contrapartidas atrasadas" icone={TriangleAlert} contagem={p.contrapartidas_atrasadas.length} tom="alerta"
              descricao="Atraso gera alerta, nunca suspensão de entregas.">
              <ListaParceiros vazio="Nenhuma contrapartida atrasada."
                itens={p.contrapartidas_atrasadas.map((c) => ({
                  chave: c.id, parceiroId: c.parceiro_id, nome: c.parceiro,
                  detalhe: `${c.nome}${c.proxima_data ? ` · ${data(c.proxima_data)}` : ""}`,
                }))} />
            </Bloco>

            <Bloco titulo="Contratos assinados no período" icone={BadgeCheck} contagem={p.contratos_assinados.length} tom="menta">
              <ListaParceiros vazio="Nenhum contrato assinado no período."
                itens={p.contratos_assinados.map((c) => ({
                  chave: c.parceiro_id, parceiroId: c.parceiro_id, nome: c.parceiro, detalhe: `Assinado em ${data(c.data)}`,
                }))} />
            </Bloco>
          </div>

          {/* Indicações */}
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-menta-400" />
                <h2 className="font-semibold">Indicações do período</h2>
              </div>
              <Link to={linkPeriodo} className="text-sm text-menta-400 hover:underline">Ver indicações</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Indicador rotulo="Total" valor={p.indicacoes.total} link={linkPeriodo}
                detalhe={`${p.indicacoes.do_parceiro} recebidas · ${p.indicacoes.para_parceiro} enviadas`} />
              <Indicador rotulo="No ICP" valor={p.indicacoes.no_icp} detalhe={percentual(p.indicacoes.no_icp, p.indicacoes.total)} />
              <Indicador rotulo="Com reunião" valor={p.indicacoes.com_reuniao} detalhe={percentual(p.indicacoes.com_reuniao, p.indicacoes.total)} />
              <Indicador rotulo="Fechadas" valor={p.indicacoes.fechadas} detalhe={percentual(p.indicacoes.fechadas, p.indicacoes.total)} />
              <Indicador rotulo="Paradas há 30 dias" valor={p.indicacoes_paradas} link="/app/indicacoes?paradas=1" detalhe="Sem atualização" />
              <Indicador rotulo="Propostas de ficha" valor={p.propostas_ficha_pendentes} link="/app/pendencias" detalhe="Aguardando validação" />
            </div>
            {Object.keys(p.indicacoes.por_empresa).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por empresa do grupo</p>
                {Object.entries(p.indicacoes.por_empresa).map(([empresa, total]) => (
                  <div key={empresa} className="grid grid-cols-[minmax(0,7rem)_1fr_2rem] items-center gap-3 text-sm">
                    <span className="truncate">{empresa}</span>
                    <Barra valor={Number(total)} maximo={Math.max(1, p.indicacoes.total)} />
                    <span className="text-right font-semibold">{Number(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Comissões: só quem vê comissão recebe a chave preenchida */}
          {veComissao && p.comissoes && (
            <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-menta-400" />
                  <h2 className="font-semibold">Comissões</h2>
                </div>
                <Link to="/app/comissoes" className="text-sm text-menta-400 hover:underline">Ver comissões</Link>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Indicador rotulo="A pagar" valor={moeda(p.comissoes.a_pagar)} link="/app/comissoes" />
                <Indicador rotulo="Pagas no período" valor={moeda(p.comissoes.pagas_periodo)} />
                <Indicador rotulo="A receber" valor={moeda(p.comissoes.a_receber)} link="/app/comissoes?aba=receber" />
                <Indicador rotulo="Recebidas no período" valor={moeda(p.comissoes.recebidas_periodo)} />
              </div>
            </section>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Bloco titulo="Fila do Base Ativa" icone={ListOrdered} contagem={p.fila_base_ativa.length} link="/app/base-ativa">
              <ListaParceiros vazio="Fila vazia." linkMais="/app/base-ativa"
                itens={p.fila_base_ativa.map((f) => ({
                  chave: f.parceiro_id, parceiroId: f.parceiro_id, nome: `${f.posicao}º ${f.parceiro}`,
                  aviso: f.estrategico ? <Pilula tom="menta">Estratégico</Pilula> : undefined,
                }))} />
            </Bloco>

            <Bloco titulo="Categorias sem as 3 opções" icone={Layers} contagem={p.categorias_sem_3.length} tom="alerta"
              descricao="Categorias comerciais com menos de 3 parceiros assinados e com ficha publicada.">
              {p.categorias_sem_3.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todas as categorias têm 3 ou mais opções.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {p.categorias_sem_3.map((c) => (
                    <li key={c.categoria_id}>
                      <Link to={`/app/parceiros?categoria=${c.categoria_id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10">
                        {c.categoria} <span className="font-semibold text-warning">{c.assinados}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Bloco>

            <Bloco titulo="Atividades do período" icone={Clock} link="/app/atividades"
              contagem={p.atividades.reduce((s, a) => s + Number(a.quantidade ?? 0), 0)}
              descricao="Tempo estimado apenas informativo, sem limite de horas.">
              <Atividades atividades={p.atividades} />
            </Bloco>
          </div>
        </div>
      )}

      <PautaDialog aberto={pautaAberta} onOpenChange={setPautaAberta} painel={p} />
    </div>
  );
}

function percentual(parte: number, total: number) {
  if (!total) return "0% do total";
  return `${Math.round((parte / total) * 100)}% do total`;
}

function Funil({ funil }: { funil: { etapa: string; nome: string; perda: boolean; total: number }[] }) {
  const ativas = funil.filter((f) => !f.perda);
  const perdas = funil.filter((f) => f.perda);
  const maximo = Math.max(1, ...ativas.map((f) => Number(f.total)));
  return (
    <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
      <div className="mb-4 flex items-center gap-2">
        <Hourglass className="h-5 w-5 text-menta-400" />
        <h2 className="font-semibold">Funil por etapa</h2>
      </div>
      <div className="space-y-2">
        {ativas.map((f) => (
          <Link key={f.etapa} to={`/app/parceiros?etapa=${f.etapa}`}
            className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 rounded-[8px] px-1 py-0.5 text-sm hover:bg-white/5 sm:grid-cols-[12rem_1fr_3rem]">
            <span className="truncate">{f.nome}</span>
            <Barra valor={Number(f.total)} maximo={maximo} className="h-3" />
            <span className="text-right font-semibold">{f.total}</span>
          </Link>
        ))}
      </div>
      {perdas.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-xs text-muted-foreground">Perdas:</span>
          {perdas.map((f) => (
            <Link key={f.etapa} to={`/app/parceiros?etapa=${f.etapa}`}>
              <Pilula tom={f.total ? "perigo" : "neutro"}>{f.nome}: {f.total}</Pilula>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Atividades({ atividades }: { atividades: { tipo: string; quantidade: number; minutos: number }[] }) {
  if (!atividades.length) return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada no período.</p>;
  const ordenadas = [...atividades].sort((a, b) => Number(b.minutos) - Number(a.minutos));
  const maximo = Math.max(1, ...ordenadas.map((a) => Number(a.minutos)));
  const total = ordenadas.reduce((s, a) => s + Number(a.minutos ?? 0), 0);
  return (
    <div className="space-y-2">
      {ordenadas.map((a) => (
        <div key={a.tipo} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate">{a.tipo}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{a.quantidade} · {minutosParaHoras(a.minutos)}</span>
          </div>
          <Barra valor={Number(a.minutos)} maximo={maximo} className="mt-1 h-1.5" cor="bg-menta-500/60" />
        </div>
      ))}
      <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
        <CalendarCheck className="h-3.5 w-3.5" /> Tempo estimado total: {minutosParaHoras(total)}
      </p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" /> Detalhes por parceiro e por pessoa em Atividades.
      </p>
    </div>
  );
}
