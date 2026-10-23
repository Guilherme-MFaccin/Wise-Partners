// Convite de usuário (FR-001, FR-007, FR-072). Quem pode convidar quem:
// administrador convida qualquer papel; time de parcerias convida usuários de parceiro;
// o responsável do parceiro convida usuários da própria empresa.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, perfilDaRequisicao, urlDoApp } from "../_shared/supabase.ts";
import { enviarEmail, layoutEmail, modeloEmail } from "../_shared/email.ts";

const PAPEIS = ["admin", "parcerias", "consultor", "comercial", "financeiro", "parceiro"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const quem = await perfilDaRequisicao(req);
    if (!quem) return erro("Não autenticado.", 401);
    const b = await req.json();
    const email = String(b.email ?? "").trim().toLowerCase();
    const nome = String(b.nome ?? "").trim();
    let papel = String(b.papel ?? "");
    let parceiroId: string | null = b.parceiro_id ?? null;
    let responsavel = !!b.is_responsavel_parceiro;
    const diretor = !!b.is_diretor;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !nome) return erro("Informe nome e e-mail válidos.");
    if (!PAPEIS.includes(papel)) return erro("Papel inválido.");

    if (quem.papel === "admin") {
      // tudo permitido
    } else if (quem.papel === "parcerias") {
      if (papel !== "parceiro") return erro("O time de parcerias convida apenas usuários de parceiros.", 403);
      if (diretor) return erro("Sem permissão.", 403);
    } else if (quem.papel === "parceiro" && quem.is_responsavel_parceiro) {
      papel = "parceiro";
      parceiroId = quem.parceiro_id;
      responsavel = false;
    } else {
      return erro("Sem permissão para convidar usuários.", 403);
    }
    if (papel === "parceiro" && !parceiroId) return erro("Informe o parceiro do usuário.");
    if (papel !== "parceiro" && !b.empresa_grupo_id) return erro("Informe a empresa do grupo do usuário interno.");
    if (diretor && papel !== "admin") return erro("O Diretor precisa ter o papel de administrador.");

    const sb = admin();
    const { data: existente } = await sb.from("perfis").select("id, ativo, papel, parceiro_id").eq("email", email).maybeSingle();
    if (existente) {
      return erro(existente.ativo ? "Este e-mail já tem acesso ao portal." : "Este usuário existe e está desativado. Reative-o na lista de usuários.", 409);
    }

    const convite = {
      email, nome, papel,
      empresa_grupo_id: papel === "parceiro" ? null : b.empresa_grupo_id,
      parceiro_id: papel === "parceiro" ? parceiroId : null,
      is_diretor: diretor, is_responsavel_parceiro: papel === "parceiro" && responsavel,
      convidado_por: quem.id,
    };
    const up = await sb.from("convites").upsert(convite);
    if (up.error) return erro(up.error.message);
    await sb.from("historico").insert({
      tabela: "convites", parceiro_id: convite.parceiro_id, campo: "acesso concedido",
      valor_novo: `${email} (${papel})`, autor_id: quem.id,
    });

    const app = await urlDoApp(sb);
    const redirectTo = app ? `${app}/` : undefined;
    const { data: lista } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const jaNoAuth = lista?.users?.find((u) => (u.email ?? "").toLowerCase() === email);

    if (jaNoAuth) {
      // Usuário do Auth sem perfil (ex.: removido antes): cria o perfil a partir do convite
      const ins = await sb.from("perfis").insert({
        id: jaNoAuth.id, nome, email, papel, empresa_grupo_id: convite.empresa_grupo_id, parceiro_id: convite.parceiro_id,
        is_diretor: convite.is_diretor, is_responsavel_parceiro: convite.is_responsavel_parceiro,
      });
      if (ins.error) return erro(ins.error.message);
      await sb.from("convites").delete().eq("email", email);
    }

    // Link de acesso: enviado com o modelo da Wise pelo Resend; sem Resend, o próprio Supabase envia.
    if (Deno.env.get("RESEND_API_KEY")) {
      const tipo = jaNoAuth ? "magiclink" : "invite";
      const { data: link, error } = await sb.auth.admin.generateLink({ type: tipo as any, email, options: { redirectTo } });
      if (error) return erro(error.message);
      const chave = papel === "parceiro" ? "convite_parceiro" : "convite_interno";
      const m = await modeloEmail(sb, chave, { nome });
      await enviarEmail(email, m.assunto, layoutEmail({
        titulo: m.assunto, paragrafos: m.corpo.split("\n\n"), botao: { texto: "Entrar no portal", url: link.properties.action_link },
      }), `${m.corpo}\n\n${link.properties.action_link}`);
    } else if (!jaNoAuth) {
      const { error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error) return erro(error.message);
    } else {
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });
      if (error) return erro(error.message);
    }
    return json({ ok: true, mensagem: `Convite enviado para ${email}.` });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
