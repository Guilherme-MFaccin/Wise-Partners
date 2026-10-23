// Limite simples de requisições por IP, em memória da instância (protege a página pública).
const janelas = new Map<string, { inicio: number; n: number }>();

export function ipDe(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("cf-connecting-ip") || "desconhecido";
}

export function excedeuLimite(chave: string, maximo = 60, janelaMs = 60_000) {
  const agora = Date.now();
  const j = janelas.get(chave);
  if (!j || agora - j.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, n: 1 });
    return false;
  }
  j.n++;
  return j.n > maximo;
}
