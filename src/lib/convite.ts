import { supabase } from "@/integrations/supabase/client";

export type DadosConvite = {
  email: string;
  nome: string;
  papel: "admin" | "parcerias" | "consultor" | "comercial" | "financeiro" | "parceiro";
  empresa_grupo_id?: string | null;
  parceiro_id?: string | null;
  is_diretor?: boolean;
  is_responsavel_parceiro?: boolean;
};

// Convida um usuário pela Edge Function convidar-usuario (cria o convite e envia o link de acesso).
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
