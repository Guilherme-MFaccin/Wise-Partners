// Redefinição de senha por quem gerencia o acesso (alternativa ao "Esqueci minha senha", que depende de e-mail).
// Mesmas regras da criação de acesso: administrador redefine qualquer usuário; time de parcerias, usuários de
// parceiro; o responsável do parceiro, usuários da própria empresa. A senha nova é provisória: o portal pede a
// troca pela faixa de senha provisória. A própria pessoa troca a sua senha em Minha conta.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, perfilDaRequisicao } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const quem = await perfilDaRequisicao(req);
    if (!quem) return erro("Não autenticado.", 401);
    const b = await req.json();
    const perfilId = String(b.perfil_id ?? "");
    const senha = String(b.senha ?? "");
    if (!perfilId) return erro("Informe o usuário.");
    if (senha.length < 6) return erro("A senha provisória precisa de pelo menos 6 caracteres.");
    if (perfilId === quem.id) return erro("Para trocar a sua própria senha, use Minha conta.");

    const sb = admin();
    const { data: alvo } = await sb.from("perfis").select("id, email, papel, parceiro_id").eq("id", perfilId).maybeSingle();
    if (!alvo) return erro("Usuário não encontrado.", 404);

    const pode = quem.papel === "admin"
      || (quem.papel === "parcerias" && alvo.papel === "parceiro")
      || (quem.papel === "parceiro" && quem.is_responsavel_parceiro && alvo.papel === "parceiro" && alvo.parceiro_id === quem.parceiro_id);
    if (!pode) return erro("Sem permissão para redefinir a senha deste usuário.", 403);

    const at = await sb.auth.admin.updateUserById(alvo.id, { password: senha, user_metadata: { senha_provisoria: true } });
    if (at.error) return erro(at.error.message);
    await sb.from("historico").insert({
      tabela: "perfis", registro_id: alvo.id, parceiro_id: alvo.parceiro_id, campo: "senha",
      valor_novo: "senha provisória definida", autor_id: quem.id,
    });
    return json({ ok: true, mensagem: `Senha provisória definida para ${alvo.email}.` });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
