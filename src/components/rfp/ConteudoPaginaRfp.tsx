import { Loader2, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import type { BlocoPublico, ParceiroPublico } from "./tipos";

// Renderizador único da página de RFP: usado na página pública (/r/:token) e na pré-visualização
// do editor. Mostra só o que vem nos blocos; nada de nível, pacote, status ou comissão.
export function ConteudoPaginaRfp({
  clienteNome, necessidadeResumida, blocos, onFalar, falandoCom, previa = false,
}: {
  clienteNome: string;
  necessidadeResumida: string;
  blocos: BlocoPublico[];
  onFalar?: (p: ParceiroPublico) => void;
  falandoCom?: string | null;
  previa?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <Logo className="h-7 sm:h-8" />
        <span className="text-xs font-semibold uppercase tracking-wider text-menta-400">Seleção exclusiva</span>
      </header>
      {blocos.map((b, i) => (
        <Bloco key={i} bloco={b} clienteNome={clienteNome} necessidadeResumida={necessidadeResumida}
          onFalar={onFalar} falandoCom={falandoCom} previa={previa} />
      ))}
      <footer className="border-t border-white/10 pt-6 text-center text-xs text-neutro-300">
        Página preparada pela Wise Makers para {clienteNome || "o cliente"}.
      </footer>
    </div>
  );
}

function Bloco({
  bloco, clienteNome, necessidadeResumida, onFalar, falandoCom, previa,
}: {
  bloco: BlocoPublico; clienteNome: string; necessidadeResumida: string;
  onFalar?: (p: ParceiroPublico) => void; falandoCom?: string | null; previa: boolean;
}) {
  switch (bloco.tipo) {
    case "abertura":
      return (
        <section className="space-y-4">
          {clienteNome && <p className="text-sm font-semibold text-menta-400">{clienteNome}</p>}
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{bloco.titulo}</h1>
          {necessidadeResumida && (
            <p className="inline-flex rounded-full bg-menta-500/15 px-3 py-1 text-sm font-medium text-menta-300">
              Necessidade: {necessidadeResumida}
            </p>
          )}
          {bloco.texto && <p className="whitespace-pre-line text-base leading-relaxed text-neutro-100">{bloco.texto}</p>}
        </section>
      );
    case "categoria":
      return (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{bloco.titulo}</h2>
            {bloco.texto && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutro-300">{bloco.texto}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {bloco.parceiros.map((p) => (
              <CartaoParceiro key={p.parceiro_id} parceiro={p} onFalar={onFalar} carregando={falandoCom === p.parceiro_id} previa={previa} />
            ))}
          </div>
        </section>
      );
    case "aviso":
      return (
        <section className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm leading-relaxed text-neutro-100">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" />
          <p className="whitespace-pre-line">{bloco.texto}</p>
        </section>
      );
    case "consultor":
      return <BlocoConsultor nome={bloco.nome} email={bloco.email} telefone={bloco.telefone} texto={bloco.texto} />;
    default:
      return null;
  }
}

function CartaoParceiro({
  parceiro, onFalar, carregando, previa,
}: { parceiro: ParceiroPublico; onFalar?: (p: ParceiroPublico) => void; carregando: boolean; previa: boolean }) {
  const disponivel = parceiro.disponivel && !!parceiro.contato;
  return (
    <article className="flex flex-col rounded-[14px] border border-white/10 bg-card p-5">
      <h3 className="text-lg font-bold">{parceiro.nome}</h3>
      {parceiro.texto && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutro-100">{parceiro.texto}</p>}
      {parceiro.destaques?.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm text-neutro-100">
          {parceiro.destaques.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-menta-500" />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-5">
        {!disponivel ? (
          <Button disabled variant="secondary" className="w-full">Indisponível no momento</Button>
        ) : (
          <Button className="w-full" disabled={carregando} onClick={() => !previa && onFalar?.(parceiro)}
            title={previa ? "Na pré-visualização o botão não abre o contato" : undefined}>
            {carregando ? <Loader2 className="animate-spin" /> : parceiro.contato === "whatsapp" ? <MessageCircle /> : <Mail />}
            {parceiro.contato === "whatsapp" ? "Falar com este parceiro" : "Enviar e-mail"}
          </Button>
        )}
      </div>
    </article>
  );
}

export function BlocoConsultor({
  nome, email, telefone, texto,
}: { nome: string | null; email: string | null; telefone: string | null; texto?: string | null }) {
  const fone = (telefone ?? "").replace(/\D/g, "");
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-menta-400">Seu consultor da Wise Makers</p>
      {nome && <p className="mt-2 text-lg font-bold">{nome}</p>}
      {texto && <p className="mt-1 whitespace-pre-line text-sm text-neutro-100">{texto}</p>}
      <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
        {email && (
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 break-all text-menta-400 hover:underline">
            <Mail className="h-4 w-4 shrink-0" /> {email}
          </a>
        )}
        {telefone && (
          <a href={fone ? `tel:+${fone.startsWith("55") ? fone : "55" + fone}` : undefined}
            className="inline-flex items-center gap-2 text-menta-400 hover:underline">
            <Phone className="h-4 w-4 shrink-0" /> {telefone}
          </a>
        )}
      </div>
    </section>
  );
}
