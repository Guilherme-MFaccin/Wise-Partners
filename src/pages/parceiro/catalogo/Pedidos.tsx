import { useState } from "react";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { RESULTADOS, contatoDoPedido, useAcessoHub, useMarcarPedido, usePedidos, type Pedido } from "@/components/catalogo/dados";
import { dataHora, somenteDigitos } from "@/lib/formato";
import { toastErro } from "@/lib/erros";

// Pedidos do catálogo: os que a empresa recebeu (com o contato de quem pediu) e os que ela fez. Protocolo, sem etapas.
export default function Pedidos() {
  const { perfil } = useAuth();
  const pid = perfil?.parceiro_id ?? null;
  const acesso = useAcessoHub();
  const recebidos = usePedidos({ ofertanteId: pid });
  const feitos = usePedidos({ solicitanteId: pid });
  return (
    <div className="space-y-8">
      <Cabecalho titulo="Pedidos do catálogo" descricao="Quem pediu as suas condições e quais condições a sua empresa pediu?" />
      {acesso.data?.ofertar && (
        <section aria-labelledby="recebidos">
          <h2 id="recebidos" className="mb-3 font-semibold">Recebidos</h2>
          {recebidos.isLoading ? <Carregando /> : recebidos.error ? <ErroCarga erro={recebidos.error} /> : (recebidos.data ?? []).length === 0
            ? <Vazio titulo="Nenhum pedido recebido">Quando alguém pedir uma condição sua, o contato aparece aqui e você recebe um aviso.</Vazio>
            : <ul className="space-y-3">{recebidos.data!.map((p) => <Recebido key={p.id} p={p} />)}</ul>}
        </section>
      )}
      <section aria-labelledby="feitos">
        <h2 id="feitos" className="mb-3 font-semibold">Feitos pela sua empresa</h2>
        {feitos.isLoading ? <Carregando /> : feitos.error ? <ErroCarga erro={feitos.error} /> : (feitos.data ?? []).length === 0
          ? <Vazio titulo="Nenhum pedido feito">Peça uma condição no catálogo e o protocolo aparece aqui.</Vazio>
          : (
            <ul className="divide-y divide-white/10 rounded-[14px] border border-white/10 bg-card">
              {feitos.data!.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{p.titulo_oferta} <span className="text-neutro-300">· {p.ofertante_nome || p.ofertante?.nome_fantasia}</span></p>
                    <p className="text-xs text-neutro-300"><span className="font-mono">{p.protocolo}</span> · {dataHora(p.created_at)} · {p.condicao}</p>
                  </div>
                  <Pilula tom={p.resultado === "fechado" ? "menta" : "neutro"} className="self-start">{RESULTADOS[p.resultado]}</Pilula>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  );
}

function Recebido({ p }: { p: Pedido }) {
  const marcar = useMarcarPedido();
  const [contato, setContato] = useState<Awaited<ReturnType<typeof contatoDoPedido>> | undefined>(undefined);
  const [carregando, setCarregando] = useState(false);
  async function verContato() {
    setCarregando(true);
    try { setContato(await contatoDoPedido(p.id)); } catch (e) { toastErro(e); } finally { setCarregando(false); }
  }
  const fone = somenteDigitos(contato?.telefone ?? "");
  return (
    <li className="rounded-[14px] border border-white/10 bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{p.solicitante_nome || p.solicitante?.nome_fantasia} pediu: {p.titulo_oferta}</p>
          <p className="text-xs text-neutro-300"><span className="font-mono">{p.protocolo}</span> · {dataHora(p.created_at)}</p>
          {p.mensagem && <p className="mt-2 text-sm">"{p.mensagem}"</p>}
        </div>
        <Pilula tom={p.resultado === "fechado" ? "menta" : "neutro"} className="self-start">{RESULTADOS[p.resultado]}</Pilula>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {contato === undefined ? (
          <Button size="sm" variant="outline" disabled={carregando} onClick={verContato}>{carregando && <Loader2 className="animate-spin" />}Ver o contato</Button>
        ) : contato ? (
          <>
            <span className="text-sm">{contato.nome ?? "Contato"}</span>
            {contato.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${contato.email}`}><Mail /> {contato.email}</a></Button>}
            {fone && <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${fone.length <= 11 ? "55" + fone : fone}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>}
            {contato.telefone && !fone && <span className="inline-flex items-center gap-1 text-sm"><Phone className="h-4 w-4" />{contato.telefone}</span>}
          </>
        ) : <span className="text-sm text-neutro-300">Contato indisponível.</span>}
        <span className="ml-auto flex gap-2">
          <Button size="sm" variant={p.resultado === "fechado" ? "default" : "outline"} disabled={marcar.isPending} onClick={() => marcar.mutate({ id: p.id, resultado: p.resultado === "fechado" ? "enviado" : "fechado" })}>Fechou negócio</Button>
          <Button size="sm" variant={p.resultado === "nao_avancou" ? "default" : "ghost"} disabled={marcar.isPending} onClick={() => marcar.mutate({ id: p.id, resultado: p.resultado === "nao_avancou" ? "enviado" : "nao_avancou" })}>Não avançou</Button>
        </span>
      </div>
    </li>
  );
}
