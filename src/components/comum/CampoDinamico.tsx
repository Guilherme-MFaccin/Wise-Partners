import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { moeda } from "@/lib/formato";

export type CampoDef = {
  id: string;
  escopo: string;
  categoria_id: string | null;
  perfil_institucional: string | null;
  chave: string;
  rotulo: string;
  tipo: "texto_curto" | "texto_longo" | "numero" | "valor" | "faixa" | "lista" | "multipla" | "sim_nao" | "link" | "arquivo";
  opcoes: string[];
  observacao: string | null;
  obrigatorio: boolean;
  uso_rfp: boolean;
  interno: boolean;
  parceiro_edita: boolean;
  ordem: number;
  ativo: boolean;
};

// Entrada de um campo configurável (perfil comum ou campo da categoria).
export function CampoInput({ campo, valor, onChange, disabled }: { campo: CampoDef; valor: any; onChange: (v: any) => void; disabled?: boolean }) {
  switch (campo.tipo) {
    case "texto_longo":
      return <Textarea value={valor ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} rows={4} />;
    case "numero":
    case "valor":
      return (
        <Input type="number" inputMode="decimal" value={valor ?? ""} disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
      );
    case "faixa":
    case "lista":
      return (
        <Select value={valor ?? ""} onValueChange={(v) => onChange(v === "__nenhum" ? null : v)} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__nenhum">Não informado</SelectItem>
            {campo.opcoes.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "multipla": {
      const lista: string[] = Array.isArray(valor) ? valor : [];
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {campo.opcoes.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <Checkbox checked={lista.includes(o)} disabled={disabled}
                onCheckedChange={(c) => {
                  const nova = c ? [...lista, o] : lista.filter((x) => x !== o);
                  onChange(nova.length ? nova : null);
                }} />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "sim_nao":
      return (
        <Select value={valor === true ? "sim" : valor === false ? "nao" : ""} disabled={disabled}
          onValueChange={(v) => onChange(v === "sim" ? true : v === "nao" ? false : null)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">Sim</SelectItem>
            <SelectItem value="nao">Não</SelectItem>
            <SelectItem value="__">Não informado</SelectItem>
          </SelectContent>
        </Select>
      );
    default:
      return <Input value={valor ?? ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled} />;
  }
}

// Exibição do valor de um campo.
export function valorCampoTexto(campo: Pick<CampoDef, "tipo">, valor: any): string {
  if (valor === null || valor === undefined || valor === "") return "";
  if (Array.isArray(valor)) return valor.join(", ");
  if (campo.tipo === "sim_nao") return valor ? "Sim" : "Não";
  if (campo.tipo === "valor") return moeda(valor);
  return String(valor);
}

export function CampoValor({ campo, valor }: { campo: CampoDef; valor: any }) {
  const t = valorCampoTexto(campo, valor);
  if (!t) return <span className="text-muted-foreground">Não informado</span>;
  if (campo.tipo === "link" && /^https?:\/\//.test(t))
    return <a href={t} target="_blank" rel="noreferrer" className="break-all text-menta-400 underline">{t}</a>;
  return <span className="whitespace-pre-wrap break-words">{t}</span>;
}
