import { cn } from "@/lib/utils";
import { nomeNivel, rotulo, STATUS_ATIVIDADE } from "@/lib/rotulos";

// Cores dos níveis só em selos e marcações de nível (constituição).
const CORES_NIVEL: Record<string, string> = {
  A: "bg-nivel-elite text-nivel-dourado border border-nivel-dourado/60",
  B: "bg-nivel-premium text-white border border-white/20",
  C: "bg-nivel-select text-white border border-white/20",
};

export function SeloNivel({ tipo, nivel, className }: { tipo?: string | null; nivel?: string | null; className?: string }) {
  if (!nivel) return <Pilula className={className}>Sem nível</Pilula>;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", CORES_NIVEL[nivel], className)}>
      {nomeNivel(tipo, nivel)}
    </span>
  );
}

type Tom = "neutro" | "menta" | "alerta" | "perigo" | "info";
const TONS: Record<Tom, string> = {
  neutro: "bg-white/10 text-neutro-100",
  menta: "bg-menta-500/15 text-menta-300",
  alerta: "bg-warning/15 text-warning",
  perigo: "bg-destructive/15 text-red-300",
  info: "bg-sky-500/15 text-sky-300",
};

export function Pilula({ children, tom = "neutro", className }: { children: React.ReactNode; tom?: Tom; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONS[tom], className)}>
      {children}
    </span>
  );
}

const TOM_STATUS: Record<string, Tom> = { ativo: "menta", morno: "alerta", dormente: "perigo", pausado: "neutro" };
export function SeloStatus({ status }: { status?: string | null }) {
  if (!status) return null;
  return <Pilula tom={TOM_STATUS[status] ?? "neutro"}>{rotulo(STATUS_ATIVIDADE, status)}</Pilula>;
}

const TOM_ESTADO: Record<string, Tom> = {
  pendente: "neutro", enviada: "info", validada: "menta", recusada: "perigo", atrasada: "alerta",
  aguardando_fechamento: "neutro", aguardando_compensacao: "info", a_pagar: "alerta", nf_recebida: "info", paga: "menta", cancelada: "neutro",
  fila: "neutro", em_ciclo: "menta", concluido: "info", suspenso: "alerta",
  nova: "info", em_contato: "neutro", reuniao: "info", proposta: "alerta", fechada: "menta", perdida: "perigo",
  rascunho: "neutro", publicado: "menta", encerrado: "neutro",
  aberto: "neutro", feito: "menta", vencido: "perigo",
};
export function SeloEstado({ estado, mapa }: { estado?: string | null; mapa: Record<string, string> }) {
  if (!estado) return null;
  return <Pilula tom={TOM_ESTADO[estado] ?? "neutro"}>{rotulo(mapa, estado)}</Pilula>;
}
