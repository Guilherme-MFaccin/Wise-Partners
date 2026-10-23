import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CampoInput, CampoValor, type CampoDef } from "@/components/comum/CampoDinamico";
import { Pilula } from "@/components/comum/Selos";
import { Carregando, Vazio } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { Secao } from "../ui";
import { invalidarParceiro, useCampos, useCategorias, useParceiroCampos, useParceiroCategorias, type Parceiro } from "../dados";
import { gruposDoParceiro } from "./campos";

// Campos configuráveis da ficha: perfil comum e campos de cada categoria (ou do perfil institucional).
export function AbaPerfil({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias, perfil } = useAuth();
  const qc = useQueryClient();
  const campos = useCampos();
  const { data: categorias = [] } = useCategorias();
  const vinculos = useParceiroCategorias(p.id);
  const valores = useParceiroCampos(p.id);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, any>>({});
  const [salvando, setSalvando] = useState(false);

  if (campos.isLoading || vinculos.isLoading || valores.isLoading) return <Carregando />;
  const atual = new Map((valores.data ?? []).map((v) => [v.campo_id, v]));
  const grupos = gruposDoParceiro(p, campos.data ?? [], vinculos.data ?? [], categorias);
  const valorDe = (c: CampoDef) => (c.id in rascunho ? rascunho[c.id] : atual.get(c.id)?.valor ?? null);

  function iniciar() {
    setRascunho({});
    setEditando(true);
  }

  async function salvar() {
    const linhas = Object.entries(rascunho)
      .filter(([id, v]) => JSON.stringify(v ?? null) !== JSON.stringify(atual.get(id)?.valor ?? null))
      .map(([id, v]) => ({
        parceiro_id: p.id, campo_id: id, valor: v ?? null, versao: (atual.get(id)?.versao ?? 0) + 1,
        updated_by: perfil?.id, updated_at: new Date().toISOString(),
      }));
    if (!linhas.length) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("parceiro_campos").upsert(linhas, { onConflict: "parceiro_id,campo_id" });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Ficha salva.");
    setEditando(false);
    setRascunho({});
    invalidarParceiro(qc, p.id);
  }

  const semCategoria = p.tipo_parceria === "comercial" && !(vinculos.data ?? []).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Campos marcados com <Pilula tom="menta">RFP</Pilula> alimentam a recomendação e a página do cliente.
          Campos <Pilula tom="alerta">Interno</Pilula> nunca aparecem para o parceiro.
        </p>
        {isParcerias && !editando && <Button variant="outline" onClick={iniciar}><Pencil /> Editar campos</Button>}
      </div>

      {semCategoria && <Vazio titulo="Nenhuma categoria marcada.">Marque a categoria na Visão geral para ver os campos específicos.</Vazio>}
      {p.tipo_parceria === "institucional" && !p.perfil_institucional && (
        <Vazio titulo="Perfil institucional não informado.">Defina o perfil nos dados da empresa para ver os campos do perfil.</Vazio>
      )}

      {grupos.map((g) => (
        <Secao key={g.chave} titulo={
          <span className="flex flex-wrap items-center gap-2">
            {g.principal !== undefined && <Star className={g.principal ? "h-4 w-4 fill-menta-400 text-menta-400" : "h-4 w-4 text-white/30"} />}
            {g.titulo}
            {g.principal && <Pilula tom="menta">Principal</Pilula>}
          </span>
        }>
          {g.campos.length ? (
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {g.campos.map((c) => (
                <div key={c.id} className={c.tipo === "texto_longo" || c.tipo === "multipla" ? "min-w-0 md:col-span-2" : "min-w-0"}>
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutro-300">{c.rotulo}</span>
                    {c.uso_rfp && <Pilula tom="menta" className="px-1.5 py-0 text-[10px]">RFP</Pilula>}
                    {c.interno && <Pilula tom="alerta" className="px-1.5 py-0 text-[10px]">Interno</Pilula>}
                  </div>
                  {editando ? (
                    <>
                      <CampoInput campo={c} valor={valorDe(c)} onChange={(v) => setRascunho((r) => ({ ...r, [c.id]: v }))} />
                      {c.observacao && <p className="mt-1 text-xs text-muted-foreground">{c.observacao}</p>}
                    </>
                  ) : (
                    <div className="text-sm"><CampoValor campo={c} valor={valorDe(c)} /></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum campo configurado.</p>
          )}
        </Secao>
      ))}

      {editando && (
        <div className="sticky bottom-20 z-20 flex justify-end gap-2 rounded-[14px] border border-white/10 bg-background/95 p-3 backdrop-blur lg:bottom-4">
          <Button variant="outline" onClick={() => { setEditando(false); setRascunho({}); }}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar campos"}</Button>
        </div>
      )}
    </div>
  );
}
