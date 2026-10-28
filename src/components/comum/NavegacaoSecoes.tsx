import { useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// `fixa`: fica no topo, fora da ordem alfabética (por exemplo, "Visão geral")
export type Secao = { id: string; rotulo: string; fixa?: boolean };

// Busca sem diferenciar maiúsculas nem acentos: "acoes" encontra "Ações da Wise"
export function normalizarBusca(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Cada palavra buscada precisa abrir uma palavra do rótulo: "acoes" acha "Ações da Wise", não "Remunerações"
export function casaBusca(rotulo: string, busca: string) {
  const palavras = normalizarBusca(rotulo).split(/[^a-z0-9]+/);
  return normalizarBusca(busca).split(/\s+/).filter(Boolean).every((t) => palavras.some((p) => p.startsWith(t)));
}

export function ordenarSecoes(secoes: Secao[]) {
  const fixas = secoes.filter((s) => s.fixa);
  const demais = secoes.filter((s) => !s.fixa).sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR", { sensitivity: "base" }));
  return { fixas, demais };
}

function BotaoSecao({ secao, ativa, onClick }: { secao: Secao; ativa: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativa ? "page" : undefined}
      className={cn(
        "flex w-full items-center rounded-[8px] px-3 py-2 text-left text-sm font-medium text-neutro-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ativa && "bg-menta-500/10 text-menta-400 hover:bg-menta-500/10 hover:text-menta-400",
      )}
    >
      <span className="min-w-0 truncate">{secao.rotulo}</span>
    </button>
  );
}

// Lista lateral com busca, para telas largas
function ListaLateral({ secoes, ativa, onChange, rotulo }: { secoes: Secao[]; ativa: string; onChange: (id: string) => void; rotulo: string }) {
  const [busca, setBusca] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const termo = normalizarBusca(busca);
  const { fixas, demais } = useMemo(() => {
    const filtradas = termo ? secoes.filter((s) => casaBusca(s.rotulo, termo)) : secoes;
    return ordenarSecoes(filtradas);
  }, [secoes, termo]);
  const total = fixas.length + demais.length;

  function limpar() {
    setBusca("");
    campo.current?.focus();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={campo}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && total > 0) onChange((fixas[0] ?? demais[0]).id);
            if (e.key === "Escape" && busca) { e.preventDefault(); setBusca(""); }
          }}
          placeholder={`Buscar ${rotulo}`}
          aria-label={`Buscar ${rotulo}`}
          className="pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
        />
        {busca && (
          <button type="button" onClick={limpar} aria-label="Limpar busca"
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav aria-label={rotulo} className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1">
        {fixas.map((s) => <BotaoSecao key={s.id} secao={s} ativa={s.id === ativa} onClick={() => onChange(s.id)} />)}
        {fixas.length > 0 && demais.length > 0 && <div className="my-1.5 border-t border-white/10" role="separator" />}
        {demais.map((s) => <BotaoSecao key={s.id} secao={s} ativa={s.id === ativa} onClick={() => onChange(s.id)} />)}
      </nav>
      {total === 0 ? (
        <div className="shrink-0 space-y-2 px-3 text-sm text-muted-foreground">
          <p>Nada encontrado para "{busca.trim()}".</p>
          <Button type="button" variant="outline" size="sm" onClick={limpar}>Limpar busca</Button>
        </div>
      ) : (
        <p className="shrink-0 px-3 text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {termo ? `${total} de ${secoes.length}` : `${secoes.length} ${rotulo}`}
        </p>
      )}
    </div>
  );
}

// Seletor com busca, para celular e tablet
function SeletorCompacto({ secoes, ativa, onChange, rotulo }: { secoes: Secao[]; ativa: string; onChange: (id: string) => void; rotulo: string }) {
  const [aberto, setAberto] = useState(false);
  const { fixas, demais } = useMemo(() => ordenarSecoes(secoes), [secoes]);
  const atual = secoes.find((s) => s.id === ativa);

  function item(s: Secao) {
    return (
      <CommandItem key={s.id} value={s.rotulo} onSelect={() => { onChange(s.id); setAberto(false); }} className="min-h-10">
        <Check className={cn("mr-2 h-4 w-4 text-menta-400", s.id === ativa ? "opacity-100" : "opacity-0")} aria-hidden="true" />
        {s.rotulo}
      </CommandItem>
    );
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={aberto} aria-label={`Escolher ${rotulo}`}
          className="h-11 w-full justify-between gap-2 px-3 font-medium">
          <span className="min-w-0 truncate">{atual?.rotulo}</span>
          <span className="ml-auto shrink-0 text-xs font-normal tabular-nums text-muted-foreground">{secoes.length} {rotulo}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command filter={(valor, busca) => (casaBusca(valor, busca) ? 1 : 0)}>
          <CommandInput placeholder={`Buscar ${rotulo}`} />
          <CommandList className="max-h-[min(60dvh,360px)]">
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            {fixas.length > 0 && <CommandGroup>{fixas.map(item)}</CommandGroup>}
            {fixas.length > 0 && <CommandSeparator />}
            <CommandGroup>{demais.map(item)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Navegação entre muitas seções de uma mesma tela: busca, ordem alfabética e lista vertical.
// Em telas largas a lista fica ao lado do conteúdo; abaixo de 1280 px vira um seletor com busca.
// `rotulo` é o nome do conjunto no plural e em minúsculas ("seções", "abas").
export function NavegacaoSecoes({
  secoes, ativa, onChange, rotulo = "seções", children,
}: { secoes: Secao[]; ativa: string; onChange: (id: string) => void; rotulo?: string; children: ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[232px_minmax(0,1fr)] xl:items-start xl:gap-6">
      <div className="mb-4 xl:hidden">
        <SeletorCompacto secoes={secoes} ativa={ativa} onChange={onChange} rotulo={rotulo} />
      </div>
      <aside className="hidden xl:sticky xl:top-20 xl:flex xl:max-h-[calc(100dvh-6rem)] xl:flex-col xl:rounded-[14px] xl:border xl:border-white/10 xl:bg-card xl:p-3">
        <ListaLateral secoes={secoes} ativa={ativa} onChange={onChange} rotulo={rotulo} />
      </aside>
      <section className="min-w-0" aria-label={secoes.find((s) => s.id === ativa)?.rotulo}>
        {children}
      </section>
    </div>
  );
}
