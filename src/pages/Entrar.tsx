import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mensagemErroAcesso } from "@/lib/senha";
import { Logo } from "@/components/comum/Logo";
import { CampoSenha } from "@/components/conta/CamposNovaSenha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Modo = "entrar" | "esqueci" | "enviado";

// Login com e-mail e senha (FR-002, alterado em 28/10/2026). Só entra quem recebeu acesso: o cadastro aberto
// está desligado no Supabase Auth. "Esqueci minha senha" envia um link para criar uma senha nova.
export default function Entrar() {
  const { session, perfil, carregando } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!carregando && session && perfil) return <Navigate to={perfil.papel === "parceiro" ? "/parceiro" : "/app"} replace />;

  const emailLimpo = email.trim().toLowerCase();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLimpo, password: senha });
    setEnviando(false);
    if (error) {
      setErro(mensagemErroAcesso(error.message));
      return;
    }
    navigate("/", { replace: true });
  }

  async function pedirNovaSenha(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, { redirectTo: `${window.location.origin}/redefinir-senha` });
    setEnviando(false);
    // A resposta não diz se o e-mail tem acesso, para não revelar quem é usuário do portal
    if (error && /rate limit|too many|429/i.test(error.message)) {
      setErro(mensagemErroAcesso(error.message));
      return;
    }
    setModo("enviado");
  }

  function irPara(m: Modo) {
    setErro(null);
    setSenha("");
    setModo(m);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-9" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-menta-500">Wise Partners</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-card p-6">
          {modo === "enviado" ? (
            <div className="space-y-3 text-center">
              <Mail className="mx-auto h-10 w-10 text-menta-500" aria-hidden="true" />
              <h1 className="text-xl font-bold">Confira o seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Se <strong className="text-foreground">{emailLimpo}</strong> tiver acesso ao portal, você vai receber um link para criar uma senha nova.
                Se ele não chegar em alguns minutos, peça a um administrador da Wise para redefinir a sua senha.
              </p>
              <Button variant="ghost" onClick={() => irPara("entrar")}><ArrowLeft /> Voltar para o login</Button>
            </div>
          ) : modo === "esqueci" ? (
            <form onSubmit={pedirNovaSenha} className="space-y-4" noValidate>
              <div>
                <h1 className="text-xl font-bold">Criar uma senha nova</h1>
                <p className="mt-1 text-sm text-muted-foreground">Informe o e-mail de acesso. Enviamos um link para você criar uma senha nova.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
              <Button type="submit" className="w-full" disabled={enviando || !/^\S+@\S+\.\S+$/.test(emailLimpo)}>
                {enviando && <Loader2 className="animate-spin" />} Enviar link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => irPara("entrar")}><ArrowLeft /> Voltar para o login</Button>
            </form>
          ) : (
            <form onSubmit={entrar} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold">Entrar no portal</h1>
                <p className="mt-1 text-sm text-muted-foreground">Use o e-mail e a senha do seu acesso.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <CampoSenha id="senha" rotulo="Senha" valor={senha} onChange={setSenha} autoComplete="current-password" />
              {erro && <p role="alert" className="text-sm text-red-300">{erro}</p>}
              <Button type="submit" className="w-full" disabled={enviando || !emailLimpo || !senha}>
                {enviando && <Loader2 className="animate-spin" />} Entrar
              </Button>
              <button type="button" onClick={() => irPara("esqueci")}
                className="mx-auto block min-h-11 px-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Esqueci minha senha
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
