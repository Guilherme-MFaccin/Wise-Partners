import { addDays, format, parseISO, startOfMonth } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hojeISO } from "@/lib/formato";

// Período usado no painel e na tela de atividades.
export type OpcaoPeriodo = "7d" | "mes" | "30d" | "personalizado";
export type Periodo = { opcao: OpcaoPeriodo; inicio: string; fim: string };

const OPCOES: Record<OpcaoPeriodo, string> = {
  "7d": "Últimos 7 dias",
  mes: "Este mês",
  "30d": "Últimos 30 dias",
  personalizado: "Personalizado",
};

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// Datas calculadas a partir de hoje em Brasília (mesma referência do banco).
export function calcularPeriodo(opcao: OpcaoPeriodo, atual?: Periodo): Periodo {
  const hoje = parseISO(hojeISO() + "T12:00:00");
  switch (opcao) {
    case "mes":
      return { opcao, inicio: iso(startOfMonth(hoje)), fim: iso(hoje) };
    case "30d":
      return { opcao, inicio: iso(addDays(hoje, -30)), fim: iso(hoje) };
    case "personalizado":
      return { opcao, inicio: atual?.inicio ?? iso(addDays(hoje, -7)), fim: atual?.fim ?? iso(hoje) };
    default:
      return { opcao: "7d", inicio: iso(addDays(hoje, -7)), fim: iso(hoje) };
  }
}

export function SeletorPeriodo({ valor, onChange }: { valor: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={valor.opcao} onValueChange={(v) => onChange(calcularPeriodo(v as OpcaoPeriodo, valor))}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(OPCOES) as OpcaoPeriodo[]).map((o) => (
            <SelectItem key={o} value={o}>{OPCOES[o]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {valor.opcao === "personalizado" && (
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input type="date" aria-label="Início" className="min-w-0 flex-1 sm:w-40" value={valor.inicio}
            onChange={(e) => e.target.value && onChange({ ...valor, inicio: e.target.value })} />
          <span className="text-sm text-muted-foreground">a</span>
          <Input type="date" aria-label="Fim" className="min-w-0 flex-1 sm:w-40" value={valor.fim}
            onChange={(e) => e.target.value && onChange({ ...valor, fim: e.target.value })} />
        </div>
      )}
    </div>
  );
}
