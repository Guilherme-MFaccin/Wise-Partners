import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCopy, FileText, ImageIcon, Loader2, Paperclip, ScanText, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { arquivoParaBase64, chamarIA, type ResultadoPrint, type ResultadoResumo } from "@/lib/ia";
import { mensagemErro, toastErro } from "@/lib/erros";
import { hojeISO, semTravessao } from "@/lib/formato";
import { ETAPAS, PACOTES, TIPOS_CONTATO, nomeNivel, rotulo } from "@/lib/rotulos";
import { Campo } from "@/components/parceiros/ui";
import {
  invalidarParceiro, nomeArquivoSeguro, passoAtivo, perfisInternos, podeRegistrarContato, useParceiro, usePerfis,
  useProximosPassos, useTiposAtividade,
} from "@/components/parceiros/dados";

// Tipo de atividade sugerido a partir do tipo de contato (nomes do cadastro tipos_atividade)
const ATIVIDADE_POR_TIPO: Record<string, string> = {
  ligacao: "Ligação",
  whatsapp: "Mensagem ou follow-up",
  email: "Mensagem ou follow-up",
  reuniao_presencial: "Reunião de apresentação",
  reuniao_online: "Reunião de apresentação",
  documento_enviado: "Documento enviado",
  evento: "Evento ou palestra",
};

const NENHUM = "__nenhum";
const ACEITOS = "image/*,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Data e hora local no formato do input datetime-local
function agoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type Revisao = {
  resumo: string;
  decisoes: string;
  pendencias_wise: string;
  pendencias_parceiro: string;
  sugestoes: ResultadoResumo["sugestoes_ficha"];
};

const linhas = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

// Registro rápido de ponto de contato (história 2, FR-020 a FR-025). Meta: menos de 1 minuto no celular.
export function RegistroContatoDialog({
  aberto, onOpenChange, parceiroIdInicial,
}: { aberto: boolean; onOpenChange: (v: boolean) => void; parceiroIdInicial: string | null }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const { data: tipos = [] } = useTiposAtividade();
  const { data: perfis = [] } = usePerfis();

  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [tipo, setTipo] = useState("whatsapp");
  const [quando, setQuando] = useState(agoraLocal());
  const [participantes, setParticipantes] = useState("");
  const [texto, setTexto] = useState("");
  const [anexos, setAnexos] = useState<File[]>([]);
  const [atividade, setAtividade] = useState<string>(NENHUM);
  const [atividadeManual, setAtividadeManual] = useState(false);
  const [passo, setPasso] = useState({ descricao: "", data: "", responsavel_id: "" });
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [mensagens, setMensagens] = useState<ResultadoPrint["mensagens"]>([]);
  const [ia, setIa] = useState<"resumo" | "print" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const { data: parceiro } = useParceiro(parceiroId);
  const { data: passos } = useProximosPassos(parceiroId);

  // Cada abertura começa um registro novo
  useEffect(() => {
    if (!aberto) return;
    setParceiroId(parceiroIdInicial);
    setTipo("whatsapp");
    setQuando(agoraLocal());
    setParticipantes("");
    setTexto("");
    setAnexos([]);
    setAtividadeManual(false);
    setPasso({ descricao: "", data: "", responsavel_id: "" });
    setRevisao(null);
    setMensagens([]);
  }, [aberto, parceiroIdInicial]);

  // Pré-seleciona o tipo de atividade pelo tipo de contato, até o usuário escolher outro
  useEffect(() => {
    if (atividadeManual) return;
    const nome = ATIVIDADE_POR_TIPO[tipo];
    setAtividade(tipos.find((t) => t.ativo && t.nome === nome)?.id ?? NENHUM);
  }, [tipo, tipos, atividadeManual]);

  const imagens = anexos.filter((a) => a.type.startsWith("image/"));

  async function lerPrint(img: File) {
    setIa("print");
    try {
      const r = await chamarIA<ResultadoPrint>("ler_print", { imagem_base64: await arquivoParaBase64(img), mime: img.type || "image/png" });
      setMensagens(r.mensagens ?? []);
      const corrido = semTravessao(r.texto_corrido ?? "");
      setTexto((t) => (t.trim() ? `${t.trim()}\n\n${corrido}` : corrido));
      toast.success("Texto do print inserido. Revise antes de salvar.");
    } catch (e) {
      toast.error(`IA indisponível: ${mensagemErro(e)}. Você pode registrar manualmente.`);
    } finally {
      setIa(null);
    }
  }

  async function resumir() {
    if (!texto.trim()) {
      toast.error("Cole ou escreva o texto do contato antes de pedir o resumo.");
      return;
    }
    setIa("resumo");
    try {
      const ativo = passoAtivo(passos);
      const r = await chamarIA<ResultadoResumo>("resumir_contato", {
        texto,
        parceiro: {
          nome: parceiro?.nome_fantasia ?? "",
          etapa: rotulo(ETAPAS, parceiro?.etapa),
          nivel: parceiro?.nivel ? nomeNivel(parceiro.tipo_parceria, parceiro.nivel) : null,
          pacote: parceiro?.pacote ? rotulo(PACOTES, parceiro.pacote) : null,
          proximo_passo: ativo ? `${ativo.descricao} (até ${ativo.data})` : null,
        },
        hoje: hojeISO(),
      });
      setRevisao({
        resumo: semTravessao(r.resumo ?? ""),
        decisoes: (r.decisoes ?? []).map(semTravessao).join("\n"),
        pendencias_wise: (r.pendencias_wise ?? []).map(semTravessao).join("\n"),
        pendencias_parceiro: (r.pendencias_parceiro ?? []).map(semTravessao).join("\n"),
        sugestoes: r.sugestoes_ficha ?? [],
      });
      if (r.proximo_passo?.descricao) {
        setPasso((x) => ({ ...x, descricao: semTravessao(r.proximo_passo!.descricao), data: r.proximo_passo!.data ?? x.data }));
      }
      if (r.tipo_contato_sugerido && TIPOS_CONTATO[r.tipo_contato_sugerido] && tipo === "whatsapp" && !atividadeManual) {
        setTipo(r.tipo_contato_sugerido);
      }
    } catch (e) {
      toast.error(`IA indisponível: ${mensagemErro(e)}. Você pode registrar manualmente.`);
    } finally {
      setIa(null);
    }
  }

  async function salvar() {
    if (!parceiroId) {
      toast.error("Escolha o parceiro.");
      return;
    }
    if (!texto.trim() && !anexos.length && !revisao) {
      toast.error("Escreva o que aconteceu ou anexe um arquivo.");
      return;
    }
    if (passo.descricao.trim() && !passo.data) {
      toast.error("Informe a data do próximo passo.");
      return;
    }
    setSalvando(true);
    try {
      // Anexos: enviados só na confirmação
      const enviados: { caminho: string; nome: string; tipo: string }[] = [];
      for (const a of anexos) {
        const caminho = `${parceiroId}/${crypto.randomUUID()}-${nomeArquivoSeguro(a.name)}`;
        const up = await supabase.storage.from("anexos").upload(caminho, a, { contentType: a.type || undefined });
        if (up.error) throw up.error;
        enviados.push({ caminho, nome: a.name, tipo: a.type });
      }
      const resumo = revisao
        ? {
          resumo: revisao.resumo.trim(),
          decisoes: linhas(revisao.decisoes),
          pendencias_wise: linhas(revisao.pendencias_wise),
          pendencias_parceiro: linhas(revisao.pendencias_parceiro),
          proximo_passo: passo.descricao.trim() ? { descricao: passo.descricao.trim(), data: passo.data || null } : null,
          sugestoes_ficha: revisao.sugestoes,
        }
        : null;
      const { error } = await supabase.from("pontos_contato").insert({
        parceiro_id: parceiroId,
        tipo,
        data: (quando ? new Date(quando) : new Date()).toISOString(),
        participantes: participantes.trim() || null,
        texto: texto.trim() || null,
        resumo,
        tipo_atividade_id: atividade === NENHUM ? null : atividade,
        anexos: enviados,
        autor_id: perfil?.id,
      });
      if (error) throw error;
      if (passo.descricao.trim()) {
        const r = await supabase.from("proximos_passos").insert({
          parceiro_id: parceiroId, descricao: passo.descricao.trim(), data: passo.data, responsavel_id: passo.responsavel_id || null,
        });
        if (r.error) {
          toastErro(r.error);
          toast.message("O contato foi registrado, mas o próximo passo não. Registre-o na ficha.");
        }
      }
      invalidarParceiro(qc, parceiroId);
      qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Contato registrado");
      onOpenChange(false);
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  const pode = podeRegistrarContato(perfil?.papel);

  return (
    <Dialog open={aberto} onOpenChange={(v) => !salvando && onOpenChange(v)}>
      <DialogContent className="flex h-[100dvh] max-w-2xl flex-col gap-0 p-0 sm:h-auto sm:max-h-[92vh] sm:rounded-[14px]">
        <DialogHeader className="border-b border-white/10 px-4 py-4 text-left sm:px-6">
          <DialogTitle>Registrar contato</DialogTitle>
          <DialogDescription>A IA ajuda a resumir, mas nada é gravado antes de você salvar.</DialogDescription>
        </DialogHeader>

        {!pode ? (
          <p className="p-6 text-sm text-muted-foreground">Seu papel não registra pontos de contato.</p>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
              <Campo rotulo="Parceiro" obrigatorio>
                <ParceiroBusca valor={parceiroId} onChange={setParceiroId} />
              </Campo>

              <div className="grid grid-cols-2 gap-3">
                <Campo rotulo="Tipo">
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TIPOS_CONTATO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
                <Campo rotulo="Data e hora">
                  <Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} />
                </Campo>
              </div>

              <Campo rotulo="Participantes">
                <Input value={participantes} onChange={(e) => setParticipantes(e.target.value)} placeholder="Ex.: João (diretor), Maria" />
              </Campo>

              <Campo rotulo="O que aconteceu" dica="Cole a conversa, o e-mail ou a transcrição já feita (Gemini, gravador do celular).">
                <Textarea rows={7} value={texto} onChange={(e) => setTexto(e.target.value)} className="min-h-[160px]" />
              </Campo>

              {/* Anexos */}
              <div className="space-y-2">
                <input ref={arquivoRef} type="file" multiple accept={ACEITOS} className="hidden"
                  onChange={(e) => {
                    const novos = Array.from(e.target.files ?? []);
                    setAnexos((a) => [...a, ...novos]);
                    e.target.value = "";
                  }} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => arquivoRef.current?.click()}>
                    <Paperclip /> Anexar print ou arquivo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={resumir} disabled={!!ia || !texto.trim()}>
                    {ia === "resumo" ? <Loader2 className="animate-spin" /> : <Sparkles />} Resumir com IA
                  </Button>
                </div>
                {anexos.length > 0 && (
                  <ul className="space-y-1.5">
                    {anexos.map((a, i) => (
                      <li key={`${a.name}-${i}`} className="flex items-center gap-2 rounded-[8px] border border-white/10 px-2 py-1.5 text-sm">
                        {a.type.startsWith("image/") ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
                        <span className="min-w-0 flex-1 truncate">{a.name}</span>
                        {a.type.startsWith("image/") && (
                          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" disabled={!!ia} onClick={() => lerPrint(a)}>
                            {ia === "print" ? <Loader2 className="animate-spin" /> : <ScanText />} Ler print com IA
                          </Button>
                        )}
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="Remover anexo"
                          onClick={() => setAnexos((l) => l.filter((_, j) => j !== i))}>
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {imagens.length === 0 && anexos.length === 0 && (
                  <p className="text-xs text-muted-foreground">Imagens, PDF ou documento de texto. Prints de conversa podem ser lidos pela IA.</p>
                )}
              </div>

              {mensagens.length > 0 && (
                <div className="rounded-[10px] border border-white/10 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-neutro-300">Mensagens lidas do print (confira autores e datas)</p>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label="Fechar" onClick={() => setMensagens([])}><X /></Button>
                  </div>
                  <ul className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
                    {mensagens.map((m, i) => (
                      <li key={i} className="break-words">
                        <span className="font-semibold text-menta-300">{m.autor}</span>
                        {m.data && <span className="text-xs text-muted-foreground"> · {m.data}</span>}
                        <span className="block">{m.texto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {revisao && <PainelRevisao revisao={revisao} onChange={setRevisao} onDescartar={() => setRevisao(null)} />}

              <Campo rotulo="Tipo de atividade" dica="Tempo estimado só como informação.">
                <Select value={atividade} onValueChange={(v) => { setAtividade(v); setAtividadeManual(true); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NENHUM}>Não registrar atividade</SelectItem>
                    {tipos.filter((t) => t.ativo).map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>

              {/* Próximo passo: substitui o atual do parceiro */}
              <div className="space-y-3 rounded-[10px] border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Próximo passo</p>
                  {passo.descricao && (
                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setPasso({ descricao: "", data: "", responsavel_id: "" })}>
                      Limpar
                    </Button>
                  )}
                </div>
                <Input value={passo.descricao} onChange={(e) => setPasso((x) => ({ ...x, descricao: e.target.value }))} placeholder="Opcional. Ex.: enviar a minuta" />
                {passo.descricao.trim() && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Campo rotulo="Data" obrigatorio>
                      <Input type="date" value={passo.data} onChange={(e) => setPasso((x) => ({ ...x, data: e.target.value }))} />
                    </Campo>
                    <Campo rotulo="Responsável">
                      <Select value={passo.responsavel_id || NENHUM} onValueChange={(v) => setPasso((x) => ({ ...x, responsavel_id: v === NENHUM ? "" : v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NENHUM}>Responsável do parceiro</SelectItem>
                          {perfisInternos(perfis).map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Campo>
                  </div>
                )}
                {passoAtivo(passos) && passo.descricao.trim() && (
                  <p className="text-xs text-muted-foreground">Substitui o próximo passo atual: {passoAtivo(passos)!.descricao}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/10 px-4 py-3 sm:justify-end sm:px-6">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
              <Button className="flex-1 sm:flex-none" onClick={salvar} disabled={salvando || !!ia}>
                {salvando ? <Loader2 className="animate-spin" /> : null} Salvar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Revisão do resumo da IA: tudo editável; sugestões de ficha só como lista para copiar.
function PainelRevisao({ revisao, onChange, onDescartar }: { revisao: Revisao; onChange: (r: Revisao) => void; onDescartar: () => void }) {
  const set = (k: keyof Omit<Revisao, "sugestoes">, v: string) => onChange({ ...revisao, [k]: v });
  const textoSugestoes = revisao.sugestoes.map((s) => `${s.campo}: ${s.valor}${s.motivo ? ` (${s.motivo})` : ""}`).join("\n");
  return (
    <div className="space-y-3 rounded-[10px] border border-menta-500/40 bg-menta-500/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-menta-300"><Sparkles className="h-4 w-4" /> Resumo da IA (revise)</p>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onDescartar}>Descartar</Button>
      </div>
      <Campo rotulo="Resumo"><Textarea rows={3} value={revisao.resumo} onChange={(e) => set("resumo", e.target.value)} /></Campo>
      <Campo rotulo="Decisões (uma por linha)"><Textarea rows={2} value={revisao.decisoes} onChange={(e) => set("decisoes", e.target.value)} /></Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Pendências da Wise"><Textarea rows={2} value={revisao.pendencias_wise} onChange={(e) => set("pendencias_wise", e.target.value)} /></Campo>
        <Campo rotulo="Pendências do parceiro"><Textarea rows={2} value={revisao.pendencias_parceiro} onChange={(e) => set("pendencias_parceiro", e.target.value)} /></Campo>
      </div>
      <p className="text-xs text-muted-foreground">O próximo passo sugerido foi preenchido abaixo e pode ser ajustado ou limpo.</p>
      {revisao.sugestoes.length > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-neutro-300">Sugestões de atualização da ficha</p>
            <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs"
              onClick={() => navigator.clipboard.writeText(textoSugestoes).then(() => toast.success("Sugestões copiadas."), () => toast.error("Não foi possível copiar."))}>
              <ClipboardCopy /> Copiar
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {revisao.sugestoes.map((s, i) => (
              <li key={i} className="break-words">
                <span className="font-semibold">{s.campo}:</span> {s.valor}
                {s.motivo && <span className="text-xs text-muted-foreground"> ({s.motivo})</span>}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">Não são aplicadas automaticamente. Atualize a ficha se fizer sentido.</p>
        </div>
      )}
    </div>
  );
}
