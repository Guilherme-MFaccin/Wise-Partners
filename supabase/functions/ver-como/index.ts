// Ver como (26/11/2026): o administrador e o gerente da comunidade abrem o portal como outra conta, numa aba separada,
// para conferir o que cada tipo de acesso vê. Devolve um código de entrada de uso único para aquela conta; a aba nova
// guarda a sessão só nela (sessionStorage), sem tirar quem pediu do próprio acesso. Cada uso fica no histórico.
// Não vale para contas de administrador, contas desativadas nem para a própria conta.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, perfilDaRequisicao } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não aceito.", 405);
  try {
    const quem = await perfilDaRequisicao(req);
    if (!quem) return erro("Não autenticado.", 401);
    if (quem.papel !== "admin" && quem.papel !== "parcerias") return erro("Ver como é do administrador e do gerente da comunidade.", 403);
    const b = await req.json().catch(() => ({}));
    const alvoId = String(b?.perfil_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(alvoId)) return erro("Conta inválida.");
    if (alvoId === quem.id) return erro("Esta é a sua própria conta.");

    const sb = admin();
    const { data: alvo } = await sb.from("perfis").select("id, nome, email, papel, ativo, parceiro_id").eq("id", alvoId).maybeSingle();
    if (!alvo) return erro("Conta não encontrada.", 404);
    if (!alvo.ativo) return erro("Esta conta está desativada.");
    if (alvo.papel === "admin") return erro("Não é possível ver como um administrador.", 403);

    const { data: u, error: eu } = await sb.auth.admin.getUserById(alvo.id);
    if (eu || !u?.user?.email) return erro("Esta conta não tem login no portal.");
    const { data: link, error: el } = await sb.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
    if (el || !link?.properties?.hashed_token) return erro("Não foi possível abrir a visualização agora.", 500);

    await sb.from("historico").insert({
      tabela: "perfis", registro_id: alvo.id, parceiro_id: alvo.parceiro_id, campo: "ver como",
      valor_novo: `${quem.nome} abriu o portal como ${alvo.nome}`, autor_id: quem.id,
    });
    return json({ token_hash: link.properties.hashed_token, nome: alvo.nome, email: u.user.email });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
