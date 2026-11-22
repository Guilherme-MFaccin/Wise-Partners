import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { RESULTADOS, usePedidos } from "@/components/catalogo/dados";
import { dataHora } from "@/lib/formato";

// Pedidos do catálogo (todos), para a Wise medir o que o hub gera e saber onde cabe comissão (opcional, FO-19)
export default function PedidosCatalogo() {
  const q = usePedidos();
  const lista = q.data ?? [];
  const fechados = lista.filter((p) => p.resultado === "fechado").length;
  return (
    <div>
      <Cabecalho titulo="Pedidos do catálogo" descricao={`Quem pediu o quê a quem, e o que virou negócio? ${q.isSuccess ? `${lista.length} pedidos, ${fechados} fechados.` : ""}`} />
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && lista.length === 0 && <Vazio titulo="Nenhum pedido ainda">Os pedidos aparecem aqui quando um membro pede uma condição.</Vazio>}
      {lista.length > 0 && (
        <div className="overflow-x-auto rounded-[14px] border border-white/10 bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Pedidos do catálogo</caption>
            <thead className="border-b border-white/10 text-xs text-neutro-300">
              <tr>{["Protocolo", "Quando", "Quem pediu", "Quem oferece", "Oferta e condição", "Resultado"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {lista.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.protocolo}</td>
                  <td className="px-4 py-3 text-neutro-300">{dataHora(p.created_at)}</td>
                  <td className="px-4 py-3">{p.solicitante_nome || p.solicitante?.nome_fantasia}</td>
                  <td className="px-4 py-3">{p.ofertante_nome || p.ofertante?.nome_fantasia}</td>
                  <td className="px-4 py-3"><span className="font-medium">{p.titulo_oferta}</span><span className="block text-xs text-menta-300">{p.condicao}</span></td>
                  <td className="px-4 py-3"><Pilula tom={p.resultado === "fechado" ? "menta" : "neutro"}>{RESULTADOS[p.resultado]}</Pilula></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
