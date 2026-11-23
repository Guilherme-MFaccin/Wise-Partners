import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgePercent, CalendarDays, CheckCircle2, ExternalLink, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { data, semTravessao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { useCategoriasLista, usePedirCondicao, usePedirParceria, useSalvarOferta, type Oferta, type OfertaCatalogo } from "./dados";

// Logo da empresa (bucket público "logos") ou as iniciais, quando não há logo ou a imagem não carrega
export function AvatarEmpresa({ nome, caminho, tamanho = "md" }: { nome: string; caminho: string | null; tamanho?: "md" | "lg" }) {
  const [falhou, setFalhou] = useState(false);
  const url = caminho && !falhou ? supabase.storage.from("logos").getPublicUrl(caminho).data.publicUrl : null;
  const iniciais = nome.split(/\s+/).filter((p) => p.length > 2 || /^[A-Z0-9]/.test(p)).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || nome.slice(0, 2).toUpperCase();
  const lado = tamanho === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-sm";
  return url ? (
    <img src={url} alt="" onError={() => setFalhou(true)} className={cn("shrink-0 rounded-[10px] border border-white/10 bg-white object-contain p-1", lado)} />
  ) : (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 font-semibold text-neutro-100", lado)}>{iniciais}</span>
  );
}

// A condição para membros: em destaque quando liberada; travada (sem o texto) para quem vê a vitrine
export function Condicao({ o, compacta }: { o: OfertaCatalogo; compacta?: boolean }) {
  if (o.liberada && o.condicao) {
    return (
      <p className={cn("flex items-start gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 font-semibold text-menta-300", compacta ? "text-sm" : "text-[15px]")}>
        <BadgePercent className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span><span className="sr-only">Condição para membros: </span>{o.condicao}</span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutro-300">
      <Lock className="h-4 w-4 shrink-0" aria-hidden />Condição exclusiva para membros
    </p>
  );
}

const local = (o: { cidade: string | null; uf: string | null }) => [o.cidade, o.uf].filter(Boolean).join(", ");

// Cartão de oferta do catálogo: quem oferece, o que é, a condição e a ação
export function CartaoOferta({ o, aoPedir, aoVerEmpresa }: { o: OfertaCatalogo; aoPedir?: (o: OfertaCatalogo) => void; aoVerEmpresa?: (parceiroId: string) => void }) {
  const area = o.categoria ?? o.categorias[0];
  return (
    <article className="group flex flex-col rounded-[14px] border border-white/10 bg-card p-4 transition-colors hover:border-white/20 sm:p-5">
      <div className="flex items-center gap-3">
        <AvatarEmpresa nome={o.empresa} caminho={o.logo_caminho} />
        <div className="min-w-0 flex-1">
          {aoVerEmpresa ? (
            <button type="button" onClick={() => aoVerEmpresa(o.parceiro_id)} className="block max-w-full truncate text-left text-sm font-semibold hover:underline">{o.empresa}</button>
          ) : <p className="truncate text-sm font-semibold">{o.empresa}</p>}
          <p className="truncate text-xs text-neutro-300">{[area, local(o)].filter(Boolean).join(" · ") || "Empresa do ecossistema"}</p>
        </div>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-snug">{o.titulo}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-neutro-100">{o.descricao}</p>
      {o.para_quem && <p className="mt-2 line-clamp-2 text-xs text-neutro-300"><span className="font-semibold">Para quem: </span>{o.para_quem}</p>}
      <div className="mt-4"><Condicao o={o} compacta /></div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {o.validade && <span className="inline-flex items-center gap-1 text-xs text-neutro-300"><CalendarDays className="h-3.5 w-3.5" aria-hidden />Até {data(o.validade)}</span>}
        <span className="ml-auto flex items-center gap-2">
          {aoVerEmpresa && <Button size="sm" variant="ghost" onClick={() => aoVerEmpresa(o.parceiro_id)}>Ver a empresa</Button>}
          {o.propria ? <span className="text-xs text-neutro-300">Sua oferta</span>
            : o.liberada && aoPedir && <Button size="sm" onClick={() => aoPedir(o)}>Pedir a condição</Button>}
        </span>
      </div>
    </article>
  );
}

// Empresa no catálogo: logo, áreas, quantas ofertas e a primeira condição
export type EmpresaCatalogo = { parceiro_id: string; empresa: string; logo_caminho: string | null; site: string | null; cidade: string | null; uf: string | null;
  categorias: string[]; ofertas: OfertaCatalogo[] };

export function agruparEmpresas(ofertas: OfertaCatalogo[]): EmpresaCatalogo[] {
  const m = new Map<string, EmpresaCatalogo>();
  for (const o of ofertas) {
    const e = m.get(o.parceiro_id) ?? { parceiro_id: o.parceiro_id, empresa: o.empresa, logo_caminho: o.logo_caminho, site: o.site, cidade: o.cidade, uf: o.uf,
      categorias: o.categorias, ofertas: [] };
    e.ofertas.push(o);
    m.set(o.parceiro_id, e);
  }
  return [...m.values()].sort((a, b) => b.ofertas.length - a.ofertas.length || a.empresa.localeCompare(b.empresa, "pt-BR"));
}

export function CartaoEmpresa({ e, aoAbrir }: { e: EmpresaCatalogo; aoAbrir: (id: string) => void }) {
  return (
    <button type="button" onClick={() => aoAbrir(e.parceiro_id)}
      className="flex w-full flex-col rounded-[14px] border border-white/10 bg-card p-4 text-left transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
      <div className="flex items-center gap-3">
        <AvatarEmpresa nome={e.empresa} caminho={e.logo_caminho} tamanho="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{e.empresa}</p>
          <p className="truncate text-xs text-neutro-300">{local(e) || "Empresa do ecossistema"}</p>
        </div>
      </div>
      {e.categorias.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">{e.categorias.slice(0, 3).map((c) => <li key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-neutro-300">{c}</li>)}</ul>
      )}
      <p className="mt-4 text-sm text-neutro-100">{e.ofertas[0].titulo}</p>
      <p className="mt-auto pt-4 text-xs text-neutro-300"><span className="tabular-nums">{e.ofertas.length}</span> {e.ofertas.length === 1 ? "oferta" : "ofertas"} no catálogo</p>
    </button>
  );
}

// Ficha da empresa: todas as ofertas dela, com o que é, para quem serve, como usar e a condição
export function FichaEmpresa({ empresa, aberta, fechar, aoPedir }: { empresa: EmpresaCatalogo | null; aberta: boolean; fechar: () => void; aoPedir: (o: OfertaCatalogo) => void }) {
  const site = empresa?.site ? (/^https?:/.test(empresa.site) ? empresa.site : `https://${empresa.site}`) : null;
  return (
    <Sheet open={aberta} onOpenChange={(v) => !v && fechar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {empresa && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <AvatarEmpresa nome={empresa.empresa} caminho={empresa.logo_caminho} tamanho="lg" />
                <div className="min-w-0">
                  <SheetTitle className="truncate">{empresa.empresa}</SheetTitle>
                  <SheetDescription>{[empresa.categorias.slice(0, 2).join(", "), local(empresa)].filter(Boolean).join(" · ") || "Empresa do ecossistema"}</SheetDescription>
                </div>
              </div>
              {site && (
                <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 pt-2 text-sm text-neutro-300 hover:text-white">
                  {empresa.site}<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only"> (abre em outra aba)</span>
                </a>
              )}
            </SheetHeader>
            <h3 className="mt-6 text-sm font-semibold"><span className="tabular-nums">{empresa.ofertas.length}</span> {empresa.ofertas.length === 1 ? "oferta" : "ofertas"} no catálogo</h3>
            <ul className="mt-3 space-y-4">
              {empresa.ofertas.map((o) => (
                <li key={o.oferta_id} className="rounded-[14px] border border-white/10 bg-background/40 p-4">
                  <p className="font-semibold">{o.titulo}</p>
                  <p className="mt-2 text-sm text-neutro-100">{o.descricao}</p>
                  {o.para_quem && <p className="mt-2 text-sm"><span className="font-semibold">Para quem: </span><span className="text-neutro-300">{o.para_quem}</span></p>}
                  {o.liberada && o.como_usar && <p className="mt-2 text-sm"><span className="font-semibold">Como usar: </span><span className="text-neutro-300">{o.como_usar}</span></p>}
                  <div className="mt-3"><Condicao o={o} /></div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {o.validade && <span className="inline-flex items-center gap-1 text-xs text-neutro-300"><CalendarDays className="h-3.5 w-3.5" aria-hidden />Até {data(o.validade)}</span>}
                    <span className="ml-auto">
                      {o.propria ? <span className="text-xs text-neutro-300">Sua oferta</span>
                        : o.liberada && <Button size="sm" onClick={() => aoPedir(o)}>Pedir a condição</Button>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Empresa da comunidade que quer ser parceira: o pedido entra na fila de candidatos (a conversa de entrada continua)
export function DialogoParceria({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const pedir = usePedirParceria();
  const cats = useCategoriasLista();
  const [f, setF] = useState({ categoria_id: "", clientes_ativos: "", aceite_termo_parceiro: false });
  const [tocado, setTocado] = useState(false);
  useEffect(() => { if (aberto) { setF({ categoria_id: "", clientes_ativos: "", aceite_termo_parceiro: false }); setTocado(false); } }, [aberto]);
  const erros = {
    categoria_id: !f.categoria_id ? "Escolha a categoria da sua empresa." : "",
    clientes_ativos: !/^\d{1,7}$/.test(f.clientes_ativos) ? "Informe um número aproximado." : "",
    aceite: !f.aceite_termo_parceiro ? "Aceite o termo de adesão para enviar o pedido." : "",
  };
  const valido = Object.values(erros).every((e) => !e);
  const opcoes = (cats.data ?? []).filter((c) => c.tipo === "comercial" || c.tipo === "institucional");
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quero ser parceiro do programa</DialogTitle>
          <DialogDescription>A equipe da Wise fala com você pelo WhatsApp e marca uma conversa de entrada de 45 minutos. O seu acesso continua o mesmo.</DialogDescription>
        </DialogHeader>
        <form id="form-parceria" noValidate className="space-y-4" onSubmit={(e) => {
          e.preventDefault(); setTocado(true);
          if (valido) pedir.mutate(f, { onSuccess: () => { toast.success("Pedido enviado. A Wise fala com você pelo WhatsApp."); fechar(); } });
        }}>
          <div className="space-y-1.5">
            <Label htmlFor="par-cat">Categoria da sua empresa</Label>
            <Select value={f.categoria_id} onValueChange={(v) => setF((x) => ({ ...x, categoria_id: v }))}>
              <SelectTrigger id="par-cat" aria-invalid={tocado && !!erros.categoria_id}><SelectValue placeholder="Escolha a categoria" /></SelectTrigger>
              <SelectContent>{opcoes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            {tocado && erros.categoria_id && <p className="text-xs text-red-300">{erros.categoria_id}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="par-cli">Clientes ativos, mais ou menos</Label>
            <Input id="par-cli" inputMode="numeric" value={f.clientes_ativos} onChange={(e) => setF((x) => ({ ...x, clientes_ativos: e.target.value.replace(/\D/g, "").slice(0, 7) }))}
              aria-invalid={tocado && !!erros.clientes_ativos} />
            {tocado && erros.clientes_ativos && <p className="text-xs text-red-300">{erros.clientes_ativos}</p>}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={f.aceite_termo_parceiro} onCheckedChange={(v) => setF((x) => ({ ...x, aceite_termo_parceiro: v === true }))} className="mt-0.5" aria-invalid={tocado && !!erros.aceite} />
            <span>Li e aceito o <a href="/parceiros/termo" target="_blank" rel="noreferrer" className="text-menta-300 underline underline-offset-2">termo de adesão do programa</a>.</span>
          </label>
          {tocado && erros.aceite && <p className="text-xs text-red-300">{erros.aceite}</p>}
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
          <Button type="submit" form="form-parceria" disabled={pedir.isPending}>{pedir.isPending && <Loader2 className="animate-spin" />}Enviar pedido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
              <DialogDescription>{oferta?.empresa} · condição para membros: {oferta?.condicao}</DialogDescription>
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
