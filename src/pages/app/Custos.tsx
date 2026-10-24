import { Link, useSearchParams } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustosDiretos } from "@/components/gestao/CustosDiretos";
import { PlanilhaCustos } from "@/components/gestao/PlanilhaCustos";
import { Remuneracoes } from "@/components/gestao/Remuneracoes";
import { AcessoRestrito } from "@/components/gestao/Restrito";

const ABAS = ["planilha", "diretos", "remuneracoes"] as const;
type Aba = (typeof ABAS)[number];

// Custos do canal (História 2): planilha, custos diretos e remunerações. Só administradores (RLS e funções do banco).
export default function Custos() {
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const abaParam = params.get("aba") as Aba | null;
  const aba: Aba = abaParam && ABAS.includes(abaParam) ? abaParam : "planilha";
  if (!isAdmin) return <AcessoRestrito titulo="Custos" texto="Remunerações, custo-hora e custos do canal são visíveis só para administradores." />;

  return (
    <div>
      <Cabecalho
        titulo="Custos do canal"
        descricao="Horas com o custo da época, comissões, custos diretos e remunerações de referência."
        acoes={<Button variant="outline" asChild><Link to="/app/resultado"><TrendingUp /> Resultado do canal</Link></Button>}
      />
      <Tabs value={aba} onValueChange={(v) => setParams(v === "planilha" ? {} : { aba: v }, { replace: true })}>
        <TabsList className="mb-4 h-auto flex-wrap">
          <TabsTrigger value="planilha">Planilha de custos</TabsTrigger>
          <TabsTrigger value="diretos">Custos diretos</TabsTrigger>
          <TabsTrigger value="remuneracoes">Remunerações</TabsTrigger>
        </TabsList>
        <TabsContent value="planilha"><PlanilhaCustos /></TabsContent>
        <TabsContent value="diretos"><CustosDiretos /></TabsContent>
        <TabsContent value="remuneracoes"><Remuneracoes /></TabsContent>
      </Tabs>
    </div>
  );
}
