import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Repeat, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO, moeda } from "@/lib/formato";
import { CATEGORIAS_CUSTO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type CustoDireto = {
  id: string; data: string; categoria: string; valor: number; descricao: string; parceiro_id: string | null;
  contrapartida_id: string | null; acao_wise_id: string | null; recorrente: boolean; recorrente_ate: string | null;
  parceiro: { id: string; nome_fantasia: string } | null;
};

const TODAS = "__todas";

// Custos diretos lançados à mão (FR-105): eventos, kits, deslocamento, ferramentas etc. Só administradores.
export function CustosDiretos() {
  const qc = useQueryClient();
  const [edicao, setEdicao] = useState<CustoDireto | "novo" | null>(null);
  const [categoria, setCategoria] = useState(TODAS);
  const q = useQuery({
    queryKey: ["custos-diretos"],
    queryFn: async () =>
      (ok<any>(await supabase.from("custos_diretos")
        .select("id, data, categoria, valor, descricao, parceiro_id, contrapartida_id, acao_wise_id, recorrente, recorrente_ate, parceiro:parceiros(id, nome_fantasia)")
        .order("data", { ascending: false })) ?? []) as unknown as CustoDireto[],
  });
  const lista = useMemo(() => (q.data ?? []).filter((c) => categoria === TODAS || c.categoria === categoria), [q.data, categoria]);

  async function excluir(c: CustoDireto) {
    if (!confirm(`Excluir o custo "${c.descricao}"?`)) return;
    const { error } = await supabase.from("custos_diretos").delete().eq("id", c.id);
    if (error) return toastErro(error);
    toast.success("Custo excluído.");
    qc.invalidateQueries({ queryKey: ["custos-diretos"] });
    qc.invalidateQueries({ queryKey: ["planilha-custos"] });
    qc.invalidateQueries({ queryKey: ["resultado-canal"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Categoria"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as categorias</SelectItem>
            {Object.entries(CATEGORIAS_CUSTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setEdicao("novo")}><Plus /> Lançar custo direto</Button>
      </div>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && lista.length === 0 && <Vazio titulo="Nenhum custo direto lançado" />}
      {lista.length > 0 && (
        <ul className={cn(CLASSE_CARD, "divide-y divide-white/10")}>
          {lista.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.descricao}</span>
                  <Pilula>{rotulo(CATEGORIAS_CUSTO, c.categoria)}</Pilula>
                  {c.recorrente && (
                    <Pilula tom="info"><Repeat className="mr-1 h-3 w-3" /> Mensal{c.recorrente_ate ? ` até ${data(c.recorrente_ate)}` : ", sem fim"}</Pilula>
                  )}
                  {c.acao_wise_id && <Pilula tom="menta">Ação da Wise</Pilula>}
                  {c.contrapartida_id && <Pilula tom="menta">Ação do parceiro</Pilula>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data(c.data)} · {c.parceiro
                    ? <Link to={`/app/parceiros/${c.parceiro.id}`} className="hover:text-menta-400">{c.parceiro.nome_fantasia}</Link>
                    : "Custo geral do programa"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <span className="font-semibold">{moeda(c.valor)}{c.recorrente ? " por mês" : ""}</span>
                <div className="flex shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" onClick={() => setEdicao(c)}><Pencil /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300" aria-label="Excluir" onClick={() => excluir(c)}><Trash2 /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <CustoDiretoDialog edicao={edicao} onClose={() => setEdicao(null)} />
    </div>
  );
}

function CustoDiretoDialog({ edicao, onClose }: { edicao: CustoDireto | "novo" | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [dataCusto, setDataCusto] = useState(hojeISO());
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [recorrente, setRecorrente] = useState(false);
  const [ate, setAte] = useState("");

  useEffect(() => {
    if (!edicao) return;
    const c = edicao === "novo" ? null : edicao;
    setDataCusto(c?.data ?? hojeISO());
    setCategoria(c?.categoria ?? "");
    setValor(c ? String(c.valor) : "");
    setDescricao(c?.descricao ?? "");
    setParceiroId(c?.parceiro_id ?? null);
    setRecorrente(c?.recorrente ?? false);
    setAte(c?.recorrente_ate ?? "");
  }, [edicao]);

  const valido = !!dataCusto && !!categoria && valor !== "" && Number(valor) >= 0 && descricao.trim() !== ""
    && (!recorrente || !ate || ate >= dataCusto);

  const salvar = useMutation({
    mutationFn: async () => {
      const registro = {
        data: dataCusto, categoria, valor: Number(valor), descricao: descricao.trim(), parceiro_id: parceiroId,
        recorrente, recorrente_ate: recorrente && ate ? ate : null,
      };
      const { error } = edicao === "novo"
        ? await supabase.from("custos_diretos").insert(registro)
        : await supabase.from("custos_diretos").update(registro).eq("id", (edicao as CustoDireto).id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Custo direto salvo.");
      qc.invalidateQueries({ queryKey: ["custos-diretos"] });
      qc.invalidateQueries({ queryKey: ["planilha-custos"] });
      qc.invalidateQueries({ queryKey: ["resultado-canal"] });
      onClose();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!edicao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{edicao === "novo" ? "Lançar custo direto" : "Editar custo direto"}</DialogTitle>
          <DialogDescription>Sem parceiro, o valor entra como custo geral do programa.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valido) salvar.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={dataCusto} onChange={(e) => setDataCusto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input type="number" inputMode="decimal" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIAS_CUSTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Parceiro (opcional)</Label>
            <div className="flex gap-1">
              <ParceiroBusca valor={parceiroId} onChange={setParceiroId} placeholder="Custo geral do programa" />
              {parceiroId && <Button type="button" variant="ghost" size="icon" aria-label="Sem parceiro" onClick={() => setParceiroId(null)}><X /></Button>}
            </div>
          </div>
          <div className="space-y-2 rounded-[10px] bg-white/5 p-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Recorrente (uma linha por mês, como uma ferramenta mensal)</span>
              <Switch checked={recorrente} onCheckedChange={setRecorrente} />
            </label>
            {recorrente && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Recorrente até (vazio = sem data de fim)</Label>
                <Input type="date" value={ate} min={dataCusto} onChange={(e) => setAte(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!valido || salvar.isPending}>{salvar.isPending && <Loader2 className="animate-spin" />} Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
