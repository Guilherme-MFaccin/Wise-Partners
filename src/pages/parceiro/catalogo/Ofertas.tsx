import { useState } from "react";
import { Lock, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { DialogoOferta } from "@/components/catalogo/Componentes";
import { ESTADOS_OFERTA, useAcessoHub, useApagarOferta, useOfertas, useSalvarOferta, type Oferta } from "@/components/catalogo/dados";
import { data } from "@/lib/formato";

// Minhas ofertas: o que a empresa oferece no catálogo. Só parceiros Elite e clientes do grupo oferecem.
export default function Ofertas() {
  const { perfil } = useAuth();
  const pid = perfil?.parceiro_id ?? null;
  const acesso = useAcessoHub();
  const q = useOfertas({ parceiroId: pid });
  const salvar = useSalvarOferta();
  const apagar = useApagarOferta();
  const [editando, setEditando] = useState<Oferta | null>(null);
  const [nova, setNova] = useState(false);

  const cab = (acoes?: React.ReactNode) => (
    <Cabecalho titulo="Minhas ofertas" descricao="O que a sua empresa oferece aos membros do ecossistema, e em que pé está a validação?" acoes={acoes} />
  );
  if (acesso.isLoading) return <div>{cab()}<Carregando /></div>;
  if (acesso.error) return <div>{cab()}<ErroCarga erro={acesso.error} /></div>;
  if (!acesso.data?.ofertar || !pid) {
    return (
      <div>
        {cab()}
        <Vazio titulo="Ofertas no catálogo são do nível Elite">
          <span className="inline-flex items-start gap-2 text-left"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Sua empresa passa a Elite quando um cliente trazido por ela contrata uma empresa do Grupo Tríade. Clientes do grupo também podem oferecer.</span>
        </Vazio>
      </div>
    );
  }
  const lista = q.data ?? [];
  return (
    <div>
      {cab(<Button onClick={() => setNova(true)}><Plus /> Nova oferta</Button>)}
      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && lista.length === 0 && (
        <Vazio titulo="Nenhuma oferta ainda">Crie uma oferta com uma condição só para membros. A Wise valida antes de publicar.</Vazio>
      )}
      <ul className="space-y-3">
        {lista.map((o) => (
          <li key={o.id} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{o.titulo}</p>
                <p className="mt-1 text-sm text-menta-300">{o.condicao}</p>
                <p className="mt-1 text-xs text-neutro-300">Atualizada em {data(o.updated_at)}{o.validade ? ` · válida até ${data(o.validade)}` : ""}</p>
              </div>
              <Pilula tom={ESTADOS_OFERTA[o.estado].tom} className="self-start">{ESTADOS_OFERTA[o.estado].rotulo}</Pilula>
            </div>
            {o.estado === "recusada" && o.motivo_recusa && <p className="mt-2 rounded-[8px] bg-destructive/10 px-3 py-2 text-sm text-red-200">Motivo: {o.motivo_recusa}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditando(o)}><Pencil /> Editar</Button>
              {o.estado === "publicada" && <Button size="sm" variant="outline" disabled={salvar.isPending} onClick={() => salvar.mutate({ id: o.id, dados: { estado: "pausada" } })}><Pause /> Pausar</Button>}
              {o.estado === "pausada" && <Button size="sm" variant="outline" disabled={salvar.isPending} onClick={() => salvar.mutate({ id: o.id, dados: { estado: "em_validacao" } })}><Play /> Retomar</Button>}
              <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" disabled={apagar.isPending}
                onClick={() => window.confirm("Apagar esta oferta?") && apagar.mutate(o.id)}><Trash2 /> Apagar</Button>
            </div>
          </li>
        ))}
      </ul>
      <DialogoOferta aberto={nova || !!editando} oferta={editando} parceiroId={pid} fechar={() => { setNova(false); setEditando(null); }} />
    </div>
  );
}
