import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ParceiroResumo = { id: string; nome_fantasia: string; razao_social: string | null; cnpj: string | null; cidade: string | null; uf: string | null };

export function useParceirosResumo() {
  return useQuery({
    queryKey: ["parceiros-resumo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parceiros")
        .select("id, nome_fantasia, razao_social, cnpj, cidade, uf")
        .order("nome_fantasia");
      if (error) throw error;
      return (data ?? []) as ParceiroResumo[];
    },
  });
}

// Seleção de parceiro com busca por nome, razão social ou CNPJ.
export function ParceiroBusca({
  valor, onChange, placeholder = "Buscar parceiro", className,
}: { valor: string | null; onChange: (id: string | null) => void; placeholder?: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  const { data: parceiros = [] } = useParceirosResumo();
  const atual = parceiros.find((p) => p.id === valor);
  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={cn("w-full justify-between rounded-[8px] font-normal", className)}>
          <span className="truncate">{atual ? atual.nome_fantasia : placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
        <Command
          filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder="Nome, razão social ou CNPJ" />
          <CommandList>
            <CommandEmpty>Nenhum parceiro encontrado.</CommandEmpty>
            <CommandGroup>
              {parceiros.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.nome_fantasia} ${p.razao_social ?? ""} ${p.cnpj ?? ""} ${p.id}`}
                  onSelect={() => {
                    onChange(p.id);
                    setAberto(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", valor === p.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{p.nome_fantasia}</span>
                  {p.cidade && <span className="ml-auto pl-2 text-xs text-muted-foreground">{p.cidade}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
