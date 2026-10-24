import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { nomePerfil, usePerfis } from "@/components/parceiros/dados";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { QUADRANTES_CRUZAMENTO } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { useCruzamentos, type Cruzamento } from "./dados";

const QUADS = Object.keys(QUADRANTES_CRUZAMENTO);
const n = (v: unknown) => Number(v ?? 0) || 0;

// Cruzamentos feitos pelos parceiros, com totais por quadrante. A lista enviada pelo parceiro nunca é guardada.
export function ListaCruzamentos() {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const q = useCruzamentos();
  const { data: parceiros = [] } = useParceirosResumo();
  const { data: perfis = [] } = usePerfis();
  const [aberto, setAberto] = useState<Set<string>>(new Set());
  const [excluir, setExcluir] = useState<{ id: string; nome: string } | null>(null);

  const grupos = useMemo(() => {
    const m = new Map<string, Cruzamento[]>();
    for (const c of q.data ?? []) m.set(c.parceiro_id, [...(m.get(c.parceiro_id) ?? []), c]);
    return [...m.entries()].map(([id, lista]) => ({
      id,
      nome: parceiros.find((p) => p.id === id)?.nome_fantasia ?? "Parceiro",
      lista,
      enviados: lista.reduce((a, c) => a + n(c.total_enviado), 0),
      coincidencias: lista.reduce((a, c) => a + n(c.totais?.coincidencias), 0),
      quads: Object.fromEntries(QUADS.map((k) => [k, lista.reduce((a, c) => a + n(c.totais?.[k]), 0)])),
    })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [q.data, parceiros]);

  const exclusao = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("excluir_cruzamentos", { p_parceiro: id });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: (qtd) => {
      toast.success(`${qtd} coincidência(s) pendente(s) apagada(s).`);
      qc.invalidateQueries({ queryKey: ["cruzamento"] });
      setExcluir(null);
    },
    onError: toastErro,
  });

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  if (!grupos.length) return <Vazio titulo="Nenhum cruzamento feito ainda." />;

  const alternar = (id: string) => setAberto((s) => {
    const x = new Set(s);
    if (x.has(id)) x.delete(id);
    else x.add(id);
    return x;
  });

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Os CNPJs enviados pelos parceiros não ficam guardados: aqui aparecem só as quantidades e as coincidências com a base da Wise.
      </p>
      <ul className="space-y-2">
        {grupos.map((g) => {
          const expandido = aberto.has(g.id);
          return (
            <li key={g.id} className={cn(CLASSE_CARD, "min-w-0")}>
              <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <button type="button" onClick={() => alternar(g.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {expandido ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="truncate font-semibold">{g.nome}</span>
                </button>
                <span className="flex flex-wrap gap-2 pl-6 sm:pl-0">
                  <Pilula>{g.lista.length} cruzamento(s)</Pilula>
                  <Pilula>{g.enviados} CNPJs enviados</Pilula>
                  <Pilula tom="menta">{g.coincidencias} coincidência(s)</Pilula>
                </span>
              </div>
              {expandido && (
                <div className="space-y-3 border-t border-white/10 p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {QUADS.map((k) => (
                      <div key={k} className="rounded-[10px] bg-white/5 p-2">
                        <p className="text-xs text-muted-foreground">{QUADRANTES_CRUZAMENTO[k]}</p>
                        <p className="text-lg font-bold">{g.quads[k]}</p>
                      </div>
                    ))}
                  </div>
                  <ul className="divide-y divide-white/5">
                    {g.lista.map((c) => (
                      <li key={c.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          {dataHora(c.executado_em)}
                          {nomePerfil(perfis, c.executado_por) && <span className="text-muted-foreground"> · {nomePerfil(perfis, c.executado_por)}</span>}
                        </span>
                        <span className="flex flex-wrap gap-2 text-xs">
                          <span>{n(c.total_enviado)} enviados</span>
                          <span>{n(c.totais?.coincidencias)} coincidências</span>
                          {c.totais?.excluido_em && <Pilula tom="alerta">Exclusão pedida em {dataHora(c.totais.excluido_em)}</Pilula>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/app/parceiros/${g.id}`} className="text-menta-400 hover:underline">Abrir ficha do parceiro</Link>
                    {isParcerias && (
                      <Button size="sm" variant="outline" onClick={() => setExcluir({ id: g.id, nome: g.nome })}>
                        <Trash2 /> Excluir coincidências pendentes
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <AlertDialog open={!!excluir} onOpenChange={(v) => !v && !exclusao.isPending && setExcluir(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coincidências de {excluir?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Use quando o parceiro pedir a exclusão. As coincidências que ainda não viraram indicação nem ação são apagadas na hora;
              o registro do cruzamento fica com a data do pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={exclusao.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={exclusao.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (excluir) exclusao.mutate(excluir.id);
              }}
            >
              {exclusao.isPending && <Loader2 className="animate-spin" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
