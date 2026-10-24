import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type Dados =
  | { estado: "ok"; parceiro: string; empresas: { codigo: string; nome: string; descricao: string | null }[]; criterios_icp: { chave: string; descricao: string }[] }
  | { estado: "indisponivel" };

const URL_FUNCAO = `${import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321"}/functions/v1/indicacao-publica`;
const CHAVE = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "anon") as string;
const CABECALHOS = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };

const VAZIO = {
  empresa: "", cliente_razao_social: "", cliente_cnpj: "", contato_nome: "", contato_cargo: "", contato_email: "", contato_telefone: "",
  necessidade: "", consentimento: false, website: "",
};

// Página pública do link exclusivo de indicação (/i/:token), sem login e fora dos buscadores.
// O envio sempre mostra a mesma mensagem neutra, aconteça o que acontecer no servidor.
export default function IndicacaoLink() {
  const { token = "" } = useParams();
  const [f, setF] = useState(VAZIO);
  const [icp, setIcp] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const set = (k: keyof typeof VAZIO, v: any) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = "Wise Makers | Indicação";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = tituloAnterior;
      meta.remove();
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["indicacao-publica", token],
    retry: false,
    staleTime: Infinity,
    queryFn: async (): Promise<Dados> => {
      try {
        const r = await fetch(`${URL_FUNCAO}?token=${encodeURIComponent(token)}`, { headers: CABECALHOS });
        if (!r.ok) return { estado: "indisponivel" };
        const d = await r.json();
        return d?.estado === "ok" ? (d as Dados) : { estado: "indisponivel" };
      } catch {
        return { estado: "indisponivel" };
      }
    },
  });

  const empresas = data?.estado === "ok" ? data.empresas : [];
  const empresa = empresas.length === 1 ? empresas[0].codigo : f.empresa;
  const emailOk = !f.contato_email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contato_email.trim());
  const valido = !!empresa && !!f.cliente_razao_social.trim() && !!f.contato_nome.trim()
    && !!(f.contato_email.trim() || f.contato_telefone.trim()) && emailOk && f.consentimento;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      await fetch(URL_FUNCAO, {
        method: "POST",
        headers: { ...CABECALHOS, "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          empresa,
          cliente_razao_social: f.cliente_razao_social.trim(),
          cliente_cnpj: f.cliente_cnpj.trim(),
          contato_nome: f.contato_nome.trim(),
          contato_cargo: f.contato_cargo.trim(),
          contato_email: f.contato_email.trim(),
          contato_telefone: f.contato_telefone.trim(),
          necessidade: f.necessidade.trim(),
          aderencia_icp: icp,
          consentimento: f.consentimento,
          website: f.website,
        }),
      });
    } catch {
      // Resposta neutra mesmo em falha de rede
    }
    setEnviando(false);
    setEnviado(true);
    setF(VAZIO);
    setIcp({});
    window.scrollTo({ top: 0 });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Logo className="h-8" />
        <Loader2 className="h-5 w-5 animate-spin text-menta-400" />
      </div>
    );
  }

  if (!data || data.estado !== "ok") {
    return (
      <Moldura>
        <div className="rounded-[14px] border border-white/10 bg-card p-6">
          <p className="text-lg font-semibold">Link indisponível.</p>
          <p className="mt-2 text-sm text-neutro-300">Este link de indicação não está disponível. Fale com quem enviou o link para você.</p>
        </div>
      </Moldura>
    );
  }

  if (enviado) {
    return (
      <Moldura>
        <div className="rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-6">
          <CheckCircle2 className="h-8 w-8 text-menta-400" />
          <p className="mt-3 text-lg font-semibold">Obrigado! Recebemos as informações.</p>
          <p className="mt-2 text-sm text-neutro-300">Se a indicação seguir para análise, a Wise Makers entra em contato pelos dados informados.</p>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <section className="space-y-3">
        <p className="text-sm font-semibold text-menta-400">Indicação de {data.parceiro}</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Fale com a Wise Makers</h1>
        <p className="text-base leading-relaxed text-neutro-100">
          {data.parceiro} é parceira da Wise Makers. Conte um pouco sobre a sua empresa e o que você precisa; a nossa equipe entra em contato.
        </p>
      </section>

      <form onSubmit={enviar} className="space-y-6" noValidate>
        {/* Campo oculto contra robôs: pessoas não veem nem preenchem */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="website">Site</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
        </div>

        {empresas.length > 1 && (
          <fieldset className="space-y-3 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold">Com qual empresa você quer falar?</legend>
            <RadioGroup value={f.empresa} onValueChange={(v) => set("empresa", v)} className="gap-2">
              {empresas.map((e) => (
                <label key={e.codigo} className="flex cursor-pointer gap-3 rounded-[10px] border border-white/10 p-3 has-[[data-state=checked]]:border-menta-500">
                  <RadioGroupItem value={e.codigo} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{e.nome}</span>
                    {e.descricao && <span className="block text-xs text-neutro-300">{e.descricao}</span>}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </fieldset>
        )}

        <fieldset className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold">Sua empresa</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="razao" rotulo="Razão social ou nome da empresa *">
              <Input id="razao" autoComplete="organization" value={f.cliente_razao_social} onChange={(e) => set("cliente_razao_social", e.target.value)} maxLength={200} />
            </Campo>
            <Campo id="cnpj" rotulo="CNPJ">
              <Input id="cnpj" inputMode="numeric" value={f.cliente_cnpj} onChange={(e) => set("cliente_cnpj", e.target.value)} maxLength={20} />
            </Campo>
          </div>
          {data.criterios_icp.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Marque o que vale para a sua empresa:</p>
              {data.criterios_icp.map((c) => (
                <label key={c.chave} className="flex cursor-pointer gap-2 rounded-[10px] border border-white/10 p-3 text-sm">
                  <Checkbox checked={!!icp[c.chave]} onCheckedChange={(v) => setIcp((x) => ({ ...x, [c.chave]: !!v }))} className="mt-0.5" />
                  <span>{c.descricao}</span>
                </label>
              ))}
            </div>
          )}
          <Campo id="necessidade" rotulo="O que você precisa?">
            <Textarea id="necessidade" rows={4} value={f.necessidade} onChange={(e) => set("necessidade", e.target.value)} maxLength={2000}
              placeholder="Ex.: estruturar o processo comercial, formar a equipe de vendas, gerar mais oportunidades." />
          </Campo>
        </fieldset>

        <fieldset className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold">Seus dados de contato</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nome" rotulo="Nome *">
              <Input id="nome" autoComplete="name" value={f.contato_nome} onChange={(e) => set("contato_nome", e.target.value)} maxLength={120} />
            </Campo>
            <Campo id="cargo" rotulo="Cargo">
              <Input id="cargo" autoComplete="organization-title" value={f.contato_cargo} onChange={(e) => set("contato_cargo", e.target.value)} maxLength={120} />
            </Campo>
            <Campo id="email" rotulo="E-mail">
              <Input id="email" type="email" autoComplete="email" value={f.contato_email} onChange={(e) => set("contato_email", e.target.value)} maxLength={160}
                aria-invalid={!emailOk} />
              {!emailOk && <p className="text-xs text-red-300">Confira o e-mail.</p>}
            </Campo>
            <Campo id="telefone" rotulo="Telefone ou WhatsApp">
              <Input id="telefone" type="tel" inputMode="tel" autoComplete="tel" value={f.contato_telefone} onChange={(e) => set("contato_telefone", e.target.value)} maxLength={40} />
            </Campo>
          </div>
          <p className="text-xs text-neutro-300">Informe ao menos um e-mail ou telefone.</p>
        </fieldset>

        <label className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm leading-relaxed">
          <Checkbox checked={f.consentimento} onCheckedChange={(c) => set("consentimento", !!c)} className="mt-0.5" />
          <span>
            Autorizo a Wise Makers a usar os dados informados para entrar em contato comigo sobre esta indicação, conforme a Lei Geral de Proteção de Dados
            (Lei 13.709/2018). A empresa parceira que enviou o link será informada do andamento. Posso pedir a exclusão dos meus dados a qualquer momento. *
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!valido || enviando}>
          {enviando ? <Loader2 className="animate-spin" /> : <Send />} Enviar
        </Button>
      </form>
    </Moldura>
  );
}

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="flex items-center justify-between gap-3">
          <Logo className="h-7 sm:h-8" />
          <span className="text-xs font-semibold uppercase tracking-wider text-menta-400">Indicação</span>
        </header>
        {children}
        <footer className="flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-center text-xs text-neutro-300">
          <ShieldCheck className="h-4 w-4 text-menta-400" /> Wise Makers · seus dados são usados só para o contato desta indicação.
        </footer>
      </div>
    </div>
  );
}
