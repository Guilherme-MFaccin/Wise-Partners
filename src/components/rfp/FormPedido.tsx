import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmpresasGrupo } from "./dados";
import type { PedidoRfp } from "./tipos";

export type DadosPedido = Pick<PedidoRfp, "cliente_nome" | "necessidade" | "porte" | "regiao" | "prazo" | "restricoes" | "empresa_grupo_id">;

// Etapa 1: dados do pedido (o pai troca a key para recarregar os valores iniciais). Só o nome da empresa do cliente; nenhum dado pessoal é necessário.
export function FormPedido({
  inicial, onSalvar, salvando, somenteLeitura, rotuloSalvar = "Salvar pedido",
}: {
  inicial: DadosPedido;
  onSalvar: (d: DadosPedido) => void;
  salvando?: boolean;
  somenteLeitura?: boolean;
  rotuloSalvar?: string;
}) {
  const [d, setD] = useState<DadosPedido>(inicial);
  const { data: empresas = [] } = useEmpresasGrupo();
  const set = (k: keyof DadosPedido, v: string) => setD((x) => ({ ...x, [k]: v }));
  const valido = d.cliente_nome.trim() && d.necessidade.trim() && d.empresa_grupo_id;

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valido) onSalvar(d); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cliente">Empresa do cliente</Label>
          <Input id="cliente" value={d.cliente_nome} disabled={somenteLeitura} placeholder="Nome da empresa"
            onChange={(e) => set("cliente_nome", e.target.value)} />
          <p className="text-xs text-muted-foreground">Só o nome da empresa. A página não mostra dados pessoais do cliente.</p>
        </div>
        <div className="space-y-1.5">
          <Label>Empresa do grupo</Label>
          <Select value={d.empresa_grupo_id ?? ""} onValueChange={(v) => set("empresa_grupo_id", v)} disabled={somenteLeitura}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="necessidade">Necessidade</Label>
        <Textarea id="necessidade" rows={5} value={d.necessidade} disabled={somenteLeitura}
          placeholder="Descreva com as palavras do cliente o que ele precisa resolver"
          onChange={(e) => set("necessidade", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="porte">Porte</Label>
          <Input id="porte" value={d.porte ?? ""} disabled={somenteLeitura} placeholder="Ex.: 80 funcionários, R$ 2 mi/mês"
            onChange={(e) => set("porte", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="regiao">Região</Label>
          <Input id="regiao" value={d.regiao ?? ""} disabled={somenteLeitura} placeholder="Ex.: Maringá/PR"
            onChange={(e) => set("regiao", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" value={d.prazo ?? ""} disabled={somenteLeitura} placeholder="Ex.: decidir em 60 dias"
            onChange={(e) => set("prazo", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="restricoes">Restrições</Label>
        <Textarea id="restricoes" rows={2} value={d.restricoes ?? ""} disabled={somenteLeitura}
          placeholder="Orçamento, tecnologia obrigatória, atendimento presencial..."
          onChange={(e) => set("restricoes", e.target.value)} />
      </div>
      {!somenteLeitura && (
        <div className="flex justify-end">
          <Button type="submit" disabled={!valido || salvando}>
            {salvando ? <Loader2 className="animate-spin" /> : <Save />} {rotuloSalvar}
          </Button>
        </div>
      )}
    </form>
  );
}
