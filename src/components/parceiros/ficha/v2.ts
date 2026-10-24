import { NIVEIS_COMERCIAL } from "@/lib/rotulos";
import { hojeISO } from "@/lib/formato";

// Apoio às abas da v2 da ficha (Método Octo). As regras ficam no banco; aqui só formatamos.

// Nas telas internas o nível aparece com a letra e o nome (ex.: "A · Elite").
export function nivelInterno(codigo: string | null | undefined) {
  if (!codigo) return "Sem nível";
  const nome = NIVEIS_COMERCIAL[codigo];
  return nome ? `${codigo} · ${nome}` : codigo;
}

// Percentual vindo do banco como número de 0 a 100 (numeric chega como texto)
export function pct(v: number | string | null | undefined, casas = 1) {
  if (v === null || v === undefined || v === "") return "";
  return `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

export function vencida(d: string | null | undefined) {
  return !!d && d < hojeISO();
}

// Soma dias a uma data AAAA-MM-DD (sem fuso)
export function somarDias(d: string, dias: number) {
  const [a, m, dia] = d.split("-").map(Number);
  const x = new Date(Date.UTC(a, m - 1, dia + dias));
  return x.toISOString().slice(0, 10);
}

export async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

// Matriz de acesso da v2 (briefing técnico, seção 5): a interface só esconde; a RLS decide.
export const PAPEIS_V2 = {
  nossaParceria: ["admin", "parcerias", "consultor", "comercial"],
  scorecard: ["admin", "parcerias", "consultor"],
  nivel: ["admin", "parcerias", "consultor"],
  onboarding: ["admin", "parcerias", "consultor"],
  acoes: ["admin", "parcerias", "consultor"],
  maturidade: ["admin", "parcerias", "consultor"],
  desligamento: ["admin", "parcerias"],
};
