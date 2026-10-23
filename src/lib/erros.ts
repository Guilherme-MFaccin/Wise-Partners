import { toast } from "sonner";

// Mensagem amigável a partir de erros do Supabase (as regras do banco já falam português).
export function mensagemErro(e: any): string {
  if (!e) return "Erro desconhecido.";
  const msg: string = e.message ?? String(e);
  if (e.code === "42501" || /row-level security/i.test(msg)) return "Você não tem permissão para esta ação.";
  if (e.code === "23505") return "Já existe um registro com esses dados.";
  if (/dados_pessoais_com_consentimento/.test(msg)) return "Declare o consentimento para salvar dados pessoais do cliente.";
  return msg;
}

export function toastErro(e: any) {
  toast.error(mensagemErro(e));
}

// Lança o erro de uma resposta do Supabase, para usar com react-query.
export function ok<T>(r: { data: T; error: any }): T {
  if (r.error) throw r.error;
  return r.data;
}
