// Regras de senha do portal. A senha provisória (criada por quem dá o acesso) segue o mínimo do Supabase Auth;
// a senha que a própria pessoa escolhe precisa de pelo menos 8 caracteres.
export const MINIMO_SENHA_PROVISORIA = 6;
export const MINIMO_SENHA_PESSOAL = 8;

// Sem caracteres que se confundem (0, O, 1, l, I), para ditar ou copiar sem erro
const CARACTERES = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarSenha(tamanho = 12): string {
  const bytes = new Uint32Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CARACTERES[b % CARACTERES.length]).join("");
}

// Mensagem do problema da senha escolhida pela pessoa, ou null se estiver boa
export function problemaSenhaPessoal(senha: string, confirmacao: string): string | null {
  if (senha.length < MINIMO_SENHA_PESSOAL) return `A senha precisa de pelo menos ${MINIMO_SENHA_PESSOAL} caracteres.`;
  if (/^(.)\1+$/.test(senha) || ["12345678", "123456789", "1234567890", "senha123", "password"].includes(senha.toLowerCase())) {
    return "Essa senha é fácil de adivinhar. Escolha outra.";
  }
  if (senha !== confirmacao) return "A confirmação não é igual à nova senha.";
  return null;
}

// Erros do Supabase Auth em português
export function mensagemErroAcesso(mensagem: string | undefined): string {
  const m = mensagem ?? "";
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(m)) return "Este acesso ainda não foi liberado. Fale com o time de parcerias da Wise.";
  if (/rate limit|too many|429/i.test(m)) return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  if (/same.*password|different from the old/i.test(m)) return "A nova senha precisa ser diferente da atual.";
  if (/weak|at least/i.test(m)) return "A senha é muito fraca. Use pelo menos 8 caracteres.";
  return "Não foi possível concluir agora. Tente de novo em alguns minutos.";
}
