// Rótulos em português para os códigos do banco. Textos sem travessão nem meia-risca.

export const PAPEIS: Record<string, string> = {
  admin: "Administrador",
  parcerias: "Time de parcerias",
  consultor: "Consultor ou gerente de conta",
  comercial: "Comercial",
  financeiro: "Financeiro",
  parceiro: "Usuário de parceiro",
};

export const ETAPAS: Record<string, string> = {
  sem_contato: "Sem contato",
  contato_feito: "Contato feito",
  retornou: "Retornou",
  reuniao_agendada: "Reunião agendada",
  reuniao_realizada: "Reunião realizada",
  qualificacao: "Qualificação",
  proposta_decisor: "Proposta com o decisor",
  fechamento: "Fechamento",
  onboarding: "Onboarding",
  parceria_ativa: "Parceria ativa",
  nutricao: "Nutrição",
  nao_elegivel: "Não elegível",
  sem_interesse: "Sem interesse",
  parceria_encerrada: "Parceria encerrada",
};
export const ETAPAS_FUNIL = [
  "sem_contato", "contato_feito", "retornou", "reuniao_agendada", "reuniao_realizada", "qualificacao", "proposta_decisor",
  "fechamento", "onboarding", "parceria_ativa",
];
// Etapa de pausa: fora da sequência do funil, com data de retomada
export const ETAPAS_PAUSA = ["nutricao"];
export const ETAPAS_PERDA = ["nao_elegivel", "sem_interesse", "parceria_encerrada"];

// Nos textos para parceiros e clientes, níveis aparecem pelo nome, nunca pela letra.
export const NIVEIS_COMERCIAL: Record<string, string> = { A: "Elite", B: "Premium", C: "Select" };
export const NIVEIS_INSTITUCIONAL: Record<string, string> = { A: "Institucional A", B: "Institucional B", C: "Institucional C" };
export function nomeNivel(tipo: string | null | undefined, codigo: string | null | undefined) {
  if (!codigo) return "Sem nível";
  return (tipo === "institucional" ? NIVEIS_INSTITUCIONAL : NIVEIS_COMERCIAL)[codigo] ?? codigo;
}

export const PACOTES: Record<string, string> = { A: "A · Base Ativa", B: "B · Formação", C: "C · Prateleira" };

export const STATUS_ATIVIDADE: Record<string, string> = { ativo: "Ativo", morno: "Morno", dormente: "Dormente", pausado: "Pausado" };

export const TIPOS_PARCERIA: Record<string, string> = { comercial: "Comercial", institucional: "Institucional" };
export const NATUREZAS: Record<string, string> = { privada: "Privada", publica: "Pública", paraestatal: "Paraestatal" };
export const PERFIS_INSTITUCIONAIS: Record<string, string> = {
  ecossistema: "Ecossistema", convocador: "Convocador", viveiro: "Viveiro", vitrine: "Vitrine",
};

export const TIPOS_CONTATO: Record<string, string> = {
  reuniao_presencial: "Reunião presencial",
  reuniao_online: "Reunião online",
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  evento: "Evento",
  documento_enviado: "Documento enviado",
  outro: "Outro",
};

export const PAPEIS_CONTATO: Record<string, string> = {
  decisor: "Decisor",
  interlocutor: "Interlocutor",
  responsavel_parceria: "Responsável pela parceria",
  comercial_clientes: "Contato comercial para clientes",
  ponte: "Ponte",
};

export const TIPOS_DOCUMENTO: Record<string, string> = {
  dossie: "Dossiê", apresentacao: "Apresentação", resumo: "Resumo", minuta: "Minuta", contrato_assinado: "Contrato assinado",
  certificado: "Certificado", comprovacao: "Comprovação", material: "Material", outro: "Outro",
};

export const ESTADOS_CONTRAPARTIDA: Record<string, string> = {
  pendente: "Pendente", enviada: "Enviada", validada: "Em dia", recusada: "Recusada", atrasada: "Atrasada",
};
export const PERIODICIDADES: Record<string, string> = {
  na_assinatura: "Na assinatura", unica: "Uma vez", continua: "Contínuo", quinzenal: "Quinzenal", mensal: "Mensal",
  bimestral: "Bimestral", trimestral: "Trimestral", por_ciclo: "Por ciclo", por_acao: "Por ação",
};

export const SENTIDOS: Record<string, string> = {
  parceiro_para_grupo: "Do parceiro para o grupo",
  grupo_para_parceiro: "Do grupo para o parceiro",
};
export const ORIGENS_INDICACAO: Record<string, string> = {
  grupo_whatsapp: "Grupo de WhatsApp", wise_hub: "Wise Hub", evento: "Evento", rfp: "Pedido de RFP",
  portal_parceiro: "Portal do parceiro", reuniao: "Reunião", outra: "Outra",
  link_parceiro: "Link exclusivo do parceiro", cruzamento: "Cruzamento de carteiras", acao_conjunta: "Ação conjunta",
};
export const ETAPAS_INDICACAO: Record<string, string> = {
  nova: "Nova", em_contato: "Em contato", reuniao: "Reunião", proposta: "Proposta", fechada: "Fechada", perdida: "Perdida",
};

export const ESTADOS_COMISSAO: Record<string, string> = {
  aguardando_fechamento: "Aguardando fechamento",
  aguardando_compensacao: "Aguardando compensação",
  a_pagar: "A pagar",
  nf_recebida: "Nota fiscal recebida",
  paga: "Paga",
  cancelada: "Cancelada",
};
// Para comissão que o grupo recebe do parceiro
export const ESTADOS_COMISSAO_RECEBER: Record<string, string> = {
  ...ESTADOS_COMISSAO,
  a_pagar: "A receber",
  nf_recebida: "Nota fiscal emitida",
  paga: "Recebida",
};
export const BENEFICIARIOS: Record<string, string> = {
  parceiro: "Parceiro", responsavel: "Responsável pela parceria", grupo: "Grupo (a receber)",
};

export const ESTADOS_BASE_ATIVA: Record<string, string> = {
  fila: "Na fila", em_ciclo: "Em ciclo", concluido: "Concluído", suspenso: "Suspenso",
};

export const ESTADOS_PEDIDO_RFP: Record<string, string> = { rascunho: "Rascunho", publicado: "Publicado", encerrado: "Encerrado" };

export const TIPOS_CAMPO: Record<string, string> = {
  texto_curto: "Texto curto", texto_longo: "Texto longo", numero: "Número", valor: "Valor em reais", faixa: "Faixa",
  lista: "Lista (uma opção)", multipla: "Múltipla escolha", sim_nao: "Sim ou não", link: "Link", arquivo: "Arquivo",
};

// ---------------------------------------------------------------------------
// v2 (Método Octo)
// ---------------------------------------------------------------------------
export const ORIGENS_PARCEIRO: Record<string, string> = {
  prospeccao_ativa: "Prospecção ativa", procura_espontanea: "Procura espontânea", indicacao_parceiro: "Indicação de parceiro",
  indicacao_interna: "Indicação interna", evento: "Evento", outra: "Outra",
};
export const ETAPAS_JORNADA: Record<string, string> = {
  captacao: "Captação", onboarding: "Onboarding", relacionamento: "Relacionamento", ida_mercado: "Ida ao mercado conjunta", gestao: "Gestão",
};
// Etapas do painel por jornada (catálogo de indicadores)
export const ETAPAS_PAINEL: Record<string, string> = {
  captacao: "Captação", onboarding: "Onboarding", relacionamento: "Relacionamento", producao: "Produção", canal: "Resultado do canal",
};
export const CATEGORIAS_CUSTO: Record<string, string> = {
  evento: "Evento", kit_brindes: "Kit e brindes", deslocamento: "Deslocamento", impressos: "Impressos", ferramentas: "Ferramentas",
  midia: "Mídia", outro: "Outro",
};
export const TIPOS_LINHA_CUSTO: Record<string, string> = {
  hora: "Horas", comissao_parceiro: "Comissão ao parceiro", comissao_responsavel: "Comissão ao responsável",
  custo_direto: "Custo direto", receita: "Receita", comissao_recebida: "Comissão recebida",
};
export const AGRUPAMENTOS_RESULTADO: Record<string, string> = {
  total: "Total", parceiro: "Por parceiro", nivel: "Por nível", modelo: "Por modelo de atuação", empresa: "Por empresa do grupo", origem: "Por origem do parceiro",
};
export const SITUACOES_ONBOARDING: Record<string, string> = { em_andamento: "Em andamento", ativado: "Ativado", nao_ativado: "Não ativado" };
export const MARCOS_ONBOARDING: Record<string, string> = {
  encontro_alinhamento: "Encontro 1: alinhamento", encontro_vendas: "Encontro 2: vendas", marco_30: "Marco de 30 dias",
  encontro_produto: "Encontro 3: produto", marco_60: "Marco de 60 dias", encontro_pos_venda: "Encontro 4: pós-venda", marco_90: "Marco de 90 dias: ativação",
};
export const RESULTADOS_REVISAO: Record<string, string> = {
  cumpre: "Cumpre o nível", observacao: "Em observação", proposta_rebaixamento: "Proposta de rebaixamento", isento: "Isento", subida: "Subida por resultado",
};
export const GRUPOS_REQUISITO: Record<string, string> = { resultado: "Resultado", capacitacao: "Capacitação", regras: "Regras" };
export const FAIXAS: Record<string, string> = { destaque: "Destaque", potencial: "Potencial", base: "Base" };
export const ESTADOS_ACAO_WISE: Record<string, string> = {
  planejada: "Planejada", feita: "Feita", comprovada: "Comprovada", atrasada: "Atrasada", cancelada: "Cancelada",
};
export const TIPOS_ACAO: Record<string, string> = {
  marketing: "Marketing", venda: "Venda", relacionamento: "Relacionamento", conteudo: "Conteúdo", evento: "Evento", outro: "Outro",
};
export const ESTADOS_DESLIGAMENTO: Record<string, string> = {
  em_risco: "Em risco", tentativa_1: "Primeira tentativa de retomada", tentativa_2: "Segunda tentativa de retomada",
  sugerido: "Desligamento sugerido", aprovado: "Aprovado pelo Diretor", avisado: "Aviso enviado", encerrado: "Encerrado", cancelado: "Cancelado",
};
export const TIPOS_DESLIGAMENTO: Record<string, string> = { inatividade: "Inatividade", inadequacao: "Inadequação" };
export const EIXOS_MATURIDADE: Record<string, string> = {
  objetivo: "Objetivo e estratégia", modelo: "Modelo de atuação", aderencia: "Aderência ao ICP", capacitacao: "Capacitação",
  mercado: "Ida ao mercado conjunta", programa: "Engajamento no programa", relacionamento: "Relacionamento", resultado: "Resultado",
};
export const CATEGORIAS_MATURIDADE: Record<string, string> = { fundacao: "Fundação", desenvolvimento: "Desenvolvimento", escala: "Escala" };
export const FASES_PROGRAMA: Record<string, string> = {
  experimentacao: "Experimentação", tracao: "Tração", crescimento: "Crescimento acelerado", otimizacao: "Otimização",
};
export const QUADRANTES_CRUZAMENTO: Record<string, string> = {
  cliente_comum: "Cliente em comum", wise_apresenta: "A Wise pode apresentar o parceiro",
  parceiro_apresenta: "O parceiro pode apresentar a Wise", acao_conjunta: "Ação conjunta de marketing ou venda",
};
export const PRAZOS_SLA: Record<string, string> = {
  validacao: "Validação e primeiro contato", retorno_parceiro: "Retorno ao parceiro", atualizacao: "Atualização a cada 15 dias",
  primeiro_contato_parceiro: "Primeiro contato do parceiro", atualizacao_parceiro: "Atualização pelo parceiro",
};
export const TIPOS_MODULO: Record<string, string> = { video_arquivo: "Vídeo (arquivo)", video_link: "Vídeo (link)", pdf: "PDF", texto: "Texto" };

export function rotulo(mapa: Record<string, string>, codigo: string | null | undefined) {
  if (!codigo) return "";
  return mapa[codigo] ?? codigo;
}
