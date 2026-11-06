import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { FAIXAS_FATURAMENTO, NIVEIS, nomePilar } from "@/lib/diagnostico";

type Config = {
  publicada: boolean; video_url: string | null; video_formato: "auto" | "horizontal" | "vertical" | "quadrado"; agenda_url: string | null; hub_url: string;
  icp_min_vendedores: number; icp_faturamento_min: string | null;
};
type Cadastro = {
  id: string; created_at: string; parceiro_id: string; nome: string; email: string; whatsapp: string; empresa: string; cargo: string;
  faturamento_faixa: string; vendedores: number; segmento: string; desafio: string; autoriza_parceiro: boolean; icp: boolean; status: string;
  diagnostico_resultado: { percentual: number; nivel: string; pilar_mais_fragil: string } | null; parceiros: { nome_fantasia: string } | null;
};

export const STATUS_CLIENTE: Record<string, string> = {
  cadastrado: "Cadastrado", agenda_liberada: "Agenda liberada", reuniao_agendada: "Reunião marcada", reuniao_feita: "Reunião feita",
  diagnostico_feito: "Autodiagnóstico feito", descartado: "Descartado",
};
const COLUNAS = "id, created_at, parceiro_id, nome, email, whatsapp, empresa, cargo, faturamento_faixa, vendedores, segmento, desafio, autoriza_parceiro, icp, status, diagnostico_resultado, parceiros(nome_fantasia)";
const faixa = (v: string) => FAIXAS_FATURAMENTO.find((x) => x.valor === v)?.rotulo ?? v;
const data = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-5">
      <h3 className="text-base font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 text-sm text-neutro-300">{descricao}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

// Landing page do cliente do parceiro (/c/:codigo): publicação, vídeo, agenda, Wise Hub, regra do ICP e os cadastros.
// Pixel do Meta e GA4 são os mesmos da landing page dos parceiros. Administrador edita; time de parcerias consulta e muda a situação.
export function SecaoLandingCliente({ somenteLeitura }: { somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const cfg = useQuery({
    queryKey: ["config", "landing-cliente"],
    queryFn: async () => ok<any>(await supabase.from("config_landing_cliente").select("*").eq("id", 1).maybeSingle()) as Config | null,
  });
  const cad = useQuery({
    queryKey: ["config", "landing-cliente", "cadastros"],
    queryFn: async () => ok<any>(await supabase.from("cadastros_cliente").select(COLUNAS).order("created_at", { ascending: false }).limit(300)) as Cadastro[],
  });
  const [f, setF] = useState<Config | null>(null);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { if (cfg.data) setF(cfg.data); }, [cfg.data]);
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setF((x) => (x ? { ...x, [k]: v } : x));

  async function salvar() {
    if (!f) return;
    setSalvando(true);
    const { error } = await supabase.from("config_landing_cliente").update({
      publicada: f.publicada, video_url: f.video_url?.trim() || null, video_formato: f.video_formato, agenda_url: f.agenda_url?.trim() || null,
      hub_url: f.hub_url.trim(), icp_min_vendedores: f.icp_min_vendedores, icp_faturamento_min: f.icp_faturamento_min || null,
    }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Página do cliente atualizada.");
    qc.invalidateQueries({ queryKey: ["config", "landing-cliente"] });
  }

  async function mudarStatus(id: string, status: string) {
    const { error } = await supabase.from("cadastros_cliente").update({ status }).eq("id", id);
    if (error) return toastErro(error);
    qc.invalidateQueries({ queryKey: ["config", "landing-cliente", "cadastros"] });
  }

  if (cfg.isLoading) return <Carregando />;
  if (cfg.error) return <ErroCarga erro={cfg.error} />;
  if (!f) return <Vazio titulo="Configuração não encontrada">A migração da página do cliente ainda não foi aplicada neste banco.</Vazio>;
  const desligado = somenteLeitura;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutro-300">
        A página abre no link de cada parceiro (endereço /c/código), com o logo dele no topo. O link fica no portal do parceiro, em Indicar.
      </p>

      <Bloco titulo="Publicação, vídeo e agenda">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">Página no ar<span className="block text-xs text-neutro-300">Desligada, os links mostram que a página está pausada.</span></span>
          <Switch checked={f.publicada} onCheckedChange={(v) => set("publicada", v)} disabled={desligado} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lc-video">Endereço do vídeo</Label>
            <Input id="lc-video" placeholder="https://youtu.be/..." value={f.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} disabled={desligado} />
            <p className="text-xs text-neutro-300">Vazio, a página mostra a capa com o Igor.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-formato">Formato do vídeo</Label>
            <Select value={f.video_formato} onValueChange={(v) => set("video_formato", v as Config["video_formato"])} disabled={desligado}>
              <SelectTrigger id="lc-formato"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (Shorts em pé, os demais 16:9)</SelectItem>
                <SelectItem value="horizontal">Horizontal 16:9</SelectItem>
                <SelectItem value="vertical">Vertical 9:16</SelectItem>
                <SelectItem value="quadrado">Quadrado 1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-agenda">Página de agendamento do Google Agenda</Label>
            <Input id="lc-agenda" placeholder="https://calendar.app.google/..." value={f.agenda_url ?? ""} onChange={(e) => set("agenda_url", e.target.value)} disabled={desligado} />
            <p className="text-xs text-neutro-300">Quem está no ICP escolhe o horário aqui. Vazio, a página avisa que a equipe chama no WhatsApp.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="lc-hub">Link do Wise Hub depois do autodiagnóstico</Label>
            <Input id="lc-hub" value={f.hub_url} onChange={(e) => set("hub_url", e.target.value)} disabled={desligado} />
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Quem vai para a reunião (ICP)" descricao="Quem atende à regra escolhe o horário da reunião; os demais fazem o autodiagnóstico na hora e recebem o link do Hub.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lc-vend">Vendedores, no mínimo</Label>
            <Input id="lc-vend" type="number" min={1} value={f.icp_min_vendedores} onChange={(e) => set("icp_min_vendedores", Math.max(1, Number(e.target.value) || 1))} disabled={desligado} />
            <p className="text-xs text-neutro-300">4 = mais de 3 vendedores (decisão do FO-10).</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lc-fat">Faturamento mínimo por mês</Label>
            <Select value={f.icp_faturamento_min ?? "sem"} onValueChange={(v) => set("icp_faturamento_min", v === "sem" ? null : v)} disabled={desligado}>
              <SelectTrigger id="lc-fat"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem">Sem mínimo</SelectItem>
                {FAIXAS_FATURAMENTO.map((x) => <SelectItem key={x.valor} value={x.valor}>{x.rotulo} ou mais</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Bloco>

      {!somenteLeitura && (
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Save className="mr-2 h-4 w-4" aria-hidden />}Salvar a página do cliente
          </Button>
        </div>
      )}

      <Bloco titulo="Cadastros pela página" descricao="Os 300 mais recentes, com o parceiro de origem. Mude a situação quando a reunião for marcada ou feita.">
        {cad.isLoading ? <Carregando /> : cad.error ? <ErroCarga erro={cad.error} /> : !cad.data?.length ? (
          <p className="text-sm text-neutro-300">Nenhum cadastro ainda. Eles aparecem aqui assim que um cliente de parceiro conclui o cadastro.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead><TableHead>Empresa</TableHead><TableHead>Contato</TableHead><TableHead>Parceiro</TableHead>
                  <TableHead>Perfil</TableHead><TableHead>Diagnóstico</TableHead><TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cad.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{data(c.created_at)}</TableCell>
                    <TableCell className="min-w-[180px]">{c.empresa}<span className="block text-xs text-neutro-300">{c.segmento}</span><span className="block text-xs text-neutro-300">{c.desafio}</span></TableCell>
                    <TableCell className="min-w-[180px]">{c.nome}<span className="block text-xs text-neutro-300">{c.cargo}</span><span className="block text-xs text-neutro-300">{c.email} · {c.whatsapp}</span></TableCell>
                    <TableCell>{c.parceiros?.nome_fantasia ?? "Sem parceiro"}{c.autoriza_parceiro && <span className="block text-xs text-neutro-300">autorizou compartilhar</span>}</TableCell>
                    <TableCell className="whitespace-nowrap">{c.icp ? <span className="font-semibold">ICP</span> : "Fora do ICP"}<span className="block text-xs text-neutro-300">{c.vendedores} vendedores · {faixa(c.faturamento_faixa)}</span></TableCell>
                    <TableCell className="whitespace-nowrap">{c.diagnostico_resultado ? (
                      <>{c.diagnostico_resultado.percentual}% · {NIVEIS[c.diagnostico_resultado.nivel]?.nome ?? c.diagnostico_resultado.nivel}
                        <span className="block text-xs text-neutro-300">Mais frágil: {nomePilar(c.diagnostico_resultado.pilar_mais_fragil)}</span></>
                    ) : <span className="text-neutro-300">Ainda não</span>}</TableCell>
                    <TableCell className="min-w-[170px]">
                      <Select value={c.status} onValueChange={(v) => mudarStatus(c.id, v)}>
                        <SelectTrigger className="h-8 text-xs" aria-label={`Situação de ${c.empresa}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_CLIENTE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-neutro-300">Para abrir a ficha de um parceiro: <Link className="text-menta-300 hover:underline" to="/app/parceiros">Parceiros</Link>.</p>
      </Bloco>
    </div>
  );
}
