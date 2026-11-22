import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Input } from "@/components/ui/input";
import { CartaoOferta, DialogoPedido, FiltroCategorias } from "@/components/catalogo/Componentes";
import { useAcessoHub, useCatalogo, type OfertaCatalogo } from "@/components/catalogo/dados";

// Catálogo de parceiros (FO-19): ofertas com condição só para membros, de parceiros Elite e de clientes do Grupo Tríade.
export default function Catalogo() {
  const acesso = useAcessoHub();
  const cat = useCatalogo(!!acesso.data?.ver);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pedindo, setPedindo] = useState<OfertaCatalogo | null>(null);
  const lista = useMemo(() => cat.data ?? [], [cat.data]);
  const categorias = useMemo(() => [...new Set(lista.flatMap((o) => (o.categoria ? [o.categoria] : o.categorias.slice(0, 1))))].sort(), [lista]);
  const termo = busca.trim().toLowerCase();
  const visiveis = lista.filter((o) => (!categoria || o.categoria === categoria || o.categorias.includes(categoria))
    && (!termo || `${o.titulo} ${o.descricao} ${o.empresa} ${o.condicao}`.toLowerCase().includes(termo)));

  const cab = <Cabecalho titulo="Catálogo de parceiros" descricao="Que condições especiais as empresas do ecossistema oferecem para você?" />;
  if (acesso.isLoading) return <div>{cab}<Carregando /></div>;
  if (acesso.error) return <div>{cab}<ErroCarga erro={acesso.error} /></div>;
  if (!acesso.data?.ver) {
    return (
      <div>
        {cab}
        <Vazio titulo="O catálogo abre no nível Premium">
          <span className="inline-flex items-start gap-2 text-left"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Sua empresa passa a Premium quando um cliente seu, dentro do perfil, faz o diagnóstico com a Wise. Clientes do Grupo Tríade têm acesso direto.</span>
        </Vazio>
      </div>
    );
  }
  return (
    <div>
      {cab}
      <div className="mb-4 space-y-3">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-300" aria-hidden />
          <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar serviço, produto ou empresa" aria-label="Buscar no catálogo" className="pl-9" />
        </div>
        <FiltroCategorias categorias={categorias} ativa={categoria} aoMudar={setCategoria} />
      </div>
      {cat.isLoading && <Carregando texto="Carregando o catálogo..." />}
      {cat.error && <ErroCarga erro={cat.error} />}
      {cat.isSuccess && visiveis.length === 0 && (
        <Vazio titulo={lista.length ? "Nada com esta busca" : "O catálogo ainda está vazio"}>
          {lista.length ? "Mude a busca ou a categoria." : "As ofertas aparecem aqui depois da validação da Wise."}
        </Vazio>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visiveis.map((o) => <CartaoOferta key={o.oferta_id} o={o} aoPedir={setPedindo} />)}
      </div>
      <DialogoPedido oferta={pedindo} fechar={() => setPedindo(null)} />
    </div>
  );
}
