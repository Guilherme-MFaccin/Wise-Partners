import { createContext, useContext, useState, type ReactNode } from "react";
import { RegistroContatoDialog } from "@/components/contato/RegistroContatoDialog";

// Registro rápido de ponto de contato, acessível de qualquer tela (FR-025).
type Ctx = { abrir: (parceiroId?: string | null) => void };
const RegistroCtx = createContext<Ctx>({ abrir: () => {} });

export function RegistroRapidoProvider({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  return (
    <RegistroCtx.Provider value={{ abrir: (id) => { setParceiroId(id ?? null); setAberto(true); } }}>
      {children}
      <RegistroContatoDialog aberto={aberto} onOpenChange={setAberto} parceiroIdInicial={parceiroId} />
    </RegistroCtx.Provider>
  );
}

export function useRegistroRapido() {
  return useContext(RegistroCtx);
}
