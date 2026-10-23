import { Link } from "react-router-dom";
import { Banknote, FileCheck2, Pencil } from "lucide-react";
import { SeloEstado } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { data, formatarCnpj, moeda } from "@/lib/formato";
import { BENEFICIARIOS, ESTADOS_COMISSAO, ESTADOS_COMISSAO_RECEBER, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { ESTADOS_TODOS, estadosPermitidosFinanceiro, type Comissao } from "./dados";

// Cartão de uma comissão, com os dados para nota fiscal quando o beneficiário é o parceiro.
export function ComissaoItem({ c, modo, onMudarEstado }: {
  c: Comissao;
  modo: "parcerias" | "financeiro";
  onMudarEstado: (c: Comissao, estados: string[], estadoInicial?: string) => void;
}) {
  const grupo = c.beneficiario === "grupo";
  const mapa = grupo ? ESTADOS_COMISSAO_RECEBER : ESTADOS_COMISSAO;
  const beneficiario = c.beneficiario === "responsavel"
    ? `Responsável pela parceria${c.responsavel?.nome ? `: ${c.responsavel.nome}` : ""}`
    : c.beneficiario === "parceiro" ? `Parceiro: ${c.parceiro?.nome_fantasia ?? ""}` : rotulo(BENEFICIARIOS, c.beneficiario);
  const financeiroPode = modo === "financeiro" ? estadosPermitidosFinanceiro(c) : [];
  const p = c.parceiro;

  return (
    <li className={cn(CLASSE_CARD, "p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">
            {p ? <Link to={`/app/parceiros/${p.id}`} className="hover:text-menta-400">{p.nome_fantasia}</Link> : "Parceiro"}
            <span className="font-normal text-muted-foreground"> · {c.indicacao?.cliente?.razao_social}</span>
          </p>
          <p className="text-sm text-muted-foreground">{c.indicacao?.empresa?.nome} · {beneficiario}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeloEstado estado={c.estado} mapa={mapa} />
          <span className="text-lg font-bold">{c.valor != null ? moeda(c.valor) : "A calcular"}</span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Dado rotulo="Percentual">{c.percentual != null ? `${Number(c.percentual).toLocaleString("pt-BR")}%` : "Não definido"}</Dado>
        <Dado rotulo={c.base_descricao ?? "Base"}>{c.base_valor != null ? moeda(c.base_valor) : "Não informada"}</Dado>
        <Dado rotulo="Indicação">{data(c.indicacao?.data)}</Dado>
        <Dado rotulo="Fechamento">{c.indicacao?.data_fechamento ? data(c.indicacao.data_fechamento) : "Não informado"}</Dado>
        <Dado rotulo="Compensação">{c.indicacao?.data_compensacao ? data(c.indicacao.data_compensacao) : "Não informada"}</Dado>
        {c.a_pagar_em && <Dado rotulo={grupo ? "A receber desde" : "A pagar desde"}>{data(c.a_pagar_em)}</Dado>}
        {c.nf_recebida_em && <Dado rotulo={grupo ? "Nota emitida em" : "Nota recebida em"}>{data(c.nf_recebida_em)}</Dado>}
        {c.paga_em && <Dado rotulo={grupo ? "Recebida em" : "Paga em"}>{data(c.paga_em)}</Dado>}
      </dl>

      {c.observacao && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{c.observacao}</p>}

      {c.beneficiario === "parceiro" && p && (
        <div className="mt-3 rounded-[8px] border border-white/10 bg-background/50 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados para nota fiscal</p>
          <p className="break-words">{p.razao_social || p.nome_fantasia}</p>
          <p className="text-muted-foreground">CNPJ: {p.cnpj ? formatarCnpj(p.cnpj) : "não informado"}</p>
          <p className="break-words text-muted-foreground">
            {[p.endereco, [p.cidade, p.uf].filter(Boolean).join("/")].filter(Boolean).join(", ") || "Endereço não informado"}
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {modo === "parcerias" && (
          <Button size="sm" variant="outline" onClick={() => onMudarEstado(c, ESTADOS_TODOS)}>
            <Pencil /> Mudar estado
          </Button>
        )}
        {financeiroPode.includes("nf_recebida") && (
          <Button size="sm" variant="outline" onClick={() => onMudarEstado(c, ["nf_recebida"], "nf_recebida")}>
            <FileCheck2 /> Nota fiscal recebida
          </Button>
        )}
        {financeiroPode.includes("paga") && (
          <Button size="sm" onClick={() => onMudarEstado(c, ["paga"], "paga")}>
            <Banknote /> Marcar como paga
          </Button>
        )}
      </div>
    </li>
  );
}

function Dado({ rotulo: r, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{r}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
