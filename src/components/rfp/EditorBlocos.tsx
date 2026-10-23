import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Eye, Loader2, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { chamarIA, type BlocoRfp, type ResultadoPagina } from "@/lib/ia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConteudoPaginaRfp } from "./ConteudoPaginaRfp";
import {
  blocosParaPrevia, entradaMontarPagina, montarBlocosPadrao, normalizarBlocosIA, parceirosNosBlocos, sincronizarBlocos,
  type ContextoPagina,
} from "./montarBlocos";
import type { Candidato } from "./tipos";

const NOMES_BLOCO: Record<string, string> = {
  abertura: "Abertura", categoria: "Categoria", aviso: "Aviso de relação comercial", consultor: "Contato do consultor",
};

// Etapa 3: montagem da página (IA ou padrão) e edição de todos os textos, com pré-visualização
// no mesmo renderizador da página pública.
export function EditorBlocos({
  ctx, blocos, onChange, candidatos, podeGerir,
}: {
  ctx: ContextoPagina;
  blocos: BlocoRfp[] | null;
  onChange: (b: BlocoRfp[]) => void;
  candidatos: Candidato[];
  podeGerir: boolean;
}) {
  const [montando, setMontando] = useState(false);
  const [falhaIA, setFalhaIA] = useState<string | null>(null);

  const semSelecao = ctx.categorias.length === 0;
  const naSelecao = ctx.categorias.flatMap((c) => c.parceiros.map((p) => `${c.categoria_id}:${p.parceiro_id}`)).sort().join("|");
  const desatualizado = !!blocos && parceirosNosBlocos(blocos).sort().join("|") !== naSelecao;

  async function montarComIA() {
    if (blocos && !confirm("Montar de novo substitui os textos editados. Continuar?")) return;
    setMontando(true);
    setFalhaIA(null);
    try {
      const r = await chamarIA<ResultadoPagina>("montar_pagina_rfp", entradaMontarPagina(ctx));
      onChange(normalizarBlocosIA(r?.blocos, ctx));
      toast.success("Página montada. Revise os textos antes de publicar.");
    } catch (e: any) {
      // Sem IA, a página é montada a partir das mesmas fichas
      setFalhaIA(e?.message ?? "Falha ao chamar a IA.");
      onChange(montarBlocosPadrao(ctx));
      toast.info("A IA não respondeu. A página foi montada a partir das fichas; revise os textos.");
    } finally {
      setMontando(false);
    }
  }

  function montarPadrao() {
    if (blocos && !confirm("Montar de novo substitui os textos editados. Continuar?")) return;
    onChange(montarBlocosPadrao(ctx));
  }

  function atualizar(i: number, novo: BlocoRfp) {
    onChange(blocos!.map((b, j) => (j === i ? novo : b)));
  }

  if (semSelecao) {
    return (
      <p className="rounded-[14px] border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
        Salve a seleção de parceiros na etapa de recomendação antes de montar a página.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {podeGerir && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={montarComIA} disabled={montando}>
            {montando ? <Loader2 className="animate-spin" /> : <Sparkles />} {blocos ? "Montar de novo com IA" : "Montar página com IA"}
          </Button>
          <Button variant="outline" onClick={montarPadrao} disabled={montando}><Wand2 /> Montar sem IA</Button>
        </div>
      )}
      {falhaIA && (
        <div className="flex gap-2 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>A IA não respondeu ({falhaIA}). Os textos abaixo vieram direto das fichas dos parceiros.</p>
        </div>
      )}
      {desatualizado && (
        <div className="flex flex-col gap-2 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> A seleção de parceiros mudou depois da montagem da página.</p>
          {podeGerir && (
            <Button size="sm" variant="outline" onClick={() => onChange(sincronizarBlocos(blocos!, ctx))}>
              <RefreshCw /> Ajustar à seleção
            </Button>
          )}
        </div>
      )}
      {!blocos && (
        <p className="rounded-[14px] border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
          A página ainda não foi montada.
        </p>
      )}
      {blocos && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0 space-y-4">
            {blocos.map((b, i) => (
              <EditorBloco key={i} bloco={b} onChange={(n) => atualizar(i, n)} disabled={!podeGerir} />
            ))}
          </div>
          <div className="min-w-0">
            <div className="xl:sticky xl:top-20">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Eye className="h-4 w-4" /> Pré-visualização</p>
              <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-[14px] border border-white/10 bg-background">
                <ConteudoPaginaRfp previa clienteNome={ctx.clienteNome} necessidadeResumida={ctx.necessidadeResumida}
                  blocos={blocosParaPrevia(blocos, candidatos)} />
              </div>
            </div>
          </div>
        </div>
      )}
      {blocos && podeGerir && (
        <p className="text-xs text-muted-foreground">O rascunho fica guardado neste navegador até a publicação.</p>
      )}
    </div>
  );
}

function EditorBloco({ bloco, onChange, disabled }: { bloco: BlocoRfp; onChange: (b: BlocoRfp) => void; disabled: boolean }) {
  return (
    <div className="space-y-3 rounded-[14px] border border-white/10 bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-menta-400">{NOMES_BLOCO[bloco.tipo]}</p>
      {(bloco.tipo === "abertura" || bloco.tipo === "categoria") && (
        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input value={bloco.titulo} disabled={disabled} onChange={(e) => onChange({ ...bloco, titulo: e.target.value })} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Texto</Label>
        <Textarea rows={3} value={bloco.texto} disabled={disabled} onChange={(e) => onChange({ ...bloco, texto: e.target.value } as BlocoRfp)} />
      </div>
      {bloco.tipo === "consultor" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={bloco.nome ?? ""} disabled={disabled} onChange={(e) => onChange({ ...bloco, nome: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={bloco.email ?? ""} disabled={disabled} onChange={(e) => onChange({ ...bloco, email: e.target.value || null })} />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={bloco.telefone ?? ""} disabled={disabled} onChange={(e) => onChange({ ...bloco, telefone: e.target.value || null })} />
          </div>
        </div>
      )}
      {bloco.tipo === "categoria" && bloco.parceiros.map((p, j) => {
        const mudar = (n: Partial<typeof p>) => onChange({ ...bloco, parceiros: bloco.parceiros.map((x, k) => (k === j ? { ...x, ...n } : x)) });
        return (
          <div key={p.parceiro_id} className="space-y-2 rounded-[10px] border border-white/10 p-3">
            <p className="font-semibold">{p.nome}</p>
            <div className="space-y-1.5">
              <Label>Texto do parceiro</Label>
              <Textarea rows={4} value={p.texto} disabled={disabled} onChange={(e) => mudar({ texto: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Destaques (um por linha)</Label>
              <Textarea rows={3} value={p.destaques.join("\n")} disabled={disabled} onChange={(e) => mudar({ destaques: e.target.value.split("\n") })} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
