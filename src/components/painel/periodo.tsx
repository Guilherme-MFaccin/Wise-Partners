import { addDays, addMonths, addYears, endOfMonth, endOfQuarter, endOfYear, format, parseISO, startOfMonth, startOfQuarter, startOfYear } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hojeISO } from "@/lib/formato";

// Período usado no painel, nas atividades, no resultado do canal e na planilha de custos.
export type OpcaoPeriodo =
  | "7d" | "mes" | "30d" | "mes_anterior" | "trimestre" | "trimestre_anterior" | "ano" | "ano_anterior" | "inicio" | "personalizado";
export type Periodo = { opcao: OpcaoPeriodo; inicio: string; fim: string };

const OPCOES: Record<OpcaoPeriodo, string> = {
  "7d": "Últimos 7 dias",
  mes: "Este mês",
  "30d": "Últimos 30 dias",
  mes_anterior: "Mês anterior",
  trimestre: "Este trimestre",
  trimestre_anterior: "Trimestre anterior",
  ano: "Este ano",
  ano_anterior: "Ano anterior",
  inicio: "Desde o início",
  personalizado: "Datas livres",
};

// Opções do painel e das atividades (as da v1)
export const OPCOES_CURTAS: OpcaoPeriodo[] = ["7d", "mes", "30d", "personalizado"];
// Opções do resultado do canal e da planilha de custos (História 1)
export const OPCOES_GESTAO: OpcaoPeriodo[] = ["mes", "mes_anterior", "trimestre", "trimestre_anterior", "ano", "ano_anterior", "inicio", "personalizado"];

// Primeira data considerada em "desde o início" (antes do portal não há registros)
export const INICIO_PROGRAMA = "2020-01-01";

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
    case "mes_anterior": {
      const m = addMonths(hoje, -1);
      return { opcao, inicio: iso(startOfMonth(m)), fim: iso(endOfMonth(m)) };
    }
    case "trimestre":
      return { opcao, inicio: iso(startOfQuarter(hoje)), fim: iso(hoje) };
    case "trimestre_anterior": {
      const t = addMonths(startOfQuarter(hoje), -3);
      return { opcao, inicio: iso(t), fim: iso(endOfQuarter(t)) };
    }
    case "ano":
      return { opcao, inicio: iso(startOfYear(hoje)), fim: iso(hoje) };
    case "ano_anterior": {
      const a = addYears(hoje, -1);
      return { opcao, inicio: iso(startOfYear(a)), fim: iso(endOfYear(a)) };
    }
    case "inicio":
      return { opcao, inicio: INICIO_PROGRAMA, fim: iso(hoje) };
    case "personalizado":
      return { opcao, inicio: atual?.inicio ?? iso(addDays(hoje, -7)), fim: atual?.fim ?? iso(hoje) };
    default:
      return { opcao: "7d", inicio: iso(addDays(hoje, -7)), fim: iso(hoje) };
  }
}

export function SeletorPeriodo({
  valor, onChange, opcoes = OPCOES_CURTAS,
}: { valor: Periodo; onChange: (p: Periodo) => void; opcoes?: OpcaoPeriodo[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={valor.opcao} onValueChange={(v) => onChange(calcularPeriodo(v as OpcaoPeriodo, valor))}>
        <SelectTrigger className="w-full sm:w-48" aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => (
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
