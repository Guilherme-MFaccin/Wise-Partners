import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nomePerfil, usePerfis } from "@/components/parceiros/dados";
import { dataHora } from "@/lib/formato";
import { useLeituras, type Comunicado, type Leitura } from "./dados";

type Filtro = "todos" | "lidos" | "nao_lidos";

// Leituras por parceiro e por pessoa de um comunicado enviado.
export function LeiturasDialog({ comunicado, onFechar }: { comunicado: Comunicado | null; onFechar: () => void }) {
  const q = useLeituras(comunicado?.id ?? null);
  const { data: perfis = [] } = usePerfis();
  const { data: parceiros = [] } = useParceirosResumo();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const grupos = useMemo(() => {
    const m = new Map<string, Leitura[]>();
    for (const l of q.data ?? []) {
      const k = l.parceiro_id ?? "";
      m.set(k, [...(m.get(k) ?? []), l]);
    }
    const nome = (id: string) => parceiros.find((p) => p.id === id)?.nome_fantasia ?? "Parceiro";
    return [...m.entries()]
      .map(([id, ls]) => ({ id, nome: nome(id), leituras: ls, lidos: ls.filter((l) => l.lido_em).length }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [q.data, parceiros]);

  const total = q.data?.length ?? 0;
  const lidos = (q.data ?? []).filter((l) => l.lido_em).length;
  const visiveis = grupos
    .map((g) => ({
      ...g,
      leituras: g.leituras.filter((l) => filtro === "todos" || (filtro === "lidos" ? !!l.lido_em : !l.lido_em)),
    }))
    .filter((g) => g.leituras.length);

  return (
    <Dialog open={!!comunicado} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">{comunicado?.titulo}</DialogTitle>
          <DialogDescription>
            Enviado em {dataHora(comunicado?.enviado_em)} · {lidos} de {total} pessoa(s) leram
          </DialogDescription>
        </DialogHeader>

        {comunicado && (
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-[10px] bg-white/5 p-3 text-sm">{comunicado.corpo}</div>
        )}

        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="todos">Todos ({total})</TabsTrigger>
            <TabsTrigger value="lidos">Leram ({lidos})</TabsTrigger>
            <TabsTrigger value="nao_lidos">Não leram ({total - lidos})</TabsTrigger>
          </TabsList>
        </Tabs>

        {q.isLoading && <Carregando />}
        {q.error && <ErroCarga erro={q.error} />}
        {q.isSuccess && !visiveis.length && <Vazio titulo="Ninguém nesta lista." />}

        <ul className="space-y-3">
          {visiveis.map((g) => (
            <li key={g.id} className="rounded-[10px] border border-white/10 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link to={`/app/parceiros/${g.id}`} className="font-semibold text-menta-400 hover:underline">{g.nome}</Link>
                <Pilula tom={g.lidos === g.leituras.length && filtro === "todos" ? "menta" : g.lidos ? "alerta" : "neutro"}>
                  {g.lidos} de {grupos.find((x) => x.id === g.id)?.leituras.length} leram
                </Pilula>
              </div>
              <ul className="space-y-1 text-sm">
                {g.leituras.map((l) => (
                  <li key={l.perfil_id} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex min-w-0 items-center gap-2">
                      {l.lido_em ? <CheckCircle2 className="h-4 w-4 shrink-0 text-menta-400" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{nomePerfil(perfis, l.perfil_id) || "Pessoa do parceiro"}</span>
                    </span>
                    <span className="pl-6 text-xs text-muted-foreground sm:pl-0">{l.lido_em ? `Leu em ${dataHora(l.lido_em)}` : "Não leu"}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
