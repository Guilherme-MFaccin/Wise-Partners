import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ChevronRight, Clock, Settings2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula, SeloStatus } from "@/components/comum/Selos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { BarraMeta } from "@/components/metas/BlocoMetas";
import { FunilReverso } from "@/components/metas/FunilReverso";
import { INDICADORES_PESSOA, type FunilReverso as Funil } from "@/components/metas/dados";
import { rotuloTrimestre, trimestreDe, trimestresProximos, usePessoasInternas } from "@/components/gestao/dados";
import { horas, numero, pct } from "@/components/gestao/formato";
import { AcessoRestrito } from "@/components/gestao/Restrito";
import { ok } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { ETAPAS, PAPEIS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type Regua = { aplica: boolean; atrasada?: boolean; proxima_ate?: string; cadencia_dias?: number; ultima_reuniao?: string | null };
type PainelPessoal = {
  trimestre: string; inicio: string; fim: string;
  carteira: { parceiro_id: string; parceiro: string; etapa: string; nivel: string | null; status: string | null; regua: Regua }[];
  metas: Record<string, number>;
  realizado: { assinados: number; ativados: number; clientes_icp: number; reunioes: number; regua_em_dia: number | null };
  funil: Funil;
  horas: number;
};

// Carteira e metas por pessoa (História 15, revisão de metas de 28/10/2026). Admin vê qualquer pessoa; parcerias vê só o próprio.
// As metas são definidas em Configurações, Metas, aba Pessoas.
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
        descricao="Estou no ritmo das minhas metas do trimestre e qual parceiro da carteira precisa de mim?" />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        {isAdmin && (
          <Select value={pessoaId} onValueChange={setPessoaId}>
            <SelectTrigger className="w-full sm:w-72" aria-label="Pessoa"><SelectValue /></SelectTrigger>
            <SelectContent>
              {pessoas.filter((x) => x.ativo || x.id === pessoaId).map((x) => (
                <SelectItem key={x.id} value={x.id}>{x.nome} ({rotulo(PAPEIS, x.papel)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={trimestre} onValueChange={setTrimestre}>
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
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className={cn(CLASSE_CARD, "min-w-0 p-4 sm:p-5")}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-menta-400" /> Metas do trimestre</h2>
                {isAdmin && (
                  <Link to="/app/configuracoes?aba=metas" className="inline-flex items-center gap-1 text-sm text-menta-400 hover:underline">
                    <Settings2 className="h-4 w-4" /> Editar metas
                  </Link>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {INDICADORES_PESSOA.map((i) => {
                  const bruto = p.realizado[i.chave];
                  const real = bruto === null || bruto === undefined ? null : Number(bruto);
                  const meta = p.metas[i.chave];
                  const fmt = (v: number) => (i.percentual ? pct(v) : numero(v));
                  const temMeta = meta !== undefined && meta !== null && Number(meta) > 0;
                  return (
                    <div key={i.chave} className="rounded-[10px] bg-white/5 p-3">
                      <p className="text-xs text-muted-foreground">{i.rotulo}</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {real === null ? <span className="text-base font-semibold text-muted-foreground">Sem parceiros com régua</span> : fmt(real)}
                        {temMeta && <span className="text-sm font-normal text-muted-foreground"> de {fmt(Number(meta))}</span>}
                      </p>
                      {temMeta ? (
                        <>
                          <BarraMeta valor={real ?? 0} meta={Number(meta)} className="mt-2" />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(real ?? 0) >= Number(meta) ? "Meta atingida" : `${Math.round(((real ?? 0) / Number(meta)) * 100)}% da meta`}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Sem meta definida</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Os resultados contam para quem era responsável pelo parceiro na data de cada evento. Régua em dia é o retrato de hoje.
              </p>
            </section>
            <FunilReverso funil={p.funil} pessoal />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className={cn(CLASSE_CARD, "min-w-0 p-4 sm:p-5")}>
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
