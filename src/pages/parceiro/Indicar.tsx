import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, ExternalLink, MessageCircle, Plus, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { useMeuParceiro, useParametro } from "@/components/portal/dados";
import { NovaIndicacaoDialog } from "@/components/portal/NovaIndicacaoDialog";

type LinkIndicacao = { token: string; empresas: string[]; envios: number };

async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(aviso);
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
}

// Indicar: link exclusivo com QR Code e texto sugerido (FR-128), mais o formulário de indicação da v1
export default function Indicar() {
  const { perfil } = useAuth();
  const pid = perfil?.parceiro_id;
  const parceiroQ = useMeuParceiro();
  const textoQ = useParametro<string>("link_indicacao_texto");
  const [nova, setNova] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const linkQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-link-indicacao", pid],
    queryFn: async () => ok<any>(await supabase.from("links_indicacao").select("token, empresas, envios")
      .eq("parceiro_id", pid).eq("ativo", true).maybeSingle()) as LinkIndicacao | null,
  });
  const url = linkQ.data ? `${window.location.origin}/i/${linkQ.data.token}` : null;

  useEffect(() => {
    let vivo = true;
    if (!url) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M", color: { dark: "#101012", light: "#ffffff" } })
      .then((d) => vivo && setQr(d))
      .catch(() => vivo && setQr(null));
    return () => { vivo = false; };
  }, [url]);

  if (linkQ.isLoading || parceiroQ.isLoading) return <Carregando />;
  if (linkQ.error) return <ErroCarga erro={linkQ.error} />;

  const sugerido = typeof textoQ.data === "string" && textoQ.data.trim()
    ? textoQ.data.trim()
    : "Conhece uma empresa que precisa estruturar a área comercial? Indique pelo nosso link e a Wise Makers entra em contato.";
  const mensagem = url ? `${sugerido}\n${url}` : sugerido;

  function baixarQr() {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = "qrcode-indicacao-wise-makers.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Indicar" descricao="Indique clientes para a Wise pelo seu link exclusivo ou pelo formulário."
        acoes={<Button onClick={() => setNova(true)}><Plus /> Registrar indicação</Button>} />

      {!url ? (
        <section className="rounded-[14px] border border-white/10 bg-card p-4 text-sm sm:p-5">
          <h2 className="font-semibold">Link exclusivo</h2>
          <p className="mt-2 text-muted-foreground">
            {parceiroQ.data?.tipo_parceria === "institucional"
              ? "O link exclusivo de indicação é para parcerias comerciais. Use o formulário para registrar indicações."
              : "O link exclusivo é criado na entrada em onboarding, depois da assinatura do contrato. Enquanto isso, use o formulário."}
          </p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className="min-w-0 space-y-5 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <div>
              <h2 className="font-semibold">Seu link exclusivo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Quem abrir o link vê uma página da Wise Makers com o nome da sua empresa e preenche os dados. A indicação entra atribuída a vocês.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" aria-label="Link exclusivo" />
                <div className="flex gap-2">
                  <Button onClick={() => copiar(url, "Link copiado.")} className="flex-1 sm:flex-none"><Copy /> Copiar</Button>
                  <Button variant="outline" asChild size="icon" aria-label="Abrir o link">
                    <a href={url} target="_blank" rel="noreferrer"><ExternalLink /></a>
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {linkQ.data!.envios === 1 ? "1 indicação recebida pelo link." : `${linkQ.data!.envios} indicações recebidas pelo link.`}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Texto sugerido para divulgar</h3>
              <p className="mt-2 whitespace-pre-line rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm">{mensagem}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => copiar(mensagem, "Texto copiado.")}><Copy /> Copiar texto e link</Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a>
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              O link é pessoal da sua empresa. Se precisar de um novo link, fale com o seu responsável na Wise. Acompanhe o que chegou em{" "}
              <Link to="/parceiro/indicacoes" className="text-menta-400 hover:underline">Indicações</Link>.
            </p>
          </section>

          <section className="flex flex-col items-center gap-3 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 self-start font-semibold"><QrCode className="h-4 w-4 text-menta-400" /> QR Code</h2>
            {qr ? (
              <img src={qr} alt="QR Code do link exclusivo de indicação" className="w-full max-w-[240px] rounded-[10px] bg-white p-2" />
            ) : (
              <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-[10px] bg-white/5 text-xs text-muted-foreground">Gerando...</div>
            )}
            <p className="text-center text-xs text-muted-foreground">Use em apresentações, eventos e materiais impressos.</p>
            <Button variant="outline" size="sm" onClick={baixarQr} disabled={!qr}><Download /> Baixar PNG</Button>
          </section>
        </div>
      )}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Formulário de indicação</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se você já conversou com o cliente, registre a indicação direto pelo portal, com o CNPJ e a necessidade dele.
        </p>
        <Button className="mt-3" onClick={() => setNova(true)}><Plus /> Registrar indicação</Button>
      </section>

      <NovaIndicacaoDialog aberto={nova} onClose={() => setNova(false)} />
    </div>
  );
}
