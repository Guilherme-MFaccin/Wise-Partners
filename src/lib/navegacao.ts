import {
  Award, BarChart3, Building2, GraduationCap, Handshake, Home, ListChecks, Megaphone, Network, Send, UserPlus, type LucideIcon,
} from "lucide-react";

// Arquitetura do portal (v3, 20/11/2026): seções pela cadeia de valor do to-be, cada uma com poucas abas.
// O menu lateral mostra as seções; a barra de abas no topo da página mostra as abas da seção atual.
// `papeis`: quem vê a aba (sem papeis = todos do público da área). Uma seção aparece se ao menos uma aba aparecer.

export type Aba = { to: string; rotulo: string; papeis?: string[]; exato?: boolean; prefixos?: string[] };
export type SecaoNav = { id: string; rotulo: string; icone: LucideIcon; descricao: string; abas: Aba[] };

const GESTAO = ["admin", "parcerias"];
const OPERACAO = ["admin", "parcerias", "consultor"];
const TODOS_INTERNOS = ["admin", "parcerias", "consultor", "comercial", "financeiro"];
const SEM_FINANCEIRO = ["admin", "parcerias", "consultor", "comercial"];

export const SECOES_INTERNAS: SecaoNav[] = [
  {
    id: "tarefas", rotulo: "Tarefas", icone: ListChecks, descricao: "O que fugiu da regra e precisa de alguém da Wise",
    abas: [
      { to: "/app", rotulo: "Fila de hoje", exato: true },
      { to: "/app/meu-painel", rotulo: "Minha carteira", papeis: GESTAO },
      { to: "/app/atividades", rotulo: "Contatos e horas", papeis: SEM_FINANCEIRO },
    ],
  },
  {
    id: "candidatos", rotulo: "Candidatos", icone: UserPlus, descricao: "Atrair e selecionar parceiros (P-20)",
    abas: [
      { to: "/app/candidatos", rotulo: "Fila de cadastros", papeis: GESTAO, exato: true },
      { to: "/app/candidatos/origens", rotulo: "Origens e campanha", papeis: GESTAO },
    ],
  },
  {
    id: "parceiros", rotulo: "Parceiros", icone: Building2, descricao: "Integrar, desenvolver e reter (P-26, P-40, P-47, P-54)",
    abas: [
      { to: "/app/parceiros", rotulo: "Carteira", papeis: TODOS_INTERNOS, prefixos: ["/app/parceiros/"] },
      { to: "/app/acoes", rotulo: "Ações conjuntas", papeis: OPERACAO },
      { to: "/app/base-ativa", rotulo: "Base Ativa", papeis: SEM_FINANCEIRO },
      { to: "/app/comunicados", rotulo: "Comunicados", papeis: OPERACAO },
    ],
  },
  {
    id: "oportunidades", rotulo: "Oportunidades", icone: Handshake, descricao: "Gerar oportunidades no ecossistema (P-31, P-58)",
    abas: [
      { to: "/app/indicacoes", rotulo: "Indicações", papeis: TODOS_INTERNOS },
      { to: "/app/diagnosticos", rotulo: "Diagnósticos", papeis: OPERACAO },
      { to: "/app/rfp", rotulo: "Prateleira", papeis: SEM_FINANCEIRO, prefixos: ["/app/rfp/"] },
      { to: "/app/cruzamento", rotulo: "Cruzamento", papeis: GESTAO },
      { to: "/app/comissoes", rotulo: "Comissões", papeis: ["admin", "parcerias", "financeiro"] },
    ],
  },
  {
    id: "resultados", rotulo: "Resultados", icone: BarChart3, descricao: "Medir e aprender (P-14)",
    abas: [
      { to: "/app/painel", rotulo: "Painel da semana", papeis: SEM_FINANCEIRO },
      { to: "/app/resultado", rotulo: "Canal e CAC", papeis: ["admin"] },
      { to: "/app/custos", rotulo: "Custos", papeis: ["admin"] },
      { to: "/app/maturidade", rotulo: "Maturidade", papeis: OPERACAO },
      { to: "/app/ranking", rotulo: "Ranking", papeis: OPERACAO },
    ],
  },
  {
    id: "programa", rotulo: "Programa", icone: Network, descricao: "Arquitetar, equipar e operar o programa (P-01, P-59, P-60)",
    abas: [
      { to: "/app/modelo-e-processos", rotulo: "Modelo e processos", papeis: TODOS_INTERNOS },
      { to: "/app/programa/paginas", rotulo: "Páginas", papeis: GESTAO },
      { to: "/app/capacitacao", rotulo: "Capacitação", papeis: SEM_FINANCEIRO },
      { to: "/app/configuracoes", rotulo: "Regras e configurações", papeis: GESTAO },
      { to: "/app/usuarios", rotulo: "Usuários", papeis: GESTAO },
      { to: "/app/importar", rotulo: "Importação", papeis: ["admin"] },
    ],
  },
];

// Área do parceiro. Filtros: `responsavel` (só o responsável nomeado), `onboarding` (só com plano), `comercial` (só parceria comercial)
export type AbaParceiro = Aba & { responsavel?: boolean; onboarding?: boolean; comercial?: boolean; contador?: "comunicados" };
export type SecaoParceiro = Omit<SecaoNav, "abas"> & { abas: AbaParceiro[] };

export const SECOES_PARCEIRO: SecaoParceiro[] = [
  {
    id: "inicio", rotulo: "Início", icone: Home, descricao: "O que fazer agora",
    abas: [
      { to: "/parceiro", rotulo: "Início", exato: true },
      { to: "/parceiro/onboarding", rotulo: "Primeiros passos", onboarding: true },
    ],
  },
  {
    id: "oportunidades", rotulo: "Oportunidades", icone: Send, descricao: "Indicar e acompanhar",
    abas: [
      { to: "/parceiro/indicar", rotulo: "Indicar" },
      { to: "/parceiro/indicacoes", rotulo: "Minhas indicações" },
      { to: "/parceiro/rfps", rotulo: "Prateleira" },
      { to: "/parceiro/cruzamento", rotulo: "Cruzamento", comercial: true },
    ],
  },
  {
    id: "aprender", rotulo: "Aprender", icone: GraduationCap, descricao: "Minicurso, kit e regras",
    abas: [
      { to: "/parceiro/capacitacao", rotulo: "Capacitação", prefixos: ["/parceiro/capacitacao/"] },
      { to: "/parceiro/materiais", rotulo: "Kit e materiais" },
      { to: "/parceiro/regras", rotulo: "Regras do programa" },
    ],
  },
  {
    id: "parceria", rotulo: "Minha parceria", icone: Award, descricao: "Nível, combinados e a sua empresa",
    abas: [
      { to: "/parceiro/nivel", rotulo: "Meu nível" },
      { to: "/parceiro/parceria", rotulo: "O que combinamos" },
      { to: "/parceiro/acoes", rotulo: "Ações conjuntas" },
      { to: "/parceiro/ficha", rotulo: "Ficha na Prateleira" },
      { to: "/parceiro/usuarios", rotulo: "Usuários", responsavel: true },
    ],
  },
  {
    id: "comunidade", rotulo: "Comunidade", icone: Megaphone, descricao: "Comunicados, reconhecimento e pesquisa",
    abas: [
      { to: "/parceiro/comunicados", rotulo: "Comunicados", contador: "comunicados" },
      { to: "/parceiro/ranking", rotulo: "Ranking" },
      { to: "/parceiro/pesquisa", rotulo: "Pesquisa" },
    ],
  },
];

// A aba ativa é a de caminho mais específico que casa com a URL
export function casaAba(aba: Aba, caminho: string) {
  if (caminho === aba.to) return aba.to.length;
  if (!aba.exato && caminho.startsWith(aba.to + "/")) return aba.to.length;
  for (const p of aba.prefixos ?? []) if (caminho.startsWith(p)) return p.length;
  return 0;
}

export function localizar<T extends Aba>(secoes: { abas: T[] }[], caminho: string) {
  let melhor: { secao: number; aba: T; peso: number } | null = null;
  secoes.forEach((s, i) => s.abas.forEach((a) => {
    const peso = casaAba(a, caminho);
    if (peso > 0 && (!melhor || peso > melhor.peso)) melhor = { secao: i, aba: a, peso };
  }));
  return melhor as { secao: number; aba: T; peso: number } | null;
}

