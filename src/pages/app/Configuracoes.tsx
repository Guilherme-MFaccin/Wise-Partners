import type { ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import { NavegacaoSecoes, type Secao } from "@/components/comum/NavegacaoSecoes";
import {
  SecaoContrapartidas, SecaoEmpresas, SecaoEtapas, SecaoFeriados, SecaoIcp, SecaoNiveis, SecaoPacotes, SecaoTextosEmail, SecaoTiposAtividade,
} from "@/components/config/Secoes";
import {
  CHAVES_AGRUPADAS, SecaoAcoesWise, SecaoCruzamento, SecaoCustos, SecaoFase, SecaoIndicadores, SecaoPontos, SecaoRegras, SecaoRegua,
  SecaoRequisitos, SecaoScorecard, SecaoSla,
} from "@/components/config/SecoesV2";
import { CategoriasCampos } from "@/components/config/CategoriasCampos";
import { ModelosContrato } from "@/components/config/ModelosContrato";
import { SecaoMetas } from "@/components/config/Metas";
import { Parametros } from "@/components/config/Parametros";
import { Backup } from "@/components/config/Backup";

// Agrupadas por assunto (regras, metas e medição, operação, sistema). As páginas públicas ficam em Programa, Páginas. `admin`: aba só aparece para administradores (custos e remunerações)
const ABAS: (Secao & { admin?: boolean })[] = [
  { id: "niveis", rotulo: "Níveis e prazos", grupo: "Regras do programa" },
  { id: "requisitos", rotulo: "Requisitos de nível", grupo: "Regras do programa" },
  { id: "empresas", rotulo: "Empresas e comissões", grupo: "Regras do programa" },
  { id: "pacotes", rotulo: "Pacotes", grupo: "Regras do programa" },
  { id: "contrapartidas", rotulo: "Contrapartidas", grupo: "Regras do programa" },
  { id: "sla", rotulo: "SLA e proteção", grupo: "Regras do programa" },
  { id: "pontos", rotulo: "Pontos e premiação", grupo: "Regras do programa" },
  { id: "regras", rotulo: "Regras publicadas", grupo: "Regras do programa" },
  { id: "modelos", rotulo: "Modelos de contrato", grupo: "Regras do programa" },
  { id: "cruzamento", rotulo: "Termo do cruzamento", grupo: "Regras do programa" },
  { id: "fase", rotulo: "Fase do programa", grupo: "Metas e medição" },
  { id: "metas", rotulo: "Metas", grupo: "Metas e medição" },
  { id: "indicadores", rotulo: "Indicadores do painel", grupo: "Metas e medição" },
  { id: "scorecard", rotulo: "Scorecard", grupo: "Metas e medição" },
  { id: "icp", rotulo: "Critérios do ICP", grupo: "Metas e medição" },
  { id: "custos", rotulo: "Custos e remunerações", grupo: "Metas e medição", admin: true },
  { id: "regua", rotulo: "Régua de atendimento", grupo: "Operação" },
  { id: "acoes", rotulo: "Ações da Wise", grupo: "Operação" },
  { id: "etapas", rotulo: "Etapas e motivos de perda", grupo: "Operação" },
  { id: "atividades", rotulo: "Tipos de atividade", grupo: "Operação" },
  { id: "categorias", rotulo: "Categorias e campos", grupo: "Operação" },
  { id: "emails", rotulo: "Textos de e-mail", grupo: "Operação" },
  { id: "feriados", rotulo: "Feriados", grupo: "Operação" },
  { id: "parametros", rotulo: "Parâmetros", grupo: "Operação" },
  { id: "backup", rotulo: "Backup", grupo: "Sistema" },
];

// Regras do programa como dados configuráveis (princípio III). Admin edita; time de parcerias só lê.
// A permissão real está na RLS: só administradores gravam.
export default function Configuracoes() {
  const { isAdmin, isParcerias } = useAuth();
  const [params, setParams] = useSearchParams();
  if (!isParcerias) return <Vazio titulo="Acesso restrito">Só administradores e o time de parcerias acessam as configurações.</Vazio>;
  const leitura = !isAdmin;
  const abas = ABAS.filter((a) => !a.admin || isAdmin);
  const abaParam = params.get("aba");
  // Avisos antigos apontavam para as abas das páginas, que saíram daqui (v3)
  if (abaParam === "landing") return <Navigate to="/app/candidatos" replace />;
  if (abaParam === "landing-cliente") return <Navigate to="/app/diagnosticos" replace />;
  const aba = abas.some((a) => a.id === abaParam) ? abaParam! : "niveis";
  const conteudo: Record<string, ReactNode> = {
    empresas: <SecaoEmpresas somenteLeitura={leitura} />,
    categorias: <CategoriasCampos somenteLeitura={leitura} />,
    niveis: <SecaoNiveis somenteLeitura={leitura} />,
    requisitos: <SecaoRequisitos somenteLeitura={leitura} />,
    scorecard: <SecaoScorecard somenteLeitura={leitura} />,
    pacotes: <SecaoPacotes somenteLeitura={leitura} />,
    contrapartidas: <SecaoContrapartidas somenteLeitura={leitura} />,
    acoes: <SecaoAcoesWise somenteLeitura={leitura} />,
    regua: <SecaoRegua somenteLeitura={leitura} />,
    sla: <SecaoSla somenteLeitura={leitura} />,
    pontos: <SecaoPontos somenteLeitura={leitura} />,
    atividades: <SecaoTiposAtividade somenteLeitura={leitura} />,
    custos: isAdmin ? <SecaoCustos /> : null,
    indicadores: <SecaoIndicadores somenteLeitura={leitura} />,
    metas: <SecaoMetas somenteLeitura={leitura} />,
    fase: <SecaoFase podeDefinir={isAdmin} />,
    regras: <SecaoRegras podePublicar={isAdmin} somenteLeitura={leitura} />,
    etapas: <SecaoEtapas somenteLeitura={leitura} />,
    icp: <SecaoIcp somenteLeitura={leitura} />,
    cruzamento: <SecaoCruzamento somenteLeitura={leitura} />,
    modelos: <ModelosContrato somenteLeitura={leitura} />,
    parametros: <Parametros somenteLeitura={leitura} excluir={CHAVES_AGRUPADAS} />,
    feriados: <SecaoFeriados somenteLeitura={leitura} />,
    emails: <SecaoTextosEmail somenteLeitura={leitura} />,
    backup: <Backup podeExportar={isAdmin} />,
  };

  return (
    <div>
      <Cabecalho titulo="Regras e configurações" descricao={leitura ? "Você pode consultar as regras; só administradores alteram." : "Quais regras o portal aplica sozinho? Níveis, comissão, prazos, metas e a operação do programa."} />
      <p className="mb-4 flex gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        Mudanças de regra valem só para registros novos; os registros existentes mantêm os valores da época.
      </p>
      <NavegacaoSecoes secoes={abas} ativa={aba} onChange={(v) => setParams(v === "niveis" ? {} : { aba: v }, { replace: true })}>
        <div key={aba}>{conteudo[aba]}</div>
      </NavegacaoSecoes>
    </div>
  );
}
