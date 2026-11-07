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
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { FilaParceiros } from "@/components/config/FilaParceiros";

type Config = {
  publicada: boolean; modo_cadastro: "fila" | "acesso_direto"; agenda_url: string | null; video_url: string | null; video_formato: "auto" | "horizontal" | "vertical" | "quadrado"; pixel_meta_id: string | null; capi_ativa: boolean; ga4_id: string | null;
  termo_versao: string; termo_texto: string; privacidade_versao: string; privacidade_texto: string; contato_privacidade: string;
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

// Landing page dos parceiros SaaS (/parceiros): publicação, vídeo, medição, textos legais e os cadastros com a origem do anúncio.
// Administrador edita; time de parcerias só consulta (RLS).
export function SecaoLandingPage({ somenteLeitura }: { somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const cfg = useQuery({
    queryKey: ["config", "landing"],
    queryFn: async () => ok<any>(await supabase.from("config_landing").select("*").eq("id", 1).maybeSingle()) as Config | null,
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
      publicada: f.publicada, modo_cadastro: f.modo_cadastro, agenda_url: f.agenda_url?.trim() || null, video_url: f.video_url?.trim() || null, video_formato: f.video_formato, pixel_meta_id: f.pixel_meta_id?.trim() || null, capi_ativa: f.capi_ativa,
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

      <Bloco titulo="Fila de espera" descricao="Quem se cadastrou pela página e aguarda contato. Chame no WhatsApp, mande a agenda e, depois da conversa, aprove: o parceiro e o acesso são criados na hora.">
        <FilaParceiros agendaUrl={cfg.data?.agenda_url ?? null} />
      </Bloco>

      <Bloco titulo="Cadastro na página">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">Fila de espera<span className="block text-xs text-neutro-300">Ligada, quem se cadastra entra na fila acima e recebe o acesso depois da conversa. Desligada, o acesso sai na hora, com a senha que a pessoa escolhe.</span></span>
          <Switch checked={f.modo_cadastro === "fila"} onCheckedChange={(v) => set("modo_cadastro", v ? "fila" : "acesso_direto")} disabled={desligado} />
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="lp-agenda">Agenda para os parceiros</Label>
          <Input id="lp-agenda" placeholder="https://calendar.app.google/..." value={f.agenda_url ?? ""} onChange={(e) => set("agenda_url", e.target.value)} disabled={desligado} />
          <p className="text-xs text-neutro-300">Página de agendamento do Google Agenda. Aparece no botão "Mandar a agenda" da fila.</p>
        </div>
      </Bloco>

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

    </div>
  );
}
