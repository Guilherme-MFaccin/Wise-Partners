import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ExternalLink, Info as InfoIcon, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { data, dataHora } from "@/lib/formato";
import { ESTADOS_CONTRAPARTIDA, PERIODICIDADES, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo, Secao } from "../ui";
import { CAMPOS_META_CONTRAPARTIDA, MetaContrapartida, type MetaDaContrapartida } from "@/components/metas/MetaContrapartida";
import { abrirArquivo, invalidarParceiro, nomeArquivoSeguro, nomePerfil, usePerfis } from "../dados";

type Contrapartida = MetaDaContrapartida & {
  id: string; nome: string; periodicidade: string; comprovacao: string; proxima_data: string | null;
  estado: string; ativa: boolean;
};
type Comprovacao = {
  id: string; contrapartida_id: string; enviada_por: string | null; link: string | null; caminho: string | null; observacao: string | null;
  estado: "enviada" | "validada" | "recusada"; motivo_recusa: string | null; quantidade: number | null; validada_por: string | null; validada_em: string | null; created_at: string;
};
type Tarefa = { id: string; descricao: string; prazo: string; feita: boolean; feita_em: string | null; responsavel_id: string | null };

const ESTADOS_COMPROVACAO: Record<string, string> = { enviada: "Aguardando validação", validada: "Validada", recusada: "Recusada" };

// Contrapartidas (FR-043 a FR-045) e tarefas de onboarding. Atraso só gera alerta.
export function AbaContrapartidas({ parceiroId }: { parceiroId: string }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: perfis = [] } = usePerfis();
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "contrapartidas"],
    queryFn: async () => {
      const [c, k, t] = await Promise.all([
        supabase.from("contrapartidas").select(`*, ${CAMPOS_META_CONTRAPARTIDA}`).eq("parceiro_id", parceiroId).order("ativa", { ascending: false }).order("proxima_data", { nullsFirst: false }),
        supabase.from("comprovacoes").select("*").eq("parceiro_id", parceiroId).order("created_at", { ascending: false }),
        supabase.from("tarefas_onboarding").select("*").eq("parceiro_id", parceiroId).order("prazo").order("created_at"),
      ]);
      for (const r of [c, k, t]) if (r.error) throw r.error;
      return { contrapartidas: (c.data ?? []) as Contrapartida[], comprovacoes: (k.data ?? []) as Comprovacao[], tarefas: (t.data ?? []) as Tarefa[] };
    },
  });
  const [enviar, setEnviar] = useState<Contrapartida | null>(null);
  const [recusar, setRecusar] = useState<Comprovacao | null>(null);
  const [motivo, setMotivo] = useState("");

  const atualizar = () => invalidarParceiro(qc, parceiroId);

  async function validar(c: Comprovacao) {
    const { error } = await supabase.from("comprovacoes").update({ estado: "validada" }).eq("id", c.id);
    if (error) return toastErro(error);
    toast.success("Comprovação validada.");
    atualizar();
  }

  async function confirmarRecusa() {
    if (!recusar) return;
    if (!motivo.trim()) {
      toast.error("Informe o motivo da recusa.");
      return;
    }
    const { error } = await supabase.from("comprovacoes").update({ estado: "recusada", motivo_recusa: motivo.trim() }).eq("id", recusar.id);
    if (error) return toastErro(error);
    toast.success("Comprovação recusada. O parceiro foi avisado.");
    setRecusar(null);
    atualizar();
  }

  async function marcarTarefa(t: Tarefa, feita: boolean) {
    const { error } = await supabase.from("tarefas_onboarding")
      .update({ feita, feita_em: feita ? new Date().toISOString() : null }).eq("id", t.id);
    if (error) return toastErro(error);
    atualizar();
  }

  if (q.isLoading) return <Carregando />;
  const { contrapartidas = [], comprovacoes = [], tarefas = [] } = q.data ?? {};
  const atrasadas = contrapartidas.filter((c) => c.ativa && c.estado === "atrasada").length;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-[10px] border border-white/10 bg-card p-3 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        Atraso só gera alerta: nenhuma entrega da Wise é suspensa por contrapartida não cumprida.
      </p>

      {tarefas.length > 0 && (
        <Secao titulo="Tarefas de onboarding" descricao={`${tarefas.filter((t) => t.feita).length} de ${tarefas.length} concluídas`}>
          <ul className="space-y-2">
            {tarefas.map((t) => {
              const vencida = !t.feita && t.prazo < new Date().toISOString().slice(0, 10);
              return (
                <li key={t.id} className="flex items-start gap-3 text-sm">
                  <Checkbox className="mt-0.5" checked={t.feita} disabled={!isParcerias} onCheckedChange={(v) => marcarTarefa(t, !!v)} />
                  <div className="min-w-0">
                    <p className={cn("break-words", t.feita && "text-muted-foreground line-through")}>{t.descricao}</p>
                    <p className={cn("text-xs", vencida ? "text-red-300" : "text-muted-foreground")}>
                      {t.feita ? `Feita em ${dataHora(t.feita_em)}` : `Prazo ${data(t.prazo)}${vencida ? " (vencido)" : ""}`}
                      {t.responsavel_id ? ` · ${nomePerfil(perfis, t.responsavel_id)}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Secao>
      )}

      {!contrapartidas.length ? (
        <Vazio titulo="Nenhuma contrapartida.">As contrapartidas do pacote são criadas na assinatura do contrato.</Vazio>
      ) : (
        <>
          {atrasadas > 0 && (
            <p className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" /> {atrasadas} {atrasadas === 1 ? "contrapartida atrasada" : "contrapartidas atrasadas"}
            </p>
          )}
          <div className="space-y-3">
            {contrapartidas.map((c) => {
              const lista = comprovacoes.filter((k) => k.contrapartida_id === c.id);
              const atrasada = c.estado === "atrasada" && c.ativa;
              return (
                <div key={c.id} className={cn("min-w-0 rounded-[14px] border bg-card p-4", atrasada ? "border-warning/50" : "border-white/10", !c.ativa && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{c.nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rotulo(PERIODICIDADES, c.periodicidade)} · Comprovação: {c.comprovacao}
                        {c.proxima_data ? ` · Próxima data: ${data(c.proxima_data)}` : ""}
                      </p>
                      <MetaContrapartida c={c} className="mt-2" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!c.ativa && <Pilula>Inativa</Pilula>}
                      <SeloEstado estado={c.estado} mapa={ESTADOS_CONTRAPARTIDA} />
                      {isParcerias && c.ativa && (
                        <Button size="sm" variant="outline" onClick={() => setEnviar(c)}><Send /> Enviar comprovação</Button>
                      )}
                    </div>
                  </div>
                  {atrasada && <p className="mt-2 text-xs text-warning">Atrasada: alerta para o responsável e para o parceiro. Nenhuma entrega é suspensa.</p>}
                  {lista.length > 0 && (
                    <details className="mt-3" open={lista.some((k) => k.estado === "enviada")}>
                      <summary className="cursor-pointer text-xs text-menta-400">Comprovações ({lista.length})</summary>
                      <ul className="mt-2 space-y-2">
                        {lista.map((k) => (
                          <li key={k.id} className="rounded-[10px] border border-white/10 p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <SeloEstado estado={k.estado} mapa={ESTADOS_COMPROVACAO} />
                              <span className="text-xs text-muted-foreground">
                                {dataHora(k.created_at)}{nomePerfil(perfis, k.enviada_por) ? ` · ${nomePerfil(perfis, k.enviada_por)}` : ""}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {k.link && (
                                <a href={k.link} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-menta-400 underline">
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {k.link}
                                </a>
                              )}
                              {k.caminho && (
                                <Button size="sm" variant="outline" onClick={() => abrirArquivo("comprovacoes", k.caminho!)}>
                                  <Paperclip /> Abrir arquivo
                                </Button>
                              )}
                            </div>
                            {k.quantidade !== null && k.quantidade !== undefined && <p className="mt-1 tabular-nums">Informado: {k.quantidade} {c.meta_unidade ?? ""}</p>}
                            {k.observacao && <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{k.observacao}</p>}
                            {k.motivo_recusa && <p className="mt-1 text-red-300">Motivo da recusa: {k.motivo_recusa}</p>}
                            {k.validada_em && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Revisada em {dataHora(k.validada_em)}{nomePerfil(perfis, k.validada_por) ? ` por ${nomePerfil(perfis, k.validada_por)}` : ""}
                              </p>
                            )}
                            {isParcerias && k.estado === "enviada" && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => validar(k)}><Check /> Validar</Button>
                                <Button size="sm" variant="outline" onClick={() => { setMotivo(""); setRecusar(k); }}><X /> Recusar</Button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {enviar && <EnviarComprovacao parceiroId={parceiroId} contrapartida={enviar} onFechar={() => setEnviar(null)} onSalvo={atualizar} />}

      <Dialog open={!!recusar} onOpenChange={(v) => !v && setRecusar(null)}>
        <DialogContent className="max-w-md sm:rounded-[14px]">
          <DialogHeader>
            <DialogTitle>Recusar comprovação</DialogTitle>
            <DialogDescription>A contrapartida volta para pendente e o parceiro recebe o motivo.</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da recusa" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRecusar(null)}>Cancelar</Button>
            <Button onClick={confirmarRecusa} disabled={!motivo.trim()}>Recusar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Envio de comprovação em nome do parceiro: link ou arquivo (bucket "comprovacoes")
function EnviarComprovacao({
  parceiroId, contrapartida, onFechar, onSalvo,
}: { parceiroId: string; contrapartida: Contrapartida; onFechar: () => void; onSalvo: () => void }) {
  const { perfil } = useAuth();
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [observacao, setObservacao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [salvando, setSalvando] = useState(false);
  const pedeQuantidade = contrapartida.meta_modo === "valor" && contrapartida.meta_quantidade !== null;

  async function salvar() {
    if (!link.trim() && !arquivo) {
      toast.error("Informe um link ou anexe um arquivo.");
      return;
    }
    if (pedeQuantidade && (quantidade.trim() === "" || Number(quantidade) < 0)) {
      toast.error(`Informe quantos ${contrapartida.meta_unidade ?? "itens"} a comprovação mostra.`);
      return;
    }
    setSalvando(true);
    let caminho: string | null = null;
    if (arquivo) {
      caminho = `${parceiroId}/${crypto.randomUUID()}-${nomeArquivoSeguro(arquivo.name)}`;
      const up = await supabase.storage.from("comprovacoes").upload(caminho, arquivo, { contentType: arquivo.type || undefined });
      if (up.error) {
        setSalvando(false);
        return toastErro(up.error);
      }
    }
    const { error } = await supabase.from("comprovacoes").insert({
      contrapartida_id: contrapartida.id, parceiro_id: parceiroId, link: link.trim() || null, caminho,
      observacao: observacao.trim() || null, enviada_por: perfil?.id, quantidade: pedeQuantidade ? Number(quantidade) : null,
    });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Comprovação enviada.");
    onSalvo();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Enviar comprovação</DialogTitle>
          <DialogDescription>{contrapartida.nome}. Esperado: {contrapartida.comprovacao}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Campo rotulo="Link"><Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" /></Campo>
          <Campo rotulo="Arquivo (print, PDF, relatório)">
            <Input type="file" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </Campo>
          {pedeQuantidade && (
            <Campo rotulo={`Quantos ${contrapartida.meta_unidade ?? "itens"} (meta: ${contrapartida.meta_quantidade})`}>
              <Input type="number" inputMode="numeric" min="0" className="w-40" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </Campo>
          )}
          <Campo rotulo="Observação"><Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} /></Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Enviando..." : "Enviar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
