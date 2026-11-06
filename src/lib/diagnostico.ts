// Autodiagnóstico da página do cliente do parceiro: Matriz de Diagnóstico de Governança Comercial 5x5
// (pesquisa "Ociosidade técnico-estratégica do CRM", UniCesumar): cinco pilares avaliados por cinco critérios.
// Versão para revisão do Guilherme: a redação final da pesquisa depende da aprovação do Comitê de Ética.
// O cálculo do resultado fica no banco (resultado_matriz_5x5); aqui só o texto das perguntas e dos níveis.

export const PILARES = [
  { chave: "identidade", nome: "Identidade e posicionamento", dica: "Quem é o seu cliente ideal e por que ele escolhe você." },
  { chave: "demanda", nome: "Demanda e aquisição", dica: "De onde vêm os clientes novos, com que ritmo e a que custo." },
  { chave: "conversao", nome: "Conversão e experiência", dica: "Como uma oportunidade vira venda, etapa por etapa." },
  { chave: "expansao", nome: "Expansão e retenção", dica: "Quanto você vende de novo para quem já é cliente." },
  { chave: "governanca", nome: "Governança e integração", dica: "Metas, rotina de gestão e o CRM como registro único." },
] as const;

export const CRITERIOS = [
  { chave: "estrategia", nome: "Estratégia" },
  { chave: "processo", nome: "Processo" },
  { chave: "dados", nome: "Dados" },
  { chave: "tecnologia", nome: "Tecnologia" },
  { chave: "pessoas", nome: "Pessoas e cultura" },
] as const;

export type ChavePilar = (typeof PILARES)[number]["chave"];
export type ChaveCriterio = (typeof CRITERIOS)[number]["chave"];

// Uma afirmação por célula da matriz
export const AFIRMACOES: Record<ChavePilar, Record<ChaveCriterio, string>> = {
  identidade: {
    estrategia: "Temos por escrito quem é o nosso cliente ideal e por que ele compra de nós, e não do concorrente.",
    processo: "O time apresenta a empresa e a proposta de valor do mesmo jeito, seguindo um roteiro.",
    dados: "Sabemos de quais segmentos e regiões vem a maior parte do faturamento e da margem.",
    tecnologia: "O perfil de cliente ideal está registrado no CRM e é usado para separar a carteira.",
    pessoas: "Todo vendedor sabe explicar em uma frase por que um cliente deve escolher a gente.",
  },
  demanda: {
    estrategia: "Temos uma meta de clientes novos por mês e sabemos de quais canais eles vão vir.",
    processo: "A prospecção acontece numa rotina semanal, com tempo reservado na agenda do time.",
    dados: "Sabemos quantos contatos novos geramos por mês e quanto custa conquistar um cliente.",
    tecnologia: "Todo contato novo entra no CRM, com a origem registrada.",
    pessoas: "O time prospecta mesmo quando a carteira está cheia de pedidos.",
  },
  conversao: {
    estrategia: "As etapas da venda estão definidas, com o que precisa acontecer para passar de uma para a outra.",
    processo: "Toda proposta segue um padrão e tem um próximo passo combinado com o cliente.",
    dados: "Sabemos a taxa de conversão de cada etapa e o motivo das vendas perdidas.",
    tecnologia: "As negociações em andamento estão no CRM, e não em planilhas ou só no WhatsApp.",
    pessoas: "Vendedores novos aprendem o processo com material e treinamento, e não só acompanhando alguém.",
  },
  expansao: {
    estrategia: "Temos um plano para vender mais para quem já é cliente e para recuperar quem parou de comprar.",
    processo: "Existe uma rotina de contato com a carteira atual, além de atender os pedidos que chegam.",
    dados: "Sabemos quanto da receita vem de clientes recorrentes e quais clientes estão comprando menos.",
    tecnologia: "O CRM avisa quando um cliente fica tempo demais sem comprar ou sem contato.",
    pessoas: "O time é cobrado e reconhecido pela carteira que mantém, e não só pelas vendas novas.",
  },
  governanca: {
    estrategia: "As metas comerciais saem de dados e são desdobradas por vendedor.",
    processo: "Existe uma reunião comercial com pauta fixa, em que os números são acompanhados.",
    dados: "Os indicadores comerciais saem do CRM, sem montar planilha à mão.",
    tecnologia: "O CRM é o registro obrigatório de todas as conversas e negociações com clientes.",
    pessoas: "O comercial funciona mesmo quando o dono ou o gestor não está por perto.",
  },
};

export const ESCALA = [
  { nota: 1, rotulo: "Não acontece" },
  { nota: 2, rotulo: "Raramente" },
  { nota: 3, rotulo: "Às vezes" },
  { nota: 4, rotulo: "Quase sempre" },
  { nota: 5, rotulo: "Sempre, e medimos" },
] as const;

export const NIVEIS: Record<string, { nome: string; texto: string }> = {
  inicial: { nome: "Inicial", texto: "O comercial depende de pessoas e da memória delas. O primeiro ganho vem de combinar o básico: quem é o cliente ideal, quais são as etapas da venda e onde tudo fica registrado." },
  em_estruturacao: { nome: "Em estruturação", texto: "Algumas práticas existem, mas não são seguidas por todos nem medidas. O próximo passo é transformar o que funciona em rotina e acompanhar os números toda semana." },
  estruturado: { nome: "Estruturado", texto: "O processo existe e a maior parte do time segue. Agora o ganho está em usar os dados para decidir: metas por vendedor, conversão por etapa e a carteira atual." },
  gerenciado: { nome: "Gerenciado", texto: "Processo, dados e rotina funcionam juntos. O foco passa a ser escalar: formar vendedores mais rápido e crescer na carteira atual." },
  referencia: { nome: "Referência", texto: "O comercial é previsível e funciona sem depender do dono. Vale manter a disciplina e revisar a estratégia a cada ciclo." },
};

export type ResultadoMatriz = {
  pilares: { chave: ChavePilar; media: number; percentual: number }[];
  criterios: { chave: ChaveCriterio; media: number; percentual: number }[];
  media: number;
  percentual: number;
  nivel: keyof typeof NIVEIS;
  pilar_mais_fragil: ChavePilar;
  hub_url?: string;
};

export const FAIXAS_FATURAMENTO = [
  { valor: "ate_100k", rotulo: "Até R$ 100 mil" },
  { valor: "100k_250k", rotulo: "De R$ 100 mil a R$ 250 mil" },
  { valor: "250k_500k", rotulo: "De R$ 250 mil a R$ 500 mil" },
  { valor: "500k_1m", rotulo: "De R$ 500 mil a R$ 1 milhão" },
  { valor: "1m_5m", rotulo: "De R$ 1 milhão a R$ 5 milhões" },
  { valor: "acima_5m", rotulo: "Acima de R$ 5 milhões" },
] as const;

export const nomePilar = (k: string) => PILARES.find((p) => p.chave === k)?.nome ?? k;
export const nomeCriterio = (k: string) => CRITERIOS.find((c) => c.chave === k)?.nome ?? k;
export const chaveResposta = (p: ChavePilar, c: ChaveCriterio) => `${p}.${c}`;
export const TOTAL_PERGUNTAS = PILARES.length * CRITERIOS.length;
