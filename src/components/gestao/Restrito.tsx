import { Lock } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";

// Tela para quem não tem o papel exigido (a proteção real é a RLS e as funções do banco).
export function AcessoRestrito({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <Cabecalho titulo={titulo} />
      <Vazio titulo="Acesso restrito">
        <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4 shrink-0" /> {texto}</span>
      </Vazio>
    </div>
  );
}

// Aviso em destaque (alertas do banco e orientações)
export function Aviso({ children, tom = "alerta" }: { children: React.ReactNode; tom?: "alerta" | "info" }) {
  return (
    <div className={tom === "alerta"
      ? "flex gap-2 rounded-[10px] border border-warning/40 bg-warning/10 px-3 py-2 text-sm"
      : "flex gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm"}>
      {children}
    </div>
  );
}
