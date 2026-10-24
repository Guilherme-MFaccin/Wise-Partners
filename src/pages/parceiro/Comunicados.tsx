import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dataHora } from "@/lib/formato";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useMeusComunicados, type Leitura } from "@/components/portal/dadosV2";

const TIPOS: Record<string, string> = { regra: "Regras do programa", evento: "Evento", material: "Material novo", outro: "Comunicado" };

// Comunicados da Wise para a pessoa: abrir marca como lido (confirmação de leitura)
export default function Comunicados() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const q = useMeusComunicados();
  const [aberto, setAberto] = useState<string | null>(null);

  async function abrir(l: Leitura) {
    const fechar = aberto === l.comunicado_id;
    setAberto(fechar ? null : l.comunicado_id);
    if (fechar || l.lido_em) return;
    const { error } = await supabase.rpc("marcar_comunicado_lido", { p_id: l.comunicado_id });
    if (!error) {
      qc.setQueryData<Leitura[]>(["portal-comunicados", perfil?.id], (lista) =>
        lista?.map((x) => (x.comunicado_id === l.comunicado_id ? { ...x, lido_em: new Date().toISOString() } : x)));
      qc.invalidateQueries({ queryKey: ["portal-comunicados-nao-lidos"] });
    }
  }

  const lista = (q.data ?? []).filter((l) => l.comunicado);
  const naoLidos = lista.filter((l) => !l.lido_em).length;

  return (
    <div>
      <Cabecalho titulo="Comunicados"
        descricao={naoLidos ? `${naoLidos} ${naoLidos === 1 ? "comunicado não lido" : "comunicados não lidos"}.` : "Mensagens da Wise para a sua parceria."} />
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : lista.length === 0 ? (
        <Vazio titulo="Nenhum comunicado">Os comunicados da Wise (mudanças de regra, eventos e materiais novos) aparecem aqui.</Vazio>
      ) : (
        <ul className="grid gap-3">
          {lista.map((l) => {
            const c = l.comunicado!;
            const estaAberto = aberto === l.comunicado_id;
            return (
              <li key={l.comunicado_id} className={`rounded-[14px] border bg-card ${!l.lido_em ? "border-menta-500/40" : "border-white/10"}`}>
                <button type="button" onClick={() => abrir(l)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={estaAberto}>
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!l.lido_em ? "bg-menta-500/15 text-menta-400" : "bg-white/5 text-muted-foreground"}`}>
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`${!l.lido_em ? "font-bold" : "font-semibold"}`}>{c.titulo}</p>
                      {!l.lido_em && <Pilula tom="menta">Novo</Pilula>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {TIPOS[c.tipo] ?? "Comunicado"} · {dataHora(c.enviado_em ?? l.enviado_em)}
                      {l.lido_em && <> · lido em {dataHora(l.lido_em)}</>}
                    </p>
                    {!estaAberto && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.corpo}</p>}
                  </div>
                  <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${estaAberto ? "rotate-180" : ""}`} />
                </button>
                {estaAberto && (
                  <div className="whitespace-pre-line border-t border-white/10 p-4 text-sm leading-relaxed">{c.corpo}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
