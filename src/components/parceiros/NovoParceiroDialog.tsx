import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastErro } from "@/lib/erros";
import { NATUREZAS, ORIGENS_PARCEIRO, PERFIS_INSTITUCIONAIS, TIPOS_PARCERIA } from "@/lib/rotulos";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Campo } from "./ui";
import { invalidarParceiro, perfisInternos, useCategorias, useEtapas, usePerfis } from "./dados";

type Form = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  tipo_parceria: "comercial" | "institucional";
  natureza_juridica: string;
  perfil_institucional: string;
  categoria_id: string;
  cidade: string;
  uf: string;
  origem: string;
  origem_tipo: string;
  origem_parceiro_id: string | null;
  origem_perfil_id: string;
  responsavel_id: string;
  etapa: string;
};

function formInicial(responsavel: string): Form {
  return {
    nome_fantasia: "", razao_social: "", cnpj: "", tipo_parceria: "comercial", natureza_juridica: "", perfil_institucional: "",
    categoria_id: "", cidade: "", uf: "", origem: "", origem_tipo: "", origem_parceiro_id: null, origem_perfil_id: "", responsavel_id: responsavel, etapa: "sem_contato",
  };
}

// Cadastro de parceiro (somente time de parcerias e administradores).
export function NovoParceiroDialog({ aberto, onOpenChange }: { aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categorias = [] } = useCategorias();
  const { data: etapas = [] } = useEtapas();
  const { data: perfis = [] } = usePerfis();
  const [f, setF] = useState<Form>(() => formInicial(perfil?.id ?? ""));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) setF(formInicial(perfil?.id ?? ""));
  }, [aberto, perfil?.id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const institucional = f.tipo_parceria === "institucional";
  const categoriasTipo = categorias.filter(
    (c) => c.ativa && c.tipo === f.tipo_parceria && (!institucional || !f.perfil_institucional || c.perfil_institucional === f.perfil_institucional),
  );

  async function salvar() {
    if (!f.nome_fantasia.trim()) {
      toast.error("Informe o nome fantasia.");
      return;
    }
    setSalvando(true);
    const { data, error } = await supabase
      .from("parceiros")
      .insert({
        nome_fantasia: f.nome_fantasia.trim(),
        razao_social: f.razao_social.trim() || null,
        cnpj: f.cnpj.trim() || null,
        tipo_parceria: f.tipo_parceria,
        natureza_juridica: institucional ? f.natureza_juridica || null : null,
        perfil_institucional: institucional ? f.perfil_institucional || null : null,
        cidade: f.cidade.trim() || null,
        uf: f.uf.trim().toUpperCase() || null,
        origem: f.origem.trim() || null,
        origem_detalhe: f.origem.trim() || null,
        origem_tipo: f.origem_tipo || null,
        origem_parceiro_id: f.origem_tipo === "indicacao_parceiro" ? f.origem_parceiro_id : null,
        origem_perfil_id: f.origem_tipo === "indicacao_interna" ? f.origem_perfil_id || null : null,
        responsavel_id: f.responsavel_id || null,
        etapa: f.etapa,
        created_by: perfil?.id,
      })
      .select("id")
      .single();
    if (error) {
      setSalvando(false);
      toastErro(error);
      return;
    }
    if (f.categoria_id) {
      const r = await supabase.from("parceiro_categorias").insert({ parceiro_id: data.id, categoria_id: f.categoria_id, principal: true });
      if (r.error) toastErro(r.error);
    }
    setSalvando(false);
    invalidarParceiro(qc, data.id);
    toast.success("Parceiro cadastrado.");
    onOpenChange(false);
    navigate(`/app/parceiros/${data.id}`);
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] max-w-2xl overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Novo parceiro</DialogTitle>
          <DialogDescription>Os demais dados (campos da categoria, contatos, classificação) são preenchidos na ficha.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome fantasia" obrigatorio className="sm:col-span-2">
            <Input value={f.nome_fantasia} onChange={(e) => set("nome_fantasia", e.target.value)} autoFocus />
          </Campo>
          <Campo rotulo="Razão social">
            <Input value={f.razao_social} onChange={(e) => set("razao_social", e.target.value)} />
          </Campo>
          <Campo rotulo="CNPJ">
            <Input value={f.cnpj} inputMode="numeric" onChange={(e) => set("cnpj", e.target.value)} />
          </Campo>
          <Campo rotulo="Tipo de parceria">
            <Select value={f.tipo_parceria} onValueChange={(v) => setF((x) => ({ ...x, tipo_parceria: v as Form["tipo_parceria"], categoria_id: "" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_PARCERIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          {institucional && (
            <>
              <Campo rotulo="Natureza jurídica">
                <Select value={f.natureza_juridica} onValueChange={(v) => set("natureza_juridica", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NATUREZAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo rotulo="Perfil institucional">
                <Select value={f.perfil_institucional} onValueChange={(v) => setF((x) => ({ ...x, perfil_institucional: v, categoria_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERFIS_INSTITUCIONAIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Campo>
            </>
          )}
          <Campo rotulo="Categoria principal" className={institucional ? "" : "sm:col-span-1"}>
            <Select value={f.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categoriasTipo.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
          <Campo rotulo="Etapa">
            <Select value={f.etapa} onValueChange={(v) => set("etapa", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {etapas.filter((e) => !e.perda && !e.pausa && !["fechamento", "onboarding", "parceria_ativa", "nutricao"].includes(e.codigo)).map((e) => (
                  <SelectItem key={e.codigo} value={e.codigo}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
          <Campo rotulo="Cidade">
            <Input value={f.cidade} onChange={(e) => set("cidade", e.target.value)} />
          </Campo>
          <Campo rotulo="UF">
            <Input value={f.uf} maxLength={2} onChange={(e) => set("uf", e.target.value)} className="uppercase" />
          </Campo>
          <Campo rotulo="Origem do parceiro">
            <Select value={f.origem_tipo} onValueChange={(v) => set("origem_tipo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
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
              <Select value={f.origem_perfil_id} onValueChange={(v) => set("origem_perfil_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {perfisInternos(perfis).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          )}
          <Campo rotulo="Detalhe da origem">
            <Input value={f.origem} onChange={(e) => set("origem", e.target.value)} placeholder="Ex.: nome do evento, campanha" />
          </Campo>
          <Campo rotulo="Responsável">
            <Select value={f.responsavel_id} onValueChange={(v) => set("responsavel_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {perfisInternos(perfis).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Cadastrar e abrir ficha"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
