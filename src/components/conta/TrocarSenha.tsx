import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mensagemErroAcesso, problemaSenhaPessoal } from "@/lib/senha";
import { Button } from "@/components/ui/button";
import { CampoSenha, CamposNovaSenha } from "./CamposNovaSenha";

// Troca de senha em Minha conta: confere a senha atual antes de gravar a nova
export function TrocarSenha() {
  const { session, perfil } = useAuth();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const provisoria = !!session?.user.user_metadata?.senha_provisoria;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = problemaSenhaPessoal(nova, confirmacao);
    if (problema) {
      setErro(problema);
      return;
    }
    if (nova === atual) {
      setErro("A nova senha precisa ser diferente da atual.");
      return;
    }
    setErro(null);
    setSalvando(true);
    const conferida = await supabase.auth.signInWithPassword({ email: perfil!.email, password: atual });
    if (conferida.error) {
      setSalvando(false);
      setErro(/invalid login credentials/i.test(conferida.error.message) ? "A senha atual está incorreta." : mensagemErroAcesso(conferida.error.message));
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nova, data: { senha_provisoria: false } });
    setSalvando(false);
    if (error) {
      setErro(mensagemErroAcesso(error.message));
      return;
    }
    setAtual(""); setNova(""); setConfirmacao("");
    toast.success("Senha trocada.");
  }

  return (
    <form id="senha" onSubmit={salvar} className="scroll-mt-24 space-y-4 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-menta-400" aria-hidden="true" /> Senha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {provisoria ? "Você ainda usa a senha provisória que recebeu. Escolha uma senha só sua." : "Troque a senha de acesso ao portal."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <CampoSenha id="senha-atual" rotulo="Senha atual" valor={atual} onChange={setAtual} autoComplete="current-password" />
        </div>
        <CamposNovaSenha nova={nova} confirmacao={confirmacao} onNova={setNova} onConfirmacao={setConfirmacao} />
      </div>
      {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
      <Button type="submit" disabled={salvando || !atual || !nova || !confirmacao}>
        {salvando && <Loader2 className="animate-spin" />} Trocar senha
      </Button>
    </form>
  );
}
