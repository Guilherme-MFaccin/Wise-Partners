import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { percentualCase } from "@/lib/paginas";
import { ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CampoTexto, Cartao, EsqueletoEditor, TEM_TRAVESSAO } from "@/components/paginas/Campos";
import { CHAVES, useCases, useResumoCases, type CaseLinha } from "@/components/paginas/dados";

type Rascunho = { id?: string; empresa: string; segmento: string; crescimento: string; periodo: string };
const NOVO: Rascunho = { empresa: "", segmento: "", crescimento: "", periodo: "" };

// Cases de resultado num lugar só (processo P-100): as duas páginas e o kit usam esta lista. Média calculada pelo banco.
export function AbaCases({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cases = useCases();
  const resumo = useResumoCases();
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [apagar, setApagar] = useState<CaseLinha | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: CHAVES.cases });
    qc.invalidateQueries({ queryKey: CHAVES.resumo });
  };

  async function salvar() {
    if (!editando) return;
    const c = Number(editando.crescimento.replace(",", "."));
    const r = { empresa: editando.empresa.trim(), segmento: editando.segmento.trim(), periodo: editando.periodo.trim(), crescimento: c };
    if (!r.empresa || !r.segmento || !r.periodo || editando.crescimento.trim() === "" || !Number.isFinite(c)) return toast.error("Preencha empresa, segmento, crescimento e período.");
    if (TEM_TRAVESSAO.test(r.empresa + r.segmento + r.periodo)) return toast.error("Troque o travessão por vírgula, dois-pontos ou ponto.");
    setOcupado(true);
    const ordem = Math.max(0, ...(cases.data ?? []).map((x) => x.ordem)) + 1;
    const { error } = editando.id
      ? await supabase.from("cases_resultado").update(r).eq("id", editando.id)
      : await supabase.from("cases_resultado").insert({ ...r, ordem });
    setOcupado(false);
    if (error) return toastErro(error);
    toast.success(editando.id ? "Case atualizado." : "Case incluído.");
    setEditando(null);
    recarregar();
  }

  async function mudarAtivo(c: CaseLinha, ativo: boolean) {
    const { error } = await supabase.from("cases_resultado").update({ ativo }).eq("id", c.id);
    if (error) return toastErro(error);
    recarregar();
  }

  // Reordena e regrava a ordem de 1 a n
  async function mover(i: number, d: -1 | 1) {
    const lista = [...(cases.data ?? [])];
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    setOcupado(true);
    const mudancas = lista.map((c, k) => ({ id: c.id, ordem: k + 1 })).filter((x, k) => lista[k].ordem !== x.ordem);
    const resultados = await Promise.all(mudancas.map((m) => supabase.from("cases_resultado").update({ ordem: m.ordem }).eq("id", m.id)));
    setOcupado(false);
    const erro = resultados.find((x) => x.error)?.error;
    if (erro) toastErro(erro);
    recarregar();
  }

  async function confirmarApagar() {
    if (!apagar) return;
    setOcupado(true);
    const { error } = await supabase.from("cases_resultado").delete().eq("id", apagar.id);
    setOcupado(false);
    setApagar(null);
    if (error) return toastErro(error);
    toast.success("Case removido.");
    recarregar();
  }

  if (cases.isLoading) return <EsqueletoEditor />;
  if (cases.error) return <ErroCarga erro={cases.error} aoTentar={() => cases.refetch()} />;
  const lista = cases.data ?? [];
  const ativos = lista.filter((c) => c.ativo).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="rounded-[14px] border border-white/10 bg-card p-5" aria-live="polite">
          <p className="text-xs font-semibold text-neutro-300">Média de crescimento dos cases ativos</p>
          {resumo.isLoading ? <div className="mt-3 h-12 w-32 rounded bg-white/10 motion-safe:animate-pulse" />
            : resumo.error ? <p className="mt-2 text-sm text-red-200">Não foi possível calcular a média agora.</p>
            : resumo.data?.media === null || resumo.data?.media === undefined ? <p className="mt-2 font-display text-[36px] font-bold leading-none text-neutro-300">0</p>
            : <p className="mt-2 font-display text-[48px] font-bold leading-none tabular-nums text-menta-400">{resumo.data.media > 0 ? "+" : ""}{resumo.data.media}%</p>}
          <p className="mt-2 text-sm text-neutro-300">
            {ativos === 1 ? "1 case ativo" : `${ativos} cases ativos`} de {lista.length}. Faturamento nos meses de trabalho contra os mesmos meses do ano anterior.
          </p>
        </section>
        <section className="rounded-[14px] border border-white/10 bg-card p-5 text-sm text-neutro-300">
          <p className="font-semibold text-foreground">Onde os cases aparecem</p>
          <p className="mt-1">Na seção "Cases de resultado" das duas páginas públicas, na ordem abaixo. A média é recalculada pelo banco quando um case muda, entra ou sai. Case desligado continua guardado, mas sai das páginas e da média.</p>
          <p className="mt-2">Só entra case de empresa que autorizou o uso do nome e do segmento.</p>
        </section>
      </div>

      <Cartao titulo="Cases" descricao="Empresa, segmento, crescimento e período de cada case."
        acoes={!desligado ? <Button size="sm" onClick={() => setEditando(NOVO)}><Plus className="mr-1 h-4 w-4" aria-hidden />Incluir case</Button> : undefined}>
        {lista.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-white/15 p-6 text-center text-sm">
            <p className="font-semibold">Nenhum case cadastrado.</p>
            <p className="mt-1 text-neutro-300">Sem case ativo, as páginas escondem a seção de cases. {desligado ? "Só administradores incluem cases." : "Inclua o primeiro para voltar a mostrar a prova."}</p>
          </div>
        ) : (
          <ol className="divide-y divide-white/10 overflow-hidden rounded-[10px] border border-white/10">
            {lista.map((c, i) => (
              <li key={c.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:flex-nowrap sm:px-4 ${c.ativo ? "" : "opacity-70"}`}>
                <span className="w-16 shrink-0 text-lg font-bold tabular-nums">{percentualCase(Number(c.crescimento))}</span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block break-words font-semibold">{c.empresa}</span>
                  <span className="block break-words text-sm text-neutro-300">{c.segmento}</span>
                  <span className="block text-xs tabular-nums text-neutro-300">{c.periodo}</span>
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {!c.ativo && <Pilula tom="alerta">Fora das páginas</Pilula>}
                  <Switch checked={c.ativo} onCheckedChange={(v) => mudarAtivo(c, v)} disabled={desligado} aria-label={`Mostrar o case ${c.empresa} nas páginas`} />
                  {!desligado && (
                    <>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => mover(i, -1)} disabled={i === 0 || ocupado} aria-label={`Subir ${c.empresa}`}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => mover(i, 1)} disabled={i === lista.length - 1 || ocupado} aria-label={`Descer ${c.empresa}`}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={`Editar ${c.empresa}`}
                        onClick={() => setEditando({ id: c.id, empresa: c.empresa, segmento: c.segmento, crescimento: String(Number(c.crescimento)), periodo: c.periodo })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-neutro-300 hover:text-red-300" onClick={() => setApagar(c)} aria-label={`Remover ${c.empresa}`}><Trash2 className="h-4 w-4" /></Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Cartao>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar case" : "Incluir case"}</DialogTitle>
            <DialogDescription>Crescimento de faturamento nos meses de trabalho contra os mesmos meses do ano anterior.</DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="space-y-4">
              <CampoTexto rotulo="Empresa" valor={editando.empresa} maximo={120} aoMudar={(v) => setEditando({ ...editando, empresa: v })} />
              <CampoTexto rotulo="Segmento" valor={editando.segmento} maximo={200} aoMudar={(v) => setEditando({ ...editando, segmento: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoTexto rotulo="Crescimento (%)" valor={editando.crescimento} tipo="number" maximo={8} placeholder="Ex.: 25,4"
                  aoMudar={(v) => setEditando({ ...editando, crescimento: v })} />
                <CampoTexto rotulo="Período" valor={editando.periodo} maximo={60} placeholder="jan/25 a out/26"
                  aoMudar={(v) => setEditando({ ...editando, periodo: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvar} disabled={ocupado}>{ocupado && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}{editando?.id ? "Salvar case" : "Incluir case"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!apagar} onOpenChange={(v) => !v && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover o case {apagar?.empresa}?</AlertDialogTitle>
            <AlertDialogDescription>O case sai das duas páginas e da média. Para só esconder, desligue o case em vez de remover.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarApagar(); }} disabled={ocupado}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
