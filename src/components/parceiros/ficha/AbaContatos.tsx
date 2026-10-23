import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Mail, Pencil, Phone, Plus, Search, Star, Unlink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pilula } from "@/components/comum/Selos";
import { useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { PAPEIS_CONTATO, rotulo } from "@/lib/rotulos";
import { Campo } from "../ui";
import { invalidarParceiro, normalizar } from "../dados";

type Contato = { id: string; nome: string; cargo: string | null; email: string | null; telefone: string | null; whatsapp: string | null; observacoes: string | null };
type Vinculo = { contato_id: string; papeis: string[]; principal: boolean; contatos: Contato | null };

const CONTATO_VAZIO = { nome: "", cargo: "", email: "", telefone: "", whatsapp: "", observacoes: "" };

// Contatos do parceiro (FR-012). Uma pessoa pode estar ligada a mais de uma empresa.
export function AbaContatos({ parceiroId }: { parceiroId: string }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: resumos = [] } = useParceirosResumo();
  const vinculos = useQuery({
    queryKey: ["parceiro", parceiroId, "contatos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiro_contatos").select("contato_id, papeis, principal, contatos(*)").eq("parceiro_id", parceiroId);
      if (error) throw error;
      return ((data ?? []) as any[] as Vinculo[]).sort(
        (a, b) => Number(b.principal) - Number(a.principal) || (a.contatos?.nome ?? "").localeCompare(b.contatos?.nome ?? "", "pt-BR"),
      );
    },
  });
  const ids = (vinculos.data ?? []).map((v) => v.contato_id);
  // Outras empresas em que a mesma pessoa é contato
  const outros = useQuery({
    queryKey: ["parceiro", parceiroId, "contatos-outros", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiro_contatos").select("contato_id, parceiro_id").in("contato_id", ids).neq("parceiro_id", parceiroId);
      if (error) throw error;
      return (data ?? []) as { contato_id: string; parceiro_id: string }[];
    },
  });
  const [editar, setEditar] = useState<Vinculo | "novo" | null>(null);
  const [vincular, setVincular] = useState(false);
  const [desvincular, setDesvincular] = useState<Vinculo | null>(null);

  const atualizar = () => {
    invalidarParceiro(qc, parceiroId);
    qc.invalidateQueries({ queryKey: ["contatos-todos"] });
  };

  async function remover(v: Vinculo) {
    const { error } = await supabase.from("parceiro_contatos").delete().eq("parceiro_id", parceiroId).eq("contato_id", v.contato_id);
    if (error) return toastErro(error);
    toast.success("Contato desvinculado.");
    setDesvincular(null);
    atualizar();
  }

  if (vinculos.isLoading) return <Carregando />;
  const lista = vinculos.data ?? [];

  return (
    <div className="space-y-4">
      {isParcerias && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditar("novo")}><Plus /> Novo contato</Button>
          <Button variant="outline" onClick={() => setVincular(true)}><Link2 /> Vincular contato existente</Button>
        </div>
      )}
      {!lista.length ? (
        <Vazio titulo="Nenhum contato cadastrado." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lista.map((v) => {
            const c = v.contatos;
            if (!c) return null;
            const tambem = (outros.data ?? []).filter((o) => o.contato_id === v.contato_id);
            return (
              <div key={v.contato_id} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="break-words">{c.nome}</span>
                      {v.principal && <Pilula tom="menta" className="gap-1"><Star className="h-3 w-3" /> Principal</Pilula>}
                    </p>
                    {c.cargo && <p className="text-sm text-muted-foreground">{c.cargo}</p>}
                  </div>
                  {isParcerias && (
                    <div className="flex shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Editar contato" onClick={() => setEditar(v)}><Pencil /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Desvincular contato" onClick={() => setDesvincular(v)}><Unlink /></Button>
                    </div>
                  )}
                </div>
                {v.papeis?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">{v.papeis.map((x) => <Pilula key={x}>{rotulo(PAPEIS_CONTATO, x)}</Pilula>)}</div>
                )}
                <div className="mt-3 space-y-1 text-sm">
                  {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 break-all hover:text-menta-400"><Mail className="h-3.5 w-3.5 shrink-0" />{c.email}</a>}
                  {c.telefone && <a href={`tel:${c.telefone}`} className="flex items-center gap-2 hover:text-menta-400"><Phone className="h-3.5 w-3.5 shrink-0" />{c.telefone}</a>}
                  {c.whatsapp && (
                    <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "").replace(/^(?!55)(\d{10,11})$/, "55$1")}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 hover:text-menta-400">
                      <Phone className="h-3.5 w-3.5 shrink-0" />WhatsApp {c.whatsapp}
                    </a>
                  )}
                </div>
                {c.observacoes && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{c.observacoes}</p>}
                {tambem.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Também contato de{" "}
                    {tambem.map((o, i) => (
                      <span key={o.parceiro_id}>
                        {i > 0 && ", "}
                        <Link to={`/app/parceiros/${o.parceiro_id}`} className="text-menta-400 hover:underline">
                          {resumos.find((r) => r.id === o.parceiro_id)?.nome_fantasia ?? "outro parceiro"}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editar && (
        <ContatoDialog parceiroId={parceiroId} vinculo={editar === "novo" ? null : editar}
          onFechar={() => setEditar(null)} onSalvo={atualizar} jaTemPrincipal={lista.some((v) => v.principal)} />
      )}
      {vincular && (
        <VincularDialog parceiroId={parceiroId} jaVinculados={ids} onFechar={() => setVincular(false)} onSalvo={atualizar} />
      )}

      <AlertDialog open={!!desvincular} onOpenChange={(v) => !v && setDesvincular(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular {desvincular?.contatos?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>O contato deixa de aparecer nesta ficha. O cadastro da pessoa continua nas outras empresas em que ela é contato.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => desvincular && remover(desvincular)}>Desvincular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SeletorPapeis({ papeis, onChange }: { papeis: string[]; onChange: (p: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {Object.entries(PAPEIS_CONTATO).map(([k, r]) => (
        <label key={k} className="flex items-center gap-2 text-sm">
          <Checkbox checked={papeis.includes(k)} onCheckedChange={(c) => onChange(c ? [...papeis, k] : papeis.filter((x) => x !== k))} />
          {r}
        </label>
      ))}
    </div>
  );
}

// Garante um único contato principal por parceiro
async function marcarPrincipal(parceiroId: string, contatoId: string) {
  const r = await supabase.from("parceiro_contatos").update({ principal: false }).eq("parceiro_id", parceiroId).neq("contato_id", contatoId);
  return r.error;
}

function ContatoDialog({
  parceiroId, vinculo, onFechar, onSalvo, jaTemPrincipal,
}: { parceiroId: string; vinculo: Vinculo | null; onFechar: () => void; onSalvo: () => void; jaTemPrincipal: boolean }) {
  const c = vinculo?.contatos;
  const [f, setF] = useState(() => (c ? {
    nome: c.nome, cargo: c.cargo ?? "", email: c.email ?? "", telefone: c.telefone ?? "", whatsapp: c.whatsapp ?? "", observacoes: c.observacoes ?? "",
  } : CONTATO_VAZIO));
  const [papeis, setPapeis] = useState<string[]>(vinculo?.papeis ?? []);
  const [principal, setPrincipal] = useState(vinculo ? vinculo.principal : !jaTemPrincipal);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof CONTATO_VAZIO, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.nome.trim()) {
      toast.error("Informe o nome do contato.");
      return;
    }
    setSalvando(true);
    const dados = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() || null])) as Record<string, string | null>;
    let contatoId = vinculo?.contato_id;
    let erro: any = null;
    if (contatoId) {
      erro = (await supabase.from("contatos").update(dados).eq("id", contatoId)).error;
      if (!erro) {
        erro = (await supabase.from("parceiro_contatos").update({ papeis, principal })
          .eq("parceiro_id", parceiroId).eq("contato_id", contatoId)).error;
      }
    } else {
      const r = await supabase.from("contatos").insert(dados).select("id").single();
      erro = r.error;
      contatoId = r.data?.id;
      if (!erro) erro = (await supabase.from("parceiro_contatos").insert({ parceiro_id: parceiroId, contato_id: contatoId, papeis, principal })).error;
    }
    if (!erro && principal && contatoId) erro = await marcarPrincipal(parceiroId, contatoId);
    setSalvando(false);
    if (erro) return toastErro(erro);
    toast.success(vinculo ? "Contato atualizado." : "Contato cadastrado.");
    onSalvo();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-lg overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{vinculo ? "Editar contato" : "Novo contato"}</DialogTitle>
          {vinculo && <DialogDescription>Os dados da pessoa valem para todas as empresas em que ela é contato.</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome" obrigatorio className="sm:col-span-2"><Input value={f.nome} onChange={(e) => set("nome", e.target.value)} /></Campo>
          <Campo rotulo="Cargo"><Input value={f.cargo} onChange={(e) => set("cargo", e.target.value)} /></Campo>
          <Campo rotulo="E-mail"><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Campo>
          <Campo rotulo="Telefone"><Input type="tel" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} /></Campo>
          <Campo rotulo="WhatsApp"><Input type="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Campo>
          <Campo rotulo="Papel na negociação" className="sm:col-span-2"><SeletorPapeis papeis={papeis} onChange={setPapeis} /></Campo>
          <Campo rotulo="Observações" className="sm:col-span-2"><Textarea rows={2} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></Campo>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={principal} onCheckedChange={(v) => setPrincipal(!!v)} /> Contato principal deste parceiro
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VincularDialog({
  parceiroId, jaVinculados, onFechar, onSalvo,
}: { parceiroId: string; jaVinculados: string[]; onFechar: () => void; onSalvo: () => void }) {
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<Contato | null>(null);
  const [papeis, setPapeis] = useState<string[]>([]);
  const [principal, setPrincipal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const todos = useQuery({
    queryKey: ["contatos-todos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contatos").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Contato[];
    },
  });
  useEffect(() => setEscolhido(null), [busca]);
  const resultados = useMemo(() => {
    const t = normalizar(busca);
    if (t.length < 2) return [];
    return (todos.data ?? [])
      .filter((c) => !jaVinculados.includes(c.id) && normalizar(`${c.nome} ${c.email ?? ""}`).includes(t))
      .slice(0, 20);
  }, [busca, todos.data, jaVinculados]);

  async function salvar() {
    if (!escolhido) return;
    setSalvando(true);
    let erro = (await supabase.from("parceiro_contatos").insert({ parceiro_id: parceiroId, contato_id: escolhido.id, papeis, principal })).error;
    if (!erro && principal) erro = await marcarPrincipal(parceiroId, escolhido.id);
    setSalvando(false);
    if (erro) return toastErro(erro);
    toast.success("Contato vinculado.");
    onSalvo();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-lg overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Vincular contato existente</DialogTitle>
          <DialogDescription>Use quando a mesma pessoa já é contato de outro parceiro.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou e-mail" autoFocus />
        </div>
        {busca.trim().length >= 2 && (
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {resultados.length ? resultados.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setEscolhido(c)}
                  className={`w-full rounded-[8px] border px-3 py-2 text-left text-sm ${escolhido?.id === c.id ? "border-menta-500 bg-menta-500/10" : "border-white/10 hover:bg-white/5"}`}>
                  <span className="block font-medium">{c.nome}</span>
                  <span className="block truncate text-xs text-muted-foreground">{[c.cargo, c.email].filter(Boolean).join(" · ")}</span>
                </button>
              </li>
            )) : <li className="text-sm text-muted-foreground">Nenhum contato encontrado.</li>}
          </ul>
        )}
        {escolhido && (
          <div className="space-y-3 rounded-[10px] border border-white/10 p-3">
            <Campo rotulo={`Papel de ${escolhido.nome} neste parceiro`}><SeletorPapeis papeis={papeis} onChange={setPapeis} /></Campo>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={principal} onCheckedChange={(v) => setPrincipal(!!v)} /> Contato principal deste parceiro
            </label>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={!escolhido || salvando}>Vincular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
