import { MousePointerClick } from "lucide-react";
import { data } from "@/lib/formato";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { useMeusRfps } from "@/components/portal/dados";

// Pedidos de RFP em que a empresa foi apresentada (meus_rfps nunca devolve os outros parceiros do pedido)
export default function Rfps() {
  const { data: lista = [], isLoading, error } = useMeusRfps();
  return (
    <div>
      <Cabecalho titulo="Pedidos de RFP" descricao="Clientes da Wise para os quais a sua empresa foi apresentada como opção." />
      {isLoading ? <Carregando /> : error ? <ErroCarga erro={error} /> : lista.length === 0 ? (
        <Vazio titulo="Nenhum pedido ainda">Quando a Wise apresentar a sua empresa a um cliente, o pedido aparece aqui.</Vazio>
      ) : (
        <ul className="grid gap-3">
          {[...lista].sort((a, b) => (b.publicada_em ?? "").localeCompare(a.publicada_em ?? "")).map((r) => (
            <li key={r.pedido_id} className="rounded-[14px] border border-white/10 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{r.cliente_nome}</p>
                  <p className="text-sm text-muted-foreground">{data(r.publicada_em)}</p>
                </div>
              </div>
              {r.necessidade_resumida && <p className="mt-2 text-sm">Necessidade: {r.necessidade_resumida}</p>}
              {r.cliques > 0 ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-menta-400">
                  <MousePointerClick className="h-4 w-4" /> O cliente clicou para falar com vocês
                  {r.cliques > 1 && ` (${r.cliques} vezes)`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">O cliente ainda não clicou para falar com vocês.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
