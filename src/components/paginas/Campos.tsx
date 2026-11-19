import { useId, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Item, Pergunta } from "@/lib/paginas";
import { cn } from "@/lib/utils";

// Peças do editor das páginas públicas: cartão, campo de texto com aviso de travessão, listas reordenáveis e barra de salvar.

export const TEM_TRAVESSAO = /[\u2013\u2014]/;

export function Cartao({ titulo, descricao, acoes, children, className }: {
  titulo: string; descricao?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{titulo}</h2>
          {descricao && <p className="mt-1 max-w-[68ch] text-sm text-neutro-300">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

// Campo de texto com rótulo, ajuda e o aviso de travessão (proibido em qualquer texto das páginas)
export function CampoTexto({ rotulo, valor, aoMudar, longo, ajuda, desligado, placeholder, maximo = 600, tipo }: {
  rotulo: string; valor: string; aoMudar: (v: string) => void; longo?: boolean; ajuda?: ReactNode; desligado?: boolean;
  placeholder?: string; maximo?: number; tipo?: string;
}) {
  const id = useId();
  const erro = TEM_TRAVESSAO.test(valor) ? "Troque o travessão por vírgula, dois-pontos ou ponto." : "";
  const descr = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">{rotulo}</Label>
      {longo ? (
        <Textarea id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} disabled={desligado} placeholder={placeholder}
          rows={Math.min(8, Math.max(2, Math.ceil(valor.length / 60)))} maxLength={maximo} aria-invalid={!!erro} aria-describedby={descr}
          className="min-h-[60px] [field-sizing:content] max-h-[480px]" />
      ) : (
        <Input id={id} type={tipo} value={valor} onChange={(e) => aoMudar(e.target.value)} disabled={desligado} placeholder={placeholder}
          maxLength={maximo} aria-invalid={!!erro} aria-describedby={descr} />
      )}
      {erro ? <p id={`${id}-erro`} className="text-xs text-destructive">{erro}</p>
        : ajuda ? <p id={`${id}-ajuda`} className="text-xs text-neutro-300">{ajuda}</p> : null}
    </div>
  );
}

function mover<T>(lista: T[], i: number, d: -1 | 1) {
  const j = i + d;
  if (j < 0 || j >= lista.length) return lista;
  const n = [...lista];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

function BotoesOrdem({ i, total, nome, aoMover, aoRemover, desligado }: {
  i: number; total: number; nome: string; aoMover: (d: -1 | 1) => void; aoRemover: () => void; desligado?: boolean;
}) {
  if (desligado) return null;
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => aoMover(-1)} disabled={i === 0} aria-label={`Subir ${nome} ${i + 1}`}><ArrowUp className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => aoMover(1)} disabled={i === total - 1} aria-label={`Descer ${nome} ${i + 1}`}><ArrowDown className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-neutro-300 hover:text-red-300" onClick={aoRemover} aria-label={`Remover ${nome} ${i + 1}`}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

// Lista de itens (título e, quando houver, texto): incluir, editar, remover e reordenar
export function ListaItens({ rotulo, itens, aoMudar, comTexto, nomeItem, desligado }: {
  rotulo: string; itens: Item[]; aoMudar: (v: Item[]) => void; comTexto: boolean; nomeItem: string; desligado?: boolean;
}) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-[13px] font-medium">{rotulo}</legend>
      {itens.length === 0 && <p className="text-sm text-neutro-300">Nenhum item. Sem itens, a página usa a lista padrão.</p>}
      <ol className="space-y-3">
        {itens.map((it, i) => (
          <li key={i} className="rounded-[10px] border border-white/10 bg-background/40 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-neutro-300">{i + 1}.</span>
              <div className="min-w-0 flex-1 space-y-2">
                <CampoTexto rotulo={comTexto ? "Título" : `Texto do item`} valor={it.titulo} desligado={desligado} maximo={200}
                  aoMudar={(v) => aoMudar(itens.map((x, k) => (k === i ? { ...x, titulo: v } : x)))} />
                {comTexto && (
                  <CampoTexto rotulo="Texto" valor={it.texto} longo desligado={desligado}
                    aoMudar={(v) => aoMudar(itens.map((x, k) => (k === i ? { ...x, texto: v } : x)))} />
                )}
              </div>
              <BotoesOrdem i={i} total={itens.length} nome={nomeItem} desligado={desligado}
                aoMover={(d) => aoMudar(mover(itens, i, d))} aoRemover={() => aoMudar(itens.filter((_, k) => k !== i))} />
            </div>
          </li>
        ))}
      </ol>
      {!desligado && (
        <Button type="button" variant="outline" size="sm" onClick={() => aoMudar([...itens, { titulo: "", texto: "" }])}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />Incluir {nomeItem}
        </Button>
      )}
    </fieldset>
  );
}

export function ListaPerguntasEditor({ perguntas, aoMudar, desligado }: { perguntas: Pergunta[]; aoMudar: (v: Pergunta[]) => void; desligado?: boolean }) {
  return (
    <div className="space-y-3">
      {perguntas.length === 0 && (
        <p className="rounded-[10px] border border-dashed border-white/15 p-4 text-sm text-neutro-300">
          Nenhuma pergunta. Sem perguntas, a página volta às perguntas padrão. Para não mostrar a seção, desligue "Perguntas frequentes" nas seções.
        </p>
      )}
      <ol className="space-y-3">
        {perguntas.map((q, i) => (
          <li key={i} className="rounded-[10px] border border-white/10 bg-background/40 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-neutro-300">{i + 1}.</span>
              <div className="min-w-0 flex-1 space-y-2">
                <CampoTexto rotulo="Pergunta" valor={q.pergunta} desligado={desligado} maximo={200}
                  aoMudar={(v) => aoMudar(perguntas.map((x, k) => (k === i ? { ...x, pergunta: v } : x)))} />
                <CampoTexto rotulo="Resposta" valor={q.resposta} longo desligado={desligado} maximo={1200}
                  aoMudar={(v) => aoMudar(perguntas.map((x, k) => (k === i ? { ...x, resposta: v } : x)))} />
              </div>
              <BotoesOrdem i={i} total={perguntas.length} nome="pergunta" desligado={desligado}
                aoMover={(d) => aoMudar(mover(perguntas, i, d))} aoRemover={() => aoMudar(perguntas.filter((_, k) => k !== i))} />
            </div>
          </li>
        ))}
      </ol>
      {!desligado && (
        <Button type="button" variant="outline" size="sm" onClick={() => aoMudar([...perguntas, { pergunta: "", resposta: "" }])}>
          <Plus className="mr-1 h-4 w-4" aria-hidden />Incluir pergunta
        </Button>
      )}
    </div>
  );
}

// Barra de salvar: fica presa ao pé da tela enquanto há mudança não salva
export function BarraSalvar({ sujo, salvando, aoSalvar, aoDescartar, texto = "Salvar alterações", aviso }: {
  sujo: boolean; salvando: boolean; aoSalvar: () => void; aoDescartar: () => void; texto?: string; aviso?: string;
}) {
  return (
    <div className={cn("z-10 rounded-[14px] border bg-background/95 px-4 py-3 backdrop-blur transition-colors",
      sujo ? "sticky bottom-2 border-menta-500/40" : "border-white/10")} role="region" aria-label="Salvar">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutro-300" aria-live="polite">{sujo ? (aviso ?? "Há mudanças não salvas. Elas vão ao ar assim que você salvar.") : "Tudo salvo."}</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={aoDescartar} disabled={!sujo || salvando}><Undo2 className="mr-1 h-4 w-4" aria-hidden />Descartar</Button>
          <Button type="button" onClick={aoSalvar} disabled={!sujo || salvando}>
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}{texto}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Esqueleto com o desenho do editor (cartões com campos)
export function EsqueletoEditor() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-[14px] border border-white/10 bg-card p-5 motion-safe:animate-pulse">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="mt-2 h-3 w-72 max-w-full rounded bg-white/5" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="h-10 rounded-[10px] bg-white/5" />
            <div className="h-10 rounded-[10px] bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
