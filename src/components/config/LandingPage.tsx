import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";

type Config = {
  publicada: boolean; video_url: string | null; video_formato: "auto" | "horizontal" | "vertical" | "quadrado"; pixel_meta_id: string | null; capi_ativa: boolean; ga4_id: string | null;
  termo_versao: string; termo_texto: string; privacidade_versao: string; privacidade_texto: string; contato_privacidade: string;
};
type Cadastro = {
  id: string; created_at: string; parceiro_id: string | null; empresa: string; nome: string; email: string; categoria_nome: string | null;
  clientes_ativos: number | null; utm_campaign: string | null; utm_content: string | null; utm_source: string | null; status: string;
};

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-5">
      <h3 className="text-base font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 text-sm text-neutro-300">{descricao}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

const data = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");

// Landing page dos parceiros SaaS (/parceiros): publicação, vídeo, medição, textos legais e os cadastros com a origem do anúncio.
// Administrador edita; time de parcerias só consulta (RLS).
export function SecaoLandingPage({ somenteLeitura }: { somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const cfg = useQuery({
    queryKey: ["config", "landing"],
    queryFn: async () => ok<any>(await supabase.from("config_landing").select("*").eq("id", 1).maybeSingle()) as Config | null,
  });
  const cad = useQuery({
    queryKey: ["config", "landing", "cadastros"],
    queryFn: async () => ok<any>(await supabase.from("cadastros_landing").select("*").order("created_at", { ascending: false }).limit(200)) as Cadastro[],
  });
  const [f, setF] = useState<Config | null>(null);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (cfg.data) setF(cfg.data);
  }, [cfg.data]);
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setF((x) => (x ? { ...x, [k]: v } : x));

  async function salvar() {
    if (!f) return;
    setSalvando(true);
    const { error } = await supabase.from("config_landing").update({
      publicada: f.publicada, video_url: f.video_url?.trim() || null, video_formato: f.video_formato, pixel_meta_id: f.pixel_meta_id?.trim() || null, capi_ativa: f.capi_ativa,
      ga4_id: f.ga4_id?.trim().toUpperCase() || null, termo_versao: f.termo_versao, termo_texto: f.termo_texto,
      privacidade_versao: f.privacidade_versao, privacidade_texto: f.privacidade_texto, contato_privacidade: f.contato_privacidade,
    }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Landing page atualizada.");
    qc.invalidateQueries({ queryKey: ["config", "landing"] });
  }

  if (cfg.isLoading) return <Carregando />;
  if (cfg.error) return <ErroCarga erro={cfg.error} />;
  if (!f) return <Vazio titulo="Configuração não encontrada">A migração da landing page ainda não foi aplicada neste banco.</Vazio>;

  const desligado = somenteLeitura;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutro-300">Página dos parceiros SaaS de CRM e ERP, fora dos buscadores.</p>
        <Button asChild variant="outline" size="sm"><Link to="/parceiros" target="_blank"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Abrir a página</Link></Button>
      </div>

      <Bloco titulo="Publicação e vídeo">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">Cadastro aberto na página<span className="block text-xs text-neutro-300">Desligado, a página mostra que o cadastro está pausado.</span></span>
          <Switch checked={f.publicada} onCheckedChange={(v) => set("publicada", v)} disabled={desligado} />
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="lp-video">Endereço do vídeo</Label>
          <Input id="lp-video" placeholder="https://youtu.be/... ou https://vimeo.com/..." value={f.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} disabled={desligado} />
          <p className="text-xs text-neutro-300">YouTube, Vimeo ou arquivo de vídeo. Vazio, a página mostra a capa com o Igor.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lp-formato">Formato do vídeo</Label>
          <Select value={f.video_formato} onValueChange={(v) => set("video_formato", v as Config["video_formato"])} disabled={desligado}>
            <SelectTrigger id="lp-formato"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático (Shorts em pé, os demais 16:9)</SelectItem>
              <SelectItem value="horizontal">Horizontal 16:9</SelectItem>
              <SelectItem value="vertical">Vertical 9:16</SelectItem>
              <SelectItem value="quadrado">Quadrado 1:1</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Bloco>

      <Bloco titulo="Medição dos anúncios" descricao="Os scripts só carregam com o ID preenchido. Tokens de API não entram aqui: ficam nos segredos do servidor.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lp-pixel">ID do pixel do Meta</Label>
            <Input id="lp-pixel" inputMode="numeric" placeholder="Só números" value={f.pixel_meta_id ?? ""} onChange={(e) => set("pixel_meta_id", e.target.value.replace(/\D/g, ""))} disabled={desligado} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-ga4">ID do Google Analytics 4</Label>
            <Input id="lp-ga4" placeholder="G-XXXXXXX" value={f.ga4_id ?? ""} onChange={(e) => set("ga4_id", e.target.value)} disabled={desligado} />
          </div>
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">API de Conversões do Meta<span className="block text-xs text-neutro-300">Envia o cadastro também pelo servidor. Exige o segredo META_CAPI_TOKEN na função cadastro-parceiro.</span></span>
          <Switch checked={f.capi_ativa} onCheckedChange={(v) => set("capi_ativa", v)} disabled={desligado || !f.pixel_meta_id} />
        </label>
      </Bloco>

      <Bloco titulo="Termo de adesão" descricao="Mudou o texto, mude a versão: cada cadastro guarda a versão que aceitou.">
        <div className="space-y-1.5 sm:w-48">
          <Label htmlFor="lp-tv">Versão</Label>
          <Input id="lp-tv" type="date" value={f.termo_versao} onChange={(e) => set("termo_versao", e.target.value)} disabled={desligado} />
        </div>
        <Textarea rows={10} value={f.termo_texto} onChange={(e) => set("termo_texto", e.target.value)} disabled={desligado} aria-label="Texto do termo de adesão" />
      </Bloco>

      <Bloco titulo="Política de privacidade">
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="lp-pv">Versão</Label>
            <Input id="lp-pv" type="date" value={f.privacidade_versao} onChange={(e) => set("privacidade_versao", e.target.value)} disabled={desligado} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-pc">E-mail de privacidade</Label>
            <Input id="lp-pc" type="email" value={f.contato_privacidade} onChange={(e) => set("contato_privacidade", e.target.value)} disabled={desligado} />
          </div>
        </div>
        <Textarea rows={10} value={f.privacidade_texto} onChange={(e) => set("privacidade_texto", e.target.value)} disabled={desligado} aria-label="Texto da política de privacidade" />
      </Bloco>

      {!somenteLeitura && (
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}Salvar a landing page
          </Button>
        </div>
      )}

      <Bloco titulo="Cadastros pela página" descricao="Os 200 mais recentes, com o anúncio que trouxe cada empresa (UTM).">
        {cad.isLoading ? <Carregando /> : cad.error ? <ErroCarga erro={cad.error} /> : !cad.data?.length ? (
          <p className="text-sm text-neutro-300">Nenhum cadastro ainda. Os cadastros aparecem aqui assim que alguém conclui o formulário da página.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Empresa</TableHead><TableHead>Contato</TableHead><TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Clientes</TableHead><TableHead>Campanha</TableHead><TableHead>Anúncio</TableHead><TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cad.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{data(c.created_at)}</TableCell>
                    <TableCell>{c.parceiro_id ? <Link className="text-menta-300 hover:underline" to={`/app/parceiros/${c.parceiro_id}`}>{c.empresa}</Link> : c.empresa}</TableCell>
                    <TableCell>{c.nome}<span className="block text-xs text-neutro-300">{c.email}</span></TableCell>
                    <TableCell>{c.categoria_nome ?? "Sem tipo"}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.clientes_ativos ?? <span className="text-neutro-300">0</span>}</TableCell>
                    <TableCell>{c.utm_campaign ?? <span className="text-neutro-300">Sem campanha</span>}</TableCell>
                    <TableCell>{c.utm_content ?? <span className="text-neutro-300">Sem anúncio</span>}</TableCell>
                    <TableCell>{c.status === "criado" ? "Acesso criado" : <span className="text-destructive">Falhou</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Bloco>
    </div>
  );
}
