import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Circle, FileText, Gavel, Loader2, MessageSquare, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { ESTADOS_DESLIGAMENTO, TIPOS_DESLIGAMENTO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo, Info, Secao } from "../ui";
import { invalidarParceiro, nomePerfil, useConfigValor, usePerfis, type Parceiro } from "../dados";
import { BotaoCopiar } from "./BotaoCopiar";
import { somarDias } from "./v2";

export type Fluxo = {
  id: string; parceiro_id: string; tipo: string; estado: string; motivo: string | null;
  em_risco_em: string | null; tentativa_1_em: string | null; tentativa_2_em: string | null; sugerido_em: string | null;
  aprovado_em: string | null; aprovado_por: string | null; aguardar_ciclo: boolean; avisado_em: string | null; texto_aviso: string | null;
  data_encerramento: string | null; encerrado_em: string | null; cancelado_em: string | null; cancelado_motivo: string | null; created_at: string;
};

const FINAIS = ["encerrado", "cancelado"];
const PASSOS: Record<string, { estado: string; data: keyof Fluxo }[]> = {
  inatividade: [
    { estado: "em_risco", data: "em_risco_em" }, { estado: "tentativa_1", data: "tentativa_1_em" }, { estado: "tentativa_2", data: "tentativa_2_em" },
    { estado: "sugerido", data: "sugerido_em" }, { estado: "aprovado", data: "aprovado_em" }, { estado: "avisado", data: "avisado_em" },
    { estado: "encerrado", data: "encerrado_em" },
  ],
  inadequacao: [
    { estado: "sugerido", data: "sugerido_em" }, { estado: "aprovado", data: "aprovado_em" }, { estado: "avisado", data: "avisado_em" },
    { estado: "encerrado", data: "encerrado_em" },
  ],
};

// Fluxos do parceiro (só admin e parcerias leem; a RLS devolve vazio para os demais)
export function useFluxosDesligamento(parceiroId: string, habilitado: boolean) {
  return useQuery({
    queryKey: ["parceiro", parceiroId, "desligamento"],
    enabled: habilitado,
    queryFn: async () => ok(await supabase.from("fluxos_desligamento").select("*").eq("parceiro_id", parceiroId)
      .order("created_at", { ascending: false })) as Fluxo[],
  });
}

// Desligamento (História 12, Apêndice D): tentativas, decisão do Diretor, aviso formal e encerramento.
export function AbaDesligamento({ parceiro: p }: { parceiro: Parceiro }) {
  const { isAdmin, isParcerias, perfil } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const q = useFluxosDesligamento(p.id, isParcerias);
  const [abrir, setAbrir] = useState(false);

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const fluxos = q.data ?? [];
  const aberto = fluxos.find((f) => !FINAIS.includes(f.estado));
  const atual = aberto ?? fluxos[0];
  const historico = fluxos.filter((f) => f.id !== atual?.id);

  return (
    <div className="space-y-4">
      {!atual && <Vazio titulo="Nenhum fluxo de desligamento.">O parceiro entra em risco pela rotina diária (Apêndice D).</Vazio>}
      {atual && <FluxoAtual parceiro={p} f={atual} perfis={perfis} diretor={!!perfil?.is_diretor} />}

      {isAdmin && !aberto && p.etapa !== "parceria_encerrada" && (
        <Secao titulo="Desligamento por inadequação" descricao="Conflito de interesse ou conduta incompatível. Vai direto para a decisão do Diretor, sem tentativas de retomada.">
          <Button variant="outline" onClick={() => setAbrir(true)}><ShieldOff /> Abrir desligamento por inadequação</Button>
        </Secao>
      )}

      {historico.length > 0 && (
        <Secao titulo="Fluxos anteriores">
          <ul className="space-y-2 text-sm">
            {historico.map((f) => (
              <li key={f.id} className="rounded-[10px] border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{rotulo(TIPOS_DESLIGAMENTO, f.tipo)} · aberto em {data(f.created_at)}</span>
                  <Pilula tom={f.estado === "cancelado" ? "neutro" : "perigo"}>{rotulo(ESTADOS_DESLIGAMENTO, f.estado)}</Pilula>
                </div>
                {f.cancelado_motivo && <p className="mt-1 text-xs text-muted-foreground">{data(f.cancelado_em)}: {f.cancelado_motivo}</p>}
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {abrir && <AbrirInadequacao parceiro={p} onFechar={() => setAbrir(false)} />}
    </div>
  );
}

function FluxoAtual({ parceiro: p, f, perfis, diretor }: { parceiro: Parceiro; f: Fluxo; perfis: any[]; diretor: boolean }) {
  const { isAdmin, isParcerias } = useAuth();
  const [tentativa, setTentativa] = useState(false);
  const [decisao, setDecisao] = useState<"aprovar" | "manter" | null>(null);
  const [aviso, setAviso] = useState(false);
  const { data: intervalo } = useConfigValor<number>("retomada_intervalo_dias");
  const passos = PASSOS[f.tipo] ?? PASSOS.inatividade;
  const idx = passos.findIndex((x) => x.estado === f.estado);
  const cancelado = f.estado === "cancelado";
  const libera2 = f.tentativa_1_em ? somarDias(f.tentativa_1_em, Number(intervalo ?? 15)) : null;

  return (
    <Secao titulo={`Desligamento por ${rotulo(TIPOS_DESLIGAMENTO, f.tipo).toLowerCase()}`}
      descricao={`Aberto em ${data(f.created_at)}${f.motivo ? ` · motivo: ${f.motivo}` : ""}`}
      acoes={<Pilula tom={cancelado ? "neutro" : f.estado === "encerrado" ? "perigo" : "alerta"}>{rotulo(ESTADOS_DESLIGAMENTO, f.estado)}</Pilula>}>
      {cancelado ? (
        <p className="rounded-[10px] border border-white/10 p-3 text-sm">
          Cancelado em {data(f.cancelado_em)}{f.cancelado_motivo ? `: ${f.cancelado_motivo}` : ""}.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-white/10 pl-5">
          {passos.map((x, i) => {
            const feito = i <= idx;
            const d = f[x.data] as string | null;
            return (
              <li key={x.estado} className="relative text-sm">
                <span className={cn("absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background",
                  feito ? "border-menta-500 text-menta-400" : "border-white/30 text-neutro-300")}>
                  {feito ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                </span>
                <p className={cn("font-medium", !feito && "text-muted-foreground")}>{rotulo(ESTADOS_DESLIGAMENTO, x.estado)}</p>
                <p className="text-xs text-muted-foreground">
                  {d ? data(d) : x.estado === "encerrado" && f.data_encerramento ? `Previsto para ${data(f.data_encerramento)}` : "Pendente"}
                  {x.estado === "aprovado" && f.aprovado_por ? ` · ${nomePerfil(perfis, f.aprovado_por) || "Diretor"}` : ""}
                  {x.estado === "aprovado" && f.aguardar_ciclo ? " · aguarda o fim do ciclo do Base Ativa" : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* Ações do passo atual */}
      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        {["em_risco", "tentativa_1"].includes(f.estado) && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              A segunda tentativa de retomada vale a partir de {libera2 ? data(libera2) : "15 dias depois da primeira"}.
              Qualquer indicação qualificada ou ação comprovada cancela o fluxo.
            </p>
            {isParcerias && f.estado === "tentativa_1" && (
              <Button variant="outline" onClick={() => setTentativa(true)} disabled={!!libera2 && hojeISO() < libera2}>
                <MessageSquare /> Registrar segunda tentativa
              </Button>
            )}
          </div>
        )}
        {f.estado === "tentativa_2" && (
          <p className="text-sm text-muted-foreground">
            Sem resposta em 30 dias depois da segunda tentativa, o portal sugere o desligamento ao Diretor.
          </p>
        )}
        {f.estado === "sugerido" && (
          diretor ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" onClick={() => setDecisao("aprovar")}><Gavel /> Aprovar desligamento</Button>
              <Button variant="outline" onClick={() => setDecisao("manter")}>Manter o parceiro</Button>
            </div>
          ) : <p className="flex items-center gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4" /> Aguardando a decisão do Diretor.</p>
        )}
        {f.estado === "aprovado" && (
          isAdmin
            ? <Button onClick={() => setAviso(true)}><FileText /> Gerar aviso formal</Button>
            : <p className="text-sm text-muted-foreground">Aprovado. Um administrador gera o aviso formal com a data de encerramento.</p>
        )}
        {f.texto_aviso && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Aviso formal{f.avisado_em ? ` gerado em ${data(f.avisado_em)}` : ""}</p>
              <BotaoCopiar texto={f.texto_aviso} rotulo="Copiar aviso" size="sm" />
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-[10px] border border-white/10 bg-background/40 p-3 font-sans text-sm">{f.texto_aviso}</pre>
            {f.data_encerramento && <Info rotulo="Encerramento">{data(f.data_encerramento)}</Info>}
          </div>
        )}
        {f.estado === "encerrado" && (
          <p className="text-sm text-muted-foreground">
            Parceria encerrada em {data(f.encerrado_em)}. Link de indicação e acessos revogados; comissões e indicações abertas preservadas.
          </p>
        )}
      </div>

      {tentativa && <RegistrarTentativa parceiro={p} fluxo={f} onFechar={() => setTentativa(false)} />}
      {decisao && <DecisaoDiretor parceiro={p} fluxo={f} aprovar={decisao === "aprovar"} onFechar={() => setDecisao(null)} />}
      {aviso && <GerarAviso parceiro={p} fluxo={f} onFechar={() => setAviso(false)} />}
    </Secao>
  );
}

function useAtualizar(parceiroId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId, "desligamento"] });
    qc.invalidateQueries({ queryKey: ["pendencias"] });
    invalidarParceiro(qc, parceiroId);
  };
}

function RegistrarTentativa({ parceiro: p, fluxo, onFechar }: { parceiro: Parceiro; fluxo: Fluxo; onFechar: () => void }) {
  const atualizar = useAtualizar(p.id);
  const modelo = useQuery({
    queryKey: ["textos-email", "retomada_parceiro"],
    queryFn: async () => ok(await supabase.from("textos_email").select("assunto, corpo").eq("chave", "retomada_parceiro").maybeSingle()) as
      { assunto: string; corpo: string } | null,
  });
  const contato = useQuery({
    queryKey: ["parceiro", p.id, "responsavel-contato"],
    queryFn: async () => {
      const r = ok(await supabase.from("parceiro_contatos").select("papeis, principal, contatos(nome)").eq("parceiro_id", p.id)) as unknown as
        { papeis: string[]; principal: boolean; contatos: { nome: string } | null }[];
      const resp = r.find((x) => x.papeis?.includes("responsavel_parceria")) ?? r.find((x) => x.principal) ?? r[0];
      return resp?.contatos?.nome?.split(" ")[0] ?? null;
    },
  });
  const sugerido = modelo.data?.corpo
    ? modelo.data.corpo.split("{{parceiro}}").join(p.nome_fantasia).split("{{nome}}").join(contato.data ?? "pessoal")
    : "";
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (sugerido && !texto) setTexto(sugerido); }, [sugerido]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar() {
    setSalvando(true);
    const { error } = await supabase.rpc("registrar_tentativa_retomada", { p_fluxo: fluxo.id, p_texto: texto.trim() || null });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Segunda tentativa registrada na linha do tempo.");
    atualizar();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-lg overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Segunda tentativa de retomada</DialogTitle>
          <DialogDescription>Envie a mensagem ao parceiro pelo canal de costume e registre aqui. Vira ponto de contato.</DialogDescription>
        </DialogHeader>
        {modelo.isLoading ? <Carregando /> : (
          <div className="space-y-2">
            {modelo.data?.assunto && <p className="text-xs text-muted-foreground">Assunto sugerido: {modelo.data.assunto}</p>}
            <Textarea rows={8} value={texto} onChange={(e) => setTexto(e.target.value)} />
            {texto && <BotaoCopiar texto={texto} rotulo="Copiar mensagem" size="sm" />}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando && <Loader2 className="animate-spin" />} Registrar tentativa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Só o Diretor decide (o banco também exige)
function DecisaoDiretor({ parceiro: p, fluxo, aprovar, onFechar }: { parceiro: Parceiro; fluxo: Fluxo; aprovar: boolean; onFechar: () => void }) {
  const atualizar = useAtualizar(p.id);
  const [aguardar, setAguardar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!aprovar && !motivo.trim()) return toast.error("Informe o motivo para manter o parceiro.");
    setSalvando(true);
    const { error } = await supabase.rpc("decidir_desligamento", {
      p_fluxo: fluxo.id, p_aprovar: aprovar, p_aguardar_ciclo: aprovar ? aguardar : false, p_motivo: motivo.trim() || null,
    });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success(aprovar ? "Desligamento aprovado. O administrador gera o aviso formal." : "Parceiro mantido. O fluxo foi cancelado.");
    atualizar();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{aprovar ? "Aprovar desligamento" : "Manter o parceiro"}</DialogTitle>
          <DialogDescription>{p.nome_fantasia} · {rotulo(TIPOS_DESLIGAMENTO, fluxo.tipo)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {aprovar && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox className="mt-0.5" checked={aguardar} onCheckedChange={(v) => setAguardar(!!v)} />
              <span>Aguardar o fim do ciclo do Base Ativa em curso<span className="block text-xs text-muted-foreground">O encerramento fica para depois do ciclo, se ele terminar após os 30 dias do aviso.</span></span>
            </label>
          )}
          <Campo rotulo={aprovar ? "Observação (opcional)" : "Motivo para manter"} obrigatorio={!aprovar}>
            <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button variant={aprovar ? "destructive" : "default"} onClick={salvar} disabled={salvando || (!aprovar && !motivo.trim())}>
            {salvando && <Loader2 className="animate-spin" />} {aprovar ? "Aprovar" : "Manter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GerarAviso({ parceiro: p, fluxo, onFechar }: { parceiro: Parceiro; fluxo: Fluxo; onFechar: () => void }) {
  const atualizar = useAtualizar(p.id);
  const [texto, setTexto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function gerar() {
    setSalvando(true);
    const { data: r, error } = await supabase.rpc("gerar_aviso_desligamento", { p_fluxo: fluxo.id });
    setSalvando(false);
    if (error) return toastErro(error);
    setTexto(String(r ?? ""));
    toast.success("Aviso gerado. O parceiro saiu das novas recomendações de RFP.");
    atualizar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-lg overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Aviso formal de desligamento</DialogTitle>
          <DialogDescription>
            O portal gera o texto com a data de encerramento (30 dias, cláusula 13.4). O responsável envia ao parceiro.
          </DialogDescription>
        </DialogHeader>
        {texto === null ? (
          <p className="text-sm text-muted-foreground">Ao gerar, o fluxo passa para "Aviso enviado" e o parceiro sai das novas recomendações na hora.</p>
        ) : (
          <div className="space-y-2">
            <pre className="whitespace-pre-wrap break-words rounded-[10px] border border-white/10 bg-background/40 p-3 font-sans text-sm">{texto}</pre>
            <BotaoCopiar texto={texto} rotulo="Copiar aviso" size="sm" />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>{texto === null ? "Cancelar" : "Fechar"}</Button>
          {texto === null && <Button onClick={gerar} disabled={salvando}>{salvando && <Loader2 className="animate-spin" />} Gerar aviso</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AbrirInadequacao({ parceiro: p, onFechar }: { parceiro: Parceiro; onFechar: () => void }) {
  const atualizar = useAtualizar(p.id);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!motivo.trim()) return toast.error("Informe o motivo.");
    setSalvando(true);
    const { error } = await supabase.rpc("abrir_desligamento_inadequacao", { p_parceiro: p.id, p_motivo: motivo.trim() });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Desligamento aberto. O Diretor foi avisado.");
    atualizar();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Desligamento por inadequação</DialogTitle>
          <DialogDescription>{p.nome_fantasia}. Um fluxo por inatividade em andamento é substituído.</DialogDescription>
        </DialogHeader>
        <Campo rotulo="Motivo" obrigatorio>
          <Textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: conflito de interesse comprovado" />
        </Campo>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button variant="destructive" onClick={salvar} disabled={salvando || !motivo.trim()}>
            {salvando && <Loader2 className="animate-spin" />} Enviar ao Diretor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
