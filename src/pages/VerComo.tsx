import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";

// Abertura da aba de Ver como (/ver-como#t=codigo): troca o código de uso único pela sessão da conta visualizada,
// guardada só nesta aba, e leva à área dela. O código vem no fragmento da URL, que não vai para servidor nenhum.
export default function VerComo() {
  const navigate = useNavigate();
  const [falha, setFalha] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1));
    const token = p.get("t");
    window.history.replaceState(null, "", "/ver-como");
    if (!token) {
      setFalha("Este link de visualização já foi usado ou está incompleto. Abra de novo pelo portal, em Programa, Ver como.");
      return;
    }
    try {
      sessionStorage.setItem("wp_ver_como", "1");
    } catch {
      // sem armazenamento: a sessão ainda fica nesta aba enquanto ela estiver aberta
    }
    supabase.auth.verifyOtp({ token_hash: token, type: "magiclink" }).then(({ error }) => {
      if (error) setFalha("O link de visualização expirou. Abra de novo pelo portal, em Programa, Ver como.");
      else navigate("/", { replace: true });
    });
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <Logo className="h-8" />
      {falha ? (
        <>
          <h1 className="text-[22px] font-semibold">Não foi possível abrir a visualização</h1>
          <p className="max-w-[46ch] text-sm text-neutro-300">{falha}</p>
          <Button variant="outline" onClick={() => window.close()}>Fechar esta aba</Button>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-neutro-300" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Abrindo o portal como a conta escolhida...</p>
      )}
    </main>
  );
}
