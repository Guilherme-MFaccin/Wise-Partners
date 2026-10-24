import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, ChevronDown, ChevronRight } from "lucide-react";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Barra, CLASSE_CARD } from "@/components/painel/Blocos";
import { nomePerfil, usePerfis } from "@/components/parceiros/dados";
import { data as fmtData } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { useModulos, useProgressoTrilha, type Certificado, type Tentativa, type Trilha } from "./dados";

type Pessoa = {
  perfil_id: string;
  nome: string;
  modulos: number;
  ultimoAcesso: string | null;
  tentativas: Tentativa[];
  certificado: Certificado | null;
};

type GrupoParceiro = { id: string; nome: string; pessoas: Pessoa[] };

// Progresso da trilha por parceiro e por pessoa (módulos, tentativas e certificado).
export function ProgressoTrilha({ trilha }: { trilha: Trilha }) {
  const modulos = useModulos(trilha.id);
  const moduloIds = (modulos.data ?? []).map((m) => m.id);
  const q = useProgressoTrilha(modulos.isSuccess ? trilha.id : null, moduloIds);
  const { data: perfis = [] } = usePerfis();
  const { data: parceiros = [] } = useParceirosResumo();
  const [aberto, setAberto] = useState<Set<string>>(new Set());
  const total = moduloIds.length;

  const grupos = useMemo<GrupoParceiro[]>(() => {
    if (!q.data) return [];
    const pessoas = new Map<string, Pessoa & { parceiro_id: string }>();
    const pessoa = (perfil: string, parceiro: string | null) => {
      let p = pessoas.get(perfil);
      if (!p) {
        p = { perfil_id: perfil, parceiro_id: parceiro ?? "", nome: nomePerfil(perfis, perfil), modulos: 0, ultimoAcesso: null, tentativas: [], certificado: null };
        pessoas.set(perfil, p);
      }
      if (!p.parceiro_id && parceiro) p.parceiro_id = parceiro;
      return p;
    };
    for (const g of q.data.prog) {
      const p = pessoa(g.perfil_id, g.parceiro_id);
      p.modulos++;
      if (!p.ultimoAcesso || g.concluido_em > p.ultimoAcesso) p.ultimoAcesso = g.concluido_em;
    }
    for (const t of q.data.tent) pessoa(t.perfil_id, t.parceiro_id).tentativas.push(t);
    for (const c of q.data.cert) {
      const p = pessoa(c.perfil_id, c.parceiro_id);
      p.certificado = c;
      if (!p.nome) p.nome = c.nome_pessoa;
    }
    const porParceiro = new Map<string, GrupoParceiro>();
    for (const p of pessoas.values()) {
      const nome = parceiros.find((x) => x.id === p.parceiro_id)?.nome_fantasia ?? "Sem parceiro";
      const g = porParceiro.get(p.parceiro_id) ?? { id: p.parceiro_id, nome, pessoas: [] };
      g.pessoas.push({ ...p, nome: p.nome || "Pessoa do parceiro" });
      porParceiro.set(p.parceiro_id, g);
    }
    return [...porParceiro.values()]
      .map((g) => ({ ...g, pessoas: g.pessoas.sort((a, b) => a.nome.localeCompare(b.nome)) }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [q.data, perfis, parceiros]);

  if (modulos.isLoading || q.isLoading) return <Carregando />;
  if (modulos.error || q.error) return <ErroCarga erro={modulos.error ?? q.error} />;
  if (!grupos.length) return <Vazio titulo="Ninguém começou esta trilha ainda." />;

  const alternar = (id: string) => setAberto((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });

  return (
    <ul className="space-y-2">
      {grupos.map((g) => {
        const certificados = g.pessoas.filter((p) => p.certificado?.ativo).length;
        const concluiram = g.pessoas.filter((p) => total > 0 && p.modulos >= total).length;
        const expandido = aberto.has(g.id);
        return (
          <li key={g.id} className={cn(CLASSE_CARD, "min-w-0")}>
            <button type="button" onClick={() => alternar(g.id)} className="flex w-full flex-col gap-2 p-3 text-left sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {expandido ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <span className="truncate font-semibold">{g.nome}</span>
              </span>
              <span className="flex flex-wrap gap-2 pl-6 sm:pl-0">
                <Pilula>{g.pessoas.length} pessoa(s)</Pilula>
                <Pilula tom="info">{concluiram} com módulos concluídos</Pilula>
                <Pilula tom={certificados ? "menta" : "neutro"}>{certificados} certificada(s)</Pilula>
              </span>
            </button>
            {expandido && (
              <div className="border-t border-white/10 p-3">
                {g.id && (
                  <Link to={`/app/parceiros/${g.id}`} className="mb-2 inline-block text-xs text-menta-400 hover:underline">Abrir ficha do parceiro</Link>
                )}
                <ul className="space-y-3">
                  {g.pessoas.map((p) => {
                    const ultima = p.tentativas[0];
                    return (
                      <li key={p.perfil_id} className="grid gap-2 text-sm sm:grid-cols-[1fr_180px_1fr] sm:items-center">
                        <span className="min-w-0 truncate font-medium">{p.nome}</span>
                        <span className="space-y-1">
                          <span className="block text-xs text-muted-foreground">Módulos {p.modulos} de {total}</span>
                          <Barra valor={p.modulos} maximo={Math.max(total, 1)} />
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-xs">
                          {p.certificado ? (
                            <Pilula tom={p.certificado.ativo ? "menta" : "neutro"}>
                              <Award className="mr-1 h-3 w-3" /> Certificado v{p.certificado.versao} em {fmtData(p.certificado.emitido_em)}
                              {!p.certificado.ativo && " (inativo)"}
                            </Pilula>
                          ) : ultima ? (
                            <Pilula tom="alerta">Última nota {Number(ultima.nota).toFixed(0)}% em {fmtData(ultima.created_at)}</Pilula>
                          ) : (
                            <span className="text-muted-foreground">Sem tentativa</span>
                          )}
                          {p.tentativas.length > 0 && <span className="text-muted-foreground">{p.tentativas.length} tentativa(s)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
