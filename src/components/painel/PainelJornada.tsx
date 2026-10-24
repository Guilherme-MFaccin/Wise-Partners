import { useMemo, useState } from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { differenceInCalendarDays, parseISO, subDays, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vazio } from "@/components/comum/Estados";
import { CartaoFase, type SugestaoFase } from "@/components/gestao/FasePrograma";
import { CartaoIndicador, type IndicadorV2 } from "@/components/gestao/Indicadores";
import { data } from "@/lib/formato";
import { ETAPAS_PAINEL, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { CLASSE_CARD } from "./Blocos";

// Formato devolvido por painel_v2(p_inicio, p_fim) (migração 0015)
export type PainelV2 = {
  periodo: { inicio: string; fim: string };
  fase: string | null;
  sugestao_fase?: SugestaoFase | null;
  indicadores: IndicadorV2[];
  comentarios_satisfacao?: { nota: number; comentario: string; trimestre: string; pessoa: string | null; parceiro: string | null }[];
};

const ORDEM_ETAPAS = Object.keys(ETAPAS_PAINEL);
const GRADE = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

// Período anterior usado na comparação (mesmo tamanho, imediatamente antes)
export function periodoAnterior(inicio: string, fim: string) {
  const ini = parseISO(inicio + "T12:00:00");
  const dias = differenceInCalendarDays(parseISO(fim + "T12:00:00"), ini) + 1;
  return { inicio: format(subDays(ini, dias), "yyyy-MM-dd"), fim: format(subDays(ini, 1), "yyyy-MM-dd") };
}

// Painel por etapa da jornada do parceiro (História 7, Apêndice L): destaques primeiro, lista completa por etapa.
export function PainelJornada({ dados }: { dados: PainelV2 }) {
  const [aba, setAba] = useState("destaques");
  const porEtapa = useMemo(() => {
    const m = new Map<string, IndicadorV2[]>();
    for (const i of dados.indicadores ?? []) {
      const l = m.get(i.etapa) ?? [];
      l.push(i);
      m.set(i.etapa, l);
    }
    return ORDEM_ETAPAS.filter((e) => m.has(e)).map((e) => ({ etapa: e, indicadores: m.get(e)! }));
  }, [dados.indicadores]);
  const ant = periodoAnterior(dados.periodo.inicio, dados.periodo.fim);
  const comentarios = dados.comentarios_satisfacao ?? [];

  return (
    <div className="space-y-4">
      <CartaoFase fase={dados.fase} sugestao={dados.sugestao_fase} />

      <p className="text-xs text-muted-foreground">
        Comparação com o período anterior: {data(ant.inicio)} a {data(ant.fim)}. Metas do trimestre ou do ano em Configurações, Indicadores e metas.
      </p>

      {porEtapa.length === 0 ? (
        <Vazio titulo="Nenhum indicador ativo" />
      ) : (
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="destaques" className="gap-1"><Star className="h-3.5 w-3.5" /> Destaques</TabsTrigger>
            {porEtapa.map((g) => <TabsTrigger key={g.etapa} value={g.etapa}>{rotulo(ETAPAS_PAINEL, g.etapa)}</TabsTrigger>)}
          </TabsList>

          <TabsContent value="destaques" className="space-y-6">
            {porEtapa.map((g) => {
              const destaques = g.indicadores.filter((i) => i.destaque);
              if (destaques.length === 0) return null;
              return (
                <section key={g.etapa}>
                  <h2 className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {rotulo(ETAPAS_PAINEL, g.etapa)}
                    <button type="button" className="text-xs font-normal normal-case tracking-normal text-menta-400 hover:underline" onClick={() => setAba(g.etapa)}>
                      Ver todos ({g.indicadores.length})
                    </button>
                  </h2>
                  <div className={GRADE}>
                    {destaques.map((i) => <CartaoIndicador key={i.chave} ind={i} />)}
                  </div>
                </section>
              );
            })}
          </TabsContent>

          {porEtapa.map((g) => {
            const destaques = g.indicadores.filter((i) => i.destaque);
            const demais = g.indicadores.filter((i) => !i.destaque);
            return (
              <TabsContent key={g.etapa} value={g.etapa} className="space-y-6">
                {destaques.length > 0 && (
                  <div className={GRADE}>
                    {destaques.map((i) => <CartaoIndicador key={i.chave} ind={i} />)}
                  </div>
                )}
                {demais.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Demais indicadores</h2>
                    <div className={GRADE}>
                      {demais.map((i) => <CartaoIndicador key={i.chave} ind={i} />)}
                    </div>
                  </section>
                )}
                {g.etapa === "relacionamento" && <ComentariosSatisfacao comentarios={comentarios} />}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

function ComentariosSatisfacao({ comentarios }: { comentarios: NonNullable<PainelV2["comentarios_satisfacao"]> }) {
  return (
    <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquareQuote className="h-5 w-5 text-menta-400" />
        <h2 className="font-semibold">Comentários da pesquisa de satisfação</h2>
      </div>
      {comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário no período.</p>
      ) : (
        <ul className="space-y-3">
          {comentarios.map((c, i) => (
            <li key={i} className="rounded-[10px] bg-white/5 p-3 text-sm">
              <p className="break-words">{c.comentario}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nota {c.nota} · {c.trimestre.replace("-T", " T")}
                {c.pessoa ? ` · ${c.pessoa}` : ""}{c.parceiro ? ` (${c.parceiro})` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
