import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Login por link de acesso enviado por e-mail, sem senha (FR-002). Só entra quem foi convidado.
export default function Entrar() {
  const { session, perfil, carregando } = useAuth();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!carregando && session && perfil) return <Navigate to={perfil.papel === "parceiro" ? "/parceiro" : "/app"} replace />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/` },
    });
    setEnviando(false);
    if (error) {
      setErro(/signups not allowed|not found|Signups/i.test(error.message)
        ? "Este e-mail não tem acesso ao portal. Fale com o time de parcerias da Wise."
        : "Não foi possível enviar o link agora. Tente de novo em alguns minutos.");
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-9" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-menta-500">Wise Partners</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-card p-6">
          {enviado ? (
            <div className="space-y-3 text-center">
              <Mail className="mx-auto h-10 w-10 text-menta-500" />
              <h1 className="text-xl font-bold">Confira o seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de acesso para <strong className="text-foreground">{email}</strong>. Abra o e-mail neste aparelho e toque no link para entrar.
              </p>
              <Button variant="ghost" onClick={() => setEnviado(false)}>Usar outro e-mail</Button>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold">Entrar no portal</h1>
                <p className="mt-1 text-sm text-muted-foreground">Informe o seu e-mail e receba um link de acesso. Não há senha.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {erro && <p className="text-sm text-red-300">{erro}</p>}
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Loader2 className="animate-spin" />} Receber link de acesso
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
