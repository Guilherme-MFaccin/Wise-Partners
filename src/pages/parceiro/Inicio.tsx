import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, CalendarCheck, CheckCircle2, Circle, ExternalLink, FileSearch, Flag, Handshake, ListChecks, Mail, Megaphone, MessageSquareHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { MARCOS_ONBOARDING, PACOTES, nomeNivel, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { SeloNivel } from "@/components/comum/Selos";
import { estadoContrapartida, useMeuParceiro, useMeusRfps, useMinhasContrapartidas, useParametro } from "@/components/portal/dados";
import {
  DESCRICAO_MARCOS, adicionarDias, useAcoesWise, useMeuNivel, useMeusComunicados, useMinhaPesquisa, usePlanoOnboarding,
} from "@/components/portal/dadosV2";

export default function Inicio() {
  const { perfil } = useAuth();
  const parceiroQ = useMeuParceiro();
  const p = parceiroQ.data;
  const contrapartidasQ = useMinhasContrapartidas();
  const rfpsQ = useMeusRfps();
  const hubQ = useParametro<string>("wise_hub_url");
  const nivelQ = useMeuNivel();
  const onboardingQ = usePlanoOnboarding();
  const acoesWiseQ = useAcoesWise();
  const comunicadosQ = useMeusComunicados();
  const pesquisaQ = useMinhaPesquisa();

  const responsavelQ = useQuery({
    enabled: !!p?.responsavel_id,
    queryKey: ["portal-responsavel", p?.responsavel_id],
    queryFn: async () => ok<any>(await supabase.from("perfis").select("nome, email").eq("id", p!.responsavel_id).maybeSingle()) as { nome: string; email: string } | null,
  });
  const pacoteQ = useQuery({
    enabled: !!p?.pacote,
    queryKey: ["pacote", p?.pacote],
    queryFn: async () => ok<any>(await supabase.from("pacotes").select("codigo, nome, entregas, wise_hub").eq("codigo", p!.pacote).maybeSingle()) as
      { codigo: string; nome: string; entregas: string[]; wise_hub: boolean } | null,
  });
  const tarefasQ = useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-tarefas", perfil?.parceiro_id],
    queryFn: async () => ok<any>(await supabase.from("tarefas_onboarding").select("id, descricao, prazo, feita")
      .eq("parceiro_id", perfil!.parceiro_id).order("prazo")) as { id: string; descricao: string; prazo: string; feita: boolean }[],
  });
  const indicacoesQ = useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-indicacoes-contagem", perfil?.parceiro_id],
    queryFn: async () => {
      const { count, error } = await supabase.from("indicacoes").select("id", { count: "exact", head: true }).eq("parceiro_id", perfil!.parceiro_id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (parceiroQ.isLoading) return <Carregando />;
  if (parceiroQ.error || !p) return <ErroCarga erro={parceiroQ.error ?? "Parceria não encontrada."} />;

  const assinado = !!p.data_assinatura;
  const estados = (contrapartidasQ.data ?? []).map(estadoContrapartida);
  const pendentes = estados.filter((e) => e.codigo === "pendente" || e.codigo === "recusada").length;
  const atrasadas = estados.filter((e) => e.codigo === "atrasada").length;
  // Wise Hub: só pacotes que incluem o Hub (B e A), e só depois da assinatura
  const hubUrl = typeof hubQ.data === "string" ? hubQ.data.trim() : "";
  const mostraHub = assinado && !!pacoteQ.data?.wise_hub && !!hubUrl;
  const tarefas = tarefasQ.data ?? [];

  // Próximo nível: o que falta, pelo nome do nível (nunca letras)
  const nivel = nivelQ.data;
  const faltaAcima = nivel?.acima && !nivel.acima.cumpre
    ? Object.values(nivel.acima.grupos ?? {}).flatMap((g) => (g.cumprido ? [] : g.faltante ?? []))
    : [];
  // Onboarding: próximo item do plano enquanto não houve ativação
  const plano = onboardingQ.data?.plano;
  const proximoMarco = plano && plano.situacao === "em_andamento" ? (onboardingQ.data?.marcos ?? []).find((m) => !m.cumprido_em) : undefined;
  // Ações da semana: atrasadas e previstas para os próximos 7 dias, dos dois lados
  const hoje = hojeISO();
  const limite = adicionarDias(hoje, 7);
  const acoesSemana = [
    ...(contrapartidasQ.data ?? [])
      .filter((c) => { const e = estadoContrapartida(c).codigo; return (e === "pendente" || e === "atrasada" || e === "recusada") && !!c.proxima_data && c.proxima_data <= limite; })
      .map((c) => ({ id: c.id, nome: c.nome, data: c.proxima_data!, lado: "Sua empresa", atrasada: c.proxima_data! < hoje })),
    ...(acoesWiseQ.data ?? [])
      .filter((a) => (a.estado === "planejada" || a.estado === "atrasada") && !!a.data_prevista && a.data_prevista <= limite)
      .map((a) => ({ id: a.id, nome: a.nome, data: a.data_prevista!, lado: "Wise", atrasada: a.data_prevista! < hoje })),
  ].sort((a, b) => a.data.localeCompare(b.data));
  const naoLidos = (comunicadosQ.data ?? []).filter((l) => !l.lido_em && l.comunicado);
  const pesquisaPendente = assinado && pesquisaQ.isSuccess && !pesquisaQ.data;

  return (
    <div className="space-y-6">
      <Cabecalho titulo={`Olá, ${perfil?.nome?.split(" ")[0] ?? ""}`} descricao={`Portal Wise Partners de ${p.nome_fantasia}`}
        acoes={mostraHub && (
          <Button asChild>
            <a href={hubUrl} target="_blank" rel="noreferrer"><ExternalLink /> Acessar o Wise Hub</a>
          </Button>
        )} />

      {!assinado && (
        <div className="rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm">
          A parceria ainda está em conversa. As entregas da Wise começam depois da assinatura do contrato.
        </div>
      )}

      <section className="grid gap-4 rounded-[14px] border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <Info titulo="Parceria">{p.nome_fantasia}</Info>
        <Info titulo="Nível"><SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} /></Info>
        <Info titulo="Pacote">{p.tipo_parceria === "institucional" ? "Parceria institucional" : rotulo(PACOTES, p.pacote) || "A definir"}</Info>
        <Info titulo="Início">{assinado ? data(p.data_assinatura) : "Após a assinatura"}</Info>
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsável na Wise</p>
          {responsavelQ.data ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold">{responsavelQ.data.nome}</span>
              <a href={`mailto:${responsavelQ.data.email}`} className="inline-flex items-center gap-1 break-all text-sm text-menta-400 hover:underline">
                <Mail className="h-4 w-4 shrink-0" /> {responsavelQ.data.email}
              </a>
            </p>
          ) : <p className="mt-1 text-sm text-muted-foreground">A definir</p>}
        </div>
      </section>

      {pesquisaPendente && (
        <Link to="/parceiro/pesquisa" className="flex items-center gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm transition-colors hover:border-menta-500/60">
          <MessageSquareHeart className="h-5 w-5 shrink-0 text-menta-400" />
          <span className="min-w-0 flex-1"><span className="font-semibold">Pesquisa de satisfação do trimestre.</span> Conte como está a parceria; leva menos de 1 minuto.</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-menta-400" />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {nivel && nivel.tipo === "comercial" && nivel.nivel && (
          <Painel icone={Award} titulo={`Nível ${nomeNivel("comercial", nivel.nivel)}`} to="/parceiro/nivel" link="Ver meu nível">
            {nivel.em_observacao_ate && (
              <p className="mb-2 text-warning">Em observação até {data(nivel.em_observacao_ate)}.</p>
            )}
            {nivel.acima ? (
              nivel.acima.cumpre ? (
                <p>Vocês já cumprem os requisitos do {nomeNivel("comercial", nivel.acima.nivel)}.</p>
              ) : (
                <>
                  <p className="text-muted-foreground">Para chegar ao {nomeNivel("comercial", nivel.acima.nivel)}, falta:</p>
                  <ul className="mt-2 space-y-1">
                    {faltaAcima.slice(0, 4).map((f) => <li key={f} className="flex gap-2"><span className="text-warning">•</span><span>{f}</span></li>)}
                  </ul>
                </>
              )
            ) : (
              <p className="text-muted-foreground">
                {nivel.atual?.cumpre ? "Nível mais alto do programa, com os requisitos em dia." : "Nível mais alto do programa. Veja o que manter em dia para a próxima revisão."}
              </p>
            )}
          </Painel>
        )}
        {proximoMarco && (
          <Painel icone={Flag} titulo="Próximo passo do onboarding" to="/parceiro/onboarding" link="Ver o plano de 90 dias">
            <p className="font-semibold">{rotulo(MARCOS_ONBOARDING, proximoMarco.tipo)}</p>
            <p className={proximoMarco.prazo < hoje ? "text-warning" : "text-muted-foreground"}>
              {proximoMarco.prazo < hoje ? "Venceu em" : "Até"} {data(proximoMarco.prazo)}
            </p>
            <p className="mt-1 text-muted-foreground">{DESCRICAO_MARCOS[proximoMarco.tipo]}</p>
          </Painel>
        )}
        <Painel icone={CalendarCheck} titulo="Ações da semana" to="/parceiro/acoes" link="Ver ações conjuntas">
          {acoesSemana.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma ação atrasada ou prevista para os próximos 7 dias.</p>
          ) : (
            <ul className="space-y-2">
              {acoesSemana.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-2">
                  <span className="min-w-0 flex-1">{a.nome} <span className="text-xs text-muted-foreground">· {a.lado}</span></span>
                  <span className={`shrink-0 text-xs ${a.atrasada ? "text-warning" : "text-muted-foreground"}`}>{a.atrasada ? "atrasada" : data(a.data)}</span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
        <Painel icone={Megaphone} titulo={naoLidos.length ? `Comunicados não lidos (${naoLidos.length})` : "Comunicados"} to="/parceiro/comunicados" link="Ver comunicados">
          {naoLidos.length === 0 ? (
            <p className="text-muted-foreground">Tudo lido por aqui.</p>
          ) : (
            <ul className="space-y-2">
              {naoLidos.slice(0, 3).map((l) => (
                <li key={l.comunicado_id} className="flex gap-2">
                  <span className="min-w-0 flex-1 font-semibold">{l.comunicado!.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{data(l.enviado_em)}</span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Contador to="/parceiro/acoes" icone={ListChecks} titulo="Contrapartidas"
          valor={`${pendentes} pendentes`} detalhe={atrasadas ? `${atrasadas} atrasadas` : "Nenhuma atrasada"} />
        <Contador to="/parceiro/indicacoes" icone={Handshake} titulo="Indicações" valor={String(indicacoesQ.data ?? 0)} detalhe="feitas e recebidas" />
        <Contador to="/parceiro/rfps" icone={FileSearch} titulo="Pedidos de RFP" valor={String(rfpsQ.data?.length ?? 0)} detalhe="em que vocês foram apresentados" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Entregas da Wise no seu pacote</h2>
          {p.tipo_parceria === "institucional" ? (
            <p className="mt-2 text-sm text-muted-foreground">As entregas da parceria institucional seguem o calendário de ações combinado com a Wise.</p>
          ) : pacoteQ.data?.entregas?.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {pacoteQ.data.entregas.map((e) => (
                <li key={e} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> {e}</li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-muted-foreground">O pacote ainda não foi definido.</p>}
          {!assinado && <p className="mt-3 text-xs text-muted-foreground">As entregas começam depois da assinatura.</p>}
        </section>
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Primeiros passos</h2>
          {tarefas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {assinado ? "Nenhuma tarefa de início pendente." : "As tarefas de início aparecem aqui depois da assinatura."}
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {tarefas.map((t) => (
                <li key={t.id} className="flex gap-2">
                  {t.feita ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className={t.feita ? "text-muted-foreground line-through" : ""}>{t.descricao}</span>
                  {!t.feita && <span className="ml-auto shrink-0 text-xs text-muted-foreground">até {data(t.prazo)}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
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

function Painel({ icone: Icone, titulo, to, link, children }: { icone: any; titulo: string; to: string; link: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Icone className="h-4 w-4 text-menta-400" /> {titulo}</h2>
      <div className="mt-3 flex-1 text-sm">{children}</div>
      <Link to={to} className="mt-3 inline-flex items-center gap-1 self-start text-sm text-menta-400 hover:underline">{link} <ArrowRight className="h-3.5 w-3.5" /></Link>
    </section>
  );
}

function Contador({ to, icone: Icone, titulo, valor, detalhe }: { to: string; icone: any; titulo: string; valor: string; detalhe: string }) {
  return (
    <Link to={to} className="rounded-[14px] border border-white/10 bg-card p-4 transition-colors hover:border-menta-500/40">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icone className="h-4 w-4 text-menta-400" /> {titulo}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      <p className="text-xs text-muted-foreground">{detalhe}</p>
    </Link>
  );
}
