import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlarmClock, Check, ClipboardCheck, ExternalLink, FileSignature, FileText, ListTodo, Loader2, Lock, RefreshCw, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { AtualizacaoPendente } from "@/components/indicacoes/AtualizacaoPendente";
import { SELECT_INDICACAO, type Indicacao } from "@/components/indicacoes/dados";
import { toastErro } from "@/lib/erros";
import { data, dataHora, hojeISO } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Caixa de entrada do time de parcerias: tudo o que espera ação de alguém da Wise.
export default function Pendencias() {
  const { isParcerias } = useAuth();
  if (!isParcerias) {
    return (
      <div>
        <Cabecalho titulo="Pendências" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> Esta área é do time de parcerias e dos administradores.</span>
        </Vazio>
      </div>
    );
  }
  return (
    <div>
      <Cabecalho titulo="Pendências" descricao="Aprovações, validações e prazos que aguardam ação da Wise." />
      <div className="space-y-6">
        <Aprovacoes />
        <PropostasFicha />
        <Comprovacoes />
        <AtualizacoesIndicacao />
        <TarefasOnboarding />
        <PassosVencidos />
      </div>
    </div>
  );
}

function Secao({ titulo, icone: Icone, total, carregando, erro, vazio, children }: {
  titulo: string; icone: any; total: number; carregando: boolean; erro: any; vazio: string; children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 font-semibold">
        <Icone className="h-4 w-4 text-menta-400" /> {titulo}
        <Pilula tom={total ? "alerta" : "neutro"}>{total}</Pilula>
      </h2>
      {carregando ? <Carregando /> : erro ? <ErroCarga erro={erro} /> : total === 0
        ? <p className={cn(CLASSE_CARD, "p-4 text-sm text-muted-foreground")}>{vazio}</p>
        : <ul className="space-y-2">{children}</ul>}
    </section>
  );
}

function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <li className={cn(CLASSE_CARD, "p-4 text-sm", className)}>{children}</li>;
}

function LinkParceiro({ id, nome, aba }: { id: string; nome?: string | null; aba?: string }) {
  return (
    <Link to={`/app/parceiros/${id}${aba ? `?aba=${aba}` : ""}`} className="font-semibold hover:text-menta-400">
      {nome ?? "Parceiro"}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Aprovações de assinatura: só o Diretor aprova (a RLS também exige)
// ---------------------------------------------------------------------------
function Aprovacoes() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const [obs, setObs] = useState<Record<string, string>>({});

  const consulta = useQuery({
    queryKey: ["pendencias", "aprovacoes"],
    queryFn: async () => {
      const { data: parceiros, error } = await supabase
        .from("parceiros")
        .select("id, nome_fantasia, etapa_desde, responsavel:perfis!parceiros_responsavel_id_fkey(nome)")
        .eq("etapa", "proposta_decisor")
        .order("etapa_desde");
      if (error) throw error;
      const ids = (parceiros ?? []).map((p) => p.id);
      if (!ids.length) return [];
      const { data: aprovadas, error: e2 } = await supabase.from("aprovacoes").select("parceiro_id").eq("tipo", "assinatura").in("parceiro_id", ids);
      if (e2) throw e2;
      const jaAprovados = new Set((aprovadas ?? []).map((a) => a.parceiro_id));
      return (parceiros ?? []).filter((p) => !jaAprovados.has(p.id)) as unknown as
        { id: string; nome_fantasia: string; etapa_desde: string; responsavel: { nome: string } | null }[];
    },
  });

  const diretor = useQuery({
    queryKey: ["diretor"],
    enabled: !perfil?.is_diretor,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: r } = await supabase.from("perfis").select("nome").eq("is_diretor", true).eq("ativo", true).limit(1).maybeSingle();
      return (r?.nome as string | undefined)?.split(" ")[0] ?? null;
    },
  });

  const aprovar = useMutation({
    mutationFn: async (parceiroId: string) => {
      const { error } = await supabase.from("aprovacoes").insert({
        parceiro_id: parceiroId, tipo: "assinatura", aprovado_por: perfil!.id, observacao: obs[parceiroId]?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Assinatura aprovada. O parceiro pode seguir para fechamento.");
      qc.invalidateQueries({ queryKey: ["pendencias", "aprovacoes"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: toastErro,
  });

  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Aprovações de assinatura pendentes" icone={FileSignature} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhum parceiro aguardando aprovação.">
      {lista.map((p) => (
        <Cartao key={p.id}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <LinkParceiro id={p.id} nome={p.nome_fantasia} />
              <p className="text-muted-foreground">
                Em proposta com o decisor desde {data(p.etapa_desde)}{p.responsavel?.nome ? ` · ${p.responsavel.nome}` : ""}
              </p>
            </div>
            {!perfil?.is_diretor && <Pilula tom="alerta">Aguardando {diretor.data ?? "o Diretor"}</Pilula>}
          </div>
          {perfil?.is_diretor && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Observação (opcional)" value={obs[p.id] ?? ""} onChange={(e) => setObs({ ...obs, [p.id]: e.target.value })} />
              <Button disabled={aprovar.isPending} onClick={() => aprovar.mutate(p.id)}>
                {aprovar.isPending && aprovar.variables === p.id ? <Loader2 className="animate-spin" /> : <Check />} Aprovar assinatura
              </Button>
            </div>
          )}
        </Cartao>
      ))}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Propostas de alteração da ficha feitas pelo parceiro: revisão na própria ficha
// ---------------------------------------------------------------------------
function PropostasFicha() {
  const consulta = useQuery({
    queryKey: ["pendencias", "propostas-ficha"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("propostas_ficha")
        .select("id, parceiro_id, created_at, parceiro:parceiros(nome_fantasia), autor:perfis!propostas_ficha_proposta_por_fkey(nome)")
        .eq("estado", "pendente")
        .order("created_at");
      if (error) throw error;
      return (r ?? []) as unknown as { id: string; parceiro_id: string; created_at: string; parceiro: { nome_fantasia: string } | null; autor: { nome: string } | null }[];
    },
  });
  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Propostas de ficha pendentes" icone={FileText} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhuma proposta de ficha aguardando revisão.">
      {lista.map((p) => (
        <Cartao key={p.id} className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <LinkParceiro id={p.parceiro_id} nome={p.parceiro?.nome_fantasia} aba="ficha" />
            <p className="text-muted-foreground">Enviada {p.autor?.nome ? `por ${p.autor.nome} ` : ""}em {dataHora(p.created_at)}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/app/parceiros/${p.parceiro_id}?aba=ficha`}>Revisar <ExternalLink /></Link>
          </Button>
        </Cartao>
      ))}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Comprovações de contrapartida enviadas: validar ou recusar com motivo
// ---------------------------------------------------------------------------
type ComprovacaoPendente = {
  id: string; parceiro_id: string; link: string | null; caminho: string | null; observacao: string | null; created_at: string;
  contrapartida: { nome: string } | null; parceiro: { nome_fantasia: string } | null; autor: { nome: string } | null;
};

function Comprovacoes() {
  const qc = useQueryClient();
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const consulta = useQuery({
    queryKey: ["pendencias", "comprovacoes"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("comprovacoes")
        .select("id, parceiro_id, link, caminho, observacao, created_at, contrapartida:contrapartidas(nome), parceiro:parceiros(nome_fantasia), autor:perfis!comprovacoes_enviada_por_fkey(nome)")
        .eq("estado", "enviada")
        .order("created_at");
      if (error) throw error;
      return (r ?? []) as unknown as ComprovacaoPendente[];
    },
  });

  const decidir = useMutation({
    mutationFn: async ({ id, validar }: { id: string; validar: boolean }) => {
      const alteracoes = validar ? { estado: "validada" } : { estado: "recusada", motivo_recusa: motivo.trim() };
      const { error } = await supabase.from("comprovacoes").update(alteracoes).eq("id", id);
      if (error) throw error;
      return validar;
    },
    onSuccess: (validar) => {
      toast.success(validar ? "Comprovação validada." : "Comprovação recusada. O parceiro foi avisado.");
      setRecusando(null);
      setMotivo("");
      qc.invalidateQueries({ queryKey: ["pendencias", "comprovacoes"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: toastErro,
  });

  async function abrirArquivo(caminho: string) {
    const { data: r, error } = await supabase.storage.from("comprovacoes").createSignedUrl(caminho, 600);
    if (error || !r?.signedUrl) return toastErro(error ?? new Error("Arquivo indisponível."));
    window.open(r.signedUrl, "_blank", "noopener");
  }

  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Comprovações aguardando validação" icone={ClipboardCheck} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhuma comprovação aguardando validação.">
      {lista.map((c) => (
        <Cartao key={c.id}>
          <LinkParceiro id={c.parceiro_id} nome={c.parceiro?.nome_fantasia} aba="contrapartidas" />
          <p className="break-words">{c.contrapartida?.nome}</p>
          <p className="text-muted-foreground">Enviada {c.autor?.nome ? `por ${c.autor.nome} ` : ""}em {dataHora(c.created_at)}</p>
          {c.observacao && <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{c.observacao}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {c.link && (
              <Button asChild size="sm" variant="outline">
                <a href={c.link} target="_blank" rel="noreferrer"><ExternalLink /> Abrir link</a>
              </Button>
            )}
            {c.caminho && <Button size="sm" variant="outline" onClick={() => abrirArquivo(c.caminho!)}><FileText /> Abrir arquivo</Button>}
          </div>
          {recusando === c.id ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input autoFocus placeholder="Motivo da recusa" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="destructive" disabled={!motivo.trim() || decidir.isPending} onClick={() => decidir.mutate({ id: c.id, validar: false })}>
                  Recusar
                </Button>
                <Button variant="ghost" onClick={() => { setRecusando(null); setMotivo(""); }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={decidir.isPending} onClick={() => decidir.mutate({ id: c.id, validar: true })}><Check /> Validar</Button>
              <Button size="sm" variant="outline" onClick={() => { setRecusando(c.id); setMotivo(""); }}><X /> Recusar</Button>
            </div>
          )}
        </Cartao>
      ))}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Atualizações de indicações recebidas feitas pelo parceiro
// ---------------------------------------------------------------------------
function AtualizacoesIndicacao() {
  const consulta = useQuery({
    queryKey: ["pendencias", "indicacoes"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("indicacoes")
        .select(SELECT_INDICACAO)
        .not("atualizacao_pendente", "is", null)
        .order("atualizacao_em");
      if (error) throw error;
      return (r ?? []) as unknown as Indicacao[];
    },
  });
  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Atualizações de indicação para confirmar" icone={RefreshCw} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhuma atualização de indicação aguardando confirmação.">
      {lista.map((i) => (
        <Cartao key={i.id} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link to={`/app/indicacoes?id=${i.id}`} className="font-semibold hover:text-menta-400">{i.cliente?.razao_social}</Link>
            <span className="text-muted-foreground">{i.parceiro?.nome_fantasia} · {i.empresa?.nome}</span>
          </div>
          <AtualizacaoPendente indicacao={i} podeConfirmar />
        </Cartao>
      ))}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Tarefas de onboarding em aberto
// ---------------------------------------------------------------------------
function TarefasOnboarding() {
  const qc = useQueryClient();
  const hoje = hojeISO();
  const consulta = useQuery({
    queryKey: ["pendencias", "onboarding"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("tarefas_onboarding")
        .select("id, descricao, prazo, parceiro_id, parceiro:parceiros(nome_fantasia), responsavel:perfis!tarefas_onboarding_responsavel_id_fkey(nome)")
        .eq("feita", false)
        .order("prazo");
      if (error) throw error;
      return (r ?? []) as unknown as { id: string; descricao: string; prazo: string; parceiro_id: string; parceiro: { nome_fantasia: string } | null; responsavel: { nome: string } | null }[];
    },
  });
  const concluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarefas_onboarding").update({ feita: true, feita_em: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa concluída.");
      qc.invalidateQueries({ queryKey: ["pendencias", "onboarding"] });
    },
    onError: toastErro,
  });
  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Tarefas de onboarding abertas" icone={ListTodo} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhuma tarefa de onboarding em aberto.">
      {lista.map((t) => (
        <Cartao key={t.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <LinkParceiro id={t.parceiro_id} nome={t.parceiro?.nome_fantasia} />
            <p className="break-words">{t.descricao}</p>
            <p className="text-muted-foreground">
              Prazo {data(t.prazo)}{t.responsavel?.nome ? ` · ${t.responsavel.nome}` : ""}{" "}
              {t.prazo < hoje && <Pilula tom="perigo">Atrasada</Pilula>}
            </p>
          </div>
          <Button size="sm" variant="outline" disabled={concluir.isPending} onClick={() => concluir.mutate(t.id)}><Check /> Concluir</Button>
        </Cartao>
      ))}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
// Próximos passos vencidos
// ---------------------------------------------------------------------------
function PassosVencidos() {
  const qc = useQueryClient();
  const consulta = useQuery({
    queryKey: ["pendencias", "proximos-passos"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("proximos_passos")
        .select("id, descricao, data, parceiro_id, parceiro:parceiros(nome_fantasia), responsavel:perfis!proximos_passos_responsavel_id_fkey(nome)")
        .in("estado", ["aberto", "vencido"])
        .lt("data", hojeISO())
        .order("data");
      if (error) throw error;
      return (r ?? []) as unknown as { id: string; descricao: string; data: string; parceiro_id: string; parceiro: { nome_fantasia: string } | null; responsavel: { nome: string } | null }[];
    },
  });
  const feito = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proximos_passos").update({ estado: "feito" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Próximo passo marcado como feito.");
      qc.invalidateQueries({ queryKey: ["pendencias", "proximos-passos"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: toastErro,
  });
  const lista = consulta.data ?? [];
  return (
    <Secao titulo="Próximos passos vencidos" icone={AlarmClock} total={lista.length}
      carregando={consulta.isLoading} erro={consulta.error} vazio="Nenhum próximo passo vencido.">
      {lista.map((p) => (
        <Cartao key={p.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <LinkParceiro id={p.parceiro_id} nome={p.parceiro?.nome_fantasia} />
            <p className="break-words">{p.descricao}</p>
            <p className="text-muted-foreground">Previsto para {data(p.data)}{p.responsavel?.nome ? ` · ${p.responsavel.nome}` : ""}</p>
          </div>
          <Button size="sm" variant="outline" disabled={feito.isPending} onClick={() => feito.mutate(p.id)}><Check /> Feito</Button>
        </Cartao>
      ))}
    </Secao>
  );
}
