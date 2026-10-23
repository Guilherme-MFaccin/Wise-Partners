import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { nomeSeguro } from "@/components/portal/dados";

// Anexa um dossiê em PDF à ficha; a extração por IA e a revisão acontecem na aba de documentos da ficha.
export function EnvioDossie() {
  const { perfil } = useAuth();
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviados, setEnviados] = useState<{ parceiroId: string; nome: string }[]>([]);

  async function enviar() {
    if (!parceiroId || !arquivo) return;
    setEnviando(true);
    try {
      const caminho = `${parceiroId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
      const up = await supabase.storage.from("documentos").upload(caminho, arquivo, { contentType: "application/pdf" });
      if (up.error) throw up.error;
      const { error } = await supabase.from("documentos").insert({
        parceiro_id: parceiroId, tipo: "dossie", nome: arquivo.name, caminho, autor_id: perfil?.id, visivel_parceiro: false,
      });
      if (error) {
        await supabase.storage.from("documentos").remove([caminho]);
        throw error;
      }
      toast.success("Dossiê anexado. Abra a ficha para pedir a extração.");
      setEnviados((x) => [{ parceiroId, nome: arquivo.name }, ...x]);
      setArquivo(null);
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div className="space-y-1.5">
          <Label>Parceiro</Label>
          <ParceiroBusca valor={parceiroId} onChange={setParceiroId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dossie">Dossiê em PDF</Label>
          <Input id="dossie" key={enviados.length} type="file" accept="application/pdf,.pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </div>
        <Button onClick={enviar} disabled={!parceiroId || !arquivo || enviando}>
          {enviando ? <Loader2 className="animate-spin" /> : <Upload />} Anexar
        </Button>
      </div>
      {enviados.length > 0 && (
        <ul className="space-y-2">
          {enviados.map((e, i) => (
            <li key={i} className="flex flex-col gap-2 rounded-[10px] bg-white/5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0 break-all">{e.nome}</span>
              <Link to={`/app/parceiros/${e.parceiroId}?aba=documentos`} className="inline-flex items-center gap-1 text-menta-400 hover:underline">
                Extrair dados na ficha <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
