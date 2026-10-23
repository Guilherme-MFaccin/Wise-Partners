// Avisos imediatos por e-mail (pg_cron a cada 5 minutos): aprovação pendente, proposta de ficha,
// comprovação enviada, indicação nova, clique no WhatsApp da página de RFP, comissão a pagar.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, ehRotina, urlDoApp } from "../_shared/supabase.ts";
import { enviarEmail, layoutEmail, modeloEmail } from "../_shared/email.ts";
import { moeda } from "../_shared/texto.ts";

const BENEF: Record<string, string> = { parceiro: "Parceiro", responsavel: "Responsável pela parceria" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!ehRotina(req)) return erro("Sem permissão.", 403);
  const sb = admin();
  const app = await urlDoApp(sb);
  const { data: fila, error } = await sb.from("notificacoes")
    .select("*, usuario:perfis(email, nome, ativo)")
    .eq("enviar_email", true).is("email_enviado_em", null).is("email_erro", null)
    .gte("created_at", new Date(Date.now() - 2 * 86400_000).toISOString())
    .order("created_at").limit(100);
  if (error) return erro(error.message, 500);

  let enviados = 0;
  for (const n of fila ?? []) {
    const para = n.usuario?.ativo ? n.usuario.email : n.email_destino;
    if (!para) {
      await sb.from("notificacoes").update({ email_erro: "sem destinatário" }).eq("id", n.id);
      continue;
    }
    try {
      const link = n.link ? `${app}${n.link}` : app;
      let assunto: string, corpo: string;
      if (n.tipo === "comissao_a_pagar" && n.dados?.comissao_id) {
        // E-mail ao financeiro com parceiro, cliente, empresa, valor e dados para nota fiscal
        const { data: c } = await sb.from("comissoes")
          .select("beneficiario, valor, responsavel:perfis(nome), parceiro:parceiros(nome_fantasia, razao_social, cnpj, endereco), indicacao:indicacoes(cliente:clientes(razao_social), empresa:empresas_grupo(nome))")
          .eq("id", n.dados.comissao_id).single();
        const p: any = c?.parceiro ?? {};
        const nf = c?.beneficiario === "parceiro"
          ? `${p.razao_social ?? p.nome_fantasia}, CNPJ ${p.cnpj ?? "não informado"}, ${p.endereco ?? "endereço não informado"}`
          : `Responsável pela parceria: ${(c as any)?.responsavel?.nome ?? ""}`;
        ({ assunto, corpo } = await modeloEmail(sb, "comissao_a_pagar", {
          parceiro: p.nome_fantasia, cliente: (c as any)?.indicacao?.cliente?.razao_social,
          empresa: (c as any)?.indicacao?.empresa?.nome, beneficiario: BENEF[c?.beneficiario ?? ""] ?? "",
          valor: moeda(c?.valor), dados_nf: nf,
        }));
      } else {
        ({ assunto, corpo } = await modeloEmail(sb, "notificacao", { titulo: n.titulo, mensagem: n.mensagem ?? "" }));
      }
      await enviarEmail(para, assunto, layoutEmail({ titulo: assunto, paragrafos: corpo.split("\n\n"), botao: { texto: "Abrir no portal", url: link } }), `${corpo}\n\n${link}`);
      await sb.from("notificacoes").update({ email_enviado_em: new Date().toISOString() }).eq("id", n.id);
      enviados++;
    } catch (e) {
      await sb.from("notificacoes").update({ email_erro: String(e).slice(0, 500) }).eq("id", n.id);
    }
  }
  return json({ enviados, na_fila: fila?.length ?? 0 });
});
