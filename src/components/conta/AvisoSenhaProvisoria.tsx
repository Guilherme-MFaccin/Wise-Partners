import { Link } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Faixa no topo enquanto a pessoa usa a senha provisória que recebeu de quem criou o acesso.
// Some quando ela troca a senha (Minha conta ou redefinição pelo e-mail).
export function AvisoSenhaProvisoria() {
  const { session, perfil } = useAuth();
  if (!session?.user.user_metadata?.senha_provisoria || !perfil) return null;
  const conta = perfil.papel === "parceiro" ? "/parceiro/conta" : "/app/conta";
  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm sm:px-6">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1">
        <KeyRound className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span>Você está usando uma senha provisória.</span>
        <Link to={`${conta}#senha`} className="font-semibold text-warning underline-offset-2 hover:underline">Troque agora em Minha conta</Link>
      </p>
    </div>
  );
}
