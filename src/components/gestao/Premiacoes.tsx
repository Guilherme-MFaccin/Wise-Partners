import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { ok, toastErro } from "@/lib/erros";
import { cn } from "@/lib/utils";
import { useConfiguracao } from "./dados";

type Premiacao = {
  id: string; ano: number; categoria: string; parceiro_id: string; divulgada: boolean; observacao: string | null;
  parceiro: { id: string; nome_fantasia: string } | null;
};

// Premiação anual (Apêndice K). O time de parcerias registra; consultores só consultam.
export function Premiacoes({ podeEditar, anoPadrao }: { podeEditar: boolean; anoPadrao: number }) {
  const qc = useQueryClient();
  const [edicao, setEdicao] = useState<Premiacao | "nova" | null>(null);
  const q = useQuery({
    queryKey: ["premiacoes"],
    queryFn: async () =>
      (ok<any>(await supabase.from("premiacoes")
        .select("id, ano, categoria, parceiro_id, divulgada, observacao, parceiro:parceiros(id, nome_fantasia)")
        .order("ano", { ascending: false }).order("categoria")) ?? []) as unknown as Premiacao[],
  });

  async function excluir(p: Premiacao) {
    if (!confirm(`Excluir a premiação "${p.categoria}" de ${p.ano}?`)) return;
    const { error } = await supabase.from("premiacoes").delete().eq("id", p.id);
    if (error) return toastErro(error);
    toast.success("Premiação excluída.");
    qc.invalidateQueries({ queryKey: ["premiacoes"] });
  }

  async function alternarDivulgada(p: Premiacao, v: boolean) {
    const { error } = await supabase.from("premiacoes").update({ divulgada: v }).eq("id", p.id);
    if (error) return toastErro(error);
    qc.invalidateQueries({ queryKey: ["premiacoes"] });
  }

  const lista = q.data ?? [];
  return (
    <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold"><Award className="h-5 w-5 text-menta-400" /> Premiação anual</h2>
        {podeEditar && <Button size="sm" onClick={() => setEdicao("nova")}><Plus /> Registrar premiação</Button>}
      </div>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma premiação registrada.</p>}
      {lista.length > 0 && (
        <ul className="divide-y divide-white/10">
          {lista.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.categoria}</span>
                  <Pilula>{p.ano}</Pilula>
                  {p.divulgada ? <Pilula tom="menta">Divulgada</Pilula> : <Pilula tom="alerta">Não divulgada</Pilula>}
                </p>
                <p className="text-muted-foreground">
                  {p.parceiro ? <Link to={`/app/parceiros/${p.parceiro.id}`} className="hover:text-menta-400">{p.parceiro.nome_fantasia}</Link> : ""}
                  {p.observacao ? ` · ${p.observacao}` : ""}
                </p>
              </div>
              {podeEditar && (
                <div className="flex shrink-0 items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch checked={p.divulgada} onCheckedChange={(v) => alternarDivulgada(p, v)} aria-label="Divulgada" /> Divulgar
                  </label>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" onClick={() => setEdicao(p)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300" aria-label="Excluir" onClick={() => excluir(p)}><Trash2 /></Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        O parceiro premiado é avisado ao registrar. A premiação só aparece para os outros parceiros quando divulgada; quem pediu anonimato aparece como "Parceiro Wise".
      </p>
      {podeEditar && <PremiacaoDialog edicao={edicao} anoPadrao={anoPadrao} onClose={() => setEdicao(null)} />}
    </section>
  );
}

function PremiacaoDialog({ edicao, anoPadrao, onClose }: { edicao: Premiacao | "nova" | null; anoPadrao: number; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: categoriasCfg } = useConfiguracao<string[]>("categorias_premiacao");
  const [ano, setAno] = useState(String(anoPadrao));
  const [categoria, setCategoria] = useState("");
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [divulgada, setDivulgada] = useState(false);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!edicao) return;
    const p = edicao === "nova" ? null : edicao;
    setAno(String(p?.ano ?? anoPadrao));
    setCategoria(p?.categoria ?? "");
    setParceiroId(p?.parceiro_id ?? null);
    setDivulgada(p?.divulgada ?? false);
    setObservacao(p?.observacao ?? "");
  }, [edicao, anoPadrao]);

  const categorias = [...new Set([...(Array.isArray(categoriasCfg) ? categoriasCfg : []), ...(categoria ? [categoria] : [])])];
  const valido = /^\d{4}$/.test(ano) && !!categoria && !!parceiroId;

  const salvar = useMutation({
    mutationFn: async () => {
      const registro = { ano: Number(ano), categoria, parceiro_id: parceiroId, divulgada, observacao: observacao.trim() || null };
      const { error } = edicao === "nova"
        ? await supabase.from("premiacoes").insert(registro)
        : await supabase.from("premiacoes").update(registro).eq("id", (edicao as Premiacao).id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Premiação salva.");
      qc.invalidateQueries({ queryKey: ["premiacoes"] });
      onClose();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!edicao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{edicao === "nova" ? "Registrar premiação" : "Editar premiação"}</DialogTitle>
          <DialogDescription>Uma premiação por categoria em cada ano. As categorias ficam em Configurações, Pontos e premiação.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valido) salvar.mutate(); }}>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Input type="number" inputMode="numeric" value={ano} onChange={(e) => setAno(e.target.value)} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Parceiro</Label>
            <ParceiroBusca valor={parceiroId} onChange={setParceiroId} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observação (opcional)</Label>
            <Textarea rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-[10px] bg-white/5 p-3 text-sm">
            <span>Divulgar aos parceiros</span>
            <Switch checked={divulgada} onCheckedChange={setDivulgada} />
          </label>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!valido || salvar.isPending}>{salvar.isPending && <Loader2 className="animate-spin" />} Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
