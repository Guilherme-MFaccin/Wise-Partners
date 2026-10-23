import { supabase } from "@/integrations/supabase/client";
import type { CampoDef } from "@/components/comum/CampoDinamico";
import { valorCampoTexto } from "@/components/comum/CampoDinamico";
import { DocumentoPdf } from "@/lib/pdf";
import { data as fmtData, dataHora, formatarCnpj, hojeISO, semTravessao } from "@/lib/formato";
import {
  ETAPAS, NATUREZAS, PACOTES, PAPEIS_CONTATO, PERFIS_INSTITUCIONAIS, PERIODICIDADES, STATUS_ATIVIDADE, TIPOS_DOCUMENTO,
  TIPOS_PARCERIA, nomeNivel, rotulo,
} from "@/lib/rotulos";
import { nomePerfil, passoAtivo, type Categoria, type Parceiro, type ParceiroCategoria, type PerfilResumo, type ProximoPasso } from "../dados";
import { CHAVES_APRESENTACAO, gruposDoParceiro } from "./campos";
import { carregarTimeline, descreverItem, montarTimeline } from "./timeline";

// "Contexto do parceiro" em texto (sem IA) e exportação da ficha em PDF (FR-094).

type Contato = { papeis: string[]; principal: boolean; contatos: { nome: string; cargo: string | null; email: string | null; telefone: string | null; whatsapp: string | null } | null };

export type DadosExportacao = {
  parceiro: Parceiro;
  categorias: { nome: string; principal: boolean }[];
  grupos: { titulo: string; itens: { campo: CampoDef; valor: any }[] }[];
  apresentacao: { campo: CampoDef; valor: any }[];
  contatos: Contato[];
  passos: ProximoPasso[];
  timeline: string[];
  contrapartidasAtrasadas: { nome: string; proxima_data: string | null; periodicidade: string }[];
  tarefasAbertas: { descricao: string; prazo: string }[];
  documentos: { tipo: string; nome: string; versao: number; created_at: string }[];
  perfis: PerfilResumo[];
};

// Lê tudo de que o contexto e o PDF precisam. Consultas sem permissão voltam vazias.
export async function carregarExportacao(
  parceiro: Parceiro, campos: CampoDef[], categorias: Categoria[], perfis: PerfilResumo[],
): Promise<DadosExportacao> {
  const id = parceiro.id;
  const vazio = (r: { data: any; error: any }) => (r.error ? [] : r.data ?? []);
  const [vinc, valores, contatos, passos, contrap, tarefas, docs, tl] = await Promise.all([
    supabase.from("parceiro_categorias").select("*").eq("parceiro_id", id),
    supabase.from("parceiro_campos").select("campo_id, valor").eq("parceiro_id", id),
    supabase.from("parceiro_contatos").select("papeis, principal, contatos(nome, cargo, email, telefone, whatsapp)").eq("parceiro_id", id),
    supabase.from("proximos_passos").select("*").eq("parceiro_id", id).order("created_at", { ascending: false }),
    supabase.from("contrapartidas").select("nome, proxima_data, periodicidade, estado").eq("parceiro_id", id).eq("ativa", true),
    supabase.from("tarefas_onboarding").select("descricao, prazo").eq("parceiro_id", id).eq("feita", false).order("prazo"),
    supabase.from("documentos").select("tipo, nome, versao, created_at").eq("parceiro_id", id).order("created_at", { ascending: false }),
    carregarTimeline(id, 15).catch(() => null),
  ]);
  const vinculos = vazio(vinc) as ParceiroCategoria[];
  const mapaValores = new Map((vazio(valores) as any[]).map((v) => [v.campo_id, v.valor]));
  const grupos = gruposDoParceiro(parceiro, campos, vinculos, categorias).map((g) => ({
    titulo: g.titulo,
    itens: g.campos.map((c) => ({ campo: c, valor: mapaValores.get(c.id) })),
  }));
  const comum = campos.filter((c) => c.escopo === "comum_comercial");
  const apresentacao = CHAVES_APRESENTACAO.map((k) => comum.find((c) => c.chave === k))
    .filter(Boolean)
    .map((c) => ({ campo: c!, valor: mapaValores.get(c!.id) }));
  const timeline = tl ? montarTimeline(tl).slice(0, 15).map((i) => descreverItem(i, perfis, parceiro.tipo_parceria)) : [];

  return {
    parceiro,
    categorias: vinculos
      .map((v) => ({ nome: categorias.find((c) => c.id === v.categoria_id)?.nome ?? "", principal: v.principal }))
      .sort((a, b) => Number(b.principal) - Number(a.principal)),
    grupos,
    apresentacao: parceiro.tipo_parceria === "comercial" ? apresentacao : [],
    contatos: vazio(contatos),
    passos: vazio(passos),
    timeline,
    contrapartidasAtrasadas: (vazio(contrap) as any[]).filter((c) => c.estado === "atrasada"),
    tarefasAbertas: vazio(tarefas),
    documentos: vazio(docs),
    perfis,
  };
}

function linhasDados(p: Parceiro, perfis: PerfilResumo[]): [string, string][] {
  const redes = Object.entries(p.redes_sociais ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(", ");
  const l: [string, string][] = [
    ["Nome fantasia", p.nome_fantasia],
    ["Razão social", p.razao_social ?? ""],
    ["CNPJ", formatarCnpj(p.cnpj)],
    ["Site", p.site ?? ""],
    ["Cidade", [p.cidade, p.uf].filter(Boolean).join("/")],
    ["Endereço", p.endereco ?? ""],
    ["Redes sociais", redes],
    ["Tipo de parceria", rotulo(TIPOS_PARCERIA, p.tipo_parceria)],
  ];
  if (p.tipo_parceria === "institucional") {
    l.push(["Natureza jurídica", rotulo(NATUREZAS, p.natureza_juridica)]);
    l.push(["Perfil institucional", rotulo(PERFIS_INSTITUCIONAIS, p.perfil_institucional)]);
  }
  l.push(["Categoria de empresa", p.categoria_empresa ?? ""]);
  l.push(["Origem do contato", p.origem ?? ""]);
  l.push(["Responsável", nomePerfil(perfis, p.responsavel_id)]);
  return l.filter(([, v]) => v);
}

function linhasClassificacao(p: Parceiro): [string, string][] {
  const l: [string, string][] = [
    ["Etapa", rotulo(ETAPAS, p.etapa) + (p.motivo_perda ? ` (${p.motivo_perda})` : "")],
    ["Carteira no ICP da Wise", p.carteira_icp !== null ? String(p.carteira_icp) : ""],
    ["Nível", p.nivel ? nomeNivel(p.tipo_parceria, p.nivel) : ""],
    ["Nível sugerido", p.nivel_sugerido ? nomeNivel(p.tipo_parceria, p.nivel_sugerido) : ""],
    ["Motivo do ajuste de nível", p.nivel_ajuste_motivo ?? ""],
    ["Pacote", rotulo(PACOTES, p.pacote)],
    ["Status de atividade", rotulo(STATUS_ATIVIDADE, p.status_atividade) + (p.pausado_ate ? ` até ${fmtData(p.pausado_ate)}` : "")],
    ["Motivo da inatividade", p.motivo_inatividade ?? ""],
    ["Último contato", fmtData(p.ultimo_contato)],
    ["Data de assinatura", fmtData(p.data_assinatura)],
  ];
  return l.filter(([, v]) => v);
}

function descreverContato(c: Contato) {
  const k = c.contatos;
  if (!k) return "";
  const papeis = (c.papeis ?? []).map((x) => rotulo(PAPEIS_CONTATO, x)).join(", ");
  return [
    k.nome + (c.principal ? " (principal)" : ""),
    k.cargo, papeis, k.email, k.telefone, k.whatsapp ? `WhatsApp ${k.whatsapp}` : null,
  ].filter(Boolean).join(" · ");
}

// Texto pronto para colar em uma conversa de IA
export function montarContexto(d: DadosExportacao): string {
  const p = d.parceiro;
  const s: string[] = [];
  const titulo = (t: string) => s.push("", `## ${t}`);
  s.push(`# Contexto do parceiro: ${p.nome_fantasia}`, `Gerado em ${fmtData(hojeISO())} pelo Portal Wise Partners.`);

  titulo("Dados");
  for (const [k, v] of linhasDados(p, d.perfis)) s.push(`${k}: ${v}`);
  if (d.categorias.length) s.push(`Categorias: ${d.categorias.map((c) => c.nome + (c.principal ? " (principal)" : "")).join(", ")}`);

  titulo("Classificação e etapa");
  for (const [k, v] of linhasClassificacao(p)) s.push(`${k}: ${v}`);

  for (const g of d.grupos) {
    const itens = g.itens.filter((i) => valorCampoTexto(i.campo, i.valor));
    if (!itens.length) continue;
    titulo(`Ficha: ${g.titulo}`);
    for (const i of itens) s.push(`${i.campo.rotulo}${i.campo.interno ? " (interno)" : ""}: ${valorCampoTexto(i.campo, i.valor)}`);
  }

  if (d.contatos.length) {
    titulo("Contatos");
    for (const c of d.contatos) s.push(`- ${descreverContato(c)}`);
  }

  titulo("Linha do tempo resumida (mais recentes primeiro)");
  if (d.timeline.length) for (const t of d.timeline) s.push(`- ${t}`);
  else s.push("Sem registros.");

  titulo("Pendências");
  const ativo = passoAtivo(d.passos);
  s.push(ativo
    ? `Próximo passo: ${ativo.descricao} até ${fmtData(ativo.data)}${ativo.estado === "vencido" ? " (vencido)" : ""}, responsável ${nomePerfil(d.perfis, ativo.responsavel_id) || "não definido"}`
    : "Próximo passo: nenhum definido");
  for (const c of d.contrapartidasAtrasadas) s.push(`Contrapartida atrasada: ${c.nome} (${rotulo(PERIODICIDADES, c.periodicidade)}, prevista para ${fmtData(c.proxima_data)})`);
  for (const t of d.tarefasAbertas) s.push(`Tarefa de onboarding aberta: ${t.descricao} (prazo ${fmtData(t.prazo)})`);

  if (d.documentos.length) {
    titulo("Documentos");
    for (const doc of d.documentos) s.push(`- ${rotulo(TIPOS_DOCUMENTO, doc.tipo)}: ${doc.nome} (versão ${doc.versao}, ${fmtData(doc.created_at)})`);
  }

  const anteriores = d.passos.filter((x) => x !== ativo).slice(0, 5);
  if (anteriores.length) {
    titulo("Próximos passos anteriores");
    for (const x of anteriores) s.push(`- ${fmtData(x.data)}: ${x.descricao} (${x.estado === "feito" ? "feito" : x.estado === "substituido" ? "substituído" : x.estado})`);
  }
  return semTravessao(s.join("\n"));
}

// Ficha em PDF com a identidade da Wise. Campos internos ficam de fora.
export async function gerarPdfFicha(d: DadosExportacao): Promise<Blob> {
  const p = d.parceiro;
  const pdf = await DocumentoPdf.criar({ titulo: "Ficha do parceiro" });
  pdf.titulo(p.nome_fantasia);
  if (p.razao_social) pdf.texto(p.razao_social, { tamanho: 11, espacoDepois: 2 });
  pdf.texto(`Gerada em ${fmtData(hojeISO())}`, { tamanho: 8, espacoDepois: 8 });

  pdf.secao("Dados da empresa");
  for (const [k, v] of linhasDados(p, d.perfis)) pdf.campo(k, v);
  if (d.categorias.length) pdf.campo("Categorias", d.categorias.map((c) => c.nome + (c.principal ? " (principal)" : "")).join(", "));

  pdf.secao("Classificação");
  for (const [k, v] of linhasClassificacao(p)) pdf.campo(k, v);

  const apresentacao = d.apresentacao.filter((i) => valorCampoTexto(i.campo, i.valor));
  if (apresentacao.length) {
    pdf.secao("Ficha de apresentação");
    for (const i of apresentacao) pdf.campo(i.campo.rotulo, valorCampoTexto(i.campo, i.valor));
  }

  const chavesApresentacao = new Set(d.apresentacao.map((i) => i.campo.id));
  for (const g of d.grupos) {
    const itens = g.itens.filter((i) => !i.campo.interno && !chavesApresentacao.has(i.campo.id) && valorCampoTexto(i.campo, i.valor));
    if (!itens.length) continue;
    pdf.secao(g.titulo === "Perfil comum" ? "Perfil comum" : `Campos da categoria: ${g.titulo}`);
    for (const i of itens) pdf.campo(i.campo.rotulo, valorCampoTexto(i.campo, i.valor));
  }

  if (d.contatos.length) {
    pdf.secao("Contatos");
    const linhas = [["Nome", "Cargo e papel", "E-mail", "Telefone"]];
    for (const c of d.contatos) {
      if (!c.contatos) continue;
      linhas.push([
        c.contatos.nome + (c.principal ? " (principal)" : ""),
        [c.contatos.cargo, (c.papeis ?? []).map((x) => rotulo(PAPEIS_CONTATO, x)).join(", ")].filter(Boolean).join(" · "),
        c.contatos.email ?? "",
        [c.contatos.telefone, c.contatos.whatsapp ? `WhatsApp ${c.contatos.whatsapp}` : ""].filter(Boolean).join(" · "),
      ]);
    }
    pdf.tabela(linhas, { cabecalho: true, pesos: [1.2, 1.4, 1.4, 1.2] });
  }

  if (d.passos.length) {
    pdf.secao("Próximos passos");
    const ativo = passoAtivo(d.passos);
    if (ativo) pdf.campo("Próximo passo ativo", `${ativo.descricao} · até ${fmtData(ativo.data)}${ativo.estado === "vencido" ? " (vencido)" : ""}`);
    const anteriores = d.passos.filter((x) => x !== ativo).slice(0, 8);
    if (anteriores.length) {
      pdf.tabela(
        [["Data", "Descrição", "Situação"], ...anteriores.map((x) => [fmtData(x.data), x.descricao, x.estado === "feito" ? `Feito em ${dataHora(x.concluido_em)}` : x.estado === "substituido" ? "Substituído" : "Vencido"])],
        { cabecalho: true, pesos: [0.8, 3, 1.2] },
      );
    }
  }
  return pdf.blob();
}
