import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";

export default function SemAcesso() {
  const { sair, session } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-4">
        <Logo className="mx-auto h-8" />
        <h1 className="text-xl font-bold">Acesso não liberado</h1>
        <p className="text-sm text-muted-foreground">
          O e-mail {session?.user.email} não tem acesso ativo ao Portal Wise Partners. Se você acredita que isso é um engano, fale com o time de parcerias da Wise Makers.
        </p>
        <Button variant="secondary" onClick={() => sair()}>Sair</Button>
      </div>
    </div>
  );
}
