import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { moeda } from "@/lib/formato";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Lock, Sparkles, Users } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { ErroCarga } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { useAcessoHub } from "@/components/catalogo/dados";
import { DialogoParceria } from "@/components/catalogo/Componentes";
import { ConteudoTrilha } from "@/pages/parceiro/Trilha";

// Conhecer a Wise Makers: o que a Wise Makers faz, o que a empresa indicada recebe e o minicurso "Como vender a Wise Makers".
// Aberta a todas as empresas da comunidade; o link de indicação segue o acesso (parceiro ou cliente do grupo confirmado).
const FATOS = [
  { icone: Users, numero: "40+", texto: "indústrias e empresas B2B com o comercial estruturado pela Wise Makers" },
  { icone: Sparkles, numero: "6 meses", texto: "de plano de ação no diagnóstico gratuito" },
  { icone: ClipboardList, numero: "5x5", texto: "Matriz de Governança Comercial: cinco pilares, cinco critérios" },
];
const RECEBE = [
  { titulo: "Diagnóstico comercial", texto: "Uma reunião de cerca de 2 horas com a equipe da Wise para empresas no perfil, ou o autodiagnóstico online." },
  { titulo: "Plano de ação para 6 meses", texto: "O que priorizar nos próximos 6 meses, quem faz e como medir, por e-mail em até 2 dias úteis." },
  { titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas, treinamentos curtos, calculadoras, planilhas e checklists." },
];

type Jornada = { diagnostico: number; preco_mes1: number; preco_mes1_tabela: number; preco_mes2: number; preco_continuidade: number; pct_pontual: number | null; pct_continuo: number };

// Jornada da consultoria (proposta comercial de 26/11/2026), com os preços e a comissão vindos do banco
function JornadaComPrecos({ indicar }: { indicar: boolean }) {
  const q = useQuery({
    queryKey: ["jornada-wise"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("jornada_wise" as any);
      if (error) throw error;
      return data as Jornada | null;
    },
  });
  if (q.isLoading) return <div className="h-40 rounded-[14px] border border-white/10 bg-card motion-safe:animate-pulse" aria-busy="true" aria-label="Carregando a jornada" />;
  if (q.error) return <ErroCarga erro={q.error} aoTentar={() => q.refetch()} />;
  const j = q.data;
  if (!j) return null;
  const pct = (v: number | null) => `${Number(v ?? 0).toLocaleString("pt-BR")}%`;
  const etapas = [
    { n: 0, titulo: "Diagnóstico gratuito", texto: `Reunião de cerca de 2 horas, plano para 6 meses e Wise Hub. Valor de referência ${moeda(j.diagnostico)}, sem custo.`, ganho: null },
    { n: 1, titulo: "Mês 1: acompanhamento guiado", texto: `4 encontros semanais de 2 horas: ferramentas, equipe treinada e perspectiva de 12 meses. ${moeda(j.preco_mes1)} em vez de ${moeda(j.preco_mes1_tabela)}.`, ganho: pct(j.pct_pontual) },
    { n: 2, titulo: "Mês 2: Plano de Tração", texto: `Mais 4 encontros: metas, comissão e bônus, playbook e reativação da base. Mais ${moeda(j.preco_mes2)}.`, ganho: pct(j.pct_pontual) },
    { n: 3, titulo: "Do mês 3 em diante: continuidade", texto: `2 encontros por mês, de 3 a 4 horas: indicadores, gestão do time, aquisição e retenção. ${moeda(j.preco_continuidade)} por mês.`, ganho: `${pct(j.pct_continuo)} da 1ª mensalidade` },
  ];
  return (
    <section aria-labelledby="jornada" className="space-y-3">
      <h2 id="jornada" className="text-lg font-semibold">Se a empresa indicada quiser ir além</h2>
      <p className="max-w-[68ch] text-sm text-neutro-300">O diagnóstico não obriga a nada. Quem chega pelo seu link tem condição especial no mês 1, e ao fim de cada etapa decide se segue com a Wise.</p>
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {etapas.map((e) => (
          <li key={e.n} className={`flex min-w-0 flex-col rounded-[14px] border p-5 ${e.n === 0 ? "border-dashed border-menta-500/50" : "border-white/10 bg-card"}`}>
            <span className="text-[28px] font-bold leading-none tabular-nums text-menta-400">{e.n}</span>
            <p className="mt-3 font-semibold">{e.titulo}</p>
            <p className="mt-2 text-sm text-neutro-300">{e.texto}</p>
            {indicar && e.ganho && <p className="mt-auto pt-3 text-sm"><span className="text-neutro-300">Sua comissão: </span><span className="font-semibold tabular-nums">{e.ganho}</span></p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ConhecerWise() {
  const acesso = useAcessoHub();
  const [parceria, setParceria] = useState(false);
  const cab = <Cabecalho titulo="Conhecer a Wise Makers" descricao="O que a Wise Makers faz, e como apresentar a consultoria gratuita a quem você conhece?" />;
  if (acesso.isLoading) {
    return (
      <div className="space-y-8">{cab}
        <div className="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Carregando">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-[14px] border border-white/10 bg-card motion-safe:animate-pulse" />)}
        </div>
        <div className="h-56 rounded-[14px] border border-white/10 bg-card motion-safe:animate-pulse" />
      </div>
    );
  }
  if (acesso.error) return <div>{cab}<ErroCarga erro={acesso.error} aoTentar={() => acesso.refetch()} /></div>;
  const indicar = !!acesso.data?.indicar;
  const a = acesso.data;
  const naFila = !!a?.pedido_parceria && ["fila", "contatado", "reuniao_marcada"].includes(a.pedido_parceria);

  return (
    <div className="space-y-8">
      {cab}
      <section aria-label="A Wise Makers em números" className="grid gap-4 sm:grid-cols-3">
        {FATOS.map((f) => (
          <div key={f.numero} className="rounded-[14px] border border-white/10 bg-card p-5">
            <f.icone className="h-5 w-5 text-menta-400" aria-hidden />
            <p className="mt-3 text-[28px] font-bold leading-none tabular-nums">{f.numero}</p>
            <p className="mt-2 text-sm text-neutro-300">{f.texto}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[14px] border border-white/10 bg-card p-5">
          <h2 className="text-lg font-semibold">O que a empresa indicada recebe, sem custo</h2>
          <ul className="mt-4 space-y-4">
            {RECEBE.map((r, i) => (
              <li key={r.titulo} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-menta-500/40 text-xs font-bold tabular-nums text-menta-400">{i + 1}</span>
                <div><p className="font-semibold">{r.titulo}</p><p className="mt-1 text-sm text-neutro-300">{r.texto}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col rounded-[14px] border border-white/10 bg-card p-5">
          <h2 className="text-lg font-semibold">Indique quem você conhece</h2>
          {indicar ? (
            <>
              <p className="mt-2 text-sm text-neutro-300">Mande o seu link para clientes, fornecedores e parceiros que têm time comercial. Quem entra por ele fica registrado como indicação sua.</p>
              <Button asChild className="mt-auto self-start"><Link to="/parceiro/indicar">Pegar o meu link<ArrowRight className="ml-1.5 h-4 w-4" aria-hidden /></Link></Button>
            </>
          ) : (
            <>
              <p className="mt-2 flex items-start gap-2 text-sm text-neutro-300">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {a?.vinculo_cliente === "a_confirmar"
                  ? "O link sai assim que a Wise confirmar que a sua empresa é cliente do grupo, em até 2 dias úteis."
                  : naFila ? "O link sai quando a sua empresa entrar no programa de parceiros. O pedido já está com a Wise, que fala com você pelo WhatsApp."
                  : "O link de indicação é de clientes do Grupo Tríade confirmados e de parceiros do programa."}
              </p>
              {a?.vinculo_cliente !== "a_confirmar" && !naFila && (
                <Button variant="outline" className="mt-auto self-start" onClick={() => setParceria(true)}>Quero ser parceiro</Button>
              )}
            </>
          )}
        </div>
      </section>

      <JornadaComPrecos indicar={indicar} />

      <section aria-labelledby="minicurso" className="space-y-2">
        <p id="minicurso" className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Minicurso</p>
        <ConteudoTrilha param="como_vender" embutido />
      </section>
      <DialogoParceria aberto={parceria} fechar={() => setParceria(false)} />
    </div>
  );
}
