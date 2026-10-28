import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { numero } from "@/components/gestao/formato";
import { rotuloTrimestre } from "@/components/gestao/dados";
import { cn } from "@/lib/utils";
import { useFunilReverso, type FunilReverso as Funil } from "./dados";

const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`;

// Frase principal do funil reverso, usada no cartão e na linha do kanban
export function fraseFunil(f: Funil, pessoal = false): { titulo: string; detalhe: string | null } {
  if (f.meta === null) {
    return {
      titulo: pessoal ? "Sem meta de assinados para você neste trimestre." : "Sem meta de assinados neste trimestre.",
      detalhe: `O funil atual projeta ${numero(f.projecao)} assinaturas.`,
    };
  }
  if ((f.faltam ?? 0) === 0) return { titulo: `Meta de assinados atingida: ${numero(f.assinados)} de ${numero(f.meta)}.`, detalhe: null };
  const titulo = `Faltam ${plural(f.faltam!, "assinatura", "assinaturas")} em ${plural(f.dias_uteis_restantes, "dia útil", "dias úteis")}.`;
  if ((f.lacuna ?? 0) > 0) {
    return {
      titulo,
      detalhe: `O funil atual projeta ${numero(f.projecao)}. Para cobrir a diferença: cerca de ${plural(f.reunioes_necessarias, "reunião realizada", "reuniões realizadas")} ou ${plural(f.contatos_necessarios, "contato novo", "contatos novos")}.`,
    };
  }
  return { titulo, detalhe: `O funil atual projeta ${numero(f.projecao)}, o suficiente se as negociações andarem.` };
}

// Funil reverso: parte da meta de assinados e mostra o que o funil atual projeta e quanto falta (revisão de metas, 28/10/2026)
export function FunilReverso({ funil, pessoal = false, className }: { funil: Funil; pessoal?: boolean; className?: string }) {
  const frase = fraseFunil(funil, pessoal);
  const etapas = funil.etapas.filter((e) => e.quantidade > 0 || e.etapa !== "sem_contato");
  return (
    <section className={cn(CLASSE_CARD, "min-w-0 p-4 sm:p-5", className)} aria-labelledby="t-funil-rev">
      <h2 id="t-funil-rev" className="flex items-center gap-2 font-semibold"><Filter className="h-5 w-5 text-menta-400" /> Funil até a meta</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{rotuloTrimestre(funil.trimestre)}{pessoal ? ", só a sua carteira" : ""}</p>
      <p className="mt-3 text-base font-semibold">{frase.titulo}</p>
      {frase.detalhe && <p className="mt-1 text-sm text-muted-foreground">{frase.detalhe}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[300px] text-[13px] tabular-nums">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
              <th className="py-2 pr-1.5 font-medium">Etapa</th>
              <th className="px-1.5 py-2 text-right font-medium">Parceiros</th>
              <th className="hidden px-1.5 py-2 text-right font-medium sm:table-cell">Chance</th>
              <th className="px-1.5 py-2 text-right font-medium">Projeção</th>
              <th className="py-2 pl-1.5 text-right font-medium">Paradas</th>
            </tr>
          </thead>
          <tbody>
            {etapas.map((e) => (
              <tr key={e.etapa} className="border-b border-white/5 last:border-0">
                <td className="py-2 pr-1.5">{e.nome}</td>
                <td className={cn("px-1.5 py-2 text-right", e.quantidade === 0 && "text-muted-foreground")}>{numero(e.quantidade)}</td>
                <td className="hidden px-1.5 py-2 text-right text-muted-foreground sm:table-cell">{numero(e.chance)}%</td>
                <td className={cn("px-1.5 py-2 text-right", e.projecao === 0 && "text-muted-foreground")}>{numero(e.projecao)}</td>
                <td className="py-2 pl-1.5 text-right">
                  {e.paradas > 0 ? <Pilula tom="alerta">{numero(e.paradas)}</Pilula> : <span className="text-muted-foreground">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Chance de assinatura e prazo de cada etapa em <Link to="/app/configuracoes?aba=metas" className="text-menta-400 hover:underline">Configurações, Metas</Link>.
      </p>
    </section>
  );
}

// Linha discreta para o topo do kanban; some para quem não pode ver o funil reverso
export function LinhaFunil({ versao }: { versao: number }) {
  const q = useFunilReverso(versao);
  if (!q.data) return null;
  const frase = fraseFunil(q.data);
  return (
    <p className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
      <span className="font-semibold">{frase.titulo}</span>
      {frase.detalhe && <span className="text-muted-foreground">{frase.detalhe}</span>}
      <Link to="/app" className="text-menta-400 hover:underline">Ver no painel</Link>
    </p>
  );
}
