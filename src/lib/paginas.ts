// Conteúdo editável das duas páginas públicas: a dos parceiros (/parceiros) e a do cliente do parceiro (/c/:codigo).
// As duas são únicas e gerais: nenhum nome, logo ou cor de parceiro. O banco guarda só o que o administrador mudou
// (config_landing.conteudo e config_landing_cliente.conteudo); o resto vem dos textos padrão deste arquivo.
// O editor fica em Programa, Páginas (src/pages/app/programa/Paginas.tsx).

import { FAIXAS_FATURAMENTO } from "@/lib/diagnostico";

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
export type Item = { titulo: string; texto: string };
export type Pergunta = { pergunta: string; resposta: string };
export const CAMPOS_TEXTO = ["eyebrow", "titulo", "texto", "botao", "nota"] as const;
export type CampoTexto = (typeof CAMPOS_TEXTO)[number];
export const CAMPOS_LISTA = ["itens", "itens_parceiro"] as const;
export type CampoLista = (typeof CAMPOS_LISTA)[number];

export type Bloco = { visivel?: boolean } & Partial<Record<CampoTexto, string>> & Partial<Record<CampoLista, Item[]>>;
export type Conteudo = { secoes?: Record<string, Bloco>; perguntas?: Pergunta[] };
// Conteúdo pronto para a tela: todo bloco existe, com os campos preenchidos
export type BlocoPronto = { visivel: boolean } & Record<CampoTexto, string> & Record<CampoLista, Item[]>;
export type ConteudoPronto<K extends string> = { secoes: Record<K, BlocoPronto>; perguntas: Pergunta[] };

// Descrição de cada bloco para o editor: o que ele é e quais campos tem
export type MetaBloco<K extends string = string> = {
  chave: K;
  rotulo: string;
  descricao: string;
  ocultavel: boolean;
  campos: Partial<Record<CampoTexto, string>>; // campo -> rótulo no editor
  listas?: Partial<Record<CampoLista, { rotulo: string; comTexto: boolean; nomeItem: string }>>;
};

export type Valores = { diagnostico: number; hub: number; total: number };
export type Icp = { min_vendedores: number; faturamento_min: string | null };
export type CaseResultado = { empresa: string; segmento: string; crescimento: number; periodo: string };
export type ResumoCases = { itens: CaseResultado[]; quantidade: number; media: number | null };

export const VALORES_PADRAO: Valores = { diagnostico: 2000, hub: 3000, total: 5000 };
export const ICP_PADRAO: Icp = { min_vendedores: 3, faturamento_min: "250k_500k" };

// Reserva só para o intervalo em que o site já foi publicado e as funções públicas ainda não devolvem os cases.
// A fonte é a tabela cases_resultado, editada em Programa, Páginas, Cases.
export const CASES_RESERVA: ResumoCases = {
  quantidade: 8,
  media: 35,
  itens: [
    { empresa: "Florart's Decor", segmento: "Decoração e ambientes de alto padrão", crescimento: 89.4, periodo: "jan/25 a out/26" },
    { empresa: "Maringá Portas", segmento: "Indústria de portas", crescimento: 43.8, periodo: "jan/26 a out/26" },
    { empresa: "Chamego Bandeiras", segmento: "Indústria de bandeiras", crescimento: 39.7, periodo: "jan/25 a ago/26" },
    { empresa: "Fusion Alumínios", segmento: "Portas de vidro e soluções para móveis planejados", crescimento: 25.7, periodo: "fev/25 a nov/25" },
    { empresa: "Totonho Locações", segmento: "Locação de móveis e peças para festas e eventos", crescimento: 25.4, periodo: "jan/26 a out/26" },
    { empresa: "Protectpool", segmento: "Soluções para piscinas e rede de revendedores", crescimento: 20.8, periodo: "jan/25 a out/26" },
    { empresa: "Powerfit", segmento: "Equipamentos esportivos para o mercado fitness", crescimento: 19.9, periodo: "jan/25 a out/25" },
    { empresa: "Nicopel", segmento: "Indústria de embalagens personalizadas", crescimento: 16.5, periodo: "jan/26 a out/26" },
  ],
};

// ---------------------------------------------------------------------------
// Formatação e marcadores
// ---------------------------------------------------------------------------
const NBSP = " ";

export function reais(v: number) {
  const inteiro = Number.isInteger(v);
  return `R$${NBSP}${v.toLocaleString("pt-BR", { minimumFractionDigits: inteiro ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function percentualCase(v: number) {
  return `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// Faturamento mínimo do perfil, a partir da faixa configurada ("250k_500k" vira "R$ 250 mil")
const PISO_FAIXA: Record<string, string> = {
  ate_100k: "", "100k_250k": `R$${NBSP}100 mil`, "250k_500k": `R$${NBSP}250 mil`, "500k_1m": `R$${NBSP}500 mil`,
  "1m_5m": `R$${NBSP}1 milhão`, acima_5m: `R$${NBSP}5 milhões`,
};

// "A partir de R$ 250 mil" para a faixa mínima escolhida no editor
export function pisoFaixa(faixa: string) {
  return PISO_FAIXA[faixa] ? `A partir de ${PISO_FAIXA[faixa]}` : "Sem mínimo";
}

// Texto do perfil para a reunião, gerado da configuração (icp_min_vendedores e icp_faturamento_min)
export function perfilReuniao(icp: Icp) {
  const n = Math.max(1, icp.min_vendedores);
  const vend = `a partir de ${n} ${n === 1 ? "vendedor" : "vendedores"}`;
  const piso = icp.faturamento_min && FAIXAS_FATURAMENTO.some((f) => f.valor === icp.faturamento_min) ? PISO_FAIXA[icp.faturamento_min] : "";
  return piso ? `${vend} e ${piso} de faturamento por mês` : vend;
}

export const MARCADORES: { chave: string; descricao: string }[] = [
  { chave: "valor_total", descricao: "soma dos valores de referência" },
  { chave: "valor_diagnostico", descricao: "valor do diagnóstico" },
  { chave: "valor_hub", descricao: "valor do Wise Hub" },
  { chave: "perfil_reuniao", descricao: "perfil para a reunião, gerado do ICP" },
  { chave: "media_cases", descricao: "média de crescimento dos cases" },
  { chave: "qtd_cases", descricao: "número de cases ativos" },
];

export type Variaveis = Record<string, string>;

export function variaveis(valores: Valores, icp: Icp, cases: ResumoCases): Variaveis {
  return {
    valor_total: reais(valores.total),
    valor_diagnostico: reais(valores.diagnostico),
    valor_hub: reais(valores.hub),
    perfil_reuniao: perfilReuniao(icp),
    media_cases: cases.media === null ? "" : `${cases.media > 0 ? "+" : ""}${cases.media}%`,
    qtd_cases: String(cases.quantidade),
  };
}

// Valores, perfil e cases que chegaram da função pública, com o padrão do código quando faltar algum
export function resolverDados(d: { valores?: Valores | null; icp?: Icp | null; cases?: ResumoCases | null } | undefined) {
  const valores = d?.valores ?? VALORES_PADRAO;
  const icp = d?.icp ?? ICP_PADRAO;
  const cases = d?.cases ?? CASES_RESERVA;
  return { valores, icp, cases, vars: variaveis(valores, icp, cases) };
}

export function preencher(texto: string, v: Variaveis) {
  return texto.replace(/\{(\w+)\}/g, (todo, k: string) => (k in v ? v[k] : todo));
}

// ---------------------------------------------------------------------------
// Montagem: padrão do código + o que está salvo no banco
// ---------------------------------------------------------------------------
const textoValido = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const listaValida = (v: unknown): v is Item[] =>
  Array.isArray(v) && v.length > 0 && v.every((i) => i && typeof i === "object" && typeof (i as Item).titulo === "string");

export function montarConteudo<K extends string>(padrao: ConteudoPronto<K>, salvo: unknown, v?: Variaveis): ConteudoPronto<K> {
  const s = (salvo && typeof salvo === "object" ? salvo : {}) as Conteudo;
  const secoes = {} as Record<K, BlocoPronto>;
  const p = (t: string) => (v ? preencher(t, v) : t);
  for (const k of Object.keys(padrao.secoes) as K[]) {
    const base = padrao.secoes[k];
    const o: Bloco = (s.secoes && typeof s.secoes === "object" ? s.secoes[k] : undefined) ?? {};
    const b = { visivel: typeof o.visivel === "boolean" ? o.visivel : base.visivel } as BlocoPronto;
    for (const c of CAMPOS_TEXTO) b[c] = p(textoValido(o[c]) ? o[c]! : base[c]);
    for (const c of CAMPOS_LISTA) {
      const lista = listaValida(o[c]) ? o[c]!.map((i) => ({ titulo: String(i.titulo ?? ""), texto: String(i.texto ?? "") })) : base[c];
      b[c] = lista.map((i) => ({ titulo: p(i.titulo), texto: p(i.texto) }));
    }
    secoes[k] = b;
  }
  const perguntasSalvas = Array.isArray(s.perguntas)
    ? s.perguntas.filter((q) => q && textoValido(q.pergunta) && textoValido(q.resposta))
    : null;
  const perguntas = (perguntasSalvas && perguntasSalvas.length ? perguntasSalvas : padrao.perguntas)
    .map((q) => ({ pergunta: p(q.pergunta), resposta: p(q.resposta) }));
  return { secoes, perguntas };
}

// O que difere do padrão (é isso que vai para o banco): textos iguais ao padrão não são gravados
export function compactarConteudo<K extends string>(padrao: ConteudoPronto<K>, atual: ConteudoPronto<K>): Conteudo {
  const secoes: Record<string, Bloco> = {};
  for (const k of Object.keys(padrao.secoes) as K[]) {
    const base = padrao.secoes[k];
    const a = atual.secoes[k];
    const d: Bloco = {};
    if (a.visivel !== base.visivel) d.visivel = a.visivel;
    for (const c of CAMPOS_TEXTO) if (a[c].trim() !== base[c].trim() && a[c].trim() !== "") d[c] = a[c].trim();
    for (const c of CAMPOS_LISTA) {
      const limpa = a[c].map((i) => ({ titulo: i.titulo.trim(), texto: i.texto.trim() })).filter((i) => i.titulo);
      if (limpa.length && JSON.stringify(limpa) !== JSON.stringify(base[c])) d[c] = limpa;
    }
    if (Object.keys(d).length) secoes[k] = d;
  }
  const out: Conteudo = {};
  if (Object.keys(secoes).length) out.secoes = secoes;
  const perguntas = atual.perguntas.map((q) => ({ pergunta: q.pergunta.trim(), resposta: q.resposta.trim() })).filter((q) => q.pergunta && q.resposta);
  if (JSON.stringify(perguntas) !== JSON.stringify(padrao.perguntas)) out.perguntas = perguntas;
  return out;
}

// Travessão e meia-risca são proibidos em qualquer texto: o editor aponta onde estão antes de salvar
export function temTravessao(c: unknown): boolean {
  return /[\u2013\u2014]/.test(JSON.stringify(c ?? ""));
}

function bloco(c: Partial<Record<CampoTexto, string>> & Partial<Record<CampoLista, Item[]>> = {}, visivel = true): BlocoPronto {
  return {
    visivel,
    eyebrow: c.eyebrow ?? "", titulo: c.titulo ?? "", texto: c.texto ?? "", botao: c.botao ?? "", nota: c.nota ?? "",
    itens: c.itens ?? [], itens_parceiro: c.itens_parceiro ?? [],
  };
}
const so = (...titulos: string[]): Item[] => titulos.map((titulo) => ({ titulo, texto: "" }));

// ---------------------------------------------------------------------------
// Página do portal (/parceiros): a entrada única de qualquer empresa (26/11/2026). Clientes do Grupo Tríade, quem quer ser
// parceiro e quem quer conhecer o ecossistema usam o mesmo cadastro; a Wise confere cada um e libera o acesso.
// ---------------------------------------------------------------------------
export const BLOCOS_PARCEIROS = [
  "topo", "logos", "caminhos", "grupo", "para_quem", "como_funciona", "catalogo", "acessos", "beneficios", "faixa_meio", "incluido", "niveis", "valor", "cases", "depoimentos",
  "comparacao", "perguntas", "cadastro",
] as const;
export type BlocoParceiros = (typeof BLOCOS_PARCEIROS)[number];

export const PADRAO_PARCEIROS: ConteudoPronto<BlocoParceiros> = {
  secoes: {
    topo: bloco({
      eyebrow: "Wise Partners · ecossistema do Grupo Tríade",
      titulo: "Mais negócios para a sua empresa dentro do ecossistema do Grupo Tríade.",
      texto: "No Wise Partners, a sua empresa contrata serviços de outras empresas do ecossistema com condições especiais e apresenta os próprios produtos e serviços no catálogo. Se quiser, também oferece à sua base uma consultoria comercial que vale {valor_total} e recebe 40% da primeira mensalidade quando o cliente contrata.",
      botao: "Cadastrar minha empresa",
      nota: "Cadastro em 3 minutos. A Wise confere e libera o seu acesso.",
    }),
    caminhos: bloco({
      eyebrow: "Dois jeitos de participar",
      titulo: "Faça negócio na comunidade, leve a consultoria à sua base, ou os dois.",
      itens: [
        { titulo: "Comunidade Wise Partners", texto: "Contrate produtos e serviços das empresas do ecossistema com condições só para membros, e publique as ofertas da sua empresa para os outros membros. Para clientes do Grupo Tríade e parceiros." },
        { titulo: "Programa de parceria", texto: "Ofereça aos seus clientes o diagnóstico comercial da Wise Makers, sem custo para ninguém, e receba 40% da primeira mensalidade de quem contratar a consultoria." },
      ],
    }),
    grupo: bloco({
      eyebrow: "Quem está por trás",
      titulo: "As empresas do Grupo Tríade, num ecossistema só.",
      texto: "O Wise Partners reúne quem já compra das empresas do grupo e quem vende junto com elas.",
    }),
    catalogo: bloco({
      eyebrow: "Catálogo de parceiros",
      titulo: "Condições especiais que só aparecem para quem é membro.",
      texto: "Cada oferta traz o que a empresa faz, para quem serve e uma condição exclusiva. Você pede pelo portal, recebe um protocolo e a empresa fala com você. Se a sua empresa é cliente do grupo, ela também publica as próprias ofertas.",
      nota: "As condições aparecem depois do login, para clientes do Grupo Tríade e parceiros Premium e Elite.",
    }),
    acessos: bloco({
      eyebrow: "O que cada empresa acessa",
      titulo: "O acesso segue a relação da sua empresa com o grupo.",
      texto: "Cliente do grupo não precisa vender a consultoria para aproveitar o portal: o catálogo, as condições e a vitrine para os seus produtos já valem a entrada.",
    }),
    logos: bloco({ titulo: "Empresas que estruturaram o comercial com a Wise Makers" }),
    para_quem: bloco({
      eyebrow: "Para quem é",
      titulo: "Para qualquer empresa que faz negócio com outras empresas.",
      texto: "Indústrias, fornecedores de serviço, empresas de tecnologia e entidades, de qualquer tamanho. O portal reúne empresas de mais de 30 categorias.",
      itens: [
        { titulo: "Clientes do Grupo Tríade", texto: "Contratam do ecossistema com condições especiais, publicam as próprias ofertas e indicam a consultoria da Wise Makers, se quiserem." },
        { titulo: "Sistemas, serviços e indústria", texto: "ERP, CRM, contabilidade, jurídico, RH, SST, manutenção, automação e tudo o que uma empresa compra de outra." },
        { titulo: "Entidades e instituições", texto: "Federações, Sistema S, associações, sindicatos patronais, universidades e parques tecnológicos." },
        { titulo: "Quem quer ser parceiro", texto: "Empresas com base de clientes que querem oferecer a consultoria da Wise Makers e ganhar com isso." },
      ],
    }),
    como_funciona: bloco({
      eyebrow: "Como funciona",
      titulo: "Três passos até usar o portal.",
      itens: [
        { titulo: "Cadastre a sua empresa", texto: "Leva uns 3 minutos. Conte quem é a empresa, a relação dela com o Grupo Tríade e o que ela quer no portal." },
        { titulo: "A Wise confere e libera o acesso", texto: "Cliente do grupo: a Wise confirma o vínculo e manda o acesso pelo WhatsApp. Quem quer ser parceiro: antes, uma conversa de entrada de 45 minutos." },
        { titulo: "Use o portal", texto: "Peça condições no catálogo, publique as suas ofertas e, se for parceiro ou cliente, indique a consultoria com o seu link." },
      ],
    }),
    beneficios: bloco({
      eyebrow: "Para quem quer ser parceiro",
      titulo: "Um benefício que retém, diferencia e ainda gera receita.",
      itens: [
        { titulo: "Retenha quem já compra de você", texto: "Cliente que estrutura o comercial vende mais e tem mais um motivo pra continuar com quem ajudou. A consultoria vira parte do relacionamento, sem custo pra você." },
        { titulo: "Diferencie a sua oferta", texto: "Na hora de fechar, em vez de baixar o preço, você inclui um diagnóstico comercial e o Wise Hub. O cliente leva mais, e você protege ticket e margem." },
        { titulo: "Receba 40% da primeira mensalidade", texto: "Quando um cliente que chegou pelo seu link contrata a consultoria da Wise, você recebe 40% da primeira mensalidade, pago ao CNPJ da sua empresa. O Wise Hub não gera comissão." },
      ],
    }),
    faixa_meio: bloco({
      titulo: "Mais de 300 empresas estruturadas e 1.500 vendedores capacitados pela Wise Makers.",
      texto: "Agora esse método pode chegar aos seus clientes pelas suas mãos, sem custo.",
      botao: "Cadastrar minha empresa",
      nota: "Sem custo · Sem exclusividade · Sai quando quiser",
    }),
    incluido: bloco({
      eyebrow: "Programa de parceria: o que está incluído",
      titulo: "Sem letra miúda: o que o seu cliente recebe e o que você recebe.",
      texto: "Vale pra toda a sua base de hoje e pra cada cliente novo. O autodiagnóstico online é aberto a qualquer cliente seu.",
      itens: [
        { titulo: "Reunião de diagnóstico com a Wise", texto: "Cerca de 2 horas, online, pela Matriz de Governança Comercial 5x5. Para empresas {perfil_reuniao}." },
        { titulo: "Plano de ação", texto: "O que priorizar, quem faz e os indicadores pra acompanhar. Chega por e-mail em até 2 dias úteis." },
        { titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas em quatro módulos, treinamentos curtos, calculadoras, planilhas e checklists." },
        { titulo: "Autodiagnóstico online", texto: "Para as empresas abaixo do perfil da reunião: o resultado sai na hora, com o acesso ao Wise Hub." },
      ],
      itens_parceiro: [
        { titulo: "Conversa de entrada com a Wise", texto: "45 minutos pra conhecer a sua base e combinar como oferecer a consultoria." },
        { titulo: "Acesso ao portal Wise Partners", texto: "Tudo do programa num lugar só: seu link, treinamento e acompanhamento." },
        { titulo: "Seu link exclusivo", texto: "Cada cliente que entra por ele fica registrado como seu." },
        { titulo: "Treinamento curto", texto: "Como apresentar a consultoria na venda, na renovação e no relacionamento com a base." },
        { titulo: "Acompanhamento no portal", texto: "Quem entrou pelo seu link e em que pé está." },
        { titulo: "40% da primeira mensalidade", texto: "Quando um cliente seu contrata a consultoria da Wise. Pago ao CNPJ da sua empresa, com nota fiscal." },
      ],
    }),
    niveis: bloco({
      eyebrow: "Níveis do programa",
      titulo: "Quanto mais a parceria cresce, mais a Wise investe na sua base.",
      texto: "Todo parceiro entra no programa e pode subir de nível com o tempo. A equipe da Wise conversa com você sobre cada passo.",
      itens: [
        { titulo: "Select", texto: "Seu link, o portal, o treinamento e os 40% da primeira mensalidade de cada cliente que contratar a consultoria." },
        { titulo: "Premium", texto: "Tudo do Select, e a sua empresa passa a ser recomendada pela Wise aos clientes dela." },
        { titulo: "Elite", texto: "Tudo do Premium, e uma formação por ano da Wise para a sua base de clientes." },
      ],
    }),
    valor: bloco({
      eyebrow: "Wise Hub",
      titulo: "O que o seu cliente recebe vale {valor_total}. Pra ele, sai de graça.",
      texto: "Não é área de curso. É onde o seu cliente diagnostica a operação, monta o plano e estrutura o comercial, com o método aplicado em mais de 300 empresas.",
      nota: "Na próxima negociação, em vez de dar desconto, você entrega {valor_total} em método.",
      itens: so("Sem cartão e sem instalação", "Plano de ação em até 2 dias úteis", "No navegador ou no celular", "Aulas com cases reais"),
    }),
    cases: bloco({
      eyebrow: "Resultados",
      titulo: "Quem aplicou o método mostra o resultado.",
      texto: "Empresas que estruturaram o comercial com a Wise Makers. É esse método que chega ao seu cliente.",
      nota: "Cada case compara os meses de trabalho com a Wise com os mesmos meses do ano anterior.",
    }),
    depoimentos: bloco({
      eyebrow: "Depoimentos",
      titulo: "Em vídeo, quem viveu o processo.",
    }),
    comparacao: bloco({
      eyebrow: "Lado a lado",
      titulo: "Vender só o que você já vende, ou vender com consultoria incluída.",
      itens: so(
        "Argumento na negociação além do preço",
        "Diagnóstico comercial pro cliente",
        "Plano de ação pro cliente",
        "Formação e ferramentas de gestão comercial (Wise Hub)",
        "Motivo pra falar com o cliente além da cobrança",
        "Comissão quando o cliente contrata a Wise",
      ),
    }),
    perguntas: bloco({ eyebrow: "Perguntas frequentes", titulo: "O que todo parceiro pergunta antes de entrar." }),
    cadastro: bloco({
      eyebrow: "Cadastro",
      titulo: "Cadastre a sua empresa no Wise Partners.",
      texto: "Um cadastro só, para qualquer empresa. A Wise confere cada cadastro e fala com você pelo WhatsApp em até 24 horas úteis.",
      botao: "Enviar cadastro",
      itens: so("Sem custo para entrar", "Ofertas validadas pela Wise", "Sem exclusividade", "Seu contato só vai para quem você pedir"),
    }),
  },
  perguntas: [
    { pergunta: "Quanto custa?", resposta: "Nada. Não tem mensalidade, taxa nem custo pra você ou pro seu cliente." },
    { pergunta: "Sou cliente do Grupo Tríade. Preciso vender a consultoria da Wise?", resposta: "Não. O cliente do grupo aproveita o catálogo: contrata das outras empresas com condições especiais e publica os próprios produtos e serviços. Indicar a consultoria é opcional." },
    { pergunta: "Quem pode usar as condições do catálogo?", resposta: "Os clientes das empresas do Grupo Tríade e os parceiros Premium e Elite. As outras empresas cadastradas veem as empresas e as ofertas, sem as condições." },
    { pergunta: "O que acontece depois do cadastro?", resposta: "A Wise confere quem é a empresa. Cliente do grupo recebe o acesso pelo WhatsApp depois da confirmação do vínculo. Quem quer ser parceiro faz antes uma conversa de entrada de 45 minutos." },
    { pergunta: "Por que é de graça? Qual é o porém?", resposta: "A Wise Makers ganha quando um cliente seu, depois do diagnóstico, decide contratar a consultoria pra ir além. Isso só acontece se ele quiser. Pra você, o programa é um benefício para a sua base, sem custo." },
    { pergunta: "Minha empresa não vende software. Posso entrar?", resposta: "Pode. O programa é pra qualquer empresa que vende para empresas com time comercial: sistemas, serviços, indústria, consultorias e também entidades, como federações, associações, sindicatos patronais e universidades." },
    { pergunta: "A Wise vai vender outra coisa pro meu cliente?", resposta: "O diagnóstico não é apresentação de vendas. A conversa comercial só acontece se o cliente pedir, e a Wise não vende o que você vende. Se ele contratar a consultoria, você recebe a comissão." },
    { pergunta: "Vai dar trabalho pro meu time?", resposta: "Depois da conversa de entrada, o trabalho é mandar o seu link, com a sua mensagem. O treinamento e o acompanhamento ficam no portal." },
    { pergunta: "Quais dados dos meus clientes a Wise vê?", resposta: "Só o que o próprio cliente informa no diagnóstico. A Wise nunca recebe a sua lista de clientes, e o resultado individual só é compartilhado com você se o cliente autorizar." },
    { pergunta: "Todo cliente meu faz a reunião de diagnóstico?", resposta: "A reunião com a equipe da Wise é para empresas {perfil_reuniao}. As demais fazem o autodiagnóstico online, veem o resultado na hora e recebem o acesso ao Wise Hub." },
    { pergunta: "Como e quando recebo a comissão?", resposta: "Você recebe 40% da primeira mensalidade da consultoria, depois que o primeiro pagamento do cliente compensar. O pagamento vai pro CNPJ da sua empresa, com nota fiscal, uma vez por cliente novo. O Wise Hub não gera comissão." },
    { pergunta: "O que muda nos níveis Premium e Elite?", resposta: "No Premium, a Wise passa a recomendar a sua empresa aos clientes dela. No Elite, a Wise faz uma formação por ano para a sua base. A equipe conversa com você sobre a subida de nível." },
    { pergunta: "Tem exclusividade ou meta de indicação?", resposta: "Não. Você continua trabalhando com quem quiser e não precisa bater nenhum número." },
    { pergunta: "Posso sair quando quiser?", resposta: "Pode. Basta avisar com 30 dias, sem multa. Comissões já geradas continuam sendo pagas." },
    { pergunta: "Quem é a Wise Makers?", resposta: "Uma consultoria de estrutura e gestão comercial de Maringá, Paraná. Em quatro anos, estruturou o comercial de mais de 300 empresas e capacitou mais de 1.500 vendedores." },
    { pergunta: "Quando eu começo?", resposta: "Em até 24 horas úteis depois do cadastro, a equipe da Wise fala com você pelo WhatsApp. Cliente do grupo recebe o acesso logo depois da confirmação; quem quer ser parceiro, depois da conversa de entrada." },
  ],
};

export const META_PARCEIROS: MetaBloco<BlocoParceiros>[] = [
  { chave: "topo", rotulo: "Topo", descricao: "Promessa, vídeo e o primeiro botão.", ocultavel: false,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", botao: "Botão", nota: "Nota ao lado do botão" } },
  { chave: "logos", rotulo: "Faixa de logos", descricao: "Logos de clientes da Wise Makers, logo abaixo do topo.", ocultavel: true, campos: { titulo: "Título" } },
  { chave: "caminhos", rotulo: "Dois jeitos de participar", descricao: "Comunidade e programa de parceria, lado a lado.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Caminhos", comTexto: true, nomeItem: "caminho" } } },
  { chave: "grupo", rotulo: "Empresas do Grupo Tríade", descricao: "As empresas do grupo vêm do cadastro de empresas do grupo, com a descrição de cada uma.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" } },
  { chave: "para_quem", rotulo: "Para quem é", descricao: "Os perfis de empresa que entram no portal.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" }, listas: { itens: { rotulo: "Áreas", comTexto: true, nomeItem: "área" } } },
  { chave: "como_funciona", rotulo: "Como funciona", descricao: "Os passos do cadastro ao uso do portal.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Passos", comTexto: true, nomeItem: "passo" } } },
  { chave: "catalogo", rotulo: "Catálogo de parceiros", descricao: "Números do catálogo e categorias com ofertas, calculados pelo banco.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", nota: "Nota sobre as condições" } },
  { chave: "acessos", rotulo: "O que cada empresa acessa", descricao: "Tabela de acessos por vínculo. As linhas e as marcas seguem as regras do portal e não são editáveis.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" } },
  { chave: "beneficios", rotulo: "Benefícios", descricao: "Três benefícios, cada um com um desenho ao lado (o desenho segue a ordem).", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Benefícios", comTexto: true, nomeItem: "benefício" } } },
  { chave: "faixa_meio", rotulo: "Chamada do meio", descricao: "Foto do evento, número de prova e botão.", ocultavel: true,
    campos: { titulo: "Título", texto: "Texto", botao: "Botão", nota: "Nota abaixo do botão" } },
  { chave: "incluido", rotulo: "O que está incluído", descricao: "O que o cliente recebe e o que o parceiro recebe.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Nota abaixo das listas" },
    listas: {
      itens: { rotulo: "O seu cliente recebe", comTexto: true, nomeItem: "entrega" },
      itens_parceiro: { rotulo: "Você recebe", comTexto: true, nomeItem: "entrega" },
    } },
  { chave: "niveis", rotulo: "Níveis", descricao: "Select, Premium e Elite, sem critérios de subida.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" }, listas: { itens: { rotulo: "Níveis", comTexto: true, nomeItem: "nível" } } },
  { chave: "valor", rotulo: "Wise Hub e valores", descricao: "Quadro com os valores de referência e a tela do Hub.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", nota: "Frase de destaque" },
    listas: { itens: { rotulo: "Vantagens", comTexto: false, nomeItem: "vantagem" } } },
  { chave: "cases", rotulo: "Cases de resultado", descricao: "Os cases ativos da aba Cases, com a média calculada pelo banco.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", nota: "Como o crescimento é medido" } },
  { chave: "depoimentos", rotulo: "Depoimentos em vídeo", descricao: "Os vídeos de clientes e a citação.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" } },
  { chave: "comparacao", rotulo: "Comparação", descricao: "Tabela: sem o programa e com o Wise Partners.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Linhas da tabela", comTexto: false, nomeItem: "linha" } } },
  { chave: "perguntas", rotulo: "Perguntas frequentes", descricao: "Título da seção. As perguntas ficam no quadro abaixo.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" } },
  { chave: "cadastro", rotulo: "Cadastro", descricao: "O formulário único, para qualquer empresa, e as garantias.", ocultavel: false,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", botao: "Botão de envio" },
    listas: { itens: { rotulo: "Garantias", comTexto: false, nomeItem: "garantia" } } },
];

// ---------------------------------------------------------------------------
// Página do cliente do parceiro (/c/:codigo): igual para todos, sem citar parceiro
// ---------------------------------------------------------------------------
export const BLOCOS_CLIENTE = [
  "topo", "logos", "como_funciona", "beneficios", "matriz", "faixa_meio", "incluido", "valor", "cases", "depoimentos", "comparacao",
  "perguntas", "equipe", "cadastro",
] as const;
export type BlocoCliente = (typeof BLOCOS_CLIENTE)[number];

export const PADRAO_CLIENTE: ConteudoPronto<BlocoCliente> = {
  secoes: {
    topo: bloco({
      eyebrow: "Consultoria comercial Wise Makers",
      titulo: "Uma consultoria comercial que vale {valor_total}, sem custo pra sua empresa.",
      texto: "O fornecedor que te enviou este link é parceiro da Wise Makers e incluiu pra você um diagnóstico do seu comercial, um plano de ação e o acesso ao Wise Hub.",
      botao: "Quero meu diagnóstico",
      nota: "Cadastro em 2 minutos. Sem cartão.",
    }),
    logos: bloco({ titulo: "Empresas que estruturaram o comercial com a Wise Makers" }),
    como_funciona: bloco({
      eyebrow: "Como funciona",
      titulo: "Três passos até o seu plano.",
      itens: [
        { titulo: "Conte sobre a sua empresa", texto: "Um cadastro de 2 minutos: faturamento, time comercial e o principal desafio." },
        { titulo: "Faça o diagnóstico", texto: "Para empresas {perfil_reuniao}, numa reunião online de cerca de 2 horas com a Wise. Nos outros casos, online e na hora." },
        { titulo: "Receba o plano e entre no Hub", texto: "O plano de ação chega por e-mail em até 2 dias úteis, com o acesso ao Wise Hub pra colocar em prática." },
      ],
    }),
    beneficios: bloco({
      eyebrow: "O que muda no seu comercial",
      titulo: "Menos achismo, mais método. Começando pelo que mais pesa.",
      itens: [
        { titulo: "Saiba onde o seu comercial mais trava", texto: "O diagnóstico olha os cinco pilares e aponta o mais frágil. Você para de tentar resolver tudo ao mesmo tempo e começa pelo que mais pesa no faturamento." },
        { titulo: "Um comercial com processo e rotina", texto: "Com etapas da venda, metas e rotina definidas, o time deixa as planilhas soltas e as anotações no WhatsApp. A informação fica num lugar só, e você decide com número." },
        { titulo: "Um comercial que depende menos de você", texto: "O plano de ação diz o que fazer primeiro, quem faz e como medir. A meta deixa de sair no achismo e o time sabe o que fazer sem esperar o dono." },
      ],
    }),
    matriz: bloco({
      eyebrow: "O diagnóstico",
      titulo: "Cinco pilares do seu comercial, vistos de cinco ângulos.",
      texto: "O diagnóstico usa a Matriz de Governança Comercial 5x5: cada pilar do comercial é avaliado por cinco critérios, pra mostrar onde a operação trava e por onde começar. Na reunião, a equipe da Wise conduz a análise com você.",
    }),
    faixa_meio: bloco({
      titulo: "Mais de 300 empresas estruturadas e 1.500 vendedores capacitados pela Wise Makers.",
      texto: "Agora esse método chega até você pelo seu fornecedor, sem custo.",
      botao: "Quero meu diagnóstico",
      nota: "Sem custo · Sem cartão · Sem ligação insistente",
    }),
    incluido: bloco({
      eyebrow: "O que você recebe",
      titulo: "A consultoria que o seu fornecedor incluiu pra você.",
      itens: [
        { titulo: "Reunião de diagnóstico", texto: "Cerca de 2 horas, online, com a equipe da Wise Makers. Para empresas {perfil_reuniao}." },
        { titulo: "Plano de ação", texto: "O que priorizar primeiro, com ações, responsáveis e indicadores. Chega por e-mail em até 2 dias úteis." },
        { titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas, treinamentos curtos, calculadoras, planilhas e checklists." },
        { titulo: "Autodiagnóstico online", texto: "Para empresas abaixo do perfil da reunião: o resultado sai na hora, com o acesso ao Wise Hub." },
      ],
    }),
    valor: bloco({
      eyebrow: "Wise Hub",
      titulo: "O diagnóstico e o Wise Hub valem {valor_total}. Pra você, sai de graça.",
      texto: "Não é área de curso. É onde você monta o plano, segue o Método Wise passo a passo e usa as ferramentas na rotina do seu time.",
      itens: so("Sem cartão e sem instalação", "No navegador ou no celular", "Plano de ação em até 2 dias úteis", "Aulas com cases reais"),
    }),
    cases: bloco({
      eyebrow: "Resultados",
      titulo: "Quem aplicou o método mostra o resultado.",
      texto: "Empresas que estruturaram o comercial com a Wise Makers.",
      nota: "Cada case compara os meses de trabalho com a Wise com os mesmos meses do ano anterior.",
    }),
    depoimentos: bloco({ eyebrow: "Depoimentos", titulo: "Em vídeo, quem viveu o processo." }),
    comparacao: bloco({
      eyebrow: "Lado a lado",
      titulo: "Resolver sozinho, contratar à parte ou usar o que o seu fornecedor incluiu.",
      itens: so(
        "Saber onde o comercial mais trava",
        "Plano de ação com prioridades",
        "Formação pra você e o time, mais de 20 horas",
        "Calculadoras, planilhas e checklists prontos",
        "Método aplicado em mais de 300 empresas",
        "Reunião de diagnóstico de 2 horas com a Wise",
      ),
    }),
    perguntas: bloco({ eyebrow: "Perguntas frequentes", titulo: "O que todo mundo pergunta antes de começar." }),
    equipe: bloco({ titulo: "Quem está por trás do seu diagnóstico" }),
    cadastro: bloco({
      eyebrow: "Seu diagnóstico",
      titulo: "Seu comercial pode depender menos de você. Comece pelo diagnóstico.",
      botao: "Quero meu diagnóstico",
      itens: so("Sem custo e sem cartão", "Sem ligação insistente", "Seus dados só vão para o seu fornecedor com a sua autorização"),
    }),
  },
  perguntas: [
    { pergunta: "Por que é de graça? Qual é o porém?", resposta: "O fornecedor que te enviou este link é parceiro da Wise Makers e incluiu a consultoria pra quem é cliente dele. A Wise ganha se, depois do diagnóstico, você quiser contratar a consultoria completa. Isso só acontece se você pedir." },
    { pergunta: "Vão me ligar insistindo?", resposta: "Não. A equipe da Wise só fala com você na reunião que você marcar, ou se você pedir." },
    { pergunta: "O meu fornecedor vai ver os meus dados?", resposta: "Ele fica sabendo que a sua empresa se cadastrou e em que pé está. O resultado do diagnóstico só é compartilhado se você marcar a autorização no cadastro. Suas respostas e seus números ficam com a Wise Makers." },
    { pergunta: "Serve pra minha empresa?", resposta: "Serve pra qualquer empresa com time comercial. Para empresas {perfil_reuniao}, o diagnóstico é numa reunião online com a equipe da Wise. Nos outros casos, você faz o autodiagnóstico online e vê o resultado na hora." },
    { pergunta: "Quanto tempo leva?", resposta: "O cadastro leva uns 2 minutos e o autodiagnóstico, uns 5. A reunião de diagnóstico dura cerca de 2 horas, online, no horário que você escolher, e o plano de ação chega por e-mail em até 2 dias úteis." },
    { pergunta: "É curso? Vou ter que assistir 20 horas?", resposta: "Não. Primeiro vem o diagnóstico e o plano. O Wise Hub tem a imersão de mais de 20 horas e as ferramentas, e você usa o que fizer sentido, no seu ritmo." },
    { pergunta: "Depois vão me cobrar alguma coisa?", resposta: "Não. O diagnóstico com o plano de ação (valor de referência {valor_diagnostico}) e o acesso ao Wise Hub ({valor_hub}) não têm custo e não pedem cartão. Se quiser a consultoria completa da Wise depois, é uma conversa à parte." },
    { pergunta: "Quem é a Wise Makers?", resposta: "Uma consultoria de estrutura e gestão comercial de Maringá, Paraná. Em quatro anos, estruturou o comercial de mais de 300 empresas e capacitou mais de 1.500 vendedores." },
  ],
};

export const META_CLIENTE: MetaBloco<BlocoCliente>[] = [
  { chave: "topo", rotulo: "Topo", descricao: "Convite geral, vídeo e o primeiro botão. Não cita parceiro.", ocultavel: false,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", botao: "Botão", nota: "Nota ao lado do botão" } },
  { chave: "logos", rotulo: "Faixa de logos", descricao: "Logos de clientes da Wise Makers.", ocultavel: true, campos: { titulo: "Título" } },
  { chave: "como_funciona", rotulo: "Como funciona", descricao: "Os passos até o plano.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Passos", comTexto: true, nomeItem: "passo" } } },
  { chave: "beneficios", rotulo: "Benefícios", descricao: "Três benefícios, cada um com um desenho ao lado (o desenho segue a ordem).", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Benefícios", comTexto: true, nomeItem: "benefício" } } },
  { chave: "matriz", rotulo: "O diagnóstico (Matriz 5x5)", descricao: "Os cinco pilares e os cinco critérios da matriz.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" } },
  { chave: "faixa_meio", rotulo: "Chamada do meio", descricao: "Foto do evento, número de prova e botão.", ocultavel: true,
    campos: { titulo: "Título", texto: "Texto", botao: "Botão", nota: "Nota abaixo do botão" } },
  { chave: "incluido", rotulo: "O que você recebe", descricao: "As entregas da consultoria.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Entregas", comTexto: true, nomeItem: "entrega" } } },
  { chave: "valor", rotulo: "Wise Hub e valores", descricao: "Quadro com os valores de referência e a tela do Hub.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto" }, listas: { itens: { rotulo: "Vantagens", comTexto: false, nomeItem: "vantagem" } } },
  { chave: "cases", rotulo: "Cases de resultado", descricao: "Os cases ativos da aba Cases, com a média calculada pelo banco.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", texto: "Texto", nota: "Como o crescimento é medido" } },
  { chave: "depoimentos", rotulo: "Depoimentos em vídeo", descricao: "Os vídeos de clientes e a citação.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" } },
  { chave: "comparacao", rotulo: "Comparação", descricao: "Tabela: sozinho, contratando à parte e incluído pelo fornecedor.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" }, listas: { itens: { rotulo: "Linhas da tabela", comTexto: false, nomeItem: "linha" } } },
  { chave: "perguntas", rotulo: "Perguntas frequentes", descricao: "Título da seção. As perguntas ficam no quadro abaixo.", ocultavel: true,
    campos: { eyebrow: "Sobretítulo", titulo: "Título" } },
  { chave: "equipe", rotulo: "Fotos da equipe", descricao: "Quem está por trás do diagnóstico.", ocultavel: true, campos: { titulo: "Título" } },
  { chave: "cadastro", rotulo: "Cadastro", descricao: "Formulário, agenda ou autodiagnóstico, e as garantias.", ocultavel: false,
    campos: { eyebrow: "Sobretítulo", titulo: "Título", botao: "Botão de envio" },
    listas: { itens: { rotulo: "Garantias", comTexto: false, nomeItem: "garantia" } } },
];
