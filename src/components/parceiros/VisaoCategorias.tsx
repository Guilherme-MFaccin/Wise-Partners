import { Link } from "react-router-dom";
import { AlertTriangle, Star } from "lucide-react";
import { Pilula, SeloNivel } from "@/components/comum/Selos";
import { Vazio } from "@/components/comum/Estados";
import { ETAPAS, PERFIS_INSTITUCIONAIS, rotulo } from "@/lib/rotulos";
import { isAssinado, type Categoria, type Etapa, type ParceiroCategoria, type ParceiroLista } from "./dados";

type Item = { parceiro: ParceiroLista; principal: boolean };

// Visão por categoria de prateleira (FR-014, FR-015): total, assinados e aviso de menos de 3 assinados.
export function VisaoCategorias({
  parceiros, vinculos, categorias, etapas,
}: { parceiros: ParceiroLista[]; vinculos: ParceiroCategoria[]; categorias: Categoria[]; etapas: Etapa[] }) {
  const porId = new Map(parceiros.map((p) => [p.id, p]));
  const porCategoria = new Map<string, Item[]>();
  for (const v of vinculos) {
    const p = porId.get(v.parceiro_id);
    if (!p) continue;
    const l = porCategoria.get(v.categoria_id) ?? [];
    l.push({ parceiro: p, principal: v.principal });
    porCategoria.set(v.categoria_id, l);
  }
  const comCategoria = new Set(vinculos.map((v) => v.parceiro_id));
  const semCategoria = parceiros.filter((p) => !comCategoria.has(p.id));

  const ativas = categorias.filter((c) => c.ativa);
  const comerciais = ativas.filter((c) => c.tipo === "comercial");
  const institucionais = ativas.filter((c) => c.tipo === "institucional");
  const perfis = Object.keys(PERFIS_INSTITUCIONAIS);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Categorias comerciais</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comerciais.map((c) => (
            <CartaoCategoria key={c.id} categoria={c} itens={porCategoria.get(c.id) ?? []} etapas={etapas} avisarMinimo />
          ))}
        </div>
      </section>

      {institucionais.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Categorias institucionais</h2>
          {perfis.map((perfil) => {
            const cats = institucionais.filter((c) => c.perfil_institucional === perfil);
            if (!cats.length) return null;
            return (
              <div key={perfil}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-menta-400">{PERFIS_INSTITUCIONAIS[perfil]}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cats.map((c) => (
                    <CartaoCategoria key={c.id} categoria={c} itens={porCategoria.get(c.id) ?? []} etapas={etapas} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {semCategoria.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Sem categoria</h2>
          <div className="rounded-[14px] border border-white/10 bg-card p-4">
            <ListaItens itens={semCategoria.map((p) => ({ parceiro: p, principal: false }))} />
          </div>
        </section>
      )}

      {!parceiros.length && <Vazio titulo="Nenhum parceiro cadastrado ainda." />}
    </div>
  );
}

function CartaoCategoria({
  categoria, itens, etapas, avisarMinimo,
}: { categoria: Categoria; itens: Item[]; etapas: Etapa[]; avisarMinimo?: boolean }) {
  const assinados = itens.filter((i) => isAssinado(i.parceiro, etapas)).length;
  // Principais primeiro, depois por nome
  const ordenados = [...itens].sort(
    (a, b) => Number(b.principal) - Number(a.principal) || a.parceiro.nome_fantasia.localeCompare(b.parceiro.nome_fantasia, "pt-BR"),
  );
  return (
    <div className="flex min-w-0 flex-col rounded-[14px] border border-white/10 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 font-semibold leading-snug">{categoria.nome}</h4>
        {avisarMinimo && assinados < 3 && (
          <Pilula tom="alerta" className="shrink-0 gap-1">
            <AlertTriangle className="h-3 w-3" /> Menos de 3 assinados
          </Pilula>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {itens.length} {itens.length === 1 ? "parceiro" : "parceiros"} · {assinados} {assinados === 1 ? "assinado" : "assinados"}
      </p>
      {ordenados.length > 0 && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <ListaItens itens={ordenados} />
        </div>
      )}
    </div>
  );
}

function ListaItens({ itens }: { itens: Item[] }) {
  return (
    <ul className="space-y-2">
      {itens.map(({ parceiro: p, principal }) => (
        <li key={p.id} className="flex min-w-0 items-center gap-2 text-sm">
          <Star
            className={principal ? "h-3.5 w-3.5 shrink-0 fill-menta-400 text-menta-400" : "h-3.5 w-3.5 shrink-0 text-white/15"}
            aria-label={principal ? "Categoria principal" : "Categoria secundária"}
          />
          <Link to={`/app/parceiros/${p.id}`} className="min-w-0 flex-1 truncate hover:text-menta-400 hover:underline">
            {p.nome_fantasia}
          </Link>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{rotulo(ETAPAS, p.etapa)}</span>
          {p.nivel && <SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} className="shrink-0" />}
        </li>
      ))}
    </ul>
  );
}
