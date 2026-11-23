import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Lock, Sparkles, Users } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { useAcessoHub } from "@/components/catalogo/dados";
import { ConteudoTrilha } from "@/pages/parceiro/Trilha";

// Conhecer a Wise Makers: o que a Wise Makers faz, o que a empresa indicada recebe e o minicurso "Como vender a Wise Makers".
// Aberta a todas as empresas da comunidade; o link de indicação segue o acesso (parceiro ou cliente do grupo confirmado).
const FATOS = [
  { icone: Users, numero: "300+", texto: "empresas com o comercial estruturado pela Wise Makers" },
  { icone: Sparkles, numero: "1.500+", texto: "vendedores capacitados em quatro anos" },
  { icone: ClipboardList, numero: "5x5", texto: "Matriz de Governança Comercial: cinco pilares, cinco critérios" },
];
const RECEBE = [
  { titulo: "Diagnóstico comercial", texto: "Uma reunião de cerca de 2 horas com a equipe da Wise para empresas no perfil, ou o autodiagnóstico online." },
  { titulo: "Plano de ação", texto: "O que priorizar, quem faz e como medir, por e-mail em até 2 dias úteis." },
  { titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas, treinamentos curtos, calculadoras, planilhas e checklists." },
];

export default function ConhecerWise() {
  const acesso = useAcessoHub();
  const cab = <Cabecalho titulo="Conhecer a Wise Makers" descricao="O que a Wise Makers faz, e como apresentar a consultoria gratuita a quem você conhece?" />;
  if (acesso.isLoading) return <div>{cab}<Carregando /></div>;
  if (acesso.error) return <div>{cab}<ErroCarga erro={acesso.error} aoTentar={() => acesso.refetch()} /></div>;
  const indicar = !!acesso.data?.indicar;

  return (
    <div className="space-y-8">
      {cab}
      <section aria-label="A Wise Makers em números" className="grid gap-4 sm:grid-cols-3">
        {FATOS.map((f) => (
          <div key={f.numero} className="rounded-[14px] border border-white/10 bg-card p-5">
            <f.icone className="h-5 w-5 text-menta-400" aria-hidden />
            <p className="mt-3 font-display text-[36px] font-bold leading-none tabular-nums">{f.numero}</p>
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
            <p className="mt-2 flex items-start gap-2 text-sm text-neutro-300">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              O link de indicação é de clientes do Grupo Tríade confirmados e de parceiros do programa. Quando a sua empresa tiver o acesso, ele aparece em Indicar a Wise Makers.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="minicurso" className="space-y-2">
        <p id="minicurso" className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Minicurso</p>
        <ConteudoTrilha param="como_vender" embutido />
      </section>
    </div>
  );
}
