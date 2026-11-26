import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Globe, GlobeLock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { fonteVideo, type FormatoVideo } from "@/lib/landing";
import { FAIXAS_FATURAMENTO } from "@/lib/diagnostico";
import {
  META_CLIENTE, META_PARCEIROS, PADRAO_CLIENTE, PADRAO_PARCEIROS, compactarConteudo, montarConteudo, perfilReuniao, pisoFaixa, reais, resolverDados,
  temTravessao, type BlocoCliente, type BlocoParceiros, type ConteudoPronto, type ResumoCases,
} from "@/lib/paginas";
import { Pilula } from "@/components/comum/Selos";
import { ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarraSalvar, CampoTexto, Cartao, EsqueletoEditor } from "@/components/paginas/Campos";
import { EditorBlocos, EditorPerguntas, QuadroMarcadores } from "@/components/paginas/EditorBlocos";
import {
  CHAVES, useConfigCliente, useConfigComunidade, useConfigParceiros, useFormulario, useLinkExemplo, useResumoCases, type ConfigCliente,
} from "@/components/paginas/dados";

type Tabela = "config_landing" | "config_landing_cliente" | "config_comunidade";
const CHAVE_TABELA = { config_landing: CHAVES.parceiros, config_landing_cliente: CHAVES.cliente, config_comunidade: CHAVES.comunidade };

// Publicar ou tirar do ar: grava na hora (tirar do ar pede confirmação)
function CartaoPublicacao({ tabela, publicada, url, semLink, desligado, nome }: {
  tabela: Tabela; publicada: boolean; url: string | null; semLink?: string; desligado: boolean; nome: string;
}) {
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function mudar(v: boolean) {
    setSalvando(true);
    const { error } = await (supabase.from(tabela as any) as any).update({ publicada: v }).eq("id", 1);
    setSalvando(false);
    setConfirmar(false);
    if (error) return toastErro(error);
    toast.success(v ? `A ${nome} está no ar.` : `A ${nome} saiu do ar.`);
    qc.invalidateQueries({ queryKey: CHAVE_TABELA[tabela] });
  }

  return (
    <Cartao titulo="Publicação"
      descricao={publicada ? "A página está no ar e recebe cadastros." : "A página está fora do ar: quem abrir o link vê um aviso e não consegue se cadastrar."}
      acoes={<Pilula tom={publicada ? "menta" : "alerta"}>{publicada ? "No ar" : "Fora do ar"}</Pilula>}>
      <div className="flex flex-wrap items-center gap-2">
        {!desligado && (publicada ? (
          <Button variant="outline" onClick={() => setConfirmar(true)} disabled={salvando}>
            <GlobeLock className="mr-1.5 h-4 w-4" aria-hidden />Tirar do ar
          </Button>
        ) : (
          <Button onClick={() => mudar(true)} disabled={salvando}>
            {salvando ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : <Globe className="mr-1.5 h-4 w-4" aria-hidden />}Publicar
          </Button>
        ))}
        {url ? (
          <Button asChild variant="ghost">
            <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />Ver a página<span className="sr-only"> (abre em outra aba)</span></a>
          </Button>
        ) : semLink ? <p className="text-sm text-neutro-300">{semLink}</p> : null}
      </div>
      {!desligado && <p className="text-xs text-neutro-300">A página mostra o que está salvo. Salve as mudanças antes de abrir.</p>}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tirar a {nome} do ar?</AlertDialogTitle>
            <AlertDialogDescription>Quem abrir o link passa a ver um aviso de página fora do ar e não consegue se cadastrar. Você pode publicar de novo quando quiser.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter no ar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); mudar(false); }} disabled={salvando}>
              {salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}Tirar do ar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Cartao>
  );
}

function CamposVideo({ url, formato, aoMudarUrl, aoMudarFormato, desligado, semVideo = "Vazio, a página mostra a capa com o Igor." }: {
  url: string; formato: FormatoVideo; aoMudarUrl: (v: string) => void; aoMudarFormato: (v: FormatoVideo) => void; desligado: boolean; semVideo?: string;
}) {
  const invalido = url.trim() !== "" && !fonteVideo(url.trim());
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoTexto rotulo="Endereço do vídeo" valor={url} aoMudar={aoMudarUrl} desligado={desligado} placeholder="https://youtu.be/..." maximo={500}
        ajuda={invalido ? "Use um link do YouTube, do Vimeo ou de um arquivo que comece com https://." : `YouTube, Vimeo ou arquivo de vídeo. ${semVideo}`} />
      <div className="space-y-1.5">
        <Label htmlFor="formato-video" className="text-[13px] font-medium">Formato do vídeo</Label>
        <Select value={formato} onValueChange={(v) => aoMudarFormato(v as FormatoVideo)} disabled={desligado}>
          <SelectTrigger id="formato-video"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automático (Shorts em pé, os demais 16:9)</SelectItem>
            <SelectItem value="horizontal">Horizontal 16:9</SelectItem>
            <SelectItem value="vertical">Vertical 9:16</SelectItem>
            <SelectItem value="quadrado">Quadrado 1:1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Valores de referência (diagnóstico e Wise Hub): valem para as duas páginas, com salvar próprio
export function CartaoValores({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigCliente();
  const dados = useMemo(() => (cfg.data ? { diagnostico: String(Number(cfg.data.valor_diagnostico)), hub: String(Number(cfg.data.valor_hub)) } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);
  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!form.f) return null;
  const d = Number(form.f.diagnostico.replace(",", "."));
  const h = Number(form.f.hub.replace(",", "."));
  const validos = Number.isFinite(d) && Number.isFinite(h) && d >= 0 && h >= 0 && form.f.diagnostico !== "" && form.f.hub !== "";

  async function salvar() {
    if (!validos) return toast.error("Informe os dois valores em reais, sem negativo.");
    setSalvando(true);
    const { error } = await supabase.from("config_landing_cliente").update({ valor_diagnostico: d, valor_hub: h }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Valores de referência atualizados nas duas páginas.");
    qc.invalidateQueries({ queryKey: CHAVES.cliente });
  }

  return (
    <Cartao titulo="Valores de referência" descricao="O que o cliente do parceiro receberia se contratasse à parte. Valem para as duas páginas e entram nos textos pelos marcadores.">
      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto rotulo="Diagnóstico e plano (R$)" valor={form.f.diagnostico} tipo="number" desligado={desligado}
          aoMudar={(v) => form.set("diagnostico", v)} />
        <CampoTexto rotulo="Wise Hub (R$)" valor={form.f.hub} tipo="number" desligado={desligado} aoMudar={(v) => form.set("hub", v)} />
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium">Total de referência</p>
          <p className="flex h-10 items-center text-[22px] font-bold tabular-nums">{validos ? reais(d + h) : "Confira os valores"}</p>
        </div>
      </div>
      {!desligado && form.sujo && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={form.descartar} disabled={salvando}>Descartar</Button>
          <Button onClick={salvar} disabled={salvando || !validos}>{salvando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}Salvar valores</Button>
        </div>
      )}
    </Cartao>
  );
}

function validarComum(conteudo: unknown, video: string) {
  if (temTravessao(conteudo)) return "Há travessão ou meia-risca em algum texto. Troque por vírgula, dois-pontos ou ponto (o campo aparece marcado).";
  if (video.trim() && !fonteVideo(video.trim())) return "O endereço do vídeo não é do YouTube, do Vimeo nem um arquivo https.";
  return "";
}

const RESUMO_VAZIO: ResumoCases = { itens: [], quantidade: 0, media: null };

// ---------------------------------------------------------------------------
// Página dos parceiros (/parceiros)
// ---------------------------------------------------------------------------
type FormParceiros = {
  video_url: string; video_formato: FormatoVideo; modo_cadastro: "fila"; agenda_url: string; conteudo: ConteudoPronto<BlocoParceiros>;
};

export function AbaParceiros({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigParceiros();
  const cli = useConfigCliente();
  const resumo = useResumoCases();
  const dados = useMemo<FormParceiros | null>(() => (cfg.data ? {
    video_url: cfg.data.video_url ?? "", video_formato: cfg.data.video_formato ?? "auto", modo_cadastro: cfg.data.modo_cadastro ?? "fila",
    agenda_url: cfg.data.agenda_url ?? "", conteudo: montarConteudo(PADRAO_PARCEIROS, cfg.data.conteudo),
  } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);
  const vars = useMemo(() => resolverDados({
    valores: cli.data ? { diagnostico: Number(cli.data.valor_diagnostico), hub: Number(cli.data.valor_hub), total: Number(cli.data.valor_diagnostico) + Number(cli.data.valor_hub) } : null,
    icp: cli.data ? { min_vendedores: cli.data.icp_min_vendedores, faturamento_min: cli.data.icp_faturamento_min } : null,
    cases: resumo.data ?? RESUMO_VAZIO,
  }).vars, [cli.data, resumo.data]);

  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!cfg.data || !form.f) return <Vazio titulo="Configuração da página não encontrada">A migração da página dos parceiros ainda não foi aplicada neste banco.</Vazio>;
  const f = form.f;

  async function salvar() {
    const erro = validarComum(f.conteudo, f.video_url) || (f.agenda_url.trim() && !/^https:\/\//.test(f.agenda_url.trim()) ? "A agenda precisa ser um link https://." : "");
    if (erro) return toast.error(erro);
    setSalvando(true);
    const { error } = await supabase.from("config_landing").update({
      video_url: f.video_url.trim() || null, video_formato: f.video_formato, modo_cadastro: f.modo_cadastro, agenda_url: f.agenda_url.trim() || null,
      conteudo: compactarConteudo(PADRAO_PARCEIROS, f.conteudo),
    }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Página dos parceiros atualizada.");
    qc.invalidateQueries({ queryKey: CHAVES.parceiros });
  }

  return (
    <div className="space-y-4">
      <CartaoPublicacao tabela="config_landing" publicada={cfg.data.publicada} url="/parceiros" desligado={desligado} nome="página dos parceiros" />

      <Cartao titulo="Vídeo do topo">
        <CamposVideo url={f.video_url} formato={f.video_formato} desligado={desligado}
          aoMudarUrl={(v) => form.set("video_url", v)} aoMudarFormato={(v) => form.set("video_formato", v)} />
      </Cartao>

      <Cartao titulo="Entrada pela página" descricao="Um cadastro só, para qualquer empresa. Todo cadastro entra na fila (Cadastros) e avisa o gerente com o perfil declarado. Cliente do grupo e empresa da comunidade: o gerente confere e adiciona. Parceiro: WhatsApp e conversa de entrada de 45 minutos antes da aprovação.">
        <CampoTexto rotulo="Agenda da conversa de entrada" valor={f.agenda_url} aoMudar={(v) => form.set("agenda_url", v)} desligado={desligado}
          placeholder="https://calendar.app.google/..." maximo={500} ajuda="Página de agendamento usada para marcar a conversa de 45 minutos com o candidato." />
      </Cartao>

      <CartaoValores desligado={desligado} />

      <EditorBlocos meta={META_PARCEIROS} padrao={PADRAO_PARCEIROS} valor={f.conteudo} desligado={desligado}
        aoMudar={(c) => form.set("conteudo", c)} />
      <EditorPerguntas padrao={PADRAO_PARCEIROS} valor={f.conteudo} desligado={desligado} aoMudar={(c) => form.set("conteudo", c)} />
      <QuadroMarcadores vars={vars} />

      {!desligado && <BarraSalvar sujo={form.sujo} salvando={salvando} aoSalvar={salvar} aoDescartar={form.descartar} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página do cliente do parceiro (/c/:codigo)
// ---------------------------------------------------------------------------
type FormCliente = {
  video_url: string; video_formato: FormatoVideo; agenda_url: string; hub_url: string; icp_min_vendedores: string; icp_faturamento_min: string;
  conteudo: ConteudoPronto<BlocoCliente>;
};

function valoresDe(c: ConfigCliente | null | undefined) {
  if (!c) return null;
  const diagnostico = Number(c.valor_diagnostico);
  const hub = Number(c.valor_hub);
  return { diagnostico, hub, total: diagnostico + hub };
}

export function AbaCliente({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigCliente();
  const resumo = useResumoCases();
  const link = useLinkExemplo();
  const dados = useMemo<FormCliente | null>(() => (cfg.data ? {
    video_url: cfg.data.video_url ?? "", video_formato: cfg.data.video_formato ?? "auto", agenda_url: cfg.data.agenda_url ?? "", hub_url: cfg.data.hub_url,
    icp_min_vendedores: String(cfg.data.icp_min_vendedores), icp_faturamento_min: cfg.data.icp_faturamento_min ?? "sem",
    conteudo: montarConteudo(PADRAO_CLIENTE, cfg.data.conteudo),
  } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);
  const minVend = Math.max(1, Math.min(1000, parseInt(form.f?.icp_min_vendedores ?? "", 10) || 1));
  const icpAtual = { min_vendedores: minVend, faturamento_min: form.f && form.f.icp_faturamento_min !== "sem" ? form.f.icp_faturamento_min : null };
  const vars = useMemo(() => resolverDados({ valores: valoresDe(cfg.data), icp: icpAtual, cases: resumo.data ?? RESUMO_VAZIO }).vars,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cfg.data, resumo.data, icpAtual.min_vendedores, icpAtual.faturamento_min]);

  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!cfg.data || !form.f) return <Vazio titulo="Configuração da página não encontrada">A migração da página do cliente ainda não foi aplicada neste banco.</Vazio>;
  const f = form.f;

  async function salvar() {
    const erro = validarComum(f.conteudo, f.video_url)
      || (f.agenda_url.trim() && !/^https:\/\//.test(f.agenda_url.trim()) ? "A agenda precisa ser um link https://." : "")
      || (!/^https:\/\//.test(f.hub_url.trim()) ? "O link do Wise Hub precisa começar com https://." : "")
      || (!/^\d{1,4}$/.test(f.icp_min_vendedores) || Number(f.icp_min_vendedores) < 1 ? "Informe o número mínimo de vendedores (1 ou mais)." : "");
    if (erro) return toast.error(erro);
    setSalvando(true);
    const { error } = await supabase.from("config_landing_cliente").update({
      video_url: f.video_url.trim() || null, video_formato: f.video_formato, agenda_url: f.agenda_url.trim() || null, hub_url: f.hub_url.trim(),
      icp_min_vendedores: Number(f.icp_min_vendedores), icp_faturamento_min: f.icp_faturamento_min === "sem" ? null : f.icp_faturamento_min,
      conteudo: compactarConteudo(PADRAO_CLIENTE, f.conteudo),
    }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Página do cliente atualizada.");
    qc.invalidateQueries({ queryKey: CHAVES.cliente });
  }

  return (
    <div className="space-y-4">
      <CartaoPublicacao tabela="config_landing_cliente" publicada={cfg.data.publicada} desligado={desligado} nome="página do cliente"
        url={link.data ? `/c/${link.data}` : null}
        semLink={link.isLoading ? "Procurando um link de parceiro..." : link.error ? "Não foi possível buscar um link para abrir a página." : "A página abre pelo link de um parceiro. Nenhum link ativo ainda."} />

      <Cartao titulo="Vídeo do topo">
        <CamposVideo url={f.video_url} formato={f.video_formato} desligado={desligado}
          aoMudarUrl={(v) => form.set("video_url", v)} aoMudarFormato={(v) => form.set("video_formato", v)} />
      </Cartao>

      <Cartao titulo="Perfil para a reunião de diagnóstico (ICP)"
        descricao="Quem está no perfil escolhe o horário da reunião de cerca de 2 horas; os demais fazem o autodiagnóstico online e recebem o link do Wise Hub.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Vendedores, no mínimo" valor={f.icp_min_vendedores} tipo="number" desligado={desligado}
            aoMudar={(v) => form.set("icp_min_vendedores", v.replace(/\D/g, "").slice(0, 4))} ajuda="3 = três vendedores ou mais." />
          <div className="space-y-1.5">
            <Label htmlFor="icp-fat" className="text-[13px] font-medium">Faturamento mínimo por mês</Label>
            <Select value={f.icp_faturamento_min} onValueChange={(v) => form.set("icp_faturamento_min", v)} disabled={desligado}>
              <SelectTrigger id="icp-fat"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem">Sem mínimo</SelectItem>
                {FAIXAS_FATURAMENTO.filter((x) => x.valor !== "ate_100k").map((x) => <SelectItem key={x.valor} value={x.valor}>{pisoFaixa(x.valor)} por mês</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="rounded-[10px] border border-white/10 bg-background/40 px-3 py-2 text-sm">
          <span className="text-neutro-300">Texto gerado nas páginas: </span>para empresas {perfilReuniao(icpAtual)}.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Agenda da reunião de diagnóstico" valor={f.agenda_url} aoMudar={(v) => form.set("agenda_url", v)} desligado={desligado}
            placeholder="https://calendar.app.google/..." maximo={500} ajuda="Quem está no perfil escolhe o horário aqui. Vazio, a página avisa que a equipe chama no WhatsApp." />
          <CampoTexto rotulo="Link do Wise Hub depois do autodiagnóstico" valor={f.hub_url} aoMudar={(v) => form.set("hub_url", v)} desligado={desligado} maximo={500} />
        </div>
      </Cartao>

      <CartaoValores desligado={desligado} />

      <EditorBlocos meta={META_CLIENTE} padrao={PADRAO_CLIENTE} valor={f.conteudo} desligado={desligado} aoMudar={(c) => form.set("conteudo", c)} />
      <EditorPerguntas padrao={PADRAO_CLIENTE} valor={f.conteudo} desligado={desligado} aoMudar={(c) => form.set("conteudo", c)} />
      <QuadroMarcadores vars={vars} />

      {!desligado && <BarraSalvar sujo={form.sujo} salvando={salvando} aoSalvar={salvar} aoDescartar={form.descartar} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Termo de uso do portal (config_comunidade): aceito por toda empresa no cadastro da página do portal
// ---------------------------------------------------------------------------
export function CartaoTermoUso({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigComunidade();
  const dados = useMemo(() => (cfg.data ? { termo_uso_versao: cfg.data.termo_uso_versao, termo_uso_texto: cfg.data.termo_uso_texto } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);
  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!cfg.data || !form.f) return null;
  const f = form.f;
  const termoMudou = f.termo_uso_texto !== dados!.termo_uso_texto && f.termo_uso_versao === dados!.termo_uso_versao;

  async function salvar() {
    const erro = (temTravessao(f.termo_uso_texto) ? "Há travessão ou meia-risca no termo de uso." : "")
      || (!f.termo_uso_texto.trim() ? "O termo de uso não pode ficar vazio." : "") || (!/^\d{4}-\d{2}-\d{2}$/.test(f.termo_uso_versao) ? "Informe a data da versão do termo." : "")
      || (termoMudou ? "Mude a data da versão: o texto do termo de uso mudou." : "");
    if (erro) return toast.error(erro);
    setSalvando(true);
    const { error } = await (supabase.from("config_comunidade" as any) as any).update({ termo_uso_versao: f.termo_uso_versao, termo_uso_texto: f.termo_uso_texto.trim() }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Termo de uso atualizado.");
    qc.invalidateQueries({ queryKey: CHAVES.comunidade });
  }

  return (
    <div className="space-y-4">
      <Cartao titulo="Termo de uso do portal" descricao="Toda empresa aceita este termo no cadastro da página do portal; quem quer ser parceiro aceita também o termo de adesão. Mudou o texto, mude a versão.">
        <div className="sm:w-56">
          <CampoTexto rotulo="Versão" tipo="date" valor={f.termo_uso_versao} aoMudar={(v) => form.set("termo_uso_versao", v)} desligado={desligado} maximo={10}
            ajuda={termoMudou ? "O texto mudou: mude a data da versão para salvar." : undefined} />
        </div>
        <CampoTexto rotulo="Texto do termo" longo valor={f.termo_uso_texto} aoMudar={(v) => form.set("termo_uso_texto", v)} desligado={desligado} maximo={60000}
          ajuda="Parágrafos separados por uma linha em branco." />
      </Cartao>
      {!desligado && <BarraSalvar sujo={form.sujo} salvando={salvando} aoSalvar={salvar} aoDescartar={form.descartar} texto="Salvar termo de uso" />}
    </div>
  );
}
