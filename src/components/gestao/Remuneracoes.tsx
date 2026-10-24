import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO, moeda } from "@/lib/formato";
import { PAPEIS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { useConfiguracao, usePessoasInternas } from "./dados";
import { custoHora, numero } from "./formato";

type Remuneracao = {
  id: string; perfil_id: string | null; email: string | null; valor_mensal: number; horas_mensais: number; fator_encargos: number;
  vigente_desde: string; created_at: string; perfil: { nome: string; email: string } | null;
};

const POR_EMAIL = "__email";

// Remuneração de referência e custo-hora por pessoa (História 2). Só administradores: a RLS esconde dos demais.
export function Remuneracoes() {
  const qc = useQueryClient();
  const [edicao, setEdicao] = useState<Remuneracao | "nova" | null>(null);
  const q = useQuery({
    queryKey: ["remuneracoes"],
    queryFn: async () =>
      (ok<any>(await supabase.from("remuneracoes")
        .select("id, perfil_id, email, valor_mensal, horas_mensais, fator_encargos, vigente_desde, created_at, perfil:perfis!remuneracoes_perfil_id_fkey(nome, email)")
        .order("vigente_desde", { ascending: false })) ?? []) as unknown as Remuneracao[],
  });

  // Agrupa por pessoa; a vigente é a mais recente com início até hoje
  const grupos = useMemo(() => {
    const hoje = hojeISO();
    const m = new Map<string, { nome: string; itens: Remuneracao[]; vigenteId: string | null }>();
    for (const r of q.data ?? []) {
      const chave = r.perfil_id ?? (r.email ?? "").toLowerCase();
      const g = m.get(chave) ?? { nome: r.perfil?.nome ?? r.email ?? "Sem nome", itens: [], vigenteId: null };
      g.itens.push(r);
      if (!g.vigenteId && r.vigente_desde <= hoje) g.vigenteId = r.id;
      m.set(chave, g);
    }
    return [...m.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [q.data]);

  async function excluir(r: Remuneracao) {
    if (!confirm(`Excluir a remuneração de ${r.perfil?.nome ?? r.email} vigente desde ${data(r.vigente_desde)}?`)) return;
    const { error } = await supabase.from("remuneracoes").delete().eq("id", r.id);
    if (error) return toastErro(error);
    toast.success("Remuneração excluída.");
    qc.invalidateQueries({ queryKey: ["remuneracoes"] });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="flex gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Custo-hora = remuneração mensal ÷ horas mensais × fator de encargos. Para mudar o valor, cadastre uma nova remuneração com a data
          de vigência: as atividades anteriores mantêm o custo da época.
        </p>
        <Button size="sm" className="shrink-0" onClick={() => setEdicao("nova")}><Plus /> Nova remuneração</Button>
      </div>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && grupos.length === 0 && <Vazio titulo="Nenhuma remuneração cadastrada">Sem remuneração, as horas da pessoa entram no resultado com custo não informado.</Vazio>}
      {grupos.map((g) => (
        <section key={g.nome + g.itens[0].id} className={cn(CLASSE_CARD, "p-3 sm:p-4")}>
          <p className="mb-2 font-semibold">{g.nome}</p>
          <ul className="divide-y divide-white/10">
            {g.itens.map((r) => {
              const ch = custoHora(r.valor_mensal, r.horas_mensais, r.fator_encargos);
              return (
                <li key={r.id} className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-0.5">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{moeda(r.valor_mensal)} por mês</span>
                      {r.id === g.vigenteId && <Pilula tom="menta">Vigente</Pilula>}
                      {r.vigente_desde > hojeISO() && <Pilula tom="info">Futura</Pilula>}
                      {!r.perfil_id && <Pilula tom="alerta">Aguardando o perfil de {r.email}</Pilula>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desde {data(r.vigente_desde)} · {numero(r.horas_mensais)} horas por mês · fator {numero(r.fator_encargos)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-right">
                      <p className="font-semibold">{ch === null ? "" : `${moeda(ch)} por hora`}</p>
                      <p className="text-xs text-muted-foreground">{ch === null ? "" : `${moeda(ch / 60)} por minuto`}</p>
                    </div>
                    <div className="flex shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar" onClick={() => setEdicao(r)}><Pencil /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300" aria-label="Excluir" onClick={() => excluir(r)}><Trash2 /></Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <RemuneracaoDialog edicao={edicao} onClose={() => setEdicao(null)} />
    </div>
  );
}

function RemuneracaoDialog({ edicao, onClose }: { edicao: Remuneracao | "nova" | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: pessoas = [] } = usePessoasInternas();
  const { data: horasPadrao } = useConfiguracao<number>("horas_mensais_padrao");
  const { data: fatorPadrao } = useConfiguracao<number>("fator_encargos_padrao");
  const [pessoa, setPessoa] = useState("");
  const [email, setEmail] = useState("");
  const [valor, setValor] = useState("");
  const [horasMes, setHorasMes] = useState("220");
  const [fator, setFator] = useState("1");
  const [desde, setDesde] = useState("");

  useEffect(() => {
    if (!edicao) return;
    if (edicao === "nova") {
      setPessoa(""); setEmail(""); setValor("");
      setHorasMes(String(horasPadrao ?? 220)); setFator(String(fatorPadrao ?? 1));
      setDesde(format(startOfMonth(new Date(hojeISO() + "T12:00:00")), "yyyy-MM-dd"));
    } else {
      setPessoa(edicao.perfil_id ?? POR_EMAIL); setEmail(edicao.email ?? "");
      setValor(String(edicao.valor_mensal)); setHorasMes(String(edicao.horas_mensais)); setFator(String(edicao.fator_encargos));
      setDesde(edicao.vigente_desde);
    }
  }, [edicao, horasPadrao, fatorPadrao]);

  const ch = custoHora(Number(valor), Number(horasMes), Number(fator));
  const pessoaOk = (!!pessoa && pessoa !== POR_EMAIL) || (pessoa === POR_EMAIL && /\S+@\S+\.\S+/.test(email));
  const valido = pessoaOk && Number(valor) >= 0 && valor !== ""
    && Number(horasMes) > 0 && Number(fator) > 0 && !!desde;

  const salvar = useMutation({
    mutationFn: async () => {
      const registro = {
        perfil_id: pessoa && pessoa !== POR_EMAIL ? pessoa : null,
        email: pessoa === POR_EMAIL ? email.trim().toLowerCase() : pessoas.find((p) => p.id === pessoa)?.email ?? null,
        valor_mensal: Number(valor), horas_mensais: Number(horasMes), fator_encargos: Number(fator), vigente_desde: desde,
      };
      const { error } = edicao === "nova"
        ? await supabase.from("remuneracoes").insert(registro)
        : await supabase.from("remuneracoes").update(registro).eq("id", (edicao as Remuneracao).id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Remuneração salva.");
      qc.invalidateQueries({ queryKey: ["remuneracoes"] });
      onClose();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={!!edicao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{edicao === "nova" ? "Nova remuneração" : "Editar remuneração"}</DialogTitle>
          <DialogDescription>Valor de referência para o custo das horas registradas. Só administradores veem.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valido) salvar.mutate(); }}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Pessoa</Label>
            <Select value={pessoa} onValueChange={setPessoa}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {pessoas.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} ({rotulo(PAPEIS, p.papel)}){p.ativo ? "" : ", inativo"}</SelectItem>)}
                <SelectItem value={POR_EMAIL}>Pessoa ainda sem perfil (pelo e-mail)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pessoa === POR_EMAIL && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@wisemakers.com.br" />
              <p className="text-xs text-muted-foreground">A remuneração é ligada ao perfil quando a pessoa for convidada com este e-mail.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Remuneração mensal (R$)</Label>
              <Input type="number" inputMode="decimal" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Horas mensais</Label>
              <Input type="number" inputMode="decimal" min="1" step="0.5" value={horasMes} onChange={(e) => setHorasMes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fator de encargos</Label>
              <Input type="number" inputMode="decimal" min="0.001" step="0.001" value={fator} onChange={(e) => setFator(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vigente desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
          </div>
          <div className="rounded-[10px] bg-white/5 px-3 py-2 text-sm">
            Custo-hora: <span className="font-semibold">{ch === null || !valor ? "" : moeda(ch)}</span>
            {ch !== null && !!valor && <span className="text-muted-foreground"> · {moeda(ch / 60)} por minuto</span>}
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
