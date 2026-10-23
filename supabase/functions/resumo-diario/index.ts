// E-mail diário por responsável (FR-066): todo dia útil no horário configurado (padrão 7h de Brasília).
// O pg_cron chama de hora em hora; a função confere dia útil e horário da configuração.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, agoraBrasilia, ehRotina, urlDoApp } from "../_shared/supabase.ts";
import { enviarEmail, layoutEmail, listaHtml, modeloEmail } from "../_shared/email.ts";
import { dataBr } from "../_shared/texto.ts";

const GRUPOS: [string, string][] = [
  ["followups_vencidos", "Follow-ups vencidos"],
  ["aprovacoes_pendentes", "Aprovações de assinatura pendentes"],
  ["negociacoes_paradas", "Negociações paradas"],
  ["status_atividade", "Mudanças de status de atividade"],
  ["contrapartidas_atrasadas", "Contrapartidas atrasadas"],
  ["indicacoes_paradas", "Indicações sem atualização há 30 dias"],
  ["propostas_ficha", "Propostas de alteração de ficha"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!ehRotina(req)) return erro("Sem permissão.", 403);
  const sb = admin();
  const agora = agoraBrasilia();
  const forcar = new URL(req.url).searchParams.get("forcar") === "1";
  if (!forcar) {
    const { data: cfg } = await sb.from("configuracoes").select("valor").eq("chave", "horario_alertas").maybeSingle();
    const hora = Number(String(cfg?.valor ?? "07:00").split(":")[0]);
    if (agora.hora !== hora) return json({ ignorado: "fora do horário" });
    const { data: util } = await sb.rpc("is_dia_util", { d: agora.data });
    if (!util) return json({ ignorado: "não é dia útil" });
  }
  const { data: pend, error } = await sb.rpc("pendencias_diarias");
  if (error) return erro(error.message, 500);
  const app = await urlDoApp(sb);

  let enviados = 0;
  const falhas: string[] = [];
  for (const u of (pend ?? []) as any[]) {
    const m = await modeloEmail(sb, "resumo_diario", { nome: u.nome.split(" ")[0] });
    const blocos = GRUPOS.map(([k, titulo]) =>
      listaHtml(titulo, (u.itens[k] ?? []).map((i: any) => ({
        texto: `${i.parceiro}: ${i.texto}${i.data ? ` (${dataBr(i.data)})` : ""}`,
        url: `${app}/app/parceiros/${i.parceiro_id}`,
      })))).join("");
    const texto = GRUPOS.flatMap(([k, titulo]) => (u.itens[k] ?? []).length
      ? [`${titulo}:`, ...(u.itens[k] as any[]).map((i) => `- ${i.parceiro}: ${i.texto}`)] : []).join("\n");
    try {
      await enviarEmail(u.email, m.assunto, layoutEmail({ titulo: m.assunto, paragrafos: [m.corpo], htmlExtra: blocos, botao: { texto: "Abrir o painel", url: `${app}/app` } }), `${m.corpo}\n\n${texto}`);
      enviados++;
    } catch (e) {
      falhas.push(`${u.email}: ${e}`);
    }
  }
  return json({ enviados, falhas });
});
