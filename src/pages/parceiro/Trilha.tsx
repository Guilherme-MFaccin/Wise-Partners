import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, BadgeCheck, CheckCircle2, ChevronDown, Circle, Clock, Download, ExternalLink, FileText, Loader2, Lock, PlayCircle, RotateCcw, Send, Type,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mensagemErro, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { TIPOS_MODULO, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useMeuParceiro } from "@/components/portal/dados";
import {
  HORAS_NOVA_TENTATIVA, baixarCertificadoPdf, liberaNovaTentativaEm, useProgresso, useTrilha, useUltimaTentativa,
  type Certificado, type Modulo, type Pergunta, type Trilha as TTrilha,
} from "@/components/capacitacao-parceiro/dados";

type Resultado = { nota: number; aprovado: boolean; acertos: number; total: number; nota_minima: number; certificado_id: string | null };

const ICONES: Record<string, any> = { video_arquivo: PlayCircle, video_link: PlayCircle, pdf: FileText, texto: Type };

// Trilha: módulos em ordem, conclusão de cada um, teste final e certificado (FR-152 a FR-154)
export default function Trilha() {
  const { trilha: param } = useParams();
  const qc = useQueryClient();
  const q = useTrilha(param);
  const meuQ = useProgresso("eu");
  const parceiroQ = useMeuParceiro();
  const tentativaQ = useUltimaTentativa(q.data?.trilha.id);
  const [aberto, setAberto] = useState<string | null>(null);
  const [concluindo, setConcluindo] = useState<string | null>(null);

  if (q.isLoading || meuQ.isLoading) return <Carregando />;
  if (q.error || meuQ.error) return <ErroCarga erro={q.error || meuQ.error} />;
  if (!q.data) {
    return (
      <div>
        <Voltar />
        <Vazio titulo="Trilha não encontrada">A trilha não existe ou ainda não foi publicada.</Vazio>
      </div>
    );
  }
  const { trilha, modulos, perguntas } = q.data;
  const feitos = new Set((meuQ.data?.progresso ?? []).map((p) => p.modulo_id));
  const nFeitos = modulos.filter((m) => feitos.has(m.id)).length;
  const todos = modulos.length > 0 && nFeitos === modulos.length;
  const cert = (meuQ.data?.certificados ?? []).find((c) => c.trilha_id === trilha.id);
  const certAtual = cert && cert.versao === trilha.versao ? cert : undefined;
  const proximo = modulos.find((m) => !feitos.has(m.id));
  const atual = aberto ?? (certAtual ? null : proximo?.id ?? null);

  async function concluir(m: Modulo) {
    setConcluindo(m.id);
    try {
      const { error } = await supabase.rpc("concluir_modulo", { p_modulo: m.id });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["portal-trilha-progresso"] });
      const seguinte = modulos.find((x) => x.ordem > m.ordem && !feitos.has(x.id) && x.id !== m.id);
      setAberto(seguinte?.id ?? "teste");
      toast.success("Módulo concluído.");
    } catch (e) {
      toastErro(e);
    } finally {
      setConcluindo(null);
    }
  }

  return (
    <div className="space-y-6">
      <Voltar />
      <Cabecalho titulo={trilha.titulo}
        descricao={<>Versão {trilha.versao} · {modulos.length} módulos · teste final com nota mínima de {trilha.nota_minima}%</>} />
      {trilha.descricao && <p className="-mt-3 text-sm text-muted-foreground">{trilha.descricao}</p>}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <div className="flex justify-between text-sm"><span className="font-semibold">Seu progresso</span><span className="text-muted-foreground">{nFeitos} de {modulos.length} módulos</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-menta-500 transition-all" style={{ width: `${modulos.length ? Math.round((nFeitos / modulos.length) * 100) : 0}%` }} />
        </div>
      </section>

      {cert && <BlocoCertificado cert={cert} atual={!!certAtual} versaoTrilha={trilha.versao} parceiro={parceiroQ.data?.nome_fantasia} />}

      <ol className="space-y-3">
        {modulos.map((m, i) => (
          <ItemModulo key={m.id} m={m} n={i + 1} feito={feitos.has(m.id)} aberto={atual === m.id}
            onAlternar={() => setAberto(atual === m.id ? "" : m.id)}
            onConcluir={() => concluir(m)} concluindo={concluindo === m.id} />
        ))}
      </ol>

      {!certAtual && (
        <Teste trilha={trilha} perguntas={perguntas} liberado={todos} tentativa={tentativaQ.data ?? null}
          onAprovado={() => {
            qc.invalidateQueries({ queryKey: ["portal-trilha-progresso"] });
            qc.invalidateQueries({ queryKey: ["portal-meu-nivel"] });
          }}
          onTentativa={() => qc.invalidateQueries({ queryKey: ["portal-trilha-tentativa"] })} />
      )}
    </div>
  );
}

function Voltar() {
  return (
    <Link to="/parceiro/capacitacao" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
      <ArrowLeft className="h-4 w-4" /> Capacitação
    </Link>
  );
}

function BlocoCertificado({ cert, atual, versaoTrilha, parceiro }: { cert: Certificado; atual: boolean; versaoTrilha: number; parceiro?: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex gap-3">
        <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-menta-400" />
        <div className="text-sm">
          <p className="font-semibold">{atual ? "Você é certificado nesta trilha" : `Você tem o certificado da versão ${cert.versao}`}</p>
          <p className="text-muted-foreground">
            Emitido em {dataHora(cert.emitido_em)} · código {cert.codigo}
            {!atual && `. O certificado continua válido; a versão ${versaoTrilha} tem conteúdo novo e um novo teste.`}
          </p>
        </div>
      </div>
      <Button className="shrink-0" onClick={() => baixarCertificadoPdf(cert, parceiro)}><Download /> Baixar certificado</Button>
    </section>
  );
}

function ItemModulo({ m, n, feito, aberto, onAlternar, onConcluir, concluindo }: {
  m: Modulo; n: number; feito: boolean; aberto: boolean; onAlternar: () => void; onConcluir: () => void; concluindo: boolean;
}) {
  const Icone = ICONES[m.tipo] ?? FileText;
  return (
    <li className={`rounded-[14px] border bg-card ${aberto ? "border-menta-500/40" : "border-white/10"}`}>
      <button type="button" onClick={onAlternar} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={aberto}>
        {feito ? <CheckCircle2 className="h-5 w-5 shrink-0 text-menta-400" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{n}. {m.titulo}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Icone className="h-3.5 w-3.5" /> {rotulo(TIPOS_MODULO, m.tipo)}</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className="space-y-4 border-t border-white/10 p-4">
          <ConteudoModulo m={m} />
          <div className="flex flex-wrap items-center gap-2">
            {feito ? <Pilula tom="menta">Concluído</Pilula> : (
              <Button onClick={onConcluir} disabled={concluindo}>
                {concluindo ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Marcar como concluído
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// Vídeos e PDFs enviados ficam no bucket privado "trilhas" e abrem por link temporário de 1 hora
function useLinkTemporario(caminho: string | null) {
  return useQuery({
    enabled: !!caminho,
    queryKey: ["trilha-link", caminho],
    staleTime: 50 * 60_000,
    gcTime: 55 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("trilhas").createSignedUrl(caminho!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

function embedVideo(link: string): string | null {
  try {
    const u = new URL(link);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      const m = u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
    }
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "vimeo.com") {
      const m = u.pathname.match(/^\/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
    if (host === "player.vimeo.com" || host === "youtube-nocookie.com") return link;
  } catch {
    return null;
  }
  return null;
}

function ConteudoModulo({ m }: { m: Modulo }) {
  const arquivo = m.tipo === "video_arquivo" || m.tipo === "pdf" ? m.caminho : null;
  const linkQ = useLinkTemporario(arquivo);
  if (m.tipo === "texto") {
    return m.texto ? <div className="whitespace-pre-line text-sm leading-relaxed">{m.texto}</div>
      : <p className="text-sm text-muted-foreground">Conteúdo em preparação.</p>;
  }
  if (m.tipo === "video_link") {
    if (!m.link) return <p className="text-sm text-muted-foreground">Vídeo em preparação.</p>;
    const embed = embedVideo(m.link);
    return (
      <div className="space-y-2">
        {embed && (
          <div className="aspect-video overflow-hidden rounded-[10px] bg-black">
            <iframe src={embed} title={m.titulo} className="h-full w-full" allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
          </div>
        )}
        <a href={m.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-menta-400 hover:underline">
          <ExternalLink className="h-4 w-4" /> Abrir o vídeo em outra aba
        </a>
        {m.texto && <div className="whitespace-pre-line text-sm leading-relaxed">{m.texto}</div>}
      </div>
    );
  }
  if (!m.caminho) return <p className="text-sm text-muted-foreground">Arquivo em preparação.</p>;
  if (linkQ.isLoading) return <Carregando texto="Preparando o arquivo..." />;
  if (linkQ.error || !linkQ.data) return <ErroCarga erro={linkQ.error ?? "Arquivo indisponível."} />;
  return (
    <div className="space-y-2">
      {m.tipo === "video_arquivo" ? (
        <video src={linkQ.data} controls controlsList="nodownload" preload="metadata" className="aspect-video w-full rounded-[10px] bg-black" />
      ) : (
        <Button asChild variant="outline">
          <a href={linkQ.data} target="_blank" rel="noreferrer"><FileText /> Abrir o PDF</a>
        </Button>
      )}
      {m.texto && <div className="whitespace-pre-line text-sm leading-relaxed">{m.texto}</div>}
      <p className="text-xs text-muted-foreground">O link do arquivo vale por 1 hora. Se expirar, recarregue a página.</p>
    </div>
  );
}

function Teste({ trilha, perguntas, liberado, tentativa, onAprovado, onTentativa }: {
  trilha: TTrilha; perguntas: Pergunta[]; liberado: boolean; tentativa: { nota: number; aprovado: boolean; created_at: string } | null;
  onAprovado: () => void; onTentativa: () => void;
}) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [aguardar, setAguardar] = useState<string | null>(null);
  const libera = liberaNovaTentativaEm(tentativa as any);
  const respondidas = perguntas.filter((p) => respostas[p.id] !== undefined).length;

  async function enviar() {
    setEnviando(true);
    try {
      const { data, error } = await supabase.rpc("corrigir_teste", { p_trilha: trilha.id, p_respostas: respostas });
      if (error) throw error;
      const r = data as Resultado;
      setResultado(r);
      onTentativa();
      if (r.aprovado) {
        toast.success("Parabéns! Você foi aprovado e o certificado foi emitido.");
        onAprovado();
      } else {
        setRespostas({});
      }
    } catch (e) {
      const msg = mensagemErro(e);
      if (/refazer o teste/i.test(msg)) setAguardar(msg);
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Teste final</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {perguntas.length} perguntas · nota mínima {trilha.nota_minima}%. Se não passar, você pode refazer depois de {HORAS_NOVA_TENTATIVA} horas, sem limite de tentativas.
      </p>

      {resultado && (
        <div className={`mt-4 rounded-[10px] border p-4 text-sm ${resultado.aprovado ? "border-menta-500/40 bg-menta-500/10" : "border-warning/40 bg-warning/10"}`}>
          <p className="font-semibold">
            {resultado.aprovado ? "Aprovado!" : "Ainda não foi desta vez."} Nota {Number(resultado.nota).toLocaleString("pt-BR")}% ({resultado.acertos} de {resultado.total} acertos).
          </p>
          <p className="mt-1 text-muted-foreground">
            {resultado.aprovado
              ? "O certificado já está disponível para download nesta página."
              : `A nota mínima é ${resultado.nota_minima}%. Revise os módulos e tente de novo a partir de ${dataHora(new Date(Date.now() + HORAS_NOVA_TENTATIVA * 3_600_000))}.`}
          </p>
        </div>
      )}

      {!liberado ? (
        <p className="mt-4 flex items-center gap-2 rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" /> O teste é liberado depois que você concluir todos os módulos.
        </p>
      ) : perguntas.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">O teste desta trilha ainda está em preparação.</p>
      ) : resultado?.aprovado ? null : libera || aguardar || (resultado && !resultado.aprovado) ? (
        !resultado && (
          <p className="mt-4 flex items-center gap-2 rounded-[10px] bg-warning/10 px-3 py-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-warning" />
            {libera
              ? <>Última nota: {Number(tentativa?.nota ?? 0).toLocaleString("pt-BR")}%. Você poderá refazer o teste a partir de {dataHora(libera)}.</>
              : aguardar}
          </p>
        )
      ) : (
        <>
          {tentativa && !tentativa.aprovado && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw className="h-4 w-4" /> Nova tentativa. Última nota: {Number(tentativa.nota).toLocaleString("pt-BR")}%.</p>
          )}
          <ol className="mt-4 space-y-5">
            {perguntas.map((p, i) => (
              <li key={p.id}>
                <p className="text-sm font-semibold">{i + 1}. {p.enunciado}</p>
                <RadioGroup className="mt-2 gap-2" value={respostas[p.id] !== undefined ? String(respostas[p.id]) : ""}
                  onValueChange={(v) => setRespostas((r) => ({ ...r, [p.id]: Number(v) }))}>
                  {p.opcoes.map((o, k) => (
                    <label key={k} className="flex cursor-pointer gap-3 rounded-[10px] border border-white/10 p-3 text-sm has-[[data-state=checked]]:border-menta-500">
                      <RadioGroupItem value={String(k)} className="mt-0.5" />
                      <span>{o}</span>
                    </label>
                  ))}
                </RadioGroup>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={enviar} disabled={enviando || respondidas < perguntas.length}>
              {enviando ? <Loader2 className="animate-spin" /> : <Send />} Enviar respostas
            </Button>
            <span className="text-xs text-muted-foreground">{respondidas} de {perguntas.length} respondidas</span>
          </div>
        </>
      )}
    </section>
  );
}
