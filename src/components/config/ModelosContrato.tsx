import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { TIPOS_PARCERIA } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { baixarArquivo, nomeSeguro } from "@/components/portal/dados";

type Modelo = { id: string; tipo: string; versao: number; caminho: string; vigente: boolean; created_at: string };

// Modelos de contrato (.docx com marcadores): nova versão passa a ser a vigente do tipo.
export function ModelosContrato({ somenteLeitura }: { somenteLeitura: boolean }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const [tipo, setTipo] = useState("comercial");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const q = useQuery({
    queryKey: ["config", "modelos_contrato"],
    queryFn: async () => ok<any>(await supabase.from("modelos_contrato").select("id, tipo, versao, caminho, vigente, created_at")
      .order("tipo").order("versao", { ascending: false })) as Modelo[],
  });

  async function enviar() {
    if (!arquivo) return;
    setEnviando(true);
    try {
      const versao = Math.max(0, ...(q.data ?? []).filter((m) => m.tipo === tipo).map((m) => m.versao)) + 1;
      const caminho = `${tipo}/v${versao}-${nomeSeguro(arquivo.name)}`;
      const up = await supabase.storage.from("modelos").upload(caminho, arquivo, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      if (up.error) throw up.error;
      const r1 = await supabase.from("modelos_contrato").update({ vigente: false }).eq("tipo", tipo).eq("vigente", true);
      if (r1.error) throw r1.error;
      const r2 = await supabase.from("modelos_contrato").insert({ tipo, versao, caminho, vigente: true, created_by: perfil?.id });
      if (r2.error) throw r2.error;
      toast.success(`Versão ${versao} do modelo ${TIPOS_PARCERIA[tipo].toLowerCase()} publicada como vigente.`);
      setArquivo(null);
      qc.invalidateQueries({ queryKey: ["config", "modelos_contrato"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      {!somenteLeitura && (
        <div className="space-y-3 rounded-[14px] border border-white/10 bg-card p-4">
          <p className="font-semibold">Nova versão de modelo</p>
          <p className="text-sm text-muted-foreground">
            Envie o .docx com os marcadores no formato {"{marcador}"}. Contratos já gerados continuam com a versão da época.
          </p>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPOS_PARCERIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Arquivo .docx</Label>
              <Input id="modelo" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={enviar} disabled={!arquivo || enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Upload />} Enviar</Button>
          </div>
        </div>
      )}
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : (
        <ul className="grid gap-2">
          {(q.data ?? []).map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-[14px] border border-white/10 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{TIPOS_PARCERIA[m.tipo]} · versão {m.versao}</span>
                  {m.vigente && <Pilula tom="menta">Vigente</Pilula>}
                </div>
                <p className="break-all text-xs text-muted-foreground">{m.caminho} · {dataHora(m.created_at)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => baixarArquivo("modelos", m.caminho).catch(toastErro)}><Download /> Baixar</Button>
            </li>
          ))}
          {!q.data?.length && <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>}
        </ul>
      )}
    </div>
  );
}
