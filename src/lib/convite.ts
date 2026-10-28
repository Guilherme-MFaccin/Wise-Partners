import { supabase } from "@/integrations/supabase/client";

export type DadosConvite = {
  email: string;
  nome: string;
  papel: "admin" | "parcerias" | "consultor" | "comercial" | "financeiro" | "parceiro";
  empresa_grupo_id?: string | null;
  parceiro_id?: string | null;
  is_diretor?: boolean;
  is_responsavel_parceiro?: boolean;
  senha: string; // senha provisória, repassada à pessoa por quem cria o acesso
};

// Cria o acesso de um usuário pela Edge Function convidar-usuario: conta com e-mail e senha provisória.
// A função confere quem pode convidar quem: admin convida qualquer papel; parcerias convida usuários
// de parceiro; o responsável do parceiro convida usuários da própria empresa.
export async function convidarUsuario(dados: DadosConvite): Promise<{ ok: boolean; mensagem: string }> {
  const { data, error } = await supabase.functions.invoke("convidar-usuario", { body: dados });
  if (error) {
    let msg = error.message;
    try {
      const corpo = await (error as any).context?.json?.();
      if (corpo?.erro) msg = corpo.erro;
    } catch { /* mantém */ }
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}

// Define uma senha provisória nova para um usuário (Edge Function redefinir-senha), com as mesmas regras de quem
// gerencia quem. A própria pessoa troca a sua senha em Minha conta.
export async function redefinirSenhaUsuario(perfilId: string, senha: string): Promise<{ ok: boolean; mensagem: string }> {
  const { data, error } = await supabase.functions.invoke("redefinir-senha", { body: { perfil_id: perfilId, senha } });
  if (error) {
    let msg = error.message;
    try {
      const corpo = await (error as any).context?.json?.();
      if (corpo?.erro) msg = corpo.erro;
    } catch { /* mantém */ }
    throw new Error(msg);
  }
  if (data?.erro) throw new Error(data.erro);
  return data;
}
