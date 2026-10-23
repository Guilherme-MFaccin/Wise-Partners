// Regra de redação: nenhum texto gerado pelo sistema usa travessão nem meia-risca.
export function semTravessao(t: string): string {
  return t
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 a $2")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",");
}

// Aplica semTravessao em todas as strings de um objeto.
export function limparProfundo<T>(v: T): T {
  if (typeof v === "string") return semTravessao(v) as T;
  if (Array.isArray(v)) return v.map(limparProfundo) as T;
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, limparProfundo(x)])) as T;
  }
  return v;
}

export function preencher(modelo: string, valores: Record<string, string | number | null | undefined>) {
  return modelo.replace(/\{\{(\w+)\}\}/g, (_, k) => String(valores[k] ?? ""));
}

export function escaparHtml(t: string) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function dataBr(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function moeda(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
