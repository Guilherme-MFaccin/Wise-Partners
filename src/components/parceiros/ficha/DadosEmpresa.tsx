import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pilula } from "@/components/comum/Selos";
import { toastErro } from "@/lib/erros";
import { formatarCnpj } from "@/lib/formato";
import { NATUREZAS, PERFIS_INSTITUCIONAIS, TIPOS_PARCERIA, rotulo } from "@/lib/rotulos";
import { Campo, Info, Secao } from "../ui";
import {
  invalidarParceiro, nomePerfil, perfisInternos, useCategorias, useParceiroCategorias, usePerfis, type Parceiro,
} from "../dados";

const NENHUM = "__nenhum";

type Form = {
  nome_fantasia: string; razao_social: string; cnpj: string; site: string; cidade: string; uf: string; endereco: string;
  instagram: string; linkedin: string; outro: string; tipo_parceria: string; natureza_juridica: string; perfil_institucional: string;
  categoria_empresa: string; origem: string; responsavel_id: string; autorizacao_marca: boolean;
};

function paraForm(p: Parceiro): Form {
  const r = p.redes_sociais ?? {};
  return {
    nome_fantasia: p.nome_fantasia, razao_social: p.razao_social ?? "", cnpj: p.cnpj ?? "", site: p.site ?? "",
    cidade: p.cidade ?? "", uf: p.uf ?? "", endereco: p.endereco ?? "", instagram: r.instagram ?? "", linkedin: r.linkedin ?? "",
    outro: r.outro ?? "", tipo_parceria: p.tipo_parceria, natureza_juridica: p.natureza_juridica ?? "",
    perfil_institucional: p.perfil_institucional ?? "", categoria_empresa: p.categoria_empresa ?? "", origem: p.origem ?? "",
    responsavel_id: p.responsavel_id ?? "", autorizacao_marca: p.autorizacao_marca,
  };
}

const nulo = (t: string) => (t.trim() === "" ? null : t.trim());

// Uso de marca de instituição pública ou paraestatal só com autorização formal registrada.
const exigeAutorizacao = (tipo: string, natureza: string | null) =>
  tipo === "institucional" && (natureza === "publica" || natureza === "paraestatal");

export function DadosEmpresa({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: perfis = [] } = usePerfis();
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState<Form>(() => paraForm(p));
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (!editando) setF(paraForm(p));
  }, [p, editando]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    if (!f.nome_fantasia.trim()) {
      toast.error("Informe o nome fantasia.");
      return;
    }
    setSalvando(true);
    const inst = f.tipo_parceria === "institucional";
    const redes = Object.fromEntries(
      (["instagram", "linkedin", "outro"] as const).filter((k) => f[k].trim()).map((k) => [k, f[k].trim()]),
    );
    const { error } = await supabase
      .from("parceiros")
      .update({
        nome_fantasia: f.nome_fantasia.trim(), razao_social: nulo(f.razao_social), cnpj: nulo(f.cnpj), site: nulo(f.site),
        cidade: nulo(f.cidade), uf: nulo(f.uf)?.toUpperCase() ?? null, endereco: nulo(f.endereco), redes_sociais: redes,
        tipo_parceria: f.tipo_parceria, natureza_juridica: inst ? nulo(f.natureza_juridica) : null,
        perfil_institucional: inst ? nulo(f.perfil_institucional) : null, categoria_empresa: nulo(f.categoria_empresa),
        origem: nulo(f.origem), responsavel_id: nulo(f.responsavel_id),
        autorizacao_marca: exigeAutorizacao(f.tipo_parceria, f.natureza_juridica) ? f.autorizacao_marca : p.autorizacao_marca,
      })
      .eq("id", p.id);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Dados da empresa salvos.");
    setEditando(false);
    invalidarParceiro(qc, p.id);
  }

  const redes = p.redes_sociais ?? {};
  return (
    <Secao
      titulo="Dados da empresa"
      acoes={isParcerias && !editando && <Button size="sm" variant="outline" onClick={() => setEditando(true)}><Pencil /> Editar</Button>}
    >
      {!editando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info rotulo="Razão social">{p.razao_social}</Info>
          <Info rotulo="CNPJ">{formatarCnpj(p.cnpj)}</Info>
          <Info rotulo="Site">{p.site && <a href={/^https?:/.test(p.site) ? p.site : `https://${p.site}`} target="_blank" rel="noreferrer" className="break-all text-menta-400 underline">{p.site}</a>}</Info>
          <Info rotulo="Cidade">{[p.cidade, p.uf].filter(Boolean).join("/")}</Info>
          <Info rotulo="Endereço" className="sm:col-span-2">{p.endereco}</Info>
          <Info rotulo="Redes sociais">
            {Object.entries(redes).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="block break-all">{k === "outro" ? "Outra" : k[0].toUpperCase() + k.slice(1)}: {v}</span>
            ))}
          </Info>
          <Info rotulo="Tipo de parceria">{rotulo(TIPOS_PARCERIA, p.tipo_parceria)}</Info>
          {p.tipo_parceria === "institucional" && (
            <>
              <Info rotulo="Natureza jurídica">{rotulo(NATUREZAS, p.natureza_juridica)}</Info>
              <Info rotulo="Perfil institucional">{rotulo(PERFIS_INSTITUCIONAIS, p.perfil_institucional)}</Info>
            </>
          )}
          <Info rotulo="Categoria de empresa">{p.categoria_empresa}</Info>
          <Info rotulo="Origem do contato">{p.origem}</Info>
          <Info rotulo="Responsável">{nomePerfil(perfis, p.responsavel_id)}</Info>
          {exigeAutorizacao(p.tipo_parceria, p.natureza_juridica) && (
            <Info rotulo="Autorização formal de uso de marca">
              {p.autorizacao_marca ? <Pilula tom="menta">Registrada</Pilula> : <Pilula tom="alerta">Sem autorização: não usar a marca</Pilula>}
            </Info>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo rotulo="Nome fantasia" obrigatorio><Input value={f.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} /></Campo>
            <Campo rotulo="Razão social"><Input value={f.razao_social} onChange={(e) => set("razao_social", e.target.value)} /></Campo>
            <Campo rotulo="CNPJ"><Input value={f.cnpj} inputMode="numeric" onChange={(e) => set("cnpj", e.target.value)} /></Campo>
            <Campo rotulo="Site"><Input value={f.site} onChange={(e) => set("site", e.target.value)} /></Campo>
            <Campo rotulo="Cidade"><Input value={f.cidade} onChange={(e) => set("cidade", e.target.value)} /></Campo>
            <Campo rotulo="UF"><Input value={f.uf} maxLength={2} className="uppercase" onChange={(e) => set("uf", e.target.value)} /></Campo>
            <Campo rotulo="Endereço" className="sm:col-span-2 lg:col-span-3"><Input value={f.endereco} onChange={(e) => set("endereco", e.target.value)} /></Campo>
            <Campo rotulo="Instagram"><Input value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@perfil" /></Campo>
            <Campo rotulo="LinkedIn"><Input value={f.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></Campo>
            <Campo rotulo="Outra rede"><Input value={f.outro} onChange={(e) => set("outro", e.target.value)} /></Campo>
            <Campo rotulo="Tipo de parceria" dica={f.tipo_parceria !== p.tipo_parceria ? "Ao mudar o tipo, revise categorias, nível e pacote." : undefined}>
              <Select value={f.tipo_parceria} onValueChange={(v) => set("tipo_parceria", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIPOS_PARCERIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Campo>
            {f.tipo_parceria === "institucional" && (
              <>
                <Campo rotulo="Natureza jurídica">
                  <Select value={f.natureza_juridica || NENHUM} onValueChange={(v) => set("natureza_juridica", v === NENHUM ? "" : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NENHUM}>Não informada</SelectItem>
                      {Object.entries(NATUREZAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Campo>
                <Campo rotulo="Perfil institucional">
                  <Select value={f.perfil_institucional || NENHUM} onValueChange={(v) => set("perfil_institucional", v === NENHUM ? "" : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NENHUM}>Não informado</SelectItem>
                      {Object.entries(PERFIS_INSTITUCIONAIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Campo>
              </>
            )}
            <Campo rotulo="Categoria de empresa"><Input value={f.categoria_empresa} onChange={(e) => set("categoria_empresa", e.target.value)} /></Campo>
            <Campo rotulo="Origem do contato"><Input value={f.origem} onChange={(e) => set("origem", e.target.value)} /></Campo>
            <Campo rotulo="Responsável">
              <Select value={f.responsavel_id || NENHUM} onValueChange={(v) => set("responsavel_id", v === NENHUM ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUM}>Sem responsável</SelectItem>
                  {perfisInternos(perfis).map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          </div>
          {exigeAutorizacao(f.tipo_parceria, f.natureza_juridica) && (
            <label className="flex items-start gap-3 rounded-[10px] border border-white/10 p-3 text-sm">
              <Switch checked={f.autorizacao_marca} onCheckedChange={(v) => set("autorizacao_marca", v)} />
              <span>
                Autorização formal de uso de marca registrada
                <span className="block text-xs text-muted-foreground">Obrigatória para instituições públicas ou paraestatais antes de usar a marca.</span>
              </span>
            </label>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setEditando(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar dados"}</Button>
          </div>
        </div>
      )}
    </Secao>
  );
}

// Categorias do parceiro: uma principal e outras secundárias.
export function CategoriasParceiro({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: categorias = [] } = useCategorias();
  const { data: vinculos = [] } = useParceiroCategorias(p.id);
  const [nova, setNova] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const nome = (id: string) => categorias.find((c) => c.id === id)?.nome ?? "Categoria";
  const ordenados = [...vinculos].sort((a, b) => Number(b.principal) - Number(a.principal) || nome(a.categoria_id).localeCompare(nome(b.categoria_id), "pt-BR"));
  const disponiveis = categorias.filter(
    (c) => c.ativa && c.tipo === p.tipo_parceria && !vinculos.some((v) => v.categoria_id === c.id)
      && (p.tipo_parceria !== "institucional" || !p.perfil_institucional || c.perfil_institucional === p.perfil_institucional),
  );
  const fora = vinculos.filter((v) => categorias.find((c) => c.id === v.categoria_id)?.tipo !== p.tipo_parceria);

  async function executar(fn: () => PromiseLike<{ error: any }>, msg: string) {
    setOcupado(true);
    const { error } = await fn();
    setOcupado(false);
    if (error) {
      toastErro(error);
      return false;
    }
    toast.success(msg);
    invalidarParceiro(qc, p.id);
    return true;
  }

  async function adicionar() {
    if (!nova) return;
    const ok = await executar(
      () => supabase.from("parceiro_categorias").insert({ parceiro_id: p.id, categoria_id: nova, principal: vinculos.length === 0 }),
      "Categoria adicionada.",
    );
    if (ok) setNova("");
  }

  async function tornarPrincipal(categoriaId: string) {
    // Índice único: só uma principal por parceiro. Desmarca a atual antes.
    await executar(async () => {
      const r1 = await supabase.from("parceiro_categorias").update({ principal: false }).eq("parceiro_id", p.id).eq("principal", true);
      if (r1.error) return r1;
      return supabase.from("parceiro_categorias").update({ principal: true }).eq("parceiro_id", p.id).eq("categoria_id", categoriaId);
    }, "Categoria principal atualizada.");
  }

  return (
    <Secao titulo="Categorias" descricao="O parceiro aparece em todas as categorias marcadas, com a principal identificada.">
      {ordenados.length ? (
        <ul className="divide-y divide-white/10">
          {ordenados.map((v) => (
            <li key={v.categoria_id} className="flex flex-wrap items-center gap-2 py-2">
              <Star className={v.principal ? "h-4 w-4 fill-menta-400 text-menta-400" : "h-4 w-4 text-white/20"} />
              <span className="min-w-0 flex-1 break-words text-sm">{nome(v.categoria_id)}</span>
              {v.principal ? <Pilula tom="menta">Principal</Pilula> : isParcerias && (
                <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => tornarPrincipal(v.categoria_id)}>Tornar principal</Button>
              )}
              {isParcerias && (
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={ocupado} aria-label="Remover categoria"
                  onClick={() => executar(() => supabase.from("parceiro_categorias").delete().eq("parceiro_id", p.id).eq("categoria_id", v.categoria_id), "Categoria removida.")}>
                  <Trash2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma categoria marcada.</p>
      )}
      {fora.length > 0 && (
        <p className="mt-2 text-xs text-warning">Há categorias de outro tipo de parceria marcadas. Revise depois de mudar o tipo.</p>
      )}
      {isParcerias && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Select value={nova} onValueChange={setNova}>
            <SelectTrigger className="sm:flex-1"><SelectValue placeholder="Adicionar categoria" /></SelectTrigger>
            <SelectContent>{disponiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={adicionar} disabled={!nova || ocupado}><Plus /> Adicionar</Button>
        </div>
      )}
    </Secao>
  );
}
