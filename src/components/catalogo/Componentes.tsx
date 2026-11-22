import { useEffect, useState } from "react";
import { BadgePercent, Building2, CalendarDays, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { data, semTravessao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { useCategoriasLista, usePedirCondicao, useSalvarOferta, type Oferta, type OfertaCatalogo } from "./dados";

// Cartão de oferta do catálogo: a condição para membros em destaque
export function CartaoOferta({ o, aoPedir }: { o: OfertaCatalogo; aoPedir?: (o: OfertaCatalogo) => void }) {
  return (
    <article className="flex flex-col rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-neutro-300"><Building2 className="h-3.5 w-3.5" aria-hidden />{o.empresa}</p>
          <h3 className="mt-1 font-semibold leading-snug">{o.titulo}</h3>
        </div>
        {(o.categoria || o.categorias[0]) && <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-neutro-300">{o.categoria ?? o.categorias[0]}</span>}
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm font-semibold text-menta-300">
        <BadgePercent className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{o.condicao}
      </p>
      <p className="mt-3 text-sm text-neutro-100">{o.descricao}</p>
      {o.para_quem && <p className="mt-2 text-xs text-neutro-300"><span className="font-semibold">Para quem: </span>{o.para_quem}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {o.validade && <span className="inline-flex items-center gap-1 text-xs text-neutro-300"><CalendarDays className="h-3.5 w-3.5" aria-hidden />Até {data(o.validade)}</span>}
        {o.site && (
          <a href={/^https?:/.test(o.site) ? o.site : `https://${o.site}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-neutro-300 hover:text-white">
            Site <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        <span className="ml-auto">
          {o.propria ? <span className="text-xs text-neutro-300">Sua oferta</span>
            : aoPedir && <Button size="sm" onClick={() => aoPedir(o)}>Quero esta condição</Button>}
        </span>
      </div>
    </article>
  );
}

// Pedido de condição: confirma o compartilhamento do contato e devolve o protocolo
export function DialogoPedido({ oferta, fechar }: { oferta: OfertaCatalogo | null; fechar: () => void }) {
  const pedir = usePedirCondicao();
  const [mensagem, setMensagem] = useState("");
  const [protocolo, setProtocolo] = useState<string | null>(null);
  useEffect(() => { if (oferta) { setMensagem(""); setProtocolo(null); } }, [oferta]);
  return (
    <Dialog open={!!oferta} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-lg">
        {protocolo ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Pedido enviado</DialogTitle>
              <DialogDescription>Protocolo <strong className="font-mono text-foreground">{protocolo}</strong>. A {oferta?.empresa} recebeu o seu contato e vai falar com você. Você acompanha em Catálogo, Pedidos.</DialogDescription>
            </DialogHeader>
            <DialogFooter><Button onClick={fechar}>Fechar</Button></DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{oferta?.titulo}</DialogTitle>
              <DialogDescription>Condição para membros: {oferta?.condicao}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="pedido-msg">Mensagem para a {oferta?.empresa} (opcional)</Label>
              <Textarea id="pedido-msg" rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="O que você precisa e quando quer começar" />
            </div>
            <p className="text-xs text-neutro-300">Ao pedir, a {oferta?.empresa} recebe o seu nome, e-mail e telefone para falar com você. A Wise vê o pedido.</p>
            <DialogFooter>
              <Button variant="ghost" onClick={fechar}>Cancelar</Button>
              <Button disabled={pedir.isPending} onClick={() => oferta && pedir.mutate({ ofertaId: oferta.oferta_id, mensagem: semTravessao(mensagem.trim()) }, { onSuccess: (p) => setProtocolo(p) })}>
                {pedir.isPending && <Loader2 className="animate-spin" />}Pedir a condição
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const VAZIA: Partial<Oferta> = { titulo: "", descricao: "", para_quem: "", condicao: "", como_usar: "", validade: null, categoria_id: null };

// Criar ou editar oferta. Vai sempre para a validação da Wise; publicada e editada, volta para validação.
export function DialogoOferta({ aberto, oferta, parceiroId, fechar }: { aberto: boolean; oferta: Oferta | null; parceiroId: string; fechar: () => void }) {
  const salvar = useSalvarOferta();
  const cats = useCategoriasLista();
  const [f, setF] = useState<Partial<Oferta>>(VAZIA);
  const [tocado, setTocado] = useState(false);
  useEffect(() => { if (aberto) { setF(oferta ? { ...oferta } : { ...VAZIA }); setTocado(false); } }, [aberto, oferta]);
  const set = (k: keyof Oferta, v: any) => setF((x) => ({ ...x, [k]: v }));
  const erros = {
    titulo: (f.titulo ?? "").trim().length < 3 ? "Escreva um título com pelo menos 3 letras." : "",
    descricao: (f.descricao ?? "").trim().length < 10 ? "Descreva a oferta em pelo menos 10 letras." : "",
    condicao: (f.condicao ?? "").trim().length < 3 ? "Informe a condição para membros (por exemplo, 15% de desconto)." : "",
  };
  const valido = !erros.titulo && !erros.descricao && !erros.condicao;
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTocado(true);
    if (!valido) return;
    const limpo = (t?: string | null) => (t ? semTravessao(t.trim()) || null : null);
    const dados: Partial<Oferta> = {
      parceiro_id: parceiroId, titulo: limpo(f.titulo) ?? "", descricao: limpo(f.descricao) ?? "", para_quem: limpo(f.para_quem), condicao: limpo(f.condicao) ?? "",
      como_usar: limpo(f.como_usar), validade: f.validade || null, categoria_id: f.categoria_id || null,
      ...(oferta && ["pausada", "recusada", "rascunho"].includes(oferta.estado) ? { estado: "em_validacao" as const } : {}),
    };
    salvar.mutate({ id: oferta?.id, dados }, { onSuccess: fechar });
  }
  const Erro = ({ k }: { k: keyof typeof erros }) => (tocado && erros[k] ? <p id={`of-${k}-erro`} className="text-xs text-red-300">{erros[k]}</p> : null);
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{oferta ? "Editar oferta" : "Nova oferta"}</DialogTitle>
          <DialogDescription>Toda oferta passa pela validação da Wise antes de aparecer no catálogo. A condição para membros é obrigatória.</DialogDescription>
        </DialogHeader>
        <form id="form-oferta" onSubmit={enviar} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="of-titulo">O que você oferece</Label>
            <Input id="of-titulo" value={f.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} aria-invalid={tocado && !!erros.titulo} aria-describedby="of-titulo-erro" />
            <Erro k="titulo" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="of-condicao">Condição só para membros</Label>
            <Input id="of-condicao" value={f.condicao ?? ""} onChange={(e) => set("condicao", e.target.value)} placeholder="Ex.: 15% de desconto no primeiro contrato" aria-invalid={tocado && !!erros.condicao} aria-describedby="of-condicao-erro" />
            <Erro k="condicao" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="of-desc">Descrição</Label>
            <Textarea id="of-desc" rows={4} value={f.descricao ?? ""} onChange={(e) => set("descricao", e.target.value)} aria-invalid={tocado && !!erros.descricao} aria-describedby="of-descricao-erro" />
            <Erro k="descricao" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="of-para">Para quem serve (opcional)</Label>
              <Input id="of-para" value={f.para_quem ?? ""} onChange={(e) => set("para_quem", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="of-val">Válida até (opcional)</Label>
              <Input id="of-val" type="date" value={f.validade ?? ""} onChange={(e) => set("validade", e.target.value || null)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-cat">Categoria (opcional, ajuda na busca)</Label>
              <Select value={f.categoria_id ?? "__sem__"} onValueChange={(v) => set("categoria_id", v === "__sem__" ? null : v)}>
                <SelectTrigger id="of-cat"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__sem__">Sem categoria</SelectItem>
                  {(cats.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="of-como">Como usar (opcional)</Label>
              <Input id="of-como" value={f.como_usar ?? ""} onChange={(e) => set("como_usar", e.target.value)} placeholder="Ex.: peça a condição e falamos com você em até 2 dias úteis" />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
          <Button type="submit" form="form-oferta" disabled={salvar.isPending}>{salvar.isPending && <Loader2 className="animate-spin" />}{oferta ? "Salvar e enviar para validação" : "Enviar para validação"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FiltroCategorias({ categorias, ativa, aoMudar }: { categorias: string[]; ativa: string; aoMudar: (c: string) => void }) {
  if (categorias.length < 2) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="Categoria">
      {["", ...categorias].map((c) => (
        <button key={c || "todas"} type="button" role="radio" aria-checked={ativa === c} onClick={() => aoMudar(c)}
          className={cn("min-h-9 shrink-0 rounded-full border border-white/10 px-3 text-sm text-neutro-300 hover:text-white", ativa === c && "border-menta-500/50 bg-menta-500/10 text-white")}>
          {c || "Todas"}
        </button>
      ))}
    </div>
  );
}
