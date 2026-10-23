// Exportação completa em formato aberto (FR-095): JSON e CSV de todas as tabelas no bucket "backups".
// Chamada pelo pg_cron (semanal) ou por um administrador (sob demanda).
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, agoraBrasilia, ehRotina, perfilDaRequisicao } from "../_shared/supabase.ts";
import { enviarEmail, layoutEmail, modeloEmail } from "../_shared/email.ts";

const TABELAS = [
  "empresas_grupo", "perfis", "convites", "configuracoes", "feriados", "categorias", "campos_categoria", "niveis", "pacotes",
  "catalogo_contrapartidas", "tipos_atividade", "etapas_funil", "criterios_icp", "modelos_contrato", "textos_email",
  "parceiros", "parceiros_interno", "parceiros_instrumento", "parceiro_categorias", "parceiro_campos", "propostas_ficha",
  "contatos", "parceiro_contatos", "pontos_contato", "atividades", "proximos_passos", "documentos", "aprovacoes",
  "quadros_identificacao", "contratos_gerados", "tarefas_onboarding", "contrapartidas", "comprovacoes",
  "ciclos_base_ativa", "base_ativa_encontros", "clientes", "indicacoes", "comissoes", "pedidos_rfp", "pedido_rfp_opcoes",
  "paginas_rfp", "eventos_rfp", "historico", "notificacoes",
];

function csv(linhas: Record<string, unknown>[]) {
  if (!linhas.length) return "";
  const cols = Object.keys(linhas[0]);
  const cel = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...linhas.map((l) => cols.map((c) => cel(l[c])).join(","))].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!ehRotina(req)) {
    const p = await perfilDaRequisicao(req);
    if (!p || p.papel !== "admin") return erro("Somente administradores exportam os dados.", 403);
  }
  const sb = admin();
  const a = agoraBrasilia();
  const pasta = `${a.data}-${String(a.hora).padStart(2, "0")}h-${crypto.randomUUID().slice(0, 6)}`;
  const tudo: Record<string, unknown[]> = {};
  for (const t of TABELAS) {
    const linhas: Record<string, unknown>[] = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await sb.from(t).select("*").range(de, de + 999);
      if (error) return erro(`${t}: ${error.message}`, 500);
      linhas.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    tudo[t] = linhas;
    await sb.storage.from("backups").upload(`${pasta}/csv/${t}.csv`, new Blob([csv(linhas)], { type: "text/csv" }), { upsert: true });
  }
  const up = await sb.storage.from("backups").upload(`${pasta}/completo.json`,
    new Blob([JSON.stringify({ gerado_em: new Date().toISOString(), tabelas: tudo })], { type: "application/json" }), { upsert: true });
  if (up.error) return erro(up.error.message, 500);

  // Aviso aos administradores
  const { data: admins } = await sb.from("perfis").select("email").eq("papel", "admin").eq("ativo", true);
  if (Deno.env.get("RESEND_API_KEY") && admins?.length) {
    const m = await modeloEmail(sb, "backup_concluido", { pasta });
    await enviarEmail(admins.map((x) => x.email), m.assunto, layoutEmail({ titulo: m.assunto, paragrafos: [m.corpo] }), m.corpo).catch(() => {});
  }
  return json({ pasta, arquivos: TABELAS.length + 1 });
});
