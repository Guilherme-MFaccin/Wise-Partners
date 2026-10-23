import { Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import {
  SecaoContrapartidas, SecaoEmpresas, SecaoEtapas, SecaoFeriados, SecaoIcp, SecaoNiveis, SecaoPacotes, SecaoTextosEmail, SecaoTiposAtividade,
} from "@/components/config/Secoes";
import { CategoriasCampos } from "@/components/config/CategoriasCampos";
import { ModelosContrato } from "@/components/config/ModelosContrato";
import { Parametros } from "@/components/config/Parametros";
import { Backup } from "@/components/config/Backup";

const ABAS = [
  { id: "empresas", rotulo: "Empresas e comissões" },
  { id: "categorias", rotulo: "Categorias e campos" },
  { id: "niveis", rotulo: "Níveis e prazos" },
  { id: "pacotes", rotulo: "Pacotes" },
  { id: "contrapartidas", rotulo: "Contrapartidas" },
  { id: "atividades", rotulo: "Tipos de atividade" },
  { id: "etapas", rotulo: "Etapas e motivos de perda" },
  { id: "icp", rotulo: "Critérios do ICP" },
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
  if (!isParcerias) return <Vazio titulo="Acesso restrito">Só administradores e o time de parcerias acessam as configurações.</Vazio>;
  const leitura = !isAdmin;

  return (
    <div>
      <Cabecalho titulo="Configurações" descricao={leitura ? "Você pode consultar as regras; só administradores alteram." : "Regras do programa Wise Partners."} />
      <p className="mb-4 flex gap-2 rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        Mudanças de regra valem só para registros novos; os registros existentes mantêm os valores da época.
      </p>
      <Tabs defaultValue="empresas">
        <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1">
          {ABAS.map((a) => <TabsTrigger key={a.id} value={a.id}>{a.rotulo}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="empresas"><SecaoEmpresas somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="categorias"><CategoriasCampos somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="niveis"><SecaoNiveis somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="pacotes"><SecaoPacotes somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="contrapartidas"><SecaoContrapartidas somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="atividades"><SecaoTiposAtividade somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="etapas"><SecaoEtapas somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="icp"><SecaoIcp somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="modelos"><ModelosContrato somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="parametros"><Parametros somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="feriados"><SecaoFeriados somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="emails"><SecaoTextosEmail somenteLeitura={leitura} /></TabsContent>
        <TabsContent value="backup"><Backup podeExportar={isAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}
