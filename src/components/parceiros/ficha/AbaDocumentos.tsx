import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pilula } from "@/components/comum/Selos";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { TIPOS_DOCUMENTO, rotulo } from "@/lib/rotulos";
import { Campo } from "../ui";
import { abrirArquivo, invalidarParceiro, nomeArquivoSeguro, nomePerfil, usePerfis, type Parceiro } from "../dados";
import { ExtrairDossieDialog } from "./ExtrairDossieDialog";

type Documento = {
  id: string; tipo: string; nome: string; versao: number; caminho: string; visivel_parceiro: boolean; autor_id: string | null; created_at: string;
};

const ehPdf = (d: Documento) => /\.pdf$/i.test(d.caminho) || /\.pdf$/i.test(d.nome);

// Documentos do parceiro (FR-016) com tipo, versão, data e autor.
export function AbaDocumentos({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: perfis = [] } = usePerfis();
  const q = useQuery({
    queryKey: ["parceiro", p.id, "documentos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos").select("*").eq("parceiro_id", p.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Documento[];
    },
  });
  const [enviar, setEnviar] = useState(false);
  const [extrair, setExtrair] = useState<Documento | null>(null);

  async function alternarVisivel(d: Documento, v: boolean) {
    const { error } = await supabase.from("documentos").update({ visivel_parceiro: v }).eq("id", d.id);
    if (error) return toastErro(error);
    toast.success(v ? "Documento visível ao parceiro." : "Documento oculto do parceiro.");
    qc.invalidateQueries({ queryKey: ["parceiro", p.id, "documentos"] });
  }

  if (q.isLoading) return <Carregando />;
  const lista = q.data ?? [];

  return (
    <div className="space-y-4">
      {isParcerias && <Button onClick={() => setEnviar(true)}><Upload /> Enviar documento</Button>}
      {!lista.length ? (
        <Vazio titulo="Nenhum documento." />
      ) : (
        <ul className="space-y-2">
          {lista.map((d) => (
            <li key={d.id} className="flex min-w-0 flex-col gap-3 rounded-[14px] border border-white/10 bg-card p-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Pilula tom="menta">{rotulo(TIPOS_DOCUMENTO, d.tipo)}</Pilula>
                  <span className="break-words font-medium">{d.nome}</span>
                  <span className="text-xs text-muted-foreground">versão {d.versao}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dataHora(d.created_at)}{nomePerfil(perfis, d.autor_id) ? ` · ${nomePerfil(perfis, d.autor_id)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={d.visivel_parceiro} disabled={!isParcerias} onCheckedChange={(v) => alternarVisivel(d, v)} />
                  Visível ao parceiro
                </label>
                <Button size="sm" variant="outline" onClick={() => abrirArquivo("documentos", d.caminho)}><Download /> Baixar</Button>
                {isParcerias && d.tipo === "dossie" && ehPdf(d) && (
                  <Button size="sm" variant="outline" onClick={() => setExtrair(d)}><Sparkles /> Extrair dados com IA</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {enviar && <EnviarDocumento parceiroId={p.id} onFechar={() => setEnviar(false)} onSalvo={() => invalidarParceiro(qc, p.id)} />}
      {extrair && <ExtrairDossieDialog parceiro={p} documento={extrair} onFechar={() => setExtrair(null)} />}
    </div>
  );
}

function EnviarDocumento({ parceiroId, onFechar, onSalvo }: { parceiroId: string; onFechar: () => void; onSalvo: () => void }) {
  const { perfil } = useAuth();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState("dossie");
  const [nome, setNome] = useState("");
  const [visivel, setVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!arquivo) {
      toast.error("Escolha o arquivo.");
      return;
    }
    const nomeDoc = nome.trim() || arquivo.name;
    setSalvando(true);
    // Nova versão quando já existe documento do mesmo tipo e nome
    const ant = await supabase.from("documentos").select("versao").eq("parceiro_id", parceiroId).eq("tipo", tipo).eq("nome", nomeDoc)
      .order("versao", { ascending: false }).limit(1);
    const versao = (ant.data?.[0]?.versao ?? 0) + 1;
    const caminho = `${parceiroId}/${crypto.randomUUID()}-${nomeArquivoSeguro(arquivo.name)}`;
    const up = await supabase.storage.from("documentos").upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (up.error) {
      setSalvando(false);
      return toastErro(up.error);
    }
    const { error } = await supabase.from("documentos").insert({
      parceiro_id: parceiroId, tipo, nome: nomeDoc, versao, caminho, visivel_parceiro: visivel, autor_id: perfil?.id,
    });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success(versao > 1 ? `Documento salvo como versão ${versao}.` : "Documento salvo.");
    onSalvo();
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Enviar documento</DialogTitle>
          <DialogDescription>Um documento com o mesmo tipo e nome vira uma nova versão.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Campo rotulo="Arquivo" obrigatorio>
            <Input type="file" onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setArquivo(f);
              if (f && !nome) setNome(f.name);
            }} />
          </Campo>
          <Campo rotulo="Tipo">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TIPOS_DOCUMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Campo>
          <Campo rotulo="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={visivel} onCheckedChange={(v) => setVisivel(!!v)} /> Visível ao parceiro no portal dele
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Enviando..." : "Enviar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
