import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mensagemErroAcesso, problemaSenhaPessoal } from "@/lib/senha";
import { Logo } from "@/components/comum/Logo";
import { CamposNovaSenha } from "@/components/conta/CamposNovaSenha";
import { Button } from "@/components/ui/button";

// Destino do link "Esqueci minha senha": o Supabase abre a sessão de recuperação pelo próprio link
// e a pessoa escolhe a senha nova aqui.
export default function RedefinirSenha() {
  const { session, carregando } = useAuth();
  const navigate = useNavigate();
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // O link chega com o token no endereço; dá um instante para o Supabase trocar o token pela sessão
  const [esperando, setEsperando] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setEsperando(false), 2500);
    return () => clearTimeout(t);
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = problemaSenhaPessoal(nova, confirmacao);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: nova, data: { senha_provisoria: false } });
    setSalvando(false);
    if (error) {
      setErro(mensagemErroAcesso(error.message));
      return;
    }
    toast.success("Senha nova salva.");
    navigate("/", { replace: true });
  }

  const semSessao = !session && !carregando && !esperando;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-9" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-menta-500">Wise Partners</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-card p-6">
          {semSessao ? (
            <div className="space-y-3 text-center">
              <h1 className="text-xl font-bold">Link vencido ou já usado</h1>
              <p className="text-sm text-muted-foreground">Peça um link novo na tela de login, em "Esqueci minha senha".</p>
              <Button asChild variant="outline"><Link to="/entrar">Ir para o login</Link></Button>
            </div>
          ) : !session ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Conferindo o link
            </div>
          ) : (
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold">Escolha a sua senha nova</h1>
                <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
              </div>
              <CamposNovaSenha nova={nova} confirmacao={confirmacao} onNova={setNova} onConfirmacao={setConfirmacao} />
              {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
              <Button type="submit" className="w-full" disabled={salvando || !nova || !confirmacao}>
                {salvando && <Loader2 className="animate-spin" />} Salvar senha nova
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
