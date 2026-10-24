import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, ChevronRight, Clock, Loader2, Pencil, Save, Target, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula, SeloStatus } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Barra, CLASSE_CARD } from "@/components/painel/Blocos";
import { rotuloTrimestre, trimestreDe, trimestresProximos, usePessoasInternas } from "@/components/gestao/dados";
import { horas, numero } from "@/components/gestao/formato";
import { AcessoRestrito } from "@/components/gestao/Restrito";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO, moeda } from "@/lib/formato";
import { ETAPAS, PAPEIS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type Regua = { aplica: boolean; atrasada?: boolean; proxima_ate?: string; cadencia_dias?: number; ultima_reuniao?: string | null };
type PainelPessoal = {
  trimestre: string; inicio: string; fim: string;
  carteira: { parceiro_id: string; parceiro: string; etapa: string; nivel: string | null; status: string | null; regua: Regua }[];
  metas: Record<string, number>;
  realizado: { assinados: number; ativados: number; clientes_icp: number; receita: number };
  horas: number;
};

// Indicadores das metas por pessoa (FR-178), na ordem da tela
const INDICADORES: { chave: keyof PainelPessoal["realizado"]; rotulo: string; moeda?: boolean }[] = [
  { chave: "assinados", rotulo: "Novos parceiros assinados" },
  { chave: "ativados", rotulo: "Parceiros ativados" },
  { chave: "clientes_icp", rotulo: "Clientes fechados no ICP pela carteira" },
  { chave: "receita", rotulo: "Receita atribuída", moeda: true },
];

// Carteira e metas por pessoa (História 15). Admin vê e edita de qualquer pessoa; parcerias vê só o próprio.
export default function MeuPainel() {
  const { perfil, isParcerias } = useAuth();
  if (!perfil || !isParcerias) {
    return <AcessoRestrito titulo="Meu painel" texto="O painel pessoal é do time de parcerias e dos administradores." />;
  }
  return <TelaMeuPainel />;
}

function TelaMeuPainel() {
  const { perfil, isAdmin } = useAuth();
  const hoje = new Date(hojeISO() + "T12:00:00");
  const [pessoaId, setPessoaId] = useState(perfil!.id);
  const [trimestre, setTrimestre] = useState(trimestreDe(hoje));
  const [editando, setEditando] = useState(false);
  const { data: pessoas = [] } = usePessoasInternas();

  const q = useQuery({
    queryKey: ["painel-pessoal", pessoaId, trimestre],
    queryFn: async () => ok<any>(await supabase.rpc("painel_pessoal", { p_perfil: pessoaId, p_trimestre: trimestre })) as PainelPessoal,
  });
  const p = q.data;
  const nomePessoa = pessoaId === perfil!.id ? "você" : pessoas.find((x) => x.id === pessoaId)?.nome ?? "";

  return (
    <div>
      <Cabecalho titulo={pessoaId === perfil!.id ? "Meu painel" : `Painel de ${nomePessoa}`}
        descricao="Carteira de parceiros, metas do trimestre e horas dedicadas." />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {isAdmin && (
          <Select value={pessoaId} onValueChange={(v) => { setPessoaId(v); setEditando(false); }}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Pessoa"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pessoas.filter((x) => x.ativo || x.id === pessoaId).map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.nome} ({rotulo(PAPEIS, x.papel)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={trimestre} onValueChange={(v) => { setTrimestre(v); setEditando(false); }}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Trimestre"><SelectValue /></SelectTrigger>
          <SelectContent>
            {trimestresProximos(hoje, 6, 2).map((t) => <SelectItem key={t} value={t}>{rotuloTrimestre(t)}</SelectItem>)}
          </SelectContent>
        </Select>
        {p && <p className="text-xs text-muted-foreground">{data(p.inicio)} a {data(p.fim)}</p>}
      </div>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}

      {p && (
        <div className="space-y-4">
          <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-menta-400" /> Metas do trimestre</h2>
              {isAdmin && !editando && <Button size="sm" variant="outline" onClick={() => setEditando(true)}><Pencil /> Editar metas</Button>}
            </div>
            {editando ? (
              <EditorMetas perfilId={pessoaId} trimestre={trimestre} metas={p.metas} onFechar={() => setEditando(false)} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {INDICADORES.map((i) => {
                  const real = Number(p.realizado[i.chave] ?? 0);
                  const meta = p.metas[i.chave];
                  const fmt = (v: number) => (i.moeda ? moeda(v) : numero(v));
                  return (
                    <div key={i.chave} className="rounded-[10px] bg-white/5 p-3">
                      <p className="text-xs text-muted-foreground">{i.rotulo}</p>
                      <p className="mt-1 text-xl font-bold">
                        {fmt(real)}
                        {meta !== undefined && meta !== null && <span className="text-sm font-normal text-muted-foreground"> de {fmt(Number(meta))}</span>}
                      </p>
                      {meta !== undefined && meta !== null && Number(meta) > 0 ? (
                        <>
                          <Barra valor={real} maximo={Number(meta)} className="mt-2 h-1.5" />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {real >= Number(meta) ? "Meta atingida" : `${Math.round((real / Number(meta)) * 100)}% da meta`}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Sem meta definida</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Os resultados contam para quem era responsável pelo parceiro na data de cada evento.</p>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <Briefcase className="h-5 w-5 text-menta-400" /> Carteira <span className="text-sm font-normal text-muted-foreground">({p.carteira.length})</span>
              </h2>
              {p.carteira.length === 0 ? (
                <Vazio titulo="Nenhum parceiro na carteira" />
              ) : (
                <ul className="space-y-1">
                  {p.carteira.map((c) => (
                    <li key={c.parceiro_id}>
                      <Link to={`/app/parceiros/${c.parceiro_id}`} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm hover:bg-white/5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{c.parceiro}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {rotulo(ETAPAS, c.etapa)}{c.nivel ? ` · nível ${c.nivel}` : ""}
                            {c.regua?.aplica && !c.regua.atrasada && c.regua.proxima_ate ? ` · próxima reunião até ${data(c.regua.proxima_ate)}` : ""}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {c.regua?.aplica && c.regua.atrasada && <Pilula tom="perigo">Régua atrasada</Pilula>}
                          {c.regua?.aplica && !c.regua.atrasada && <Pilula tom="menta">Régua em dia</Pilula>}
                          <SeloStatus status={c.status} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={cn(CLASSE_CARD, "h-fit p-4 sm:p-5")}>
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Clock className="h-5 w-5 text-menta-400" /> Horas no trimestre</h2>
              <p className="text-3xl font-bold">{horas(p.horas)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Tempo estimado das atividades registradas pela pessoa. Detalhes em Atividades.</p>
              <Link to="/app/atividades" className="mt-2 inline-block text-sm text-menta-400 hover:underline">Ver atividades</Link>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// Edição das metas da pessoa no trimestre (metas_pessoa): vazio remove a meta
function EditorMetas({ perfilId, trimestre, metas, onFechar }: { perfilId: string; trimestre: string; metas: Record<string, number>; onFechar: () => void }) {
  const qc = useQueryClient();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    setValores(Object.fromEntries(INDICADORES.map((i) => [i.chave, metas[i.chave] === undefined || metas[i.chave] === null ? "" : String(metas[i.chave])])));
  }, [metas]);

  async function salvar() {
    setSalvando(true);
    try {
      const gravar = INDICADORES.filter((i) => valores[i.chave]?.trim() !== "")
        .map((i) => ({ perfil_id: perfilId, trimestre, indicador: i.chave, valor: Number(valores[i.chave]) }));
      if (gravar.some((g) => !Number.isFinite(g.valor) || g.valor < 0)) throw new Error("Informe metas com números positivos.");
      const remover = INDICADORES.filter((i) => valores[i.chave]?.trim() === "" && metas[i.chave] !== undefined).map((i) => i.chave);
      if (gravar.length) {
        const { error } = await supabase.from("metas_pessoa").upsert(gravar, { onConflict: "perfil_id,trimestre,indicador" });
        if (error) throw error;
      }
      if (remover.length) {
        const { error } = await supabase.from("metas_pessoa").delete().eq("perfil_id", perfilId).eq("trimestre", trimestre).in("indicador", remover);
        if (error) throw error;
      }
      toast.success("Metas salvas.");
      qc.invalidateQueries({ queryKey: ["painel-pessoal", perfilId, trimestre] });
      onFechar();
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {INDICADORES.map((i) => (
          <div key={i.chave} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{i.rotulo}{i.moeda ? " (R$)" : ""}</Label>
            <Input type="number" inputMode="decimal" min="0" step={i.moeda ? "0.01" : "1"} placeholder="Sem meta"
              value={valores[i.chave] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [i.chave]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onFechar}><X /> Cancelar</Button>
        <Button size="sm" onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar metas</Button>
      </div>
    </div>
  );
}
