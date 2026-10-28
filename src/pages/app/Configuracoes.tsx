import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Parametros } from "@/components/config/Parametros";
import { Backup } from "@/components/config/Backup";

// Ordem alfabética na navegação (NavegacaoSecoes). `admin`: aba só aparece para administradores (custos e remunerações)
const ABAS: (Secao & { admin?: boolean })[] = [
  { id: "empresas", rotulo: "Empresas e comissões" },
  { id: "categorias", rotulo: "Categorias e campos" },
  { id: "niveis", rotulo: "Níveis e prazos" },
  { id: "requisitos", rotulo: "Requisitos de nível" },
  { id: "scorecard", rotulo: "Scorecard" },
  { id: "pacotes", rotulo: "Pacotes" },
  { id: "contrapartidas", rotulo: "Contrapartidas" },
  { id: "acoes", rotulo: "Ações da Wise" },
  { id: "regua", rotulo: "Régua de atendimento" },
  { id: "sla", rotulo: "SLA e proteção" },
  { id: "pontos", rotulo: "Pontos e premiação" },
  { id: "atividades", rotulo: "Tipos de atividade" },
  { id: "custos", rotulo: "Custos e remunerações", admin: true },
  { id: "indicadores", rotulo: "Indicadores e metas" },
  { id: "fase", rotulo: "Fase do programa" },
  { id: "regras", rotulo: "Regras publicadas" },
  { id: "etapas", rotulo: "Etapas e motivos de perda" },
  { id: "icp", rotulo: "Critérios do ICP" },
  { id: "cruzamento", rotulo: "Termo do cruzamento" },
  { id: "modelos", rotulo: "Modelos de contrato" },
  { id: "parametros", rotulo: "Parâmetros" },
  { id: "feriados", rotulo: "Feriados" },
  { id: "emails", rotulo: "Textos de e-mail" },
  { id: "backup", rotulo: "Backup" },
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
  const aba = abas.some((a) => a.id === abaParam) ? abaParam! : "empresas";
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
      <Cabecalho titulo="Configurações" descricao={leitura ? "Você pode consultar as regras; só administradores alteram." : "Regras do programa Wise Partners."} />
      <p className="mb-4 flex gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        Mudanças de regra valem só para registros novos; os registros existentes mantêm os valores da época.
      </p>
      <NavegacaoSecoes secoes={abas} ativa={aba} onChange={(v) => setParams(v === "empresas" ? {} : { aba: v }, { replace: true })}>
        <div key={aba}>{conteudo[aba]}</div>
      </NavegacaoSecoes>
    </div>
  );
}
