import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FilterX, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pilula, SeloNivel, SeloStatus } from "@/components/comum/Selos";
import { Vazio } from "@/components/comum/Estados";
import { data, somenteDigitos } from "@/lib/formato";
import { ETAPAS, PACOTES, STATUS_ATIVIDADE, TIPOS_PARCERIA, rotulo } from "@/lib/rotulos";
import { Campo } from "./ui";
import {
  nomePerfil, normalizar, perfisInternos, preenchido, useCampos,
  type Categoria, type Etapa, type ParceiroCategoria, type ParceiroLista, type PerfilResumo,
} from "./dados";

const TODOS = "__todos";

type Filtros = {
  texto: string;
  tipo: string;
  categoria: string;
  nivel: string;
  pacote: string;
  etapa: string;
  status: string;
  responsavel: string;
  cidade: string;
  campo: string;
  valorCampo: string;
};

const VAZIO: Filtros = {
  texto: "", tipo: TODOS, categoria: TODOS, nivel: TODOS, pacote: TODOS, etapa: TODOS, status: TODOS,
  responsavel: TODOS, cidade: TODOS, campo: TODOS, valorCampo: "",
};

// Lista com filtros combinados (todos precisam ser atendidos) e busca por nome, CNPJ ou contato.
export function ListaParceiros({
  parceiros, vinculos, categorias, etapas, perfis, contatos, filtroInicial,
}: {
  filtroInicial?: { etapa?: string | null; categoria?: string | null };
  parceiros: ParceiroLista[];
  vinculos: ParceiroCategoria[];
  categorias: Categoria[];
  etapas: Etapa[];
  perfis: PerfilResumo[];
  contatos: { parceiro_id: string; contatos: { nome: string; email: string | null } | null }[];
}) {
  // Filtros pré-selecionados por link (ex.: painel abre ?etapa= ou ?categoria=)
  const [f, setF] = useState<Filtros>(() => ({
    ...VAZIO,
    etapa: filtroInicial?.etapa || TODOS,
    categoria: filtroInicial?.categoria || TODOS,
  }));
  const set = (k: keyof Filtros, v: string) => setF((x) => ({ ...x, [k]: v }));
  const { data: campos = [] } = useCampos();

  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.nome]));
  const cidades = [...new Set(parceiros.map((p) => p.cidade).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const camposCategoria = campos.filter((c) => c.escopo === "categoria" && c.categoria_id === f.categoria);
  const campoSel = camposCategoria.find((c) => c.id === f.campo);

  // Valores do campo escolhido, carregados só quando o filtro é usado
  const valores = useQuery({
    queryKey: ["parceiros", "campo", f.campo],
    enabled: !!campoSel,
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiro_campos").select("parceiro_id, valor").eq("campo_id", f.campo);
      if (error) throw error;
      return new Map((data ?? []).map((r: any) => [r.parceiro_id as string, r.valor]));
    },
  });

  const filtrados = useMemo(() => {
    const termo = normalizar(f.texto);
    const digitos = somenteDigitos(f.texto);
    const contatosPor = new Map<string, string>();
    for (const c of contatos) {
      if (!c.contatos) continue;
      contatosPor.set(c.parceiro_id, `${contatosPor.get(c.parceiro_id) ?? ""} ${c.contatos.nome} ${c.contatos.email ?? ""}`);
    }
    return parceiros.filter((p) => {
      if (termo) {
        const alvo = normalizar(`${p.nome_fantasia} ${p.razao_social ?? ""} ${contatosPor.get(p.id) ?? ""}`);
        const porCnpj = digitos.length >= 3 && somenteDigitos(p.cnpj).includes(digitos);
        if (!alvo.includes(termo) && !porCnpj) return false;
      }
      if (f.tipo !== TODOS && p.tipo_parceria !== f.tipo) return false;
      if (f.categoria !== TODOS && !vinculos.some((v) => v.parceiro_id === p.id && v.categoria_id === f.categoria)) return false;
      if (f.nivel !== TODOS && (f.nivel === "sem" ? !!p.nivel : p.nivel !== f.nivel)) return false;
      if (f.pacote !== TODOS && (f.pacote === "sem" ? !!p.pacote : p.pacote !== f.pacote)) return false;
      if (f.etapa !== TODOS && p.etapa !== f.etapa) return false;
      if (f.status !== TODOS && p.status_atividade !== f.status) return false;
      if (f.responsavel !== TODOS && (f.responsavel === "sem" ? !!p.responsavel_id : p.responsavel_id !== f.responsavel)) return false;
      if (f.cidade !== TODOS && p.cidade !== f.cidade) return false;
      if (campoSel) {
        if (!valores.data) return false;
        if (!valorAtende(campoSel.tipo, valores.data.get(p.id), f.valorCampo)) return false;
      }
      return true;
    });
  }, [parceiros, vinculos, contatos, f, campoSel, valores.data]);

  const principalDe = (id: string) => {
    const v = vinculos.find((x) => x.parceiro_id === id && x.principal);
    return v ? nomeCategoria.get(v.categoria_id) ?? "" : "";
  };
  const ativos = Object.entries(f).filter(([k, v]) => (k === "texto" || k === "valorCampo" ? v !== "" : v !== TODOS)).length;

  const seletor = (k: keyof Filtros, rot: string, opcoes: [string, string][], extra?: [string, string]) => (
    <Campo rotulo={rot}>
      <Select value={f[k]} onValueChange={(v) => set(k, v)}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {extra && <SelectItem value={extra[0]}>{extra[1]}</SelectItem>}
          {opcoes.map(([v, r]) => <SelectItem key={v} value={v}>{r}</SelectItem>)}
        </SelectContent>
      </Select>
    </Campo>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-white/10 bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={f.texto} onChange={(e) => set("texto", e.target.value)} className="pl-9"
            placeholder="Buscar por nome, razão social, CNPJ ou contato" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {seletor("tipo", "Tipo de parceria", Object.entries(TIPOS_PARCERIA))}
          <Campo rotulo="Categoria (principal ou secundária)">
            <Select value={f.categoria} onValueChange={(v) => setF((x) => ({ ...x, categoria: v, campo: TODOS, valorCampo: "" }))}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectGroup>
                  <SelectLabel>Comerciais</SelectLabel>
                  {categorias.filter((c) => c.tipo === "comercial").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Institucionais</SelectLabel>
                  {categorias.filter((c) => c.tipo === "institucional").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Campo>
          {seletor("nivel", "Nível", [["A", "Elite / Institucional A"], ["B", "Premium / Institucional B"], ["C", "Select / Institucional C"]], ["sem", "Sem nível"])}
          {seletor("pacote", "Pacote", Object.entries(PACOTES), ["sem", "Sem pacote"])}
          {seletor("etapa", "Etapa", etapas.map((e) => [e.codigo, e.nome]))}
          {seletor("status", "Status de atividade", Object.entries(STATUS_ATIVIDADE))}
          {seletor("responsavel", "Responsável", perfisInternos(perfis).map((p) => [p.id, p.nome]), ["sem", "Sem responsável"])}
          {seletor("cidade", "Cidade", cidades.map((c) => [c, c]))}
        </div>

        {/* Filtro por campo específico da categoria escolhida */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo rotulo="Campo da categoria" dica={f.categoria === TODOS ? "Escolha uma categoria para filtrar pelos campos dela." : undefined}>
            <Select value={f.campo} onValueChange={(v) => setF((x) => ({ ...x, campo: v, valorCampo: "" }))} disabled={f.categoria === TODOS || !camposCategoria.length}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Nenhum</SelectItem>
                {camposCategoria.map((c) => <SelectItem key={c.id} value={c.id}>{c.rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          {campoSel && (
            <Campo rotulo="Valor">
              {["lista", "faixa", "multipla", "sim_nao"].includes(campoSel.tipo) ? (
                <Select value={f.valorCampo || TODOS} onValueChange={(v) => set("valorCampo", v === TODOS ? "" : v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS}>Qualquer valor preenchido</SelectItem>
                    {(campoSel.tipo === "sim_nao" ? ["Sim", "Não"] : campoSel.opcoes).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input className="h-9" value={f.valorCampo} onChange={(e) => set("valorCampo", e.target.value)} placeholder="Contém (vazio: qualquer valor)" />
              )}
            </Campo>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {filtrados.length} de {parceiros.length} parceiros
            {campoSel && valores.isLoading ? " · carregando valores do campo..." : ""}
          </p>
          {ativos > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setF(VAZIO)}><FilterX /> Limpar filtros</Button>
          )}
        </div>
      </div>

      {!filtrados.length ? (
        <Vazio titulo="Nenhum parceiro atende aos filtros." />
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="hidden rounded-[14px] border border-white/10 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Categoria principal</TableHead>
                  <TableHead>Nível e pacote</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Último contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[220px]">
                      <Link to={`/app/parceiros/${p.id}`} className="block truncate font-semibold hover:text-menta-400 hover:underline">{p.nome_fantasia}</Link>
                      <span className="block truncate text-xs text-muted-foreground">{rotulo(TIPOS_PARCERIA, p.tipo_parceria)}{p.razao_social ? ` · ${p.razao_social}` : ""}</span>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{principalDe(p.id)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.nivel && <SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} />}
                        {p.pacote && <Pilula>{rotulo(PACOTES, p.pacote)}</Pilula>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{rotulo(ETAPAS, p.etapa)}</TableCell>
                    <TableCell><SeloStatus status={p.status_atividade} /></TableCell>
                    <TableCell className="text-sm">{nomePerfil(perfis, p.responsavel_id)}</TableCell>
                    <TableCell className="text-sm">{[p.cidade, p.uf].filter(Boolean).join("/")}</TableCell>
                    <TableCell className="text-sm">{data(p.ultimo_contato)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Celular: cartões */}
          <div className="space-y-2 md:hidden">
            {filtrados.map((p) => (
              <Link key={p.id} to={`/app/parceiros/${p.id}`} className="block rounded-[14px] border border-white/10 bg-card p-3">
                <p className="truncate font-semibold">{p.nome_fantasia}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[principalDe(p.id), [p.cidade, p.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.nivel && <SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} />}
                  {p.pacote && <Pilula>{rotulo(PACOTES, p.pacote)}</Pilula>}
                  <Pilula>{rotulo(ETAPAS, p.etapa)}</Pilula>
                  <SeloStatus status={p.status_atividade} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {nomePerfil(perfis, p.responsavel_id) || "Sem responsável"}
                  {p.ultimo_contato ? ` · último contato em ${data(p.ultimo_contato)}` : ""}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compara o valor gravado (jsonb) com o filtro escolhido
function valorAtende(tipo: string, valor: any, filtro: string) {
  if (!preenchido(valor)) return false;
  if (!filtro) return true;
  if (tipo === "sim_nao") return (filtro === "Sim") === (valor === true);
  if (Array.isArray(valor)) return valor.includes(filtro);
  if (tipo === "lista" || tipo === "faixa") return String(valor) === filtro;
  return normalizar(String(valor)).includes(normalizar(filtro));
}
