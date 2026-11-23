// Páginas públicas: a da Comunidade Wise Partners (/comunidade), a dos parceiros (/parceiros) e a do cliente do parceiro (/c/:codigo).
// Pergunta que a tela responde: "O que as empresas, os parceiros e os clientes deles veem nas páginas públicas, e está tudo no ar?"
// O administrador edita textos, seções, perguntas, vídeo, valores, perfil da reunião, cases, textos legais e medição.
// O time de parcerias só consulta. A RLS é a fronteira: só administradores gravam.
import { useSearchParams } from "react-router-dom";
import { Info, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbaCliente, AbaComunidade, AbaParceiros } from "@/components/paginas/AbaPagina";
import { AbaCases } from "@/components/paginas/AbaCases";
import { AbaMedicao, AbaTextosLegais } from "@/components/paginas/AbaConfig";
import { useConfigCliente, useConfigComunidade, useConfigParceiros } from "@/components/paginas/dados";

const ABAS = [
  { id: "comunidade", rotulo: "Comunidade" },
  { id: "parceiros", rotulo: "Página dos parceiros" },
  { id: "cliente", rotulo: "Página do cliente" },
  { id: "cases", rotulo: "Cases" },
  { id: "legais", rotulo: "Textos legais" },
  { id: "medicao", rotulo: "Medição" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

const TITULO = "Páginas públicas";
const PERGUNTA = "O que as empresas, os parceiros e os clientes deles veem nas páginas públicas, e está tudo no ar?";

// Situação das duas páginas no cabeçalho: no ar ou fora do ar
function SituacaoPaginas() {
  const p = useConfigParceiros();
  const c = useConfigCliente();
  const m = useConfigComunidade();
  const item = (rotulo: string, publicada: boolean | undefined, carregando: boolean) => (
    <span className="flex items-center gap-2 text-sm text-neutro-300">
      {rotulo}
      {carregando ? <span className="h-5 w-16 rounded-full bg-white/10 motion-safe:animate-pulse" aria-label="Carregando" />
        : publicada === undefined ? <Pilula>Sem dados</Pilula>
        : <Pilula tom={publicada ? "menta" : "alerta"}>{publicada ? "No ar" : "Fora do ar"}</Pilula>}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2" aria-live="polite">
      {item("Comunidade", m.data?.publicada, m.isLoading)}
      {item("Parceiros", p.data?.publicada, p.isLoading)}
      {item("Cliente", c.data?.publicada, c.isLoading)}
    </div>
  );
}

export default function Paginas() {
  const { isAdmin, isParcerias, carregando } = useAuth();
  const [params, setParams] = useSearchParams();
  if (carregando) return <Carregando />;
  if (!isParcerias) {
    return (
      <div>
        <Cabecalho titulo={TITULO} descricao={PERGUNTA} />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" aria-hidden /> As páginas públicas são geridas pelo administrador do programa.</span>
        </Vazio>
      </div>
    );
  }
  const leitura = !isAdmin;
  const abaParam = params.get("aba");
  const aba: Aba = ABAS.some((a) => a.id === abaParam) ? (abaParam as Aba) : "comunidade";

  return (
    <div className="min-w-0">
      <Cabecalho titulo={TITULO} descricao={PERGUNTA} acoes={<SituacaoPaginas />} />
      {leitura && (
        <p className="mb-4 flex gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutro-300" aria-hidden />
          Você pode consultar tudo; só administradores alteram as páginas.
        </p>
      )}
      <Tabs value={aba} onValueChange={(v) => setParams(v === "comunidade" ? {} : { aba: v }, { replace: true })}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <TabsList className="mb-4 h-auto w-max">
            {ABAS.map((a) => <TabsTrigger key={a.id} value={a.id}>{a.rotulo}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value="comunidade" className="mt-0"><AbaComunidade desligado={leitura} /></TabsContent>
        <TabsContent value="parceiros" className="mt-0"><AbaParceiros desligado={leitura} /></TabsContent>
        <TabsContent value="cliente" className="mt-0"><AbaCliente desligado={leitura} /></TabsContent>
        <TabsContent value="cases" className="mt-0"><AbaCases desligado={leitura} /></TabsContent>
        <TabsContent value="legais" className="mt-0"><AbaTextosLegais desligado={leitura} /></TabsContent>
        <TabsContent value="medicao" className="mt-0"><AbaMedicao desligado={leitura} /></TabsContent>
      </Tabs>
    </div>
  );
}
