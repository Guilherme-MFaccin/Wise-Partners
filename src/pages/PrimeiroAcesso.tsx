import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mensagemErroAcesso, problemaSenhaPessoal } from "@/lib/senha";
import { Logo } from "@/components/comum/Logo";
import { CamposNovaSenha } from "@/components/conta/CamposNovaSenha";
import { Button } from "@/components/ui/button";

// Primeiro acesso (P-23, P-93): quem entra com a senha provisória recebida pelo WhatsApp cria a própria senha
// antes de usar o portal. Vale para parceiros e para o time interno. A troca grava senha_provisoria = false.
export default function PrimeiroAcesso() {
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = problemaSenhaPessoal(nova, confirmacao);
    if (problema) return setErro(problema);
    setErro(null);
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: nova, data: { senha_provisoria: false } });
    setSalvando(false);
    if (error) return setErro(mensagemErroAcesso(error.message));
    await supabase.auth.refreshSession();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-9" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-menta-400">Wise Partners</p>
        </div>
        <form onSubmit={salvar} className="space-y-4 rounded-[20px] border border-white/10 bg-card p-6" noValidate>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold"><KeyRound className="h-5 w-5 text-menta-400" aria-hidden /> Crie a sua senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {perfil?.nome ? `${perfil.nome.split(" ")[0]}, você` : "Você"} entrou com a senha provisória que recebeu. Antes de continuar, escolha uma senha só sua.
            </p>
          </div>
          <CamposNovaSenha nova={nova} confirmacao={confirmacao} onNova={setNova} onConfirmacao={setConfirmacao} />
          {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
          <Button type="submit" className="w-full" disabled={salvando || !nova || !confirmacao}>
            {salvando && <Loader2 className="animate-spin" />} Salvar e entrar
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={async () => { await sair(); navigate("/entrar"); }}>
            <LogOut /> Sair
          </Button>
        </form>
      </div>
    </div>
  );
}
