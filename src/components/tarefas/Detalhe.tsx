import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Loader2, Plus, Trash2, Workflow, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toastErro } from "@/lib/erros";
import { dataHora, semTravessao } from "@/lib/formato";
import {
  GRUPOS_REGRA, PRIORIDADES, STATUS, useApagarTarefa, useAtualizarTarefa, useComentar, useComentarios, useCriarTarefa, useParceirosLista,
  type Pessoa, type Prioridade, type Status, type Tarefa,
} from "./dados";
import { Avatar } from "./Visoes";

const SEM = "__sem__";

function CampoSelect({ id, rotulo, valor, opcoes, aoMudar, desabilitado }: {
  id: string; rotulo: string; valor: string; opcoes: { v: string; r: string }[]; aoMudar: (v: string) => void; desabilitado?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Select value={valor} onValueChange={aoMudar} disabled={desabilitado}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>{opcoes.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

// Painel lateral da tarefa: tudo editável, salvo ao mudar cada campo
export function DetalheTarefa({ tarefa, pessoas, fechar }: { tarefa: Tarefa | null; pessoas: Pessoa[]; fechar: () => void }) {
  const t = tarefa;
  const atualizar = useAtualizarTarefa();
  const apagar = useApagarTarefa();
  const parceiros = useParceirosLista();
  const { perfil } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [item, setItem] = useState("");
  const [etiqueta, setEtiqueta] = useState("");
  useEffect(() => { setTitulo(t?.titulo ?? ""); setDescricao(t?.descricao ?? ""); setItem(""); setEtiqueta(""); }, [t?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = (mudanca: Partial<Tarefa>) => t && atualizar.mutate({ id: t.id, mudanca });
  const pessoaOpc = [{ v: SEM, r: "Sem responsável" }, ...pessoas.map((p) => ({ v: p.id, r: p.nome }))];

  return (
    <Sheet open={!!t} onOpenChange={(v) => !v && fechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto border-white/10 bg-background p-0 sm:max-w-xl">
        {t && (
          <div className="space-y-5 p-5">
            <div className="pr-8">
              <SheetTitle className="sr-only">{t.titulo}</SheetTitle>
              <SheetDescription className="sr-only">Detalhes e edição da tarefa</SheetDescription>
              <Label htmlFor="tarefa-titulo" className="sr-only">Título</Label>
              <Textarea id="tarefa-titulo" value={titulo} rows={2} onChange={(e) => setTitulo(e.target.value)}
                onBlur={() => titulo.trim() && titulo !== t.titulo && salvar({ titulo: semTravessao(titulo.trim()) })}
                className="resize-none border-transparent bg-transparent px-0 text-lg font-semibold focus-visible:border-white/20" />
              <p className="text-xs text-neutro-300">Criada em {dataHora(t.created_at)}{t.concluida_em ? ` · concluída em ${dataHora(t.concluida_em)}` : ""}</p>
            </div>

            {t.origem === "regra" && <BlocoRegra t={t} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelect id="t-status" rotulo="Estado" valor={t.status} opcoes={STATUS.map((s) => ({ v: s.id, r: s.rotulo }))} aoMudar={(v) => salvar({ status: v as Status })} />
              <CampoSelect id="t-prio" rotulo="Prioridade" valor={t.prioridade} opcoes={PRIORIDADES.map((p) => ({ v: p.id, r: p.rotulo }))} aoMudar={(v) => salvar({ prioridade: v as Prioridade })} />
              <CampoSelect id="t-resp" rotulo="Responsável" valor={t.responsavel_id ?? SEM} opcoes={pessoaOpc} aoMudar={(v) => salvar({ responsavel_id: v === SEM ? null : v })} />
              <CampoSelect id="t-parc" rotulo="Parceiro" valor={t.parceiro_id ?? SEM} desabilitado={t.origem === "regra"}
                opcoes={[{ v: SEM, r: "Nenhum" }, ...(parceiros.data ?? []).map((p) => ({ v: p.id, r: p.nome_fantasia }))]} aoMudar={(v) => salvar({ parceiro_id: v === SEM ? null : v })} />
              <div className="space-y-1.5">
                <Label htmlFor="t-inicio">Início</Label>
                <Input id="t-inicio" type="date" value={t.inicio ?? ""} max={t.prazo ?? undefined} onChange={(e) => salvar({ inicio: e.target.value || null })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-prazo">Prazo</Label>
                <Input id="t-prazo" type="date" value={t.prazo ?? ""} min={t.inicio ?? undefined} onChange={(e) => salvar({ prazo: e.target.value || null })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Descrição</Label>
              <Textarea id="t-desc" rows={4} value={descricao} placeholder="Contexto, combinados, links" onChange={(e) => setDescricao(e.target.value)}
                onBlur={() => descricao !== (t.descricao ?? "") && salvar({ descricao: semTravessao(descricao) || null })} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Etiquetas</p>
              <div className="flex flex-wrap gap-1.5">
                {t.etiquetas.map((e) => (
                  <span key={e} className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-xs">#{e}
                    <button type="button" aria-label={`Tirar a etiqueta ${e}`} onClick={() => salvar({ etiquetas: t.etiquetas.filter((x) => x !== e) })}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); const v = etiqueta.trim().toLowerCase().replace(/^#/, ""); if (v && !t.etiquetas.includes(v)) salvar({ etiquetas: [...t.etiquetas, v] }); setEtiqueta(""); }}>
                  <Input value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Nova etiqueta" aria-label="Nova etiqueta" className="h-8 w-36 text-xs" />
                </form>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Checklist <span className="tabular-nums text-neutro-300">{t.checklist.filter((c) => c.feito).length}/{t.checklist.length}</span></p>
              <ul className="space-y-1.5">
                {t.checklist.map((c, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Checkbox id={`chk-${i}`} checked={c.feito} onCheckedChange={(v) => salvar({ checklist: t.checklist.map((x, j) => (j === i ? { ...x, feito: !!v } : x)) })} />
                    <label htmlFor={`chk-${i}`} className={c.feito ? "text-neutro-300 line-through" : ""}>{c.texto}</label>
                    <button type="button" className="ml-auto text-neutro-300 hover:text-white" aria-label={`Remover ${c.texto}`}
                      onClick={() => salvar({ checklist: t.checklist.filter((_, j) => j !== i) })}><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (item.trim()) salvar({ checklist: [...t.checklist, { texto: semTravessao(item.trim()), feito: false }] }); setItem(""); }}>
                <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Novo item" aria-label="Novo item do checklist" />
                <Button type="submit" size="icon" variant="outline" aria-label="Incluir item"><Plus /></Button>
              </form>
            </div>

            <Comentarios tarefaId={t.id} />

            {t.origem === "manual" && (t.criado_por === perfil?.id || perfil?.papel === "admin" || perfil?.papel === "parcerias") && (
              <Button variant="ghost" className="text-red-300 hover:text-red-200" disabled={apagar.isPending}
                onClick={() => { if (window.confirm("Apagar esta tarefa?")) apagar.mutate(t.id, { onSuccess: () => { toast.success("Tarefa apagada."); fechar(); } }); }}>
                <Trash2 /> Apagar tarefa
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Tarefa que nasceu de uma regra (P-09): o que a regra diz, onde resolver e as ações que dá para fazer aqui
function BlocoRegra({ t }: { t: Tarefa }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const [tipo, ref] = t.chave_regra?.split(":") ?? [t.tipo, ""];
  const acao = useMutation({
    mutationFn: async (qual: "validar" | "aprovar") => {
      const r = qual === "validar"
        ? await supabase.from("comprovacoes").update({ estado: "validada" }).eq("id", ref)
        : await supabase.from("aprovacoes").insert({ parceiro_id: ref, tipo: "assinatura", aprovado_por: perfil!.id, observacao: null });
      if (r.error) throw r.error;
      await supabase.rpc("sincronizar_tarefas" as any, { p_forcar: true });
    },
    onSuccess: () => { toast.success("Feito. A tarefa se fecha sozinha."); qc.invalidateQueries({ queryKey: ["tarefas-lista"] }); },
    onError: toastErro,
  });
  return (
    <div className="space-y-2 rounded-[10px] border border-violet-500/30 bg-violet-500/5 p-3 text-sm">
      <p className="flex items-center gap-2 font-semibold text-violet-200"><Workflow className="h-4 w-4" aria-hidden />Nasceu de uma regra{t.grupo ? ` · ${GRUPOS_REGRA[t.grupo]}` : ""}</p>
      {t.detalhe && <p className="text-neutro-100">{t.detalhe}</p>}
      <p className="text-xs text-neutro-300">Fecha sozinha quando o caso deixar de fugir da regra. Se você marcar como feita antes, a regra só cria outra depois de 7 dias.</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {t.link && <Button asChild size="sm" variant="outline"><Link to={t.link}>Abrir onde se resolve <ArrowRight /></Link></Button>}
        {tipo === "comprovacao" && t.status !== "feito" && (
          <Button size="sm" disabled={acao.isPending} onClick={() => acao.mutate("validar")}>{acao.isPending ? <Loader2 className="animate-spin" /> : <Check />}Validar a comprovação</Button>
        )}
        {tipo === "assinatura" && perfil?.is_diretor && t.status !== "feito" && (
          <Button size="sm" disabled={acao.isPending} onClick={() => acao.mutate("aprovar")}>{acao.isPending ? <Loader2 className="animate-spin" /> : <Check />}Aprovar a assinatura</Button>
        )}
      </div>
    </div>
  );
}

function Comentarios({ tarefaId }: { tarefaId: string }) {
  const q = useComentarios(tarefaId);
  const comentar = useComentar(tarefaId);
  const [texto, setTexto] = useState("");
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Comentários</p>
      {q.isLoading ? <p className="text-sm text-neutro-300">Carregando...</p> : q.error ? <p className="text-sm text-red-300">Não foi possível carregar os comentários.</p> : (
        <ul className="space-y-2">
          {(q.data ?? []).length === 0 && <li className="text-sm text-neutro-300">Nenhum comentário ainda.</li>}
          {(q.data ?? []).map((c) => (
            <li key={c.id} className="flex gap-2 text-sm">
              <Avatar pessoa={c.autor ? { id: c.autor_id ?? "", nome: c.autor.nome, papel: "" } : undefined} />
              <div className="min-w-0">
                <p className="text-xs text-neutro-300">{c.autor?.nome ?? "Alguém"} · {dataHora(c.created_at)}</p>
                <p className="whitespace-pre-wrap break-words">{c.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (texto.trim()) comentar.mutate(semTravessao(texto.trim()), { onSuccess: () => setTexto("") }); }}>
        <Textarea rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva um comentário" aria-label="Novo comentário" />
        <Button type="submit" size="sm" disabled={!texto.trim() || comentar.isPending}>{comentar.isPending && <Loader2 className="animate-spin" />}Comentar</Button>
      </form>
    </div>
  );
}

// Nova tarefa manual, com valores iniciais vindos da coluna em que foi pedida
export function NovaTarefa({ aberto, inicial, pessoas, fechar }: { aberto: boolean; inicial: Partial<Tarefa>; pessoas: Pessoa[]; fechar: () => void }) {
  const criar = useCriarTarefa();
  const parceiros = useParceirosLista();
  const { perfil } = useAuth();
  const [f, setF] = useState<Partial<Tarefa>>({});
  useEffect(() => { if (aberto) setF({ status: "a_fazer", prioridade: "normal", responsavel_id: perfil?.id ?? null, ...inicial }); }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof Tarefa, v: any) => setF((x) => ({ ...x, [k]: v }));
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.titulo?.trim()) return;
    criar.mutate({ ...f, titulo: semTravessao(f.titulo.trim()) }, { onSuccess: () => { toast.success("Tarefa criada."); fechar(); } });
  }
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Para o que não nasce sozinho das regras: combinados, preparos, pedidos do Diretor.</DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="space-y-4" id="nova-tarefa">
          <div className="space-y-1.5">
            <Label htmlFor="nt-titulo">O que precisa ser feito</Label>
            <Input id="nt-titulo" autoFocus value={f.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSelect id="nt-resp" rotulo="Responsável" valor={f.responsavel_id ?? SEM}
              opcoes={[{ v: SEM, r: "Sem responsável" }, ...pessoas.map((p) => ({ v: p.id, r: p.nome }))]} aoMudar={(v) => set("responsavel_id", v === SEM ? null : v)} />
            <CampoSelect id="nt-prio" rotulo="Prioridade" valor={f.prioridade ?? "normal"} opcoes={PRIORIDADES.map((p) => ({ v: p.id, r: p.rotulo }))} aoMudar={(v) => set("prioridade", v)} />
            <CampoSelect id="nt-status" rotulo="Estado" valor={f.status ?? "a_fazer"} opcoes={STATUS.filter((s) => s.id !== "cancelada").map((s) => ({ v: s.id, r: s.rotulo }))} aoMudar={(v) => set("status", v)} />
            <div className="space-y-1.5">
              <Label htmlFor="nt-prazo">Prazo</Label>
              <Input id="nt-prazo" type="date" value={f.prazo ?? ""} onChange={(e) => set("prazo", e.target.value || null)} />
            </div>
            <div className="sm:col-span-2">
              <CampoSelect id="nt-parc" rotulo="Parceiro (opcional)" valor={f.parceiro_id ?? SEM}
                opcoes={[{ v: SEM, r: "Nenhum" }, ...(parceiros.data ?? []).map((p) => ({ v: p.id, r: p.nome_fantasia }))]} aoMudar={(v) => set("parceiro_id", v === SEM ? null : v)} />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
          <Button type="submit" form="nova-tarefa" disabled={!f.titulo?.trim() || criar.isPending}>{criar.isPending && <Loader2 className="animate-spin" />}Criar tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
