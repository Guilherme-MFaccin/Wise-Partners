import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ParceiroBusca, useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Pilula } from "@/components/comum/Selos";
import { toastErro } from "@/lib/erros";
import { ORIGENS_PARCEIRO, rotulo } from "@/lib/rotulos";
import { Campo, Info, Secao } from "../ui";
import { invalidarParceiro, nomePerfil, perfisInternos, useConfigValor, usePerfis, type Parceiro } from "../dados";

const NENHUMA = "__nenhuma";

const PROPOSTA: { chave: "valor_desejado" | "oferta_valor" | "entrega_valor" | "valor_criado"; rotulo: string; dica: string }[] = [
  { chave: "valor_desejado", rotulo: "O que o parceiro quer ganhar", dica: "Objetivos do parceiro com a parceria." },
  { chave: "oferta_valor", rotulo: "O que a Wise oferece", dica: "Oferta da Wise para este parceiro." },
  { chave: "entrega_valor", rotulo: "Como o valor é entregue", dica: "Rotina, canais e responsáveis pela entrega." },
  { chave: "valor_criado", rotulo: "Valor criado para cada lado e para o cliente", dica: "Resultado esperado para o parceiro, a Wise e o cliente." },
];

type Form = {
  modelos_atuacao: string[];
  valor_desejado: string; oferta_valor: string; entrega_valor: string; valor_criado: string;
  origem_tipo: string; origem_detalhe: string; origem_parceiro_id: string | null; origem_perfil_id: string;
  horas_semana_combinadas: string;
  aceita_cruzamento_contrato: boolean;
  anonimo_ranking: boolean;
};

function doParceiro(p: Parceiro): Form {
  return {
    modelos_atuacao: p.modelos_atuacao ?? [],
    valor_desejado: p.valor_desejado ?? "", oferta_valor: p.oferta_valor ?? "", entrega_valor: p.entrega_valor ?? "", valor_criado: p.valor_criado ?? "",
    origem_tipo: p.origem_tipo ?? "", origem_detalhe: p.origem_detalhe ?? "", origem_parceiro_id: p.origem_parceiro_id,
    origem_perfil_id: p.origem_perfil_id ?? "",
    horas_semana_combinadas: p.horas_semana_combinadas === null || p.horas_semana_combinadas === undefined ? "" : String(p.horas_semana_combinadas),
    aceita_cruzamento_contrato: !!p.aceita_cruzamento_contrato,
    anonimo_ranking: !!p.anonimo_ranking,
  };
}

// Nossa parceria (História 9): modelo de atuação, proposta de valor em 4 pontos, origem e combinados.
export function AbaNossaParceria({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: modelosCfg } = useConfigValor<string[]>("modelos_atuacao");
  const { data: perfis = [] } = usePerfis();
  const { data: parceiros = [] } = useParceirosResumo();
  const [f, setF] = useState<Form>(() => doParceiro(p));
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setF(doParceiro(p)), [p]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  // Modelos do cadastro mais os já gravados que tenham saído da lista
  const modelos = Array.from(new Set([...(Array.isArray(modelosCfg) ? modelosCfg : []), ...(p.modelos_atuacao ?? [])]));
  const mudou = JSON.stringify(f) !== JSON.stringify(doParceiro(p));

  async function salvar() {
    const horas = f.horas_semana_combinadas.trim() === "" ? null : Number(f.horas_semana_combinadas.replace(",", "."));
    if (horas !== null && (Number.isNaN(horas) || horas < 0)) {
      toast.error("Informe as horas por semana como número.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("parceiros").update({
      modelos_atuacao: f.modelos_atuacao,
      valor_desejado: f.valor_desejado.trim() || null,
      oferta_valor: f.oferta_valor.trim() || null,
      entrega_valor: f.entrega_valor.trim() || null,
      valor_criado: f.valor_criado.trim() || null,
      origem_tipo: f.origem_tipo || null,
      origem_detalhe: f.origem_detalhe.trim() || null,
      origem_parceiro_id: f.origem_tipo === "indicacao_parceiro" ? f.origem_parceiro_id : null,
      origem_perfil_id: f.origem_tipo === "indicacao_interna" ? f.origem_perfil_id || null : null,
      horas_semana_combinadas: horas,
      aceita_cruzamento_contrato: f.aceita_cruzamento_contrato,
      anonimo_ranking: f.anonimo_ranking,
    }).eq("id", p.id);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Nossa parceria salva.");
    invalidarParceiro(qc, p.id);
  }

  if (!isParcerias) return <Leitura p={p} perfis={perfis} parceiros={parceiros} />;

  return (
    <div className="space-y-4">
      <Secao titulo="Modelo de atuação" descricao="Um ou mais modelos. Alimenta o scorecard, a maturidade e o resultado por modelo.">
        {modelos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado em Configurações.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {modelos.map((m) => (
              <label key={m} className="flex items-start gap-2 rounded-[10px] border border-white/10 p-3 text-sm">
                <Checkbox className="mt-0.5" checked={f.modelos_atuacao.includes(m)}
                  onCheckedChange={(v) => set("modelos_atuacao", v ? [...f.modelos_atuacao, m] : f.modelos_atuacao.filter((x) => x !== m))} />
                <span>{m}</span>
              </label>
            ))}
          </div>
        )}
      </Secao>

      <Secao titulo="Proposta de valor" descricao="Os quatro pontos combinados no primeiro encontro do onboarding.">
        <div className="grid gap-4 md:grid-cols-2">
          {PROPOSTA.map((c) => (
            <Campo key={c.chave} rotulo={c.rotulo} dica={c.dica}>
              <Textarea rows={3} value={f[c.chave]} onChange={(e) => set(c.chave, e.target.value)} />
            </Campo>
          ))}
        </div>
      </Secao>

      <Secao titulo="Origem e combinados">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Origem do parceiro">
            <Select value={f.origem_tipo || NENHUMA} onValueChange={(v) => set("origem_tipo", v === NENHUMA ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUMA}>Não informada</SelectItem>
                {Object.entries(ORIGENS_PARCEIRO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          {f.origem_tipo === "indicacao_parceiro" && (
            <Campo rotulo="Parceiro que indicou">
              <ParceiroBusca valor={f.origem_parceiro_id} onChange={(v) => set("origem_parceiro_id", v)} placeholder="Escolha o parceiro" />
            </Campo>
          )}
          {f.origem_tipo === "indicacao_interna" && (
            <Campo rotulo="Pessoa da Wise que indicou">
              <Select value={f.origem_perfil_id || NENHUMA} onValueChange={(v) => set("origem_perfil_id", v === NENHUMA ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUMA}>Não informada</SelectItem>
                  {perfisInternos(perfis).map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          )}
          <Campo rotulo="Detalhe da origem" className={f.origem_tipo === "indicacao_parceiro" || f.origem_tipo === "indicacao_interna" ? "sm:col-span-2" : ""}>
            <Input value={f.origem_detalhe} onChange={(e) => set("origem_detalhe", e.target.value)} placeholder="Ex.: nome do evento, campanha" />
          </Campo>
          <Campo rotulo="Horas por semana combinadas (primeiro mês)" dica="Sugere a nota do critério de disponibilidade no scorecard.">
            <Input inputMode="decimal" value={f.horas_semana_combinadas} onChange={(e) => set("horas_semana_combinadas", e.target.value)} placeholder="Ex.: 2" />
          </Campo>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <Switch checked={f.aceita_cruzamento_contrato} onCheckedChange={(v) => set("aceita_cruzamento_contrato", v)} />
            <span>
              Contrato v2 ou aditivo com a cláusula de cruzamento de carteiras
              <span className="block text-xs text-muted-foreground">Libera o cruzamento de carteiras no portal do parceiro.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Switch checked={f.anonimo_ranking} onCheckedChange={(v) => set("anonimo_ranking", v)} />
            <span>
              Aparecer como anônimo no ranking
              <span className="block text-xs text-muted-foreground">Outros parceiros veem "Parceiro Wise" no lugar do nome.</span>
            </span>
          </label>
        </div>
      </Secao>

      <div className="sticky bottom-2 flex justify-end">
        <Button onClick={salvar} disabled={!mudou || salvando}>
          {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar
        </Button>
      </div>
    </div>
  );
}

function Leitura({ p, perfis, parceiros }: { p: Parceiro; perfis: any[]; parceiros: { id: string; nome_fantasia: string }[] }) {
  const origemParceiro = parceiros.find((x) => x.id === p.origem_parceiro_id);
  return (
    <div className="space-y-4">
      <Secao titulo="Modelo de atuação">
        {p.modelos_atuacao?.length ? (
          <div className="flex flex-wrap gap-2">{p.modelos_atuacao.map((m) => <Pilula key={m} tom="menta">{m}</Pilula>)}</div>
        ) : <p className="text-sm text-muted-foreground">Não definido.</p>}
      </Secao>
      <Secao titulo="Proposta de valor">
        <div className="grid gap-4 md:grid-cols-2">
          {PROPOSTA.map((c) => (
            <Info key={c.chave} rotulo={c.rotulo}>{p[c.chave] ? <span className="whitespace-pre-wrap">{p[c.chave]}</span> : null}</Info>
          ))}
        </div>
      </Secao>
      <Secao titulo="Origem e combinados">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info rotulo="Origem do parceiro">{rotulo(ORIGENS_PARCEIRO, p.origem_tipo)}</Info>
          {p.origem_parceiro_id && (
            <Info rotulo="Parceiro que indicou">
              <Link to={`/app/parceiros/${p.origem_parceiro_id}`} className="text-menta-400 hover:underline">{origemParceiro?.nome_fantasia ?? "Abrir ficha"}</Link>
            </Info>
          )}
          {p.origem_perfil_id && <Info rotulo="Pessoa da Wise que indicou">{nomePerfil(perfis, p.origem_perfil_id)}</Info>}
          <Info rotulo="Detalhe da origem">{p.origem_detalhe}</Info>
          <Info rotulo="Horas por semana combinadas">
            {p.horas_semana_combinadas !== null && p.horas_semana_combinadas !== undefined ? `${Number(p.horas_semana_combinadas).toLocaleString("pt-BR")} h` : null}
          </Info>
          <Info rotulo="Cruzamento de carteiras no contrato">{p.aceita_cruzamento_contrato ? "Sim (contrato v2 ou aditivo)" : "Não"}</Info>
          <Info rotulo="Anônimo no ranking">{p.anonimo_ranking ? "Sim" : "Não"}</Info>
        </div>
      </Secao>
    </div>
  );
}
