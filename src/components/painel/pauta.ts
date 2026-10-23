import { data, minutosParaHoras, moeda, semTravessao } from "@/lib/formato";
import { ETAPAS, rotulo, STATUS_ATIVIDADE } from "@/lib/rotulos";

// Formato devolvido por painel_semanal(p_inicio, p_fim) (migração 0005).
export type PainelDados = {
  periodo: { inicio: string; fim: string };
  meta_assinados: number;
  assinados: number;
  funil: { etapa: string; nome: string; perda: boolean; total: number }[];
  followups_vencidos: { id: string; parceiro_id: string; parceiro: string; descricao: string; data: string; responsavel_id: string | null }[];
  esfriando: { parceiro_id: string; parceiro: string; status: string; ultimo_contato: string | null; motivo: string | null }[];
  negociacoes_paradas: { parceiro_id: string; parceiro: string; etapa: string; desde: string }[];
  contrapartidas_atrasadas: { id: string; parceiro_id: string; parceiro: string; nome: string; proxima_data: string | null }[];
  aprovacoes_pendentes: { parceiro_id: string; parceiro: string; desde: string }[];
  propostas_ficha_pendentes: number;
  indicacoes: {
    total: number; do_parceiro: number; para_parceiro: number; no_icp: number; com_reuniao: number; fechadas: number;
    por_empresa: Record<string, number>;
  };
  indicacoes_paradas: number;
  contratos_assinados: { parceiro_id: string; parceiro: string; data: string }[];
  // Nulo para quem não vê comissão
  comissoes: { a_pagar: number; pagas_periodo: number; a_receber: number; recebidas_periodo: number } | null;
  fila_base_ativa: { parceiro_id: string; parceiro: string; posicao: number; estrategico: boolean }[];
  categorias_sem_3: { categoria_id: string; categoria: string; assinados: number }[];
  atividades: { tipo: string; quantidade: number; minutos: number }[];
  sem_motivo_inatividade: number;
};

// Garante listas vazias quando a RLS do usuário (por exemplo, financeiro) não devolve dados.
export function normalizarPainel(p: any): PainelDados {
  const ind = p?.indicacoes ?? {};
  return {
    periodo: p?.periodo ?? { inicio: "", fim: "" },
    meta_assinados: Number(p?.meta_assinados ?? 0),
    assinados: Number(p?.assinados ?? 0),
    funil: p?.funil ?? [],
    followups_vencidos: p?.followups_vencidos ?? [],
    esfriando: p?.esfriando ?? [],
    negociacoes_paradas: p?.negociacoes_paradas ?? [],
    contrapartidas_atrasadas: p?.contrapartidas_atrasadas ?? [],
    aprovacoes_pendentes: p?.aprovacoes_pendentes ?? [],
    propostas_ficha_pendentes: Number(p?.propostas_ficha_pendentes ?? 0),
    indicacoes: {
      total: Number(ind.total ?? 0),
      do_parceiro: Number(ind.do_parceiro ?? 0),
      para_parceiro: Number(ind.para_parceiro ?? 0),
      no_icp: Number(ind.no_icp ?? 0),
      com_reuniao: Number(ind.com_reuniao ?? 0),
      fechadas: Number(ind.fechadas ?? 0),
      por_empresa: ind.por_empresa ?? {},
    },
    indicacoes_paradas: Number(p?.indicacoes_paradas ?? 0),
    contratos_assinados: p?.contratos_assinados ?? [],
    comissoes: p?.comissoes ?? null,
    fila_base_ativa: p?.fila_base_ativa ?? [],
    categorias_sem_3: p?.categorias_sem_3 ?? [],
    atividades: p?.atividades ?? [],
    sem_motivo_inatividade: Number(p?.sem_motivo_inatividade ?? 0),
  };
}

function nomes(lista: string[], max = 5) {
  if (!lista.length) return "";
  const v = lista.slice(0, max).join(", ");
  return lista.length > max ? `${v} e mais ${lista.length - max}` : v;
}

// Pauta montada sem IA, a partir dos dados do painel. Usada quando a IA não responde.
export function montarPautaLocal(p: PainelDados): string {
  const l: string[] = [];
  let n = 0;
  const topico = (titulo: string, linhas: string[]) => {
    n += 1;
    l.push(`${n}. ${titulo}`);
    linhas.filter(Boolean).forEach((x) => l.push(`   ${x}`));
    l.push("");
  };

  l.push(`Pauta da reunião semanal do Wise Partners`);
  l.push(`Período: ${data(p.periodo.inicio)} a ${data(p.periodo.fim)}`);
  l.push("");

  const faltam = Math.max(0, p.meta_assinados - p.assinados);
  topico("Meta de assinados", [
    `${p.assinados} parceiros assinados de ${p.meta_assinados}; faltam ${faltam}.`,
    p.contratos_assinados.length
      ? `Assinados no período: ${nomes(p.contratos_assinados.map((c) => c.parceiro))}.`
      : "Nenhum contrato assinado no período.",
  ]);

  if (p.aprovacoes_pendentes.length) {
    topico("Aprovações de assinatura pendentes do Diretor", [nomes(p.aprovacoes_pendentes.map((a) => a.parceiro), 10) + "."]);
  }

  const funil = p.funil.filter((f) => !f.perda && f.total > 0).map((f) => `${f.nome}: ${f.total}`);
  if (funil.length) topico("Funil", [funil.join("; ") + "."]);

  if (p.negociacoes_paradas.length) {
    topico("Negociações paradas", p.negociacoes_paradas.slice(0, 8).map(
      (x) => `${x.parceiro}, em ${rotulo(ETAPAS, x.etapa).toLowerCase()} desde ${data(x.desde)}.`,
    ));
  }

  if (p.followups_vencidos.length) {
    topico(`Follow-ups vencidos (${p.followups_vencidos.length})`, p.followups_vencidos.slice(0, 8).map(
      (x) => `${x.parceiro}: ${x.descricao} (previsto para ${data(x.data)}).`,
    ));
  }

  if (p.esfriando.length) {
    topico(`Parceiros esfriando (${p.esfriando.length})`, [
      ...p.esfriando.slice(0, 8).map((x) => `${x.parceiro}, ${rotulo(STATUS_ATIVIDADE, x.status).toLowerCase()}${x.motivo ? `: ${x.motivo}` : ", sem motivo registrado"}.`),
      p.sem_motivo_inatividade ? `${p.sem_motivo_inatividade} sem motivo da inatividade registrado.` : "",
    ]);
  }

  if (p.contrapartidas_atrasadas.length) {
    topico(`Contrapartidas atrasadas (${p.contrapartidas_atrasadas.length})`, p.contrapartidas_atrasadas.slice(0, 8).map(
      (x) => `${x.parceiro}: ${x.nome}${x.proxima_data ? ` (prevista para ${data(x.proxima_data)})` : ""}.`,
    ));
  }

  const i = p.indicacoes;
  const empresas = Object.entries(i.por_empresa).filter(([, v]) => Number(v) > 0).map(([k, v]) => `${k}: ${v}`);
  topico("Indicações do período", [
    `${i.total} indicações (${i.do_parceiro} dos parceiros para o grupo e ${i.para_parceiro} do grupo para parceiros).`,
    `${i.no_icp} no ICP, ${i.com_reuniao} com reunião e ${i.fechadas} fechadas.`,
    empresas.length ? `Por empresa: ${empresas.join("; ")}.` : "",
    p.indicacoes_paradas ? `${p.indicacoes_paradas} indicações sem atualização há 30 dias ou mais.` : "",
  ]);

  if (p.comissoes) {
    topico("Comissões", [
      `A pagar: ${moeda(p.comissoes.a_pagar)}. Pagas no período: ${moeda(p.comissoes.pagas_periodo)}.`,
      `A receber: ${moeda(p.comissoes.a_receber)}. Recebidas no período: ${moeda(p.comissoes.recebidas_periodo)}.`,
    ]);
  }

  if (p.fila_base_ativa.length) {
    topico("Fila do Base Ativa", [
      p.fila_base_ativa.slice(0, 6).map((f) => `${f.posicao}º ${f.parceiro}${f.estrategico ? " (estratégico)" : ""}`).join("; ") + ".",
    ]);
  }

  if (p.categorias_sem_3.length) {
    topico("Categorias sem as 3 opções", [
      nomes(p.categorias_sem_3.map((c) => `${c.categoria} (${c.assinados})`), 12) + ".",
    ]);
  }

  if (p.propostas_ficha_pendentes) {
    topico("Propostas de ficha para revisar", [`${p.propostas_ficha_pendentes} proposta(s) de alteração de ficha aguardando validação.`]);
  }

  if (p.atividades.length) {
    const total = p.atividades.reduce((s, a) => s + Number(a.minutos ?? 0), 0);
    topico("Atividades do período (informativo)", [
      p.atividades.map((a) => `${a.tipo}: ${a.quantidade}`).join("; ") + ".",
      `Tempo estimado: ${minutosParaHoras(total)}.`,
    ]);
  }

  topico("Próximos passos e responsáveis", ["Definir responsável e data para cada ponto acima."]);

  return semTravessao(l.join("\n").trim());
}
