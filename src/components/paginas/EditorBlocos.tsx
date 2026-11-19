import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CAMPOS_LISTA, CAMPOS_TEXTO, MARCADORES, type BlocoPronto, type ConteudoPronto, type MetaBloco, type Variaveis } from "@/lib/paginas";
import { CampoTexto, Cartao, ListaItens, ListaPerguntasEditor } from "@/components/paginas/Campos";
import { cn } from "@/lib/utils";

const CAMPOS_LONGOS = new Set(["titulo", "texto", "nota"]);

function igual(a: BlocoPronto, b: BlocoPronto) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Seções da página: liga e desliga, e os textos de cada bloco (título, texto, botão, listas)
export function EditorBlocos<K extends string>({ meta, padrao, valor, aoMudar, desligado }: {
  meta: MetaBloco<K>[]; padrao: ConteudoPronto<K>; valor: ConteudoPronto<K>; aoMudar: (v: ConteudoPronto<K>) => void; desligado: boolean;
}) {
  const [aberto, setAberto] = useState<K | null>(null);
  const mudarBloco = (k: K, b: BlocoPronto) => aoMudar({ ...valor, secoes: { ...valor.secoes, [k]: b } });
  const visiveis = meta.filter((m) => valor.secoes[m.chave].visivel).length;

  return (
    <Cartao titulo="Seções da página" descricao={`${visiveis} de ${meta.length} seções visíveis. Abra uma seção para editar os textos; campo vazio volta ao texto padrão.`}>
      <ul className="divide-y divide-white/10 overflow-hidden rounded-[10px] border border-white/10">
        {meta.map((m) => {
          const b = valor.secoes[m.chave];
          const alterado = !igual(b, padrao.secoes[m.chave]);
          const estaAberto = aberto === m.chave;
          const idCorpo = `bloco-${m.chave}`;
          return (
            <li key={m.chave} className={cn("bg-background/30", !b.visivel && "bg-transparent")}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4">
                <button type="button" onClick={() => setAberto(estaAberto ? null : m.chave)} aria-expanded={estaAberto} aria-controls={idCorpo}
                  className="flex w-full min-w-0 items-start gap-2 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:flex-1">
                  <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-neutro-300 transition-transform duration-150 motion-reduce:transition-none", estaAberto && "rotate-180")} aria-hidden />
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-semibold", !b.visivel && "text-neutro-300")}>{m.rotulo}</span>
                    <span className="block text-xs text-neutro-300">{m.descricao}</span>
                  </span>
                </button>
                <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0">
                  {alterado && <Pilula tom="info">Alterada</Pilula>}
                  {m.ocultavel ? (
                    <>
                      {!b.visivel && <Pilula tom="alerta">Oculta</Pilula>}
                      <Switch checked={b.visivel} onCheckedChange={(v) => mudarBloco(m.chave, { ...b, visivel: v })} disabled={desligado}
                        aria-label={`Mostrar a seção ${m.rotulo}`} />
                    </>
                  ) : <Pilula>Sempre visível</Pilula>}
                </div>
              </div>
              {estaAberto && (
                <div id={idCorpo} className="space-y-4 border-t border-white/10 px-3 pb-4 pt-4 sm:px-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {CAMPOS_TEXTO.filter((c) => m.campos[c]).map((c) => (
                      <div key={c} className={CAMPOS_LONGOS.has(c) ? "md:col-span-2" : ""}>
                        <CampoTexto rotulo={m.campos[c]!} valor={b[c]} longo={CAMPOS_LONGOS.has(c)} desligado={desligado}
                          maximo={c === "texto" ? 900 : 300} placeholder={padrao.secoes[m.chave][c]}
                          aoMudar={(v) => mudarBloco(m.chave, { ...b, [c]: v })} />
                      </div>
                    ))}
                  </div>
                  {CAMPOS_LISTA.filter((c) => m.listas?.[c]).map((c) => {
                    const l = m.listas![c]!;
                    return (
                      <ListaItens key={c} rotulo={l.rotulo} itens={b[c]} comTexto={l.comTexto} nomeItem={l.nomeItem} desligado={desligado}
                        aoMudar={(v) => mudarBloco(m.chave, { ...b, [c]: v })} />
                    );
                  })}
                  {alterado && !desligado && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => mudarBloco(m.chave, padrao.secoes[m.chave])}>
                      <RotateCcw className="mr-1 h-4 w-4" aria-hidden />Voltar ao texto padrão desta seção
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}

export function EditorPerguntas<K extends string>({ padrao, valor, aoMudar, desligado }: {
  padrao: ConteudoPronto<K>; valor: ConteudoPronto<K>; aoMudar: (v: ConteudoPronto<K>) => void; desligado: boolean;
}) {
  const alterado = JSON.stringify(valor.perguntas) !== JSON.stringify(padrao.perguntas);
  return (
    <Cartao titulo="Perguntas frequentes" descricao={`${valor.perguntas.length} perguntas, na ordem em que aparecem na página.`}
      acoes={alterado && !desligado ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => aoMudar({ ...valor, perguntas: padrao.perguntas })}>
          <RotateCcw className="mr-1 h-4 w-4" aria-hidden />Voltar às perguntas padrão
        </Button>
      ) : undefined}>
      <ListaPerguntasEditor perguntas={valor.perguntas} aoMudar={(p) => aoMudar({ ...valor, perguntas: p })} desligado={desligado} />
    </Cartao>
  );
}

// Marcadores que viram valores na página, com o valor de hoje
export function QuadroMarcadores({ vars }: { vars: Variaveis }) {
  return (
    <Cartao titulo="Marcadores nos textos" descricao="Escreva o marcador entre chaves em qualquer texto e a página troca pelo valor atual. Assim, mudar um valor muda todos os textos de uma vez.">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {MARCADORES.map((m) => (
          <div key={m.chave} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 border-b border-white/5 py-1.5">
            <dt className="font-mono text-xs text-menta-300">{`{${m.chave}}`}</dt>
            <dd className="min-w-0 text-right text-neutro-100"><span className="tabular-nums">{vars[m.chave] || "sem valor"}</span><span className="block text-xs text-neutro-300">{m.descricao}</span></dd>
          </div>
        ))}
      </dl>
    </Cartao>
  );
}
