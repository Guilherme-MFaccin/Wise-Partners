import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";

type Documento = { titulo: string; versao: string; html: string; atualizado_em: string };

// O documento é uma página HTML completa (abas, calculadora, BPMN). Roda isolado num iframe, sem acesso à sessão do portal.
function paginaCompleta(html: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${html}</body></html>`;
}

// Modelo de negócio e arquitetura de processos do Programa Wise Partners: gerado do mapeamento e publicado no banco.
// Só o time interno lê (RLS em documentos_internos).
export default function ModeloProcessos() {
  const doc = useQuery({
    queryKey: ["documento-interno", "modelo-e-processos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documentos_internos" as any).select("titulo, versao, html, atualizado_em").eq("chave", "modelo-e-processos").maybeSingle();
      if (error) throw error;
      return (data as unknown as Documento) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
  const srcDoc = useMemo(() => (doc.data ? paginaCompleta(doc.data.html) : ""), [doc.data]);
  const quando = doc.data ? new Date(doc.data.atualizado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "") : "";

  return (
    <div className="flex h-full flex-col">
      <Cabecalho
        titulo="Modelo de negócio e arquitetura de processos"
        descricao={doc.data
          ? `Como o programa cria valor, quanto custa e rende, e quem faz o quê em cada processo. Versão ${doc.data.versao}, atualizada em ${quando}.`
          : "Como o programa cria valor, quanto custa e rende, e quem faz o quê em cada processo."}
      />
      {doc.isLoading && <Carregando texto="Carregando o documento..." />}
      {doc.error && <ErroCarga erro={doc.error} />}
      {doc.isSuccess && !doc.data && (
        <Vazio titulo="O documento ainda não foi publicado">Ele é gerado a partir do mapeamento de processos e publicado pelo administrador.</Vazio>
      )}
      {doc.data && (
        <iframe
          title={doc.data.titulo}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads"
          className="min-h-[75vh] w-full flex-1 rounded-[14px] border border-white/10 bg-white"
        />
      )}
    </div>
  );
}
