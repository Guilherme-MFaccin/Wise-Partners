import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { carregarTexto } from "@/lib/landing";

// Termo de adesão e política de privacidade da landing page, com o texto vigente da configuração do portal.
export default function TextoLegalParceiros({ qual }: { qual: "termo" | "privacidade" }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["texto-legal", qual], queryFn: () => carregarTexto(qual), retry: 1 });

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    if (data) document.title = `Wise Partners | ${data.titulo}`;
  }, [data]);

  const blocos = (data?.texto ?? "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo className="h-7" />
          <Button asChild variant="ghost" size="sm"><Link to="/parceiros"><ArrowLeft className="mr-1 h-4 w-4" aria-hidden />Voltar</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando o texto">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-white/5" style={{ width: `${70 + ((i * 7) % 30)}%` }} />)}
          </div>
        )}
        {isError && (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">Não conseguimos abrir o texto agora.</p>
            <Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
          </div>
        )}
        {data && (
          <article className="space-y-4">
            {blocos.map((b, i) =>
              b.startsWith("## ") ? (
                i === 0
                  ? <h1 key={i} className="text-[28px] font-semibold leading-tight">{b.slice(3)}</h1>
                  : <h2 key={i} className="pt-4 text-lg font-semibold">{b.slice(3)}</h2>
              ) : (
                <p key={i} className="max-w-[68ch] text-neutro-100">{b}</p>
              ),
            )}
            <p className="border-t border-white/10 pt-4 text-sm text-neutro-300">
              Versão de {data.versao.split("-").reverse().join("/")}.{data.contato ? ` Contato de privacidade: ${data.contato}.` : ""}
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
