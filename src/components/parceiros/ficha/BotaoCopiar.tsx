import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copiar } from "./v2";

// Copia um texto para a área de transferência, com aviso.
export function BotaoCopiar({ texto, rotulo = "Copiar", size }: { texto: string; rotulo?: string; size?: "sm" | "default" }) {
  return (
    <Button type="button" variant="outline" size={size}
      onClick={async () => ((await copiar(texto)) ? toast.success("Copiado.") : toast.error("Não foi possível copiar. Selecione e copie manualmente."))}>
      <Copy /> {rotulo}
    </Button>
  );
}
