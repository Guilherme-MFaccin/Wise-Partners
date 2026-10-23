import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { escaparHtml, preencher, semTravessao } from "./texto.ts";

// Envio pelo Resend, no domínio da Wise. Sem chave configurada, nada é enviado (e o erro é registrado).
export async function enviarEmail(para: string | string[], assunto: string, html: string, texto: string) {
  const chave = Deno.env.get("RESEND_API_KEY");
  if (!chave) throw new Error("RESEND_API_KEY não configurada");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("EMAIL_FROM") ?? "Wise Partners <parcerias@wisemakers.com.br>",
      to: Array.isArray(para) ? para : [para],
      subject: semTravessao(assunto),
      html,
      text: semTravessao(texto),
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

// Layout com a identidade da Wise: faixa escura, acento menta, texto claro sobre fundo escuro.
export function layoutEmail(o: { titulo: string; paragrafos?: string[]; htmlExtra?: string; botao?: { texto: string; url: string }; rodape?: string }) {
  const p = (o.paragrafos ?? []).map((x) => `<p style="margin:0 0 14px;line-height:1.55">${escaparHtml(semTravessao(x)).replace(/\n/g, "<br>")}</p>`).join("");
  const botao = o.botao
    ? `<p style="margin:24px 0"><a href="${o.botao.url}" style="background:#00E193;color:#101012;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;display:inline-block">${escaparHtml(o.botao.texto)}</a></p>`
    : "";
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#101012;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#e7e7e9">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#101012"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1c1c20;border:1px solid rgba(255,255,255,0.1);border-radius:20px">
<tr><td style="padding:22px 28px;border-bottom:3px solid #00E193"><span style="font-size:20px;font-weight:800;color:#ffffff">Wise</span><span style="font-size:20px;font-weight:800;color:#00E193">Makers</span>
<span style="float:right;font-size:12px;font-weight:700;letter-spacing:2px;color:#00E193;line-height:28px">WISE PARTNERS</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 18px;font-size:20px;color:#ffffff">${escaparHtml(semTravessao(o.titulo))}</h1>
${p}${o.htmlExtra ?? ""}${botao}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#adadb3">${escaparHtml(o.rodape ?? "Portal Wise Partners · Wise Makers, Maringá/PR")}</td></tr>
</table></td></tr></table></body></html>`;
}

// Lista agrupada (usada no resumo diário e no relatório semanal)
export function listaHtml(titulo: string, itens: { texto: string; url?: string }[]) {
  if (!itens.length) return "";
  const li = itens.map((i) => `<li style="margin:0 0 6px">${i.url ? `<a href="${i.url}" style="color:#4defa9">${escaparHtml(semTravessao(i.texto))}</a>` : escaparHtml(semTravessao(i.texto))}</li>`).join("");
  return `<h2 style="margin:22px 0 8px;font-size:15px;color:#00E193">${escaparHtml(titulo)} (${itens.length})</h2><ul style="margin:0;padding-left:18px;line-height:1.5">${li}</ul>`;
}

export async function modeloEmail(sb: SupabaseClient, chave: string, valores: Record<string, string | number | null | undefined>) {
  const { data } = await sb.from("textos_email").select("assunto, corpo").eq("chave", chave).maybeSingle();
  const assunto = preencher(data?.assunto ?? "{{titulo}}", valores);
  const corpo = preencher(data?.corpo ?? "{{mensagem}}", valores);
  return { assunto, corpo };
}
