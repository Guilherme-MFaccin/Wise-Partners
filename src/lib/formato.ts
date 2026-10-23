import { format, parseISO, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function moeda(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return brl.format(Number(v));
}

function paraData(d: string | Date) {
  if (d instanceof Date) return d;
  // Datas puras (AAAA-MM-DD) são locais, não UTC
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? parseISO(d + "T12:00:00") : parseISO(d);
}

export function data(d: string | Date | null | undefined) {
  if (!d) return "";
  return format(paraData(d), "dd/MM/yyyy", { locale: ptBR });
}

export function dataHora(d: string | Date | null | undefined) {
  if (!d) return "";
  return format(paraData(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function dataExtenso(d: string | Date | null | undefined) {
  if (!d) return "";
  return format(paraData(d), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function haQuanto(d: string | Date | null | undefined) {
  if (!d) return "";
  return formatDistanceToNowStrict(paraData(d), { locale: ptBR, addSuffix: true });
}

// Data de hoje em Brasília, no formato AAAA-MM-DD
export function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function minutosParaHoras(min: number | null | undefined) {
  const m = Number(min ?? 0);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

// Regra de redação: nenhum texto do sistema ou da IA usa travessão nem meia-risca.
export function semTravessao(t: string) {
  return t
    .replace(/(\d)\s*[\u2013\u2014]\s*(\d)/g, "$1 a $2")
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/,\s*,/g, ",");
}

export function somenteDigitos(t: string | null | undefined) {
  return (t ?? "").replace(/\D/g, "");
}

export function formatarCnpj(t: string | null | undefined) {
  const d = somenteDigitos(t);
  if (d.length !== 14) return t ?? "";
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}
