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
  proposta_decisor: "Proposta com o decisor",
  fechamento: "Fechamento",
  onboarding: "Onboarding",
  nao_elegivel: "Não elegível",
  sem_interesse: "Sem interesse",
  parceria_encerrada: "Parceria encerrada",
};
export const ETAPAS_FUNIL = ["sem_contato", "contato_feito", "retornou", "reuniao_agendada", "reuniao_realizada", "proposta_decisor", "fechamento", "onboarding"];
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

export function rotulo(mapa: Record<string, string>, codigo: string | null | undefined) {
  if (!codigo) return "";
  return mapa[codigo] ?? codigo;
}
