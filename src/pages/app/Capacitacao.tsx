import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, ChevronRight, Lock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { useTrilhas } from "@/components/capacitacao/dados";
import { DetalheTrilha } from "@/components/capacitacao/DetalheTrilha";
import { TrilhaDialog } from "@/components/capacitacao/TrilhaDialog";
import { ProgressoTrilha } from "@/components/capacitacao/ProgressoTrilha";
import { ListaCertificados } from "@/components/capacitacao/ListaCertificados";
import { cn } from "@/lib/utils";

type Aba = "trilhas" | "progresso" | "certificados";

// Capacitação: administradores editam trilhas; parcerias, consultores e comercial acompanham.
export default function Capacitacao() {
  const { perfil, isAdmin } = useAuth();
  const papel = perfil?.papel;
  if (papel && !["admin", "parcerias", "consultor", "comercial"].includes(papel)) {
    return (
      <div>
        <Cabecalho titulo="Capacitação" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> A gestão de trilhas é interna.</span>
        </Vazio>
      </div>
    );
  }
  return <TelaCapacitacao isAdmin={isAdmin} />;
}

function TelaCapacitacao({ isAdmin }: { isAdmin: boolean }) {
  const [params, setParams] = useSearchParams();
  const trilhas = useTrilhas();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [nova, setNova] = useState(false);
  const lista = useMemo(() => trilhas.data ?? [], [trilhas.data]);

  const abaParam = params.get("aba") as Aba | null;
  const aba: Aba = abaParam === "progresso" || abaParam === "certificados" ? abaParam : "trilhas";
  const trilhaId = params.get("trilha");
  const selecionada = lista.find((t) => t.id === trilhaId) ?? null;
  const trilhaProgresso = selecionada ?? lista[0] ?? null;

  function mudar(chaves: Record<string, string | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(chaves)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  }

  return (
    <div>
      <Cabecalho
        titulo="Capacitação"
        descricao="Trilhas, módulos, testes e certificados. As trilhas ficam só no portal, nunca no Wise Hub."
        acoes={isAdmin && aba === "trilhas" && !selecionada && <Button onClick={() => setNova(true)}><Plus /> Nova trilha</Button>}
      />

      <Tabs value={aba} onValueChange={(v) => mudar({ aba: v === "trilhas" ? null : v })} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
          <TabsTrigger value="progresso">Progresso</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
        </TabsList>
      </Tabs>

      {trilhas.isLoading && <Carregando />}
      {trilhas.error && <ErroCarga erro={trilhas.error} />}

      {trilhas.isSuccess && aba === "trilhas" && (
        selecionada ? (
          <DetalheTrilha trilha={selecionada} onVoltar={() => mudar({ trilha: null })} />
        ) : !lista.length ? (
          <Vazio titulo="Nenhuma trilha cadastrada." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => mudar({ trilha: t.id })}
                  className={cn(CLASSE_CARD, "flex h-full w-full min-w-0 items-start gap-3 p-4 text-left transition hover:border-menta-500/50")}
                >
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" />
                  <span className="min-w-0 flex-1 space-y-1.5">
                    <span className="block break-words font-semibold">{t.titulo}</span>
                    {t.descricao && <span className="line-clamp-2 block text-sm text-muted-foreground">{t.descricao}</span>}
                    <span className="flex flex-wrap gap-2">
                      {t.publicada ? <Pilula tom="menta">Publicada</Pilula> : <Pilula tom="alerta">Rascunho</Pilula>}
                      <Pilula>Versão {t.versao}</Pilula>
                      <Pilula>Nota mínima {t.nota_minima}%</Pilula>
                      {t.empresa_grupo_id && <Pilula tom="info">{empresas.find((e) => e.id === t.empresa_grupo_id)?.nome ?? "Empresa"}</Pilula>}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {trilhas.isSuccess && aba === "progresso" && (
        !trilhaProgresso ? <Vazio titulo="Nenhuma trilha cadastrada." /> : (
          <div className="space-y-3">
            <div className="max-w-md">
              <Select value={trilhaProgresso.id} onValueChange={(v) => mudar({ trilha: v })}>
                <SelectTrigger aria-label="Trilha"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {lista.map((t) => <SelectItem key={t.id} value={t.id}>{t.titulo}{t.publicada ? "" : " (rascunho)"}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ProgressoTrilha trilha={trilhaProgresso} />
          </div>
        )
      )}

      {trilhas.isSuccess && aba === "certificados" && <ListaCertificados trilhas={lista} />}

      <TrilhaDialog aberto={nova} trilha={null} onFechar={() => setNova(false)} onCriada={(id) => mudar({ trilha: id })} />
    </div>
  );
}
