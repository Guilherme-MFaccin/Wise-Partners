import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, ImagePlus, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { NIVEIS, nomePilar } from "@/lib/diagnostico";

type ClienteLink = {
  id: string; created_at: string; empresa: string; status: string;
  resultado: { percentual: number; nivel: string; pilar_mais_fragil: string } | null;
};

const STATUS: Record<string, string> = {
  cadastrado: "Cadastrado", agenda_liberada: "Escolhendo horário", reuniao_agendada: "Reunião marcada", reuniao_feita: "Reunião feita",
  diagnostico_feito: "Diagnóstico feito", descartado: "Encerrado",
};

async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(aviso);
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
}

// Página de consultoria para os clientes do parceiro (/c/código): link, mensagem pronta, logo e quem entrou (FO-10).
// O parceiro vê empresa, data e andamento; o resultado só quando o cliente autorizou no cadastro.
export function LinkClientes({ parceiroId, nome }: { parceiroId: string; nome: string }) {
  const qc = useQueryClient();
  const arquivo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const linkQ = useQuery({
    queryKey: ["portal-link-cliente", parceiroId],
    retry: false,
    queryFn: async () => ok<any>(await supabase.rpc("garantir_link_cliente", { p_parceiro: parceiroId })) as string,
  });
  const logoQ = useQuery({
    queryKey: ["portal-logo", parceiroId],
    queryFn: async () => {
      const r = ok<any>(await supabase.from("parceiros").select("logo_caminho").eq("id", parceiroId).single()) as { logo_caminho: string | null };
      return r.logo_caminho ? supabase.storage.from("logos").getPublicUrl(r.logo_caminho).data.publicUrl : null;
    },
  });
  const clientesQ = useQuery({
    queryKey: ["portal-clientes-link", parceiroId],
    queryFn: async () => ok<any>(await supabase.rpc("clientes_do_link", { p_parceiro: parceiroId })) as ClienteLink[],
  });

  async function trocarLogo(f: File | undefined) {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) return toast.error("Use uma imagem PNG, JPG, WebP ou SVG.");
    if (f.size > 1024 * 1024) return toast.error("O logo precisa ter até 1 MB.");
    setEnviando(true);
    const ext = f.name.split(".").pop()?.toLowerCase() || "png";
    const caminho = `${parceiroId}/logo-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("logos").upload(caminho, f, { contentType: f.type, upsert: true });
    if (up.error) { setEnviando(false); return toastErro(up.error); }
    const { error } = await supabase.rpc("definir_logo_parceiro", { p_parceiro: parceiroId, p_caminho: caminho });
    setEnviando(false);
    if (error) return toastErro(error);
    toast.success("Logo atualizado. Ele já aparece na página.");
    qc.invalidateQueries({ queryKey: ["portal-logo", parceiroId] });
  }

  if (linkQ.isLoading) return <Carregando />;
  if (linkQ.error) {
    return (
      <section className="rounded-[14px] border border-white/10 bg-card p-4 text-sm sm:p-5">
        <h2 className="font-semibold">Consultoria para os seus clientes</h2>
        <p className="mt-2 text-muted-foreground">O link da consultoria é criado depois do aceite do termo ou da assinatura do contrato.</p>
      </section>
    );
  }
  const url = `${window.location.origin}/c/${linkQ.data}`;
  const mensagem = `A ${nome} agora inclui uma consultoria comercial da Wise Makers pra quem é nosso cliente, sem custo. Comece pelo diagnóstico do seu comercial:\n${url}`;

  return (
    <section className="space-y-5 rounded-[14px] border border-menta-500/30 bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-semibold">Consultoria para os seus clientes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mande este link para a sua base e para cada cliente novo. A página mostra o logo da {nome} ao lado da Wise Makers: o cliente faz o cadastro, o diagnóstico e recebe o acesso ao Wise Hub.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" aria-label="Link da consultoria para clientes" />
          <div className="flex gap-2">
            <Button onClick={() => copiar(url, "Link copiado.")} className="flex-1 sm:flex-none"><Copy /> Copiar</Button>
            <Button variant="outline" asChild size="icon" aria-label="Abrir a página">
              <a href={url} target="_blank" rel="noreferrer"><ExternalLink /></a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Mensagem pronta</h3>
          <p className="mt-2 whitespace-pre-line break-words rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm">{mensagem}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copiar(mensagem, "Mensagem copiada.")}><Copy /> Copiar mensagem</Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a>
            </Button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Seu logo na página</h3>
          <div className="mt-2 flex h-20 items-center justify-center rounded-[10px] border border-white/10 bg-white/5 p-3">
            {logoQ.data ? <img src={logoQ.data} alt={`Logo da ${nome}`} className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Sem logo: a página mostra o nome em texto.</span>}
          </div>
          <input ref={arquivo} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => trocarLogo(e.target.files?.[0])} />
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => arquivo.current?.click()} disabled={enviando}>
            {enviando ? <Loader2 className="animate-spin" /> : <ImagePlus />} {logoQ.data ? "Trocar o logo" : "Enviar o logo"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG ou SVG com fundo transparente, até 1 MB.</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Quem entrou pelo link</h3>
        {clientesQ.isLoading ? <Carregando /> : clientesQ.error ? <ErroCarga erro={clientesQ.error} /> : !clientesQ.data?.length ? (
          <p className="mt-2 text-sm text-muted-foreground">Ninguém ainda. Cada cliente que se cadastrar aparece aqui, com o andamento do diagnóstico.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow><TableHead>Data</TableHead><TableHead>Empresa</TableHead><TableHead>Andamento</TableHead><TableHead>Resultado</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {clientesQ.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{c.empresa}</TableCell>
                    <TableCell>{STATUS[c.status] ?? c.status}</TableCell>
                    <TableCell>{c.resultado ? (
                      <>{c.resultado.percentual}% · {NIVEIS[c.resultado.nivel]?.nome}<span className="block text-xs text-muted-foreground">Mais frágil: {nomePilar(c.resultado.pilar_mais_fragil)}</span></>
                    ) : <span className="text-muted-foreground">Sem autorização ou ainda não feito</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
