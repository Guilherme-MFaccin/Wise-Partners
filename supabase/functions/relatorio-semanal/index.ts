// Relatório semanal do Diretor (FR-067, FR-141): número principal, ROI do trimestre, indicadores em destaque,
// mudanças da semana e pontos de atenção.
// O pg_cron chama de hora em hora; a função confere o dia e o horário configurados.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, agoraBrasilia, ehRotina, urlDoApp } from "../_shared/supabase.ts";
import { enviarEmail, layoutEmail, listaHtml, modeloEmail } from "../_shared/email.ts";
import { dataBr, moeda } from "../_shared/texto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!ehRotina(req)) return erro("Sem permissão.", 403);
  const sb = admin();
  const agora = agoraBrasilia();
  if (new URL(req.url).searchParams.get("forcar") !== "1") {
    const { data: cfg } = await sb.from("configuracoes").select("chave, valor").in("chave", ["relatorio_semanal_dia", "relatorio_semanal_hora"]);
    const dia = Number(cfg?.find((c) => c.chave === "relatorio_semanal_dia")?.valor ?? 1);
    const hora = Number(String(cfg?.find((c) => c.chave === "relatorio_semanal_hora")?.valor ?? "08:00").split(":")[0]);
    if (agora.diaSemana !== dia || agora.hora !== hora) return json({ ignorado: "fora do dia ou horário" });
  }
  const fim = agora.data;
  const ini = new Date(new Date(fim + "T12:00:00Z").getTime() - 7 * 86400_000).toISOString().slice(0, 10);
  const { data: p, error } = await sb.rpc("painel_semanal", { p_inicio: ini, p_fim: fim });
  if (error) return erro(error.message, 500);
  const { data: v2 } = await sb.rpc("relatorio_semanal_v2", { p_inicio: ini, p_fim: fim });
  const app = await urlDoApp(sb);
  const link = (id: string) => `${app}/app/parceiros/${id}`;
  const pct = (v: unknown) => (v === null || v === undefined ? "sem dados" : `${Math.round(Number(v) * 100)}%`);
  const principal = v2
    ? [
        `Número principal: ${v2.clientes_icp_trimestre ?? 0} cliente(s) no ICP via parceiros no trimestre (${v2.clientes_icp_semana ?? 0} nesta semana)`,
        `ROI do canal no trimestre: ${pct(v2.roi_trimestre)} (receita ${moeda(Number(v2.receita_trimestre ?? 0))}, custo ${moeda(Number(v2.custo_trimestre ?? 0))})`,
      ]
    : [];
  const valorDestaque = (d: any) => {
    const v = d.valor;
    if (v === null || v === undefined) return "sem dados";
    if (typeof v === "object") return Object.entries(v).map(([k, x]) => `${k.replace(/_/g, " ")} ${typeof x === "object" ? JSON.stringify(x) : x}`).join(", ") || "sem dados";
    if (d.formato === "percentual") return d.chave === "roi" ? pct(v) : `${v}%`;
    if (d.formato === "moeda") return moeda(Number(v));
    if (d.formato === "dias") return `${v} dias`;
    return String(v);
  };
  const destaques = ((v2?.destaques ?? []) as any[]).map((d) => ({ texto: `${d.nome}: ${valorDestaque(d)}` }));

  // Comissões do período (o Diretor é administrador e vê valores)
  const { data: com } = await sb.from("comissoes").select("valor, estado, beneficiario, paga_em");
  const soma = (f: (c: any) => boolean) => (com ?? []).filter(f).reduce((a, c) => a + Number(c.valor ?? 0), 0);
  const aPagar = soma((c) => c.beneficiario !== "grupo" && ["a_pagar", "nf_recebida"].includes(c.estado));
  const aReceber = soma((c) => c.beneficiario === "grupo" && ["aguardando_compensacao", "a_pagar", "nf_recebida"].includes(c.estado));

  // Mudanças da semana pelo histórico
  const { data: hist } = await sb.from("historico").select("tabela, campo, valor_novo, parceiro_id").gte("created_at", ini + "T00:00:00-03:00").limit(5000);
  const conta = (f: (h: any) => boolean) => (hist ?? []).filter(f).length;
  const mudancas = [
    `Parceiros novos: ${conta((h) => h.tabela === "parceiros" && h.campo === "criado")}`,
    `Mudanças de etapa: ${conta((h) => h.tabela === "parceiros" && h.campo === "etapa")}`,
    `Mudanças de nível ou pacote: ${conta((h) => h.tabela === "parceiros" && (h.campo === "nivel" || h.campo === "pacote"))}`,
    `Mudanças de status de atividade: ${conta((h) => h.tabela === "parceiros" && h.campo === "status_atividade")}`,
    `Contratos assinados: ${p.contratos_assinados.length}`,
    `Indicações registradas: ${p.indicacoes.total} (${p.indicacoes.do_parceiro} dos parceiros, ${p.indicacoes.para_parceiro} para parceiros), ${p.indicacoes.fechadas} fechadas`,
  ];
  const indicadores = [
    `Assinados: ${p.assinados} de ${p.meta_assinados} (faltam ${Math.max(0, p.meta_assinados - p.assinados)})`,
    `Funil: ${p.funil.filter((e: any) => !e.perda && e.total > 0).map((e: any) => `${e.nome} ${e.total}`).join(", ")}`,
    `Comissões a pagar: ${moeda(aPagar)} · a receber: ${moeda(aReceber)}`,
    `Fila do Base Ativa: ${p.fila_base_ativa.length} parceiro(s)`,
  ];
  const atencao = [
    listaHtml("Aprovações pendentes", p.aprovacoes_pendentes.map((x: any) => ({ texto: x.parceiro, url: link(x.parceiro_id) }))),
    listaHtml("Follow-ups vencidos", p.followups_vencidos.map((x: any) => ({ texto: `${x.parceiro}: ${x.descricao} (${dataBr(x.data)})`, url: link(x.parceiro_id) }))),
    listaHtml("Parceiros esfriando", p.esfriando.map((x: any) => ({ texto: `${x.parceiro}: ${x.status}${x.motivo ? `, ${x.motivo}` : ", sem motivo registrado"}`, url: link(x.parceiro_id) }))),
    listaHtml("Negociações paradas", p.negociacoes_paradas.map((x: any) => ({ texto: x.parceiro, url: link(x.parceiro_id) }))),
    listaHtml("Contrapartidas atrasadas", p.contrapartidas_atrasadas.map((x: any) => ({ texto: `${x.parceiro}: ${x.nome}`, url: link(x.parceiro_id) }))),
    listaHtml("Categorias sem 3 opções assinadas", p.categorias_sem_3.map((x: any) => ({ texto: `${x.categoria}: ${x.assinados}` }))),
  ].join("");

  const { data: diretores } = await sb.from("perfis").select("email, nome").eq("is_diretor", true).eq("ativo", true);
  let enviados = 0;
  for (const d of diretores ?? []) {
    const m = await modeloEmail(sb, "relatorio_semanal", { nome: d.nome.split(" ")[0] });
    const html = layoutEmail({
      titulo: `${m.assunto} (${dataBr(ini)} a ${dataBr(fim)})`,
      paragrafos: [m.corpo, ...principal, ...indicadores],
      htmlExtra: listaHtml("Indicadores em destaque", destaques) + listaHtml("Mudanças da semana", mudancas.map((t) => ({ texto: t }))) + atencao,
      botao: { texto: "Abrir o painel", url: `${app}/app` },
    });
    await enviarEmail(d.email, m.assunto, html, [m.corpo, ...principal, ...indicadores, "", ...destaques.map((x) => x.texto), "", ...mudancas].join("\n"));
    enviados++;
  }
  return json({ enviados });
});
