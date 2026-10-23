import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Ban, CalendarClock, Copy, ExternalLink, Loader2, MessageCircle, MousePointerClick, Eye, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { BlocoRfp } from "@/lib/ia";
import { toastErro } from "@/lib/erros";
import { data, dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pilula } from "@/components/comum/Selos";
import { useEventos, situacaoCategoria, type OpcaoComNome } from "./dados";
import { blocosParaPublicar, parceirosNosBlocos, type CategoriaPagina } from "./montarBlocos";
import type { Candidato, PaginaRfp, PedidoRfp } from "./tipos";

type Resultado = { token: string; expira_em: string; excecoes: { categoria: string; selecionados: number; disponiveis: number }[]; avisos: string[] };

// Etapa 4: publicação, link, validade, renovação, revogação e acompanhamento de aberturas e cliques.
export function EtapaPublicar({
  pedido, opcoes, candidatos, categoriasPagina, nomeCategoria, pagina, blocos, podeGerir, selecaoPendente, onPublicado,
}: {
  pedido: PedidoRfp;
  opcoes: OpcaoComNome[];
  candidatos: Candidato[];
  categoriasPagina: CategoriaPagina[];
  nomeCategoria: (id: string) => string;
  pagina: PaginaRfp | null;
  blocos: BlocoRfp[] | null;
  podeGerir: boolean;
  selecaoPendente: boolean;
  onPublicado: () => void;
}) {
  const qc = useQueryClient();
  const [publicando, setPublicando] = useState(false);
  const [acao, setAcao] = useState<"renovar" | "revogar" | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const { data: eventos = [] } = useEventos(pagina?.id);

  // Pendências que impedem a publicação (o banco confere de novo)
  const problemas = useMemo(() => {
    const p: string[] = [];
    if (selecaoPendente) p.push("Há alterações não salvas na seleção de parceiros.");
    if (!categoriasPagina.length) p.push("Selecione ao menos um parceiro.");
    for (const cat of categoriasPagina) {
      const s = situacaoCategoria(cat.categoria_id, opcoes, candidatos);
      if (s.bloqueia) p.push(`${cat.nome}: selecione no mínimo 3 opções (há ${s.assinados} parceiros assinados). A Wise nunca recomenda nome único.`);
    }
    const naoElegiveis = opcoes.filter((o) => o.selecionado && !candidatos.some((c) => c.parceiro_id === o.parceiro_id));
    if (naoElegiveis.length) p.push(`Parceiros sem contrato assinado ou sem ficha publicada na seleção: ${naoElegiveis.map((o) => o.parceiro?.nome_fantasia).join(", ")}.`);
    if (!blocos) p.push("Monte a página na etapa anterior.");
    else {
      const naSelecao = categoriasPagina.flatMap((c) => c.parceiros.map((x) => `${c.categoria_id}:${x.parceiro_id}`)).sort().join("|");
      if (parceirosNosBlocos(blocos).sort().join("|") !== naSelecao) p.push("A página não corresponde à seleção atual. Ajuste a página na etapa anterior.");
    }
    return p;
  }, [selecaoPendente, categoriasPagina, opcoes, candidatos, blocos]);

  const excecoesPrevistas = categoriasPagina
    .map((c) => ({ nome: c.nome, ...situacaoCategoria(c.categoria_id, opcoes, candidatos) }))
    .filter((c) => c.excecao);

  async function invalidar() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pagina-rfp", pedido.id] }),
      qc.invalidateQueries({ queryKey: ["pedido-rfp", pedido.id] }),
      qc.invalidateQueries({ queryKey: ["pedidos-rfp"] }),
    ]);
  }

  async function publicar() {
    setPublicando(true);
    try {
      const { data: r, error } = await supabase.rpc("publicar_pagina_rfp", { p_pedido: pedido.id, p_blocos: blocosParaPublicar(blocos!) });
      if (error) throw error;
      setResultado(r as Resultado);
      toast.success(pagina?.publicada_em ? "Página publicada novamente." : "Página publicada.");
      onPublicado();
      await invalidar();
    } catch (e) {
      toastErro(e);
    } finally {
      setPublicando(false);
    }
  }

  async function renovar() {
    setAcao("renovar");
    try {
      const { error } = await supabase.rpc("renovar_pagina_rfp", { p_pedido: pedido.id });
      if (error) throw error;
      toast.success("Link renovado por mais 30 dias.");
      await invalidar();
    } catch (e) {
      toastErro(e);
    } finally {
      setAcao(null);
    }
  }

  async function revogar() {
    setAcao("revogar");
    try {
      const { error } = await supabase.rpc("revogar_pagina_rfp", { p_pedido: pedido.id });
      if (error) throw error;
      toast.success("Link revogado. O cliente passa a ver uma mensagem neutra com o seu contato.");
      await invalidar();
    } catch (e) {
      toastErro(e);
    } finally {
      setAcao(null);
    }
  }

  const publicada = !!pagina?.token && !!pagina.publicada_em;
  const link = publicada ? `${window.location.origin}/r/${pagina!.token}` : "";
  const expirada = publicada && !!pagina!.expira_em && new Date(pagina!.expira_em) < new Date();
  const msgWhatsApp = `Olá! Preparamos uma página com opções de fornecedores parceiros da Wise Makers para ${pedido.cliente_nome}: ${link}`;

  // Cliques por parceiro
  const cliques = eventos.filter((e) => e.tipo !== "abertura");
  const porParceiro = new Map<string, { nome: string; datas: { tipo: string; em: string }[] }>();
  for (const e of cliques) {
    const k = e.parceiro_id ?? "";
    const atual = porParceiro.get(k) ?? { nome: e.parceiro?.nome_fantasia ?? "Parceiro", datas: [] };
    atual.datas.push({ tipo: e.tipo, em: e.created_at });
    porParceiro.set(k, atual);
  }
  const excecoes = resultado?.excecoes ?? (pedido.excecoes ?? []);

  return (
    <div className="space-y-6">
      {podeGerir && (
        <section className="space-y-3 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h3 className="font-semibold">{publicada ? "Publicar alterações" : "Publicar a página"}</h3>
          {problemas.length > 0 ? (
            <ul className="space-y-1.5 text-sm text-red-300">
              {problemas.map((p) => <li key={p} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {p}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ao publicar, o link fica válido por 30 dias e cada parceiro apresentado recebe uma indicação com origem "pedido de RFP".
            </p>
          )}
          {excecoesPrevistas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excecoesPrevistas.map((c) => (
                <Pilula key={c.nome} tom="alerta">{c.nome}: exceção registrada, menos de 3 parceiros assinados nesta categoria</Pilula>
              ))}
            </div>
          )}
          <Button onClick={publicar} disabled={publicando || problemas.length > 0}>
            {publicando ? <Loader2 className="animate-spin" /> : <Send />} {publicada ? "Publicar novamente" : "Publicar página"}
          </Button>
        </section>
      )}

      {resultado && resultado.avisos?.length > 0 && (
        <section className="rounded-[14px] border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">Avisos da publicação</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{resultado.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      )}

      {excecoes.length > 0 && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4 text-sm">
          <p className="font-semibold">Exceções registradas</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {excecoes.map((e: any) => (
              <li key={e.categoria}>{e.categoria}: {e.selecionados} selecionados, {e.disponiveis} assinados (menos de 3 parceiros assinados nesta categoria)</li>
            ))}
          </ul>
        </section>
      )}

      {publicada && (
        <section className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Link do cliente</h3>
            {pagina!.revogada ? <Pilula tom="perigo">Revogado em {data(pagina!.revogada_em)}</Pilula>
              : expirada ? <Pilula tom="alerta">Expirou em {data(pagina!.expira_em)}</Pilula>
              : <Pilula tom="menta">Válido até {data(pagina!.expira_em)}</Pilula>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={async () => {
                try { await navigator.clipboard.writeText(link); toast.success("Link copiado."); } catch { toast.error("Não foi possível copiar. Selecione o link e copie."); }
              }}><Copy /> Copiar</Button>
              <Button variant="outline" asChild>
                <a href={link} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(msgWhatsApp)}`} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a>
            </Button>
            {podeGerir && (
              <>
                <Button variant="outline" onClick={renovar} disabled={!!acao}>
                  {acao === "renovar" ? <Loader2 className="animate-spin" /> : <CalendarClock />} Renovar por mais 30 dias
                </Button>
                {!pagina!.revogada && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-red-300" disabled={!!acao}><Ban /> Revogar</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revogar o link?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O cliente deixa de ver as opções e passa a ver uma mensagem neutra com o seu contato. Você pode renovar o link depois.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={revogar}>Revogar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Publicada em {dataHora(pagina!.publicada_em)}.</p>
        </section>
      )}

      {publicada && (
        <section className="space-y-3 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h3 className="font-semibold">Acompanhamento</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4 text-menta-400" /> {pagina!.aberturas} aberturas</span>
            <span className="inline-flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-menta-400" /> {cliques.length} cliques</span>
          </div>
          {categoriasPagina.map((cat) => (
            <div key={cat.categoria_id}>
              <p className="text-sm font-semibold text-muted-foreground">{nomeCategoria(cat.categoria_id)}</p>
              <ul className="mt-1 divide-y divide-white/5">
                {cat.parceiros.map((p) => {
                  const c = porParceiro.get(p.parceiro_id);
                  return (
                    <li key={p.parceiro_id} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:items-start sm:justify-between">
                      <span className="font-medium">{p.nome}</span>
                      {c ? (
                        <span className="text-muted-foreground sm:text-right">
                          {c.datas.length} {c.datas.length === 1 ? "clique" : "cliques"}:{" "}
                          {c.datas.map((d) => `${dataHora(d.em)} (${d.tipo === "clique_whatsapp" ? "WhatsApp" : "e-mail"})`).join(", ")}
                        </span>
                      ) : <span className="text-muted-foreground">Sem cliques</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
