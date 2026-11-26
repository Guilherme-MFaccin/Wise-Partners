import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { MODO_VER_COMO } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Faixa fixa na aba de Ver como: deixa claro de quem é a visão e que as ações valem como dessa pessoa.
// Encerrar sai só desta aba; quem abriu continua com o próprio acesso na outra aba.
export function FaixaVerComo() {
  const { perfil, session, sair } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [encerrada, setEncerrada] = useState(false);
  const ativa = MODO_VER_COMO && (!!session || encerrada);
  // Espaço no fim da página para a faixa não cobrir o conteúdo
  useEffect(() => {
    if (!ativa) return;
    document.body.style.paddingBottom = "64px";
    return () => { document.body.style.paddingBottom = ""; };
  }, [ativa]);
  if (!ativa) return null;
  async function encerrar() {
    setSaindo(true);
    await sair();
    setEncerrada(true);
    window.close();
  }
  return (
    <>
      <div role="region" aria-label="Visualização como outra pessoa"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-warning/40 bg-neutro-900 px-4 py-2 text-sm"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <Eye className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        <p className="min-w-0 flex-1">
          {encerrada ? "Visualização encerrada. Pode fechar esta aba." : <>Vendo como <strong>{perfil?.nome ?? "a conta escolhida"}</strong>. O que você fizer aqui vale como se fosse essa pessoa.</>}
        </p>
        {!encerrada && (
          <Button size="sm" variant="outline" className="border-warning/50" onClick={encerrar} disabled={saindo}>
            {saindo && <Loader2 className="animate-spin" />}Encerrar visualização
          </Button>
        )}
      </div>
    </>
  );
}
