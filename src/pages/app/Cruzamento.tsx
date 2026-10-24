import { useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BaseWise } from "@/components/cruzamento/BaseWise";
import { ListaCoincidencias } from "@/components/cruzamento/ListaCoincidencias";
import { ListaCruzamentos } from "@/components/cruzamento/ListaCruzamentos";

type Aba = "coincidencias" | "base" | "cruzamentos";

// Cruzamento de carteiras: base da Wise (admin importa), coincidências e cruzamentos (admin e parcerias).
export default function Cruzamento() {
  const { isParcerias, perfil } = useAuth();
  const [params, setParams] = useSearchParams();
  if (perfil && !isParcerias) {
    return (
      <div>
        <Cabecalho titulo="Cruzamento de carteiras" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> O cruzamento de carteiras é visível só a administradores e ao time de parcerias.</span>
        </Vazio>
      </div>
    );
  }
  const p = params.get("aba");
  const aba: Aba = p === "base" || p === "cruzamentos" ? p : "coincidencias";

  return (
    <div>
      <Cabecalho
        titulo="Cruzamento de carteiras"
        descricao="Base da Wise, coincidências com as carteiras dos parceiros e decisões caso a caso. Coincidências que não viram indicação nem ação são apagadas em 180 dias."
      />
      <Tabs
        value={aba}
        onValueChange={(v) => {
          const n = new URLSearchParams(params);
          if (v === "coincidencias") n.delete("aba");
          else n.set("aba", v);
          setParams(n, { replace: true });
        }}
        className="mb-4"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="coincidencias">Coincidências</TabsTrigger>
          <TabsTrigger value="base">Base da Wise</TabsTrigger>
          <TabsTrigger value="cruzamentos">Cruzamentos</TabsTrigger>
        </TabsList>
      </Tabs>
      {aba === "coincidencias" && <ListaCoincidencias />}
      {aba === "base" && <BaseWise />}
      {aba === "cruzamentos" && <ListaCruzamentos />}
    </div>
  );
}
