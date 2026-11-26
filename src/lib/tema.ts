import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

// Aparência (apple-design 7 e 14): claro e escuro com os mesmos papéis de cor. Nas áreas logadas vale a escolha
// da pessoa (ou o sistema); as páginas públicas são o momento da marca e ficam sempre no escuro.
// A preferência é só deste navegador (localStorage); sem ela, segue o sistema.
export type Preferencia = "sistema" | "claro" | "escuro";
const CHAVE = "wp-tema";
const ouvintes = new Set<() => void>();

export function lerPreferencia(): Preferencia {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "claro" || v === "escuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

export function areaComTema(pathname: string) {
  return /^\/(app|parceiro)(\/|$)/.test(pathname);
}

function sistemaEscuro() {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

export function aplicarTema(pathname: string, suave = false) {
  const p = lerPreferencia();
  const escuro = !areaComTema(pathname) || p === "escuro" || (p === "sistema" && sistemaEscuro());
  const raiz = document.documentElement;
  if (raiz.classList.contains("dark") === escuro) return;
  // Sem salto de brilho na troca (apple-design 14)
  if (suave && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    raiz.classList.add("tema-trocando");
    window.setTimeout(() => raiz.classList.remove("tema-trocando"), 260);
  }
  raiz.classList.toggle("dark", escuro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", escuro ? "#101012" : "#f5f5f7");
}

export function definirPreferencia(p: Preferencia) {
  try {
    if (p === "sistema") localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, p);
  } catch {
    // Sem armazenamento (janela privada): vale só nesta visita
  }
  aplicarTema(location.pathname, true);
  ouvintes.forEach((f) => f());
}

export function usePreferenciaTema() {
  return useSyncExternalStore(
    (f) => { ouvintes.add(f); return () => ouvintes.delete(f); },
    lerPreferencia,
    () => "sistema" as Preferencia,
  );
}

// Fica dentro do roteador: reaplica o tema a cada troca de página e quando o sistema muda de claro para escuro
export function SincronizarTema() {
  const { pathname } = useLocation();
  useEffect(() => { aplicarTema(pathname); }, [pathname]);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const mudou = () => aplicarTema(location.pathname, true);
    mq.addEventListener("change", mudou);
    return () => mq.removeEventListener("change", mudou);
  }, []);
  return null;
}
