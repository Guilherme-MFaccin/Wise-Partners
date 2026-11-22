import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Pause, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADOS_OFERTA, useOfertas, useSalvarOferta, type Oferta } from "@/components/catalogo/dados";
import { data } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Ofertas do catálogo (P-86 e P-58): a Wise valida o que entra; quem oferece não publica sozinho.
const VISOES = [
  { id: "validar", rotulo: "Para validar", estados: ["em_validacao"] as Oferta["estado"][] },
  { id: "publicadas", rotulo: "Publicadas", estados: ["publicada"] as Oferta["estado"][] },
  { id: "outras", rotulo: "Pausadas e recusadas", estados: ["pausada", "recusada", "rascunho"] as Oferta["estado"][] },
];

export default function OfertasCatalogo() {
  const { isParcerias } = useAuth();
  const [params, setParams] = useSearchParams();
  const visao = VISOES.find((v) => v.id === params.get("aba")) ?? VISOES[0];
  const q = useOfertas({ estados: visao.estados });
  const lista = q.data ?? [];
  return (
    <div>
      <Cabecalho titulo="Ofertas do catálogo" descricao="Que ofertas esperam a validação da Wise e o que já está no ar para os membros?" />
      <div role="tablist" aria-label="Situação das ofertas" className="mb-5 flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-white/10 bg-card p-1">
        {VISOES.map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={visao.id === v.id} onClick={() => setParams({ aba: v.id }, { replace: true })}
            className={cn("min-h-9 shrink-0 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", visao.id === v.id && "bg-white/10 text-white")}>{v.rotulo}</button>
        ))}
      </div>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && lista.length === 0 && <Vazio titulo="Nada aqui">{visao.id === "validar" ? "Nenhuma oferta esperando validação." : "Nenhuma oferta nesta situação."}</Vazio>}
      <ul className="space-y-3">{lista.map((o) => <ItemOferta key={o.id} o={o} podeDecidir={isParcerias} />)}</ul>
    </div>
  );
}

function ItemOferta({ o, podeDecidir }: { o: Oferta; podeDecidir: boolean }) {
  const salvar = useSalvarOferta();
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  return (
    <li className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-neutro-300">{o.parceiro?.nome_fantasia}</p>
          <p className="font-semibold">{o.titulo}</p>
          <p className="mt-1 text-sm font-semibold text-menta-300">{o.condicao}</p>
        </div>
        <Pilula tom={ESTADOS_OFERTA[o.estado].tom} className="self-start">{ESTADOS_OFERTA[o.estado].rotulo}</Pilula>
      </div>
      <p className="mt-2 max-w-[80ch] text-sm">{o.descricao}</p>
      <p className="mt-1 text-xs text-neutro-300">
        {o.para_quem ? `Para: ${o.para_quem} · ` : ""}{o.validade ? `Válida até ${data(o.validade)} · ` : ""}Atualizada em {data(o.updated_at)}
      </p>
      {podeDecidir && (
        recusando ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo, para quem oferece ajustar" aria-label="Motivo da recusa" />
            <Button variant="destructive" disabled={!motivo.trim() || salvar.isPending} onClick={() => salvar.mutate({ id: o.id, dados: { estado: "recusada", motivo_recusa: motivo.trim() } })}>Recusar</Button>
            <Button variant="ghost" onClick={() => setRecusando(false)}>Cancelar</Button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {o.estado !== "publicada" && <Button size="sm" disabled={salvar.isPending} onClick={() => salvar.mutate({ id: o.id, dados: { estado: "publicada", motivo_recusa: null } })}><Check /> Publicar</Button>}
            {o.estado === "em_validacao" && <Button size="sm" variant="outline" onClick={() => { setMotivo(""); setRecusando(true); }}><X /> Recusar</Button>}
            {o.estado === "publicada" && <Button size="sm" variant="outline" disabled={salvar.isPending} onClick={() => salvar.mutate({ id: o.id, dados: { estado: "pausada" } })}><Pause /> Pausar</Button>}
          </div>
        )
      )}
    </li>
  );
}
