import { ETAPAS_JORNADA, NATUREZAS, PERIODICIDADES, TIPOS_PARCERIA, rotulo } from "@/lib/rotulos";
import { TabelaConfig, type ColunaConfig, type Opcao } from "./TabelaConfig";

// Seções simples da tela de configurações, todas pelo editor genérico.
// Colunas definidas fora dos componentes para manter referências estáveis.

const op = (m: Record<string, string>): Opcao[] => Object.entries(m).map(([valor, rotulo]) => ({ valor, rotulo }));
export const NIVEIS_OP: Opcao[] = [{ valor: "C", rotulo: "Select" }, { valor: "B", rotulo: "Premium" }, { valor: "A", rotulo: "Elite" }];

const COL_EMPRESAS: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
  { chave: "base_calculo", rotulo: "Base de cálculo da comissão", tipo: "texto", obrigatoria: true },
  { chave: "pct_parceiro", rotulo: "% do parceiro", tipo: "numero", obrigatoria: true },
  { chave: "pct_responsavel", rotulo: "% do responsável pela parceria", tipo: "numero", obrigatoria: true },
  // Venda pontual (Wise, proposta comercial de 26/11/2026): vazio quando a empresa não tem venda pontual
  { chave: "base_calculo_pontual", rotulo: "Base da comissão da venda pontual (vazio se não houver)", tipo: "texto" },
  { chave: "pct_parceiro_pontual", rotulo: "% do parceiro na venda pontual", tipo: "numero" },
  { chave: "pct_responsavel_pontual", rotulo: "% do responsável na venda pontual", tipo: "numero" },
  { chave: "site", rotulo: "Site", tipo: "texto" },
  { chave: "descricao_institucional", rotulo: "Descrição institucional (aparece no portal do parceiro)", tipo: "textarea" },
];
export function SecaoEmpresas({ somenteLeitura }: { somenteLeitura: boolean }) {
  return <TabelaConfig tabela="empresas_grupo" pk={["id"]} colunas={COL_EMPRESAS} tituloItem={(l) => l.nome} somenteLeitura={somenteLeitura} />;
}

const COL_NIVEIS: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
  { chave: "faixa_min", rotulo: "Carteira no ICP: mínimo", tipo: "numero" },
  { chave: "faixa_max", rotulo: "Carteira no ICP: máximo (vazio = sem limite)", tipo: "numero" },
  { chave: "dias_morno", rotulo: "Dias sem contato para morno", tipo: "numero", obrigatoria: true },
  { chave: "dias_dormente", rotulo: "Dias sem contato para dormente", tipo: "numero", obrigatoria: true },
  // Benefícios do nível (os pacotes saíram em 26/11/2026: as entregas seguem o nível)
  { chave: "wise_hub", rotulo: "Inclui acesso ao Wise Hub", tipo: "booleano", visivel: (l) => l.tipo_parceria === "comercial" },
  { chave: "entregas", rotulo: "Entregas da Wise (uma por linha)", tipo: "linhas", visivel: (l) => l.tipo_parceria === "comercial" },
  { chave: "tarefas_onboarding", rotulo: "Tarefas de onboarding (uma por linha)", tipo: "linhas", visivel: (l) => l.tipo_parceria === "comercial" },
];
export function SecaoNiveis({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="niveis" pk={["tipo_parceria", "codigo"]} ordem="tipo_parceria" colunas={COL_NIVEIS} somenteLeitura={somenteLeitura}
      tituloItem={(l) => `${TIPOS_PARCERIA[l.tipo_parceria]}: ${l.nome}`} />
  );
}

const COL_CONTRAPARTIDAS: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "tipo_parceria", rotulo: "Tipo de parceria", tipo: "select", opcoes: op(TIPOS_PARCERIA), obrigatoria: true },
  { chave: "periodicidade", rotulo: "Periodicidade", tipo: "select", opcoes: op(PERIODICIDADES), obrigatoria: true },
  { chave: "prazo_inicial_dias", rotulo: "Prazo inicial (dias após a assinatura)", tipo: "numero" },
  { chave: "niveis", rotulo: "Níveis em que vale (nenhum marcado = todos)", tipo: "multi", opcoes: NIVEIS_OP, vazioNulo: true, visivel: (l) => l.tipo_parceria !== "institucional" },
  { chave: "natureza_juridica", rotulo: "Natureza jurídica (nenhuma = todas)", tipo: "multi", opcoes: op(NATUREZAS), vazioNulo: true, visivel: (l) => l.tipo_parceria === "institucional" },
  { chave: "comprovacao", rotulo: "Forma de comprovação", tipo: "texto", obrigatoria: true },
  { chave: "meta", rotulo: "Meta (texto para o parceiro)", tipo: "texto", larga: true },
  { chave: "meta_quantidade", rotulo: "Meta: quantidade", tipo: "numero", ajuda: "Vazio: sem meta medida, só cumprida ou não." },
  { chave: "meta_unidade", rotulo: "Meta: unidade", tipo: "texto", ajuda: "Ex.: usuários ativos, publicação, evento.", visivel: (l) => l.meta_quantidade !== "" && l.meta_quantidade !== null && l.meta_quantidade !== undefined },
  { chave: "meta_prazo_dias", rotulo: "Meta: prazo em dias", tipo: "numero", ajuda: "Nas periódicas, conta a janela dos últimos dias.", visivel: (l) => l.meta_quantidade !== "" && l.meta_quantidade !== null && l.meta_quantidade !== undefined },
  { chave: "meta_modo", rotulo: "Meta: como medir", tipo: "select", opcoes: [
    { valor: "contagem", rotulo: "Contar as comprovações validadas" },
    { valor: "valor", rotulo: "Número informado na última comprovação" },
  ], visivel: (l) => l.meta_quantidade !== "" && l.meta_quantidade !== null && l.meta_quantidade !== undefined },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "ativa", rotulo: "Ativa", tipo: "booleano" },
  { chave: "periodicidade_por_nivel", rotulo: "Periodicidade diferente por nível (JSON; A é Elite, B Premium, C Select; ex.: {\"A\": \"quinzenal\"})", tipo: "json" },
];
const NOVA_CONTRAPARTIDA = {
  nome: "", tipo_parceria: "comercial", periodicidade: "mensal", prazo_inicial_dias: 0, niveis: null,
  natureza_juridica: null, comprovacao: "", meta: null, meta_quantidade: null, meta_unidade: null, meta_prazo_dias: null, meta_modo: "contagem", ordem: 999, ativa: true, periodicidade_por_nivel: {},
};
export function SecaoContrapartidas({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="catalogo_contrapartidas" pk={["id"]} colunas={COL_CONTRAPARTIDAS} novo={NOVA_CONTRAPARTIDA} podeExcluir recolhido
      tituloItem={(l) => `${l.ativa ? "" : "(inativa) "}${l.nome}`} somenteLeitura={somenteLeitura} />
  );
}

const COL_TIPOS_ATIVIDADE: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
  { chave: "minutos", rotulo: "Duração estimada (minutos)", tipo: "numero", obrigatoria: true },
  { chave: "etapa_jornada", rotulo: "Etapa da jornada", tipo: "select", opcoes: op(ETAPAS_JORNADA) },
  { chave: "chave", rotulo: "Chave (opcional)", tipo: "texto", fixaAposCriar: true, ajuda: "Identificador usado pelas rotinas do portal; definido na criação." },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "ativo", rotulo: "Ativo", tipo: "booleano" },
];
const NOVO_TIPO_ATIVIDADE = { nome: "", minutos: 30, etapa_jornada: null, chave: null, ordem: 99, ativo: true };
export function SecaoTiposAtividade({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="tipos_atividade" pk={["id"]} colunas={COL_TIPOS_ATIVIDADE} novo={NOVO_TIPO_ATIVIDADE} podeExcluir
      tituloItem={(l) => `${l.ativo ? "" : "(inativo) "}${l.nome}${l.etapa_jornada ? ` · ${rotulo(ETAPAS_JORNADA, l.etapa_jornada)}` : ""}`}
      somenteLeitura={somenteLeitura} />
  );
}

// Etapas: só nome e ordem; os códigos são fixos porque as regras do banco dependem deles
const COL_ETAPAS: ColunaConfig[] = [
  { chave: "codigo", rotulo: "Código (fixo)", tipo: "texto", somenteLeitura: true },
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero", obrigatoria: true },
];
const FILTRO_FUNIL = { perda: false };
const FILTRO_PERDA = { perda: true };
export function SecaoEtapas({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-semibold">Etapas do funil</h3>
        <TabelaConfig tabela="etapas_funil" pk={["codigo"]} colunas={COL_ETAPAS} filtro={FILTRO_FUNIL} tituloItem={(l) => l.nome} somenteLeitura={somenteLeitura} />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Motivos de perda</h3>
        <TabelaConfig tabela="etapas_funil" pk={["codigo"]} colunas={COL_ETAPAS} filtro={FILTRO_PERDA} tituloItem={(l) => l.nome} somenteLeitura={somenteLeitura} />
      </div>
    </div>
  );
}

const COL_ICP: ColunaConfig[] = [
  { chave: "chave", rotulo: "Chave", tipo: "texto", fixaAposCriar: true, obrigatoria: true, ajuda: "Identificador sem espaços, definido na criação." },
  { chave: "descricao", rotulo: "Descrição", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "ativo", rotulo: "Ativo", tipo: "booleano" },
];
const NOVO_ICP = { chave: "", descricao: "", ordem: 99, ativo: true };
export function SecaoIcp({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="criterios_icp" pk={["id"]} colunas={COL_ICP} novo={NOVO_ICP} podeExcluir
      tituloItem={(l) => l.descricao} somenteLeitura={somenteLeitura} />
  );
}

const COL_FERIADOS: ColunaConfig[] = [
  { chave: "data", rotulo: "Data", tipo: "data", fixaAposCriar: true, obrigatoria: true },
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
];
const NOVO_FERIADO = { data: "", nome: "" };
export function SecaoFeriados({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="feriados" pk={["data"]} ordem="data" colunas={COL_FERIADOS} novo={NOVO_FERIADO} podeExcluir
      tituloItem={(l) => (l.data ? `${l.data.split("-").reverse().join("/")} · ${l.nome}` : l.nome)} somenteLeitura={somenteLeitura} />
  );
}

const COL_TEXTOS: ColunaConfig[] = [
  { chave: "descricao", rotulo: "Uso", tipo: "texto", somenteLeitura: true, larga: true },
  { chave: "assunto", rotulo: "Assunto", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "corpo", rotulo: "Corpo", tipo: "textarea", obrigatoria: true },
];
export function SecaoTextosEmail({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-3">
      <p className="rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Os marcadores ficam entre chaves duplas, como {"{{nome}}"}, e são trocados pelos dados de cada envio. Mantenha os marcadores que já
        existem no texto. Não use travessão nem meia-risca.
      </p>
      <TabelaConfig tabela="textos_email" pk={["chave"]} ordem="chave" colunas={COL_TEXTOS} recolhido
        tituloItem={(l) => l.descricao || l.chave} somenteLeitura={somenteLeitura} />
    </div>
  );
}
