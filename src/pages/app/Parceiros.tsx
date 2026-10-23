import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { NovoParceiroDialog } from "@/components/parceiros/NovoParceiroDialog";
import { VisaoCategorias } from "@/components/parceiros/VisaoCategorias";
import { QuadroFunil } from "@/components/parceiros/QuadroFunil";
import { ListaParceiros } from "@/components/parceiros/ListaParceiros";
import { useCarteira, useCategorias, useEtapas, usePerfis } from "@/components/parceiros/dados";

const VISTAS = ["categorias", "funil", "lista"];

// Carteira de parceiros (história 1): por categoria, funil e lista com filtros.
export default function Parceiros() {
  const { isParcerias } = useAuth();
  const [params, setParams] = useSearchParams();
  // ?etapa= e ?categoria= (links do painel) abrem a lista já filtrada
  const etapaLink = params.get("etapa");
  const categoriaLink = params.get("categoria");
  const vista = VISTAS.includes(params.get("vista") ?? "")
    ? params.get("vista")!
    : etapaLink || categoriaLink ? "lista" : "categorias";
  const [novo, setNovo] = useState(false);

  const { parceiros, vinculos, contatos, passos } = useCarteira();
  const categorias = useCategorias();
  const etapas = useEtapas();
  const perfis = usePerfis();

  const carregando = parceiros.isLoading || vinculos.isLoading || categorias.isLoading || etapas.isLoading;
  const erro = parceiros.error || vinculos.error || categorias.error || etapas.error;

  return (
    <div>
      <Cabecalho
        titulo="Parceiros"
        descricao="Carteira organizada por categoria de prateleira. A estrela marca a categoria principal de cada parceiro."
        acoes={isParcerias && <Button onClick={() => setNovo(true)}><Plus /> Novo parceiro</Button>}
      />

      {erro ? (
        <ErroCarga erro={erro} />
      ) : carregando ? (
        <Carregando />
      ) : (
        <Tabs value={vista} onValueChange={(v) => setParams((atual) => {
          const n = new URLSearchParams(atual);
          n.set("vista", v);
          return n;
        }, { replace: true })}>
          <TabsList className="mb-4">
            <TabsTrigger value="categorias">Por categoria</TabsTrigger>
            <TabsTrigger value="funil">Funil</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
          <TabsContent value="categorias">
            <VisaoCategorias parceiros={parceiros.data ?? []} vinculos={vinculos.data ?? []} categorias={categorias.data ?? []} etapas={etapas.data ?? []} />
          </TabsContent>
          <TabsContent value="funil">
            <QuadroFunil parceiros={parceiros.data ?? []} etapas={etapas.data ?? []} vinculos={vinculos.data ?? []}
              categorias={categorias.data ?? []} passos={passos.data ?? []} podeEditar={isParcerias} />
          </TabsContent>
          <TabsContent value="lista">
            <ListaParceiros parceiros={parceiros.data ?? []} vinculos={vinculos.data ?? []} categorias={categorias.data ?? []}
              etapas={etapas.data ?? []} perfis={perfis.data ?? []} contatos={contatos.data ?? []}
              filtroInicial={{
                etapa: etapas.data?.some((e) => e.codigo === etapaLink) ? etapaLink : null,
                categoria: categorias.data?.some((c) => c.id === categoriaLink) ? categoriaLink : null,
              }} />
          </TabsContent>
        </Tabs>
      )}

      {isParcerias && <NovoParceiroDialog aberto={novo} onOpenChange={setNovo} />}
    </div>
  );
}
