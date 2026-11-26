import { useEffect, useState } from "react";

// Efeito de borda de rolagem (apple-design 12): a barra translúcida só ganha a linha de separação
// quando o conteúdo passa por baixo dela.
export function useRolou(limite = 4) {
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ver = () => setRolou(window.scrollY > limite);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, [limite]);
  return rolou;
}
