import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ETAPAS_PERDA } from "@/lib/rotulos";
import { NavegacaoSecoes } from "@/components/comum/NavegacaoSecoes";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { AbaContrato } from "@/components/contrato/AbaContrato";
import { leInterno, useParceiro } from "@/components/parceiros/dados";
import { CabecalhoFicha } from "@/components/parceiros/ficha/CabecalhoFicha";
import { CategoriasParceiro, DadosEmpresa } from "@/components/parceiros/ficha/DadosEmpresa";
import {
  Classificacao, DadosInternos, InstrumentoParceiro, ResumoAtividades, StatusAtividade, useInterno,
} from "@/components/parceiros/ficha/Classificacao";
import { AbaPerfil } from "@/components/parceiros/ficha/AbaPerfil";
import { AbaFichaApresentacao } from "@/components/parceiros/ficha/AbaFichaApresentacao";
import { AbaContatos } from "@/components/parceiros/ficha/AbaContatos";
import { AbaLinhaTempo } from "@/components/parceiros/ficha/AbaLinhaTempo";
import { AbaContrapartidas } from "@/components/parceiros/ficha/AbaContrapartidas";
import { AbaIndicacoes } from "@/components/parceiros/ficha/AbaIndicacoes";
import { AbaDocumentos } from "@/components/parceiros/ficha/AbaDocumentos";
import { AbaNossaParceria } from "@/components/parceiros/ficha/AbaNossaParceria";
import { AbaScorecard } from "@/components/parceiros/ficha/AbaScorecard";
import { AbaNivel } from "@/components/parceiros/ficha/AbaNivel";
import { AbaOnboarding } from "@/components/parceiros/ficha/AbaOnboarding";
import { AbaAcoesConjuntas } from "@/components/parceiros/ficha/AbaAcoesConjuntas";
import { AbaMaturidade } from "@/components/parceiros/ficha/AbaMaturidade";
import { AbaDesligamento, useFluxosDesligamento } from "@/components/parceiros/ficha/AbaDesligamento";
import { PAPEIS_V2 } from "@/components/parceiros/ficha/v2";

type Aba = { valor: string; rotulo: string; fixa?: boolean; papeis?: string[]; mostrar?: boolean };

// Abas por papel, em ordem alfabética na navegação (Visão geral fixa no topo): a RLS devolve vazio para o que o papel não lê; aqui só evitamos abas vazias.
// v2: a matriz de acesso (briefing técnico, seção 5) está em PAPEIS_V2; "mostrar" depende do parceiro.
function abasDoParceiro(p: { tipo_parceria: string; data_assinatura: string | null; etapa: string }, temFluxo: boolean, isAdmin: boolean): Aba[] {
  const comercial = p.tipo_parceria === "comercial";
  const assinado = !!p.data_assinatura && !ETAPAS_PERDA.includes(p.etapa);
  return [
    { valor: "visao", rotulo: "Visão geral", fixa: true },
    { valor: "perfil", rotulo: "Perfil e categoria", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "nossa-parceria", rotulo: "Nossa parceria", papeis: PAPEIS_V2.nossaParceria },
    { valor: "ficha", rotulo: "Ficha de apresentação", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "contatos", rotulo: "Contatos", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "linha-do-tempo", rotulo: "Linha do tempo", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "scorecard", rotulo: "Scorecard", papeis: PAPEIS_V2.scorecard, mostrar: comercial },
    { valor: "contrato", rotulo: "Negociação e contrato", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "nivel", rotulo: "Nível e revisões", papeis: PAPEIS_V2.nivel, mostrar: comercial && !!p.data_assinatura },
    { valor: "onboarding", rotulo: "Onboarding", papeis: PAPEIS_V2.onboarding, mostrar: comercial },
    { valor: "acoes", rotulo: "Ações conjuntas", papeis: PAPEIS_V2.acoes, mostrar: !!p.data_assinatura },
    { valor: "contrapartidas", rotulo: "Contrapartidas", papeis: ["admin", "parcerias", "consultor"] },
    { valor: "indicacoes", rotulo: "Indicações" },
    { valor: "maturidade", rotulo: "Maturidade", papeis: PAPEIS_V2.maturidade },
    { valor: "documentos", rotulo: "Documentos", papeis: ["admin", "parcerias", "consultor", "comercial"] },
    { valor: "desligamento", rotulo: "Desligamento", papeis: PAPEIS_V2.desligamento, mostrar: temFluxo || (isAdmin && assinado) },
  ];
}

// Ficha do parceiro (histórias 1, 2, 5 e 10). Aceita ?aba= para abrir uma aba.
export default function FichaParceiro() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { perfil, veComissao, isAdmin, isParcerias } = useAuth();
  const papel = perfil?.papel ?? "";
  const q = useParceiro(id);
  const interno = useInterno(id, leInterno(papel));
  const fluxos = useFluxosDesligamento(id, isParcerias && !!id);

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const p = q.data;
  if (!p) return <Vazio titulo="Parceiro não encontrado.">Ele pode ter sido excluído ou você não tem acesso a esta ficha.</Vazio>;

  const abas = abasDoParceiro(p, (fluxos.data?.length ?? 0) > 0, isAdmin)
    .filter((a) => (!a.papeis || a.papeis.includes(papel)) && a.mostrar !== false);
  const pedida = params.get("aba") ?? "";
  const aba = abas.some((a) => a.valor === pedida) ? pedida : "visao";

  return (
    <div className="min-w-0">
      <CabecalhoFicha parceiro={p} estrategico={!!interno.data?.estrategico} />
      <NavegacaoSecoes rotulo="abas" secoes={abas.map((a) => ({ id: a.valor, rotulo: a.rotulo, fixa: a.fixa }))} ativa={aba}
        onChange={(v) => setParams({ aba: v }, { replace: true })}>
        {aba === "visao" && (
          <div className="space-y-4">
            <div className="grid gap-4 2xl:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <DadosEmpresa parceiro={p} />
                <CategoriasParceiro parceiro={p} />
              </div>
              <div className="min-w-0 space-y-4">
                <Classificacao parceiro={p} />
                <StatusAtividade parceiro={p} />
                {leInterno(papel) && <ResumoAtividades parceiroId={p.id} />}
              </div>
            </div>
            {leInterno(papel) && <DadosInternos parceiroId={p.id} />}
            {veComissao && <InstrumentoParceiro parceiroId={p.id} />}
          </div>
        )}
        {aba === "perfil" && <AbaPerfil parceiro={p} />}
        {aba === "ficha" && <AbaFichaApresentacao parceiro={p} />}
        {aba === "contatos" && <AbaContatos parceiroId={p.id} />}
        {aba === "linha-do-tempo" && <AbaLinhaTempo parceiro={p} />}
        {aba === "contrato" && <AbaContrato parceiroId={p.id} />}
        {aba === "contrapartidas" && <AbaContrapartidas parceiroId={p.id} />}
        {aba === "indicacoes" && <AbaIndicacoes parceiroId={p.id} />}
        {aba === "documentos" && <AbaDocumentos parceiro={p} />}
        {aba === "nossa-parceria" && <AbaNossaParceria parceiro={p} />}
        {aba === "scorecard" && <AbaScorecard parceiro={p} />}
        {aba === "nivel" && <AbaNivel parceiro={p} />}
        {aba === "onboarding" && <AbaOnboarding parceiro={p} />}
        {aba === "acoes" && <AbaAcoesConjuntas parceiroId={p.id} />}
        {aba === "maturidade" && <AbaMaturidade parceiroId={p.id} />}
        {aba === "desligamento" && <AbaDesligamento parceiro={p} />}
      </NavegacaoSecoes>
    </div>
  );
}
