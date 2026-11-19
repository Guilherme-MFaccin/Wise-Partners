import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BarraSalvar, CampoTexto, Cartao, EsqueletoEditor, TEM_TRAVESSAO } from "@/components/paginas/Campos";
import { CHAVES, useConfigParceiros, useFormulario } from "@/components/paginas/dados";

// Termo de adesão e política de privacidade (config_landing). Cada cadastro guarda a versão que aceitou.
export function AbaTextosLegais({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigParceiros();
  const dados = useMemo(() => (cfg.data ? {
    termo_versao: cfg.data.termo_versao, termo_texto: cfg.data.termo_texto, privacidade_versao: cfg.data.privacidade_versao,
    privacidade_texto: cfg.data.privacidade_texto, contato_privacidade: cfg.data.contato_privacidade,
  } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);

  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!cfg.data || !form.f) return <Vazio titulo="Configuração não encontrada">A migração das páginas ainda não foi aplicada neste banco.</Vazio>;
  const f = form.f;
  const versaoMudou = (campo: "termo" | "privacidade") =>
    f[`${campo}_texto`] !== dados![`${campo}_texto`] && f[`${campo}_versao`] === dados![`${campo}_versao`];

  async function salvar() {
    if (TEM_TRAVESSAO.test(f.termo_texto + f.privacidade_texto)) return toast.error("Há travessão ou meia-risca no texto. Troque por vírgula, dois-pontos ou ponto.");
    if (!f.termo_texto.trim() || !f.privacidade_texto.trim()) return toast.error("Os dois textos precisam estar preenchidos.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contato_privacidade.trim())) return toast.error("Informe um e-mail de privacidade válido.");
    setSalvando(true);
    const { error } = await supabase.from("config_landing").update({ ...f, contato_privacidade: f.contato_privacidade.trim() }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Textos legais atualizados.");
    qc.invalidateQueries({ queryKey: CHAVES.parceiros });
  }

  return (
    <div className="space-y-4">
      <Cartao titulo="Termo de adesão" descricao="O parceiro aceita este termo no cadastro. Mudou o texto, mude a versão: cada cadastro guarda a versão que aceitou."
        acoes={<Button asChild variant="ghost" size="sm"><Link to="/parceiros/termo" target="_blank"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Ver o termo</Link></Button>}>
        <div className="sm:w-56">
          <CampoTexto rotulo="Versão" tipo="date" valor={f.termo_versao} aoMudar={(v) => form.set("termo_versao", v)} desligado={desligado} maximo={10}
            ajuda={versaoMudou("termo") ? "O texto mudou: atualize a data da versão." : undefined} />
        </div>
        <CampoTexto rotulo="Texto do termo" longo valor={f.termo_texto} aoMudar={(v) => form.set("termo_texto", v)} desligado={desligado} maximo={60000}
          ajuda='Títulos começam com "## ". Parágrafos separados por uma linha em branco.' />
      </Cartao>

      <Cartao titulo="Política de privacidade" descricao="Vale para as duas páginas. O link aparece no rodapé e nas caixas de aceite."
        acoes={<Button asChild variant="ghost" size="sm"><Link to="/parceiros/privacidade" target="_blank"><ExternalLink className="mr-1 h-4 w-4" aria-hidden />Ver a política</Link></Button>}>
        <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
          <CampoTexto rotulo="Versão" tipo="date" valor={f.privacidade_versao} aoMudar={(v) => form.set("privacidade_versao", v)} desligado={desligado} maximo={10}
            ajuda={versaoMudou("privacidade") ? "O texto mudou: atualize a data da versão." : undefined} />
          <CampoTexto rotulo="E-mail de privacidade" tipo="email" valor={f.contato_privacidade} aoMudar={(v) => form.set("contato_privacidade", v)} desligado={desligado} maximo={160} />
        </div>
        <CampoTexto rotulo="Texto da política" longo valor={f.privacidade_texto} aoMudar={(v) => form.set("privacidade_texto", v)} desligado={desligado} maximo={60000} />
      </Cartao>

      {!desligado && <BarraSalvar sujo={form.sujo} salvando={salvando} aoSalvar={salvar} aoDescartar={form.descartar} texto="Salvar textos legais" />}
    </div>
  );
}

// Pixel do Meta e GA4: valem para as duas páginas. Tokens de API ficam nos segredos do servidor, nunca aqui.
export function AbaMedicao({ desligado }: { desligado: boolean }) {
  const qc = useQueryClient();
  const cfg = useConfigParceiros();
  const dados = useMemo(() => (cfg.data ? { pixel_meta_id: cfg.data.pixel_meta_id ?? "", ga4_id: cfg.data.ga4_id ?? "", capi_ativa: cfg.data.capi_ativa } : null), [cfg.data]);
  const form = useFormulario(dados);
  const [salvando, setSalvando] = useState(false);

  if (cfg.isLoading) return <EsqueletoEditor />;
  if (cfg.error) return <ErroCarga erro={cfg.error} aoTentar={() => cfg.refetch()} />;
  if (!cfg.data || !form.f) return <Vazio titulo="Configuração não encontrada">A migração das páginas ainda não foi aplicada neste banco.</Vazio>;
  const f = form.f;
  const pixelOk = f.pixel_meta_id === "" || /^[0-9]{6,20}$/.test(f.pixel_meta_id);
  const ga4 = f.ga4_id.trim().toUpperCase();
  const ga4Ok = ga4 === "" || /^G-[A-Z0-9]{4,15}$/.test(ga4);

  async function salvar() {
    if (!pixelOk || !ga4Ok) return toast.error("Confira os IDs: o pixel tem só números e o GA4 começa com G-.");
    setSalvando(true);
    const { error } = await supabase.from("config_landing").update({
      pixel_meta_id: f.pixel_meta_id || null, ga4_id: ga4 || null, capi_ativa: f.pixel_meta_id ? f.capi_ativa : false,
    }).eq("id", 1);
    setSalvando(false);
    if (error) return toastErro(error);
    form.salvo();
    toast.success("Medição atualizada nas duas páginas.");
    qc.invalidateQueries({ queryKey: CHAVES.parceiros });
  }

  return (
    <div className="space-y-4">
      <Cartao titulo="Medição dos anúncios" descricao="Os scripts só carregam com o ID preenchido e valem para as duas páginas. Tokens de API não entram aqui: ficam nos segredos do servidor.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="ID do pixel do Meta" valor={f.pixel_meta_id} desligado={desligado} placeholder="Só números" maximo={20}
            aoMudar={(v) => form.set("pixel_meta_id", v.replace(/\D/g, ""))} ajuda={pixelOk ? "Vazio, o pixel não carrega." : "O ID do pixel tem de 6 a 20 números."} />
          <CampoTexto rotulo="ID do Google Analytics 4" valor={f.ga4_id} desligado={desligado} placeholder="G-XXXXXXX" maximo={20}
            aoMudar={(v) => form.set("ga4_id", v)} ajuda={ga4Ok ? "Vazio, o GA4 não carrega." : "O ID do GA4 começa com G-."} />
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm">API de Conversões do Meta<span className="block text-xs text-neutro-300">Envia o cadastro de parceiro também pelo servidor. Exige o pixel preenchido e o segredo META_CAPI_TOKEN na função cadastro-parceiro.</span></span>
          <Switch checked={f.capi_ativa && !!f.pixel_meta_id} onCheckedChange={(v) => form.set("capi_ativa", v)} disabled={desligado || !f.pixel_meta_id} aria-label="API de Conversões do Meta" />
        </label>
      </Cartao>
      <Cartao titulo="O que é medido">
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutro-300">
          <li>Página dos parceiros: visita e cadastro (CompleteRegistration no Meta, sign_up no GA4).</li>
          <li>Página do cliente: visita e cadastro (Lead no Meta, generate_lead no GA4), separando quem está no perfil da reunião.</li>
          <li>A origem do anúncio (UTM) fica gravada em cada cadastro.</li>
        </ul>
      </Cartao>
      {!desligado && <BarraSalvar sujo={form.sujo} salvando={salvando} aoSalvar={salvar} aoDescartar={form.descartar} texto="Salvar medição" />}
    </div>
  );
}
