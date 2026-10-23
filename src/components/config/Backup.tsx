import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Download, FolderArchive, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { baixarArquivo } from "@/components/portal/dados";

// Backup completo (JSON e CSV) no bucket "backups": semanal pelo agendamento e sob demanda aqui.
export function Backup({ podeExportar }: { podeExportar: boolean }) {
  const qc = useQueryClient();
  const [exportando, setExportando] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);
  const pastasQ = useQuery({
    enabled: podeExportar,
    queryKey: ["backups"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("backups").list("", { limit: 200, sortBy: { column: "name", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => !f.id).map((f) => f.name); // pastas não têm id
    },
  });

  async function exportar() {
    setExportando(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup", { body: {} });
      if (error) throw error;
      if (data?.erro) throw new Error(data.erro);
      toast.success(`Backup gerado na pasta ${data?.pasta ?? ""}.`);
      qc.invalidateQueries({ queryKey: ["backups"] });
      if (data?.pasta) setAberta(String(data.pasta).split("/")[0]);
    } catch (e) {
      toastErro(e);
    } finally {
      setExportando(false);
    }
  }

  if (!podeExportar) return <p className="text-sm text-muted-foreground">Só administradores exportam e baixam backups.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">O backup completo roda toda semana. Use o botão para gerar uma cópia agora.</p>
        <Button onClick={exportar} disabled={exportando}>{exportando ? <Loader2 className="animate-spin" /> : <FolderArchive />} Exportar agora</Button>
      </div>
      {pastasQ.isLoading ? <Carregando /> : pastasQ.error ? <ErroCarga erro={pastasQ.error} /> : (
        <ul className="grid gap-2">
          {(pastasQ.data ?? []).map((p) => (
            <li key={p} className="rounded-[14px] border border-white/10 bg-card">
              <button type="button" className="flex w-full items-center gap-2 p-3 text-left font-semibold" onClick={() => setAberta(aberta === p ? null : p)}>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", aberta !== p && "-rotate-90")} /> {p}
              </button>
              {aberta === p && <ArquivosBackup pasta={p} />}
            </li>
          ))}
          {!pastasQ.data?.length && <p className="text-sm text-muted-foreground">Nenhum backup ainda.</p>}
        </ul>
      )}
    </div>
  );
}

function ArquivosBackup({ pasta }: { pasta: string }) {
  const [sub, setSub] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["backups", pasta],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("backups").list(pasta, { limit: 500, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      return data ?? [];
    },
  });
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  return (
    <ul className="divide-y divide-white/5 border-t border-white/10">
      {(q.data ?? []).map((f) => f.id ? (
        <li key={f.name} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{f.name}</span>
          <Button size="sm" variant="ghost" onClick={() => baixarArquivo("backups", `${pasta}/${f.name}`).catch(toastErro)}><Download /> Baixar</Button>
        </li>
      ) : (
        // Subpasta
        <li key={f.name} className="pl-3">
          <button type="button" className="flex w-full items-center gap-2 py-2 text-left text-sm font-medium" onClick={() => setSub(sub === f.name ? null : f.name)}>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", sub !== f.name && "-rotate-90")} /> {f.name}
          </button>
          {sub === f.name && <ArquivosBackup pasta={`${pasta}/${f.name}`} />}
        </li>
      ))}
      {!q.data?.length && <li className="px-3 py-2 text-sm text-muted-foreground">Pasta vazia.</li>}
    </ul>
  );
}
