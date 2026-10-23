import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Download, ExternalLink, FileText, Globe, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { TIPOS_DOCUMENTO, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando } from "@/components/comum/Estados";
import { useEmpresasGrupo } from "@/components/rfp/dados";
import { baixarArquivo, useParametro } from "@/components/portal/dados";

type Material = { titulo: string; link: string };
type Mentoria = { data: string; titulo: string; link?: string };
type Evento = { data: string; titulo: string; local?: string; link?: string };

const lista = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default function Materiais() {
  const { perfil } = useAuth();
  const documentosQ = useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-documentos", perfil?.parceiro_id],
    // A RLS só devolve documentos da própria empresa marcados como visíveis ao parceiro
    queryFn: async () => ok<any>(await supabase.from("documentos").select("id, tipo, nome, caminho, created_at")
      .eq("parceiro_id", perfil!.parceiro_id).eq("visivel_parceiro", true).order("created_at", { ascending: false })) as
      { id: string; tipo: string; nome: string; caminho: string; created_at: string }[],
  });
  const materiaisQ = useParametro("materiais_parceiro");
  const mentoriaQ = useParametro("calendario_mentoria");
  const eventosQ = useParametro("calendario_eventos");
  const { data: empresas = [] } = useEmpresasGrupo();

  const hoje = hojeISO();
  const proximas = <T extends { data: string }>(v: T[]) => v.filter((x) => (x.data ?? "") >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  const mentorias = proximas(lista<Mentoria>(mentoriaQ.data));
  const eventos = proximas(lista<Evento>(eventosQ.data));
  const materiais = lista<Material>(materiaisQ.data);
  const documentos = documentosQ.data ?? [];

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Materiais e agenda" descricao="Certificado, selos, apresentações, mentoria mensal, eventos e as empresas do grupo." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Documentos da sua empresa</h2>
          {documentosQ.isLoading ? <Carregando /> : documentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">O certificado, os selos e as apresentações aparecem aqui quando a Wise disponibilizar.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {documentos.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-menta-400" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{d.nome}</span>
                      <span className="text-xs text-muted-foreground">{rotulo(TIPOS_DOCUMENTO, d.tipo)} · {data(d.created_at)}</span>
                    </span>
                  </span>
                  <Button size="sm" variant="outline" onClick={() => baixarArquivo("documentos", d.caminho).catch(toastErro)}>
                    <Download /> Baixar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Materiais para parceiros</h2>
          {materiais.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum material publicado ainda.</p> : (
            <ul className="space-y-2">
              {materiais.map((m, i) => (
                <li key={i}>
                  <a href={m.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-menta-400 hover:underline">
                    <ExternalLink className="h-4 w-4 shrink-0" /> {m.titulo}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Mentoria mensal</h2>
          {mentorias.length === 0 ? <p className="text-sm text-muted-foreground">As próximas edições da mentoria mensal aparecem aqui.</p> : (
            <ul className="space-y-3">
              {mentorias.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
                  <div className="min-w-0">
                    <p className="font-medium">{data(m.data)} · {m.titulo}</p>
                    {m.link && <a href={m.link} target="_blank" rel="noreferrer" className="break-all text-menta-400 hover:underline">Link de acesso</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Eventos</h2>
          {eventos.length === 0 ? <p className="text-sm text-muted-foreground">Os próximos eventos aparecem aqui.</p> : (
            <ul className="space-y-3">
              {eventos.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
                  <div className="min-w-0">
                    <p className="font-medium">{data(e.data)} · {e.titulo}</p>
                    {e.local && <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {e.local}</p>}
                    {e.link && <a href={e.link} target="_blank" rel="noreferrer" className="break-all text-menta-400 hover:underline">Mais informações</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Empresas do grupo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {empresas.map((e) => (
            <article key={e.id} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
              <h3 className="font-semibold">{e.nome}</h3>
              {e.descricao_institucional && <p className="mt-2 whitespace-pre-line text-sm text-neutro-100">{e.descricao_institucional}</p>}
              {e.site && (
                <a href={e.site} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 break-all text-sm text-menta-400 hover:underline">
                  <Globe className="h-4 w-4 shrink-0" /> {e.site.replace(/^https?:\/\//, "")}
                </a>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
