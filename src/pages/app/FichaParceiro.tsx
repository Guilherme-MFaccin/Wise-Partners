import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Aba = { valor: string; rotulo: string; papeis?: string[] };

// Abas por papel: a RLS devolve vazio para o que o papel não lê; aqui só evitamos abas vazias.
const ABAS: Aba[] = [
  { valor: "visao", rotulo: "Visão geral" },
  { valor: "perfil", rotulo: "Perfil e categoria", papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { valor: "ficha", rotulo: "Ficha de apresentação", papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { valor: "contatos", rotulo: "Contatos", papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { valor: "linha-do-tempo", rotulo: "Linha do tempo", papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { valor: "contrato", rotulo: "Negociação e contrato", papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { valor: "contrapartidas", rotulo: "Contrapartidas", papeis: ["admin", "parcerias", "consultor"] },
  { valor: "indicacoes", rotulo: "Indicações" },
  { valor: "documentos", rotulo: "Documentos", papeis: ["admin", "parcerias", "consultor", "comercial"] },
];

// Ficha do parceiro (histórias 1, 2, 5 e 10). Aceita ?aba= para abrir uma aba.
export default function FichaParceiro() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const { perfil, veComissao } = useAuth();
  const papel = perfil?.papel ?? "";
  const q = useParceiro(id);
  const interno = useInterno(id, leInterno(papel));

  const abas = ABAS.filter((a) => !a.papeis || a.papeis.includes(papel));
  const pedida = params.get("aba") ?? "";
  const aba = abas.some((a) => a.valor === pedida) ? pedida : "visao";

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const p = q.data;
  if (!p) return <Vazio titulo="Parceiro não encontrado.">Ele pode ter sido excluído ou você não tem acesso a esta ficha.</Vazio>;

  return (
    <div className="min-w-0">
      <CabecalhoFicha parceiro={p} estrategico={!!interno.data?.estrategico} />
      <Tabs value={aba} onValueChange={(v) => setParams({ aba: v }, { replace: true })}>
        <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1">
          {abas.map((a) => <TabsTrigger key={a.valor} value={a.valor}>{a.rotulo}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
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
        </TabsContent>
        <TabsContent value="perfil"><AbaPerfil parceiro={p} /></TabsContent>
        <TabsContent value="ficha"><AbaFichaApresentacao parceiro={p} /></TabsContent>
        <TabsContent value="contatos"><AbaContatos parceiroId={p.id} /></TabsContent>
        <TabsContent value="linha-do-tempo"><AbaLinhaTempo parceiro={p} /></TabsContent>
        <TabsContent value="contrato"><AbaContrato parceiroId={p.id} /></TabsContent>
        <TabsContent value="contrapartidas"><AbaContrapartidas parceiroId={p.id} /></TabsContent>
        <TabsContent value="indicacoes"><AbaIndicacoes parceiroId={p.id} /></TabsContent>
        <TabsContent value="documentos"><AbaDocumentos parceiro={p} /></TabsContent>
      </Tabs>
    </div>
  );
}
