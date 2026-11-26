import { Check, ExternalLink, Lock, X } from "lucide-react";
import type { EmpresaGrupo, ResumoComunidade } from "@/lib/landing";

// Peças da Comunidade Wise Partners na página do portal: empresas do grupo, quem acessa o quê e os números do catálogo.

// Quem acessa o quê. Segue as regras do banco (pode_ver_catalogo, pode_ofertar, acesso_comunidade); não é editável.
const PERFIS_ACESSO = ["Cadastrada", "Cliente do grupo", "Parceiro Premium", "Parceiro Elite"];
const LINHAS_ACESSO: { rotulo: string; marcas: boolean[] }[] = [
  { rotulo: "Ver as empresas e o que cada uma oferece", marcas: [true, true, true, true] },
  { rotulo: "Usar as condições especiais do catálogo", marcas: [false, true, true, true] },
  { rotulo: "Indicar a consultoria da Wise Makers com link próprio", marcas: [false, true, true, true] },
  { rotulo: "Conhecer a Wise Makers no minicurso", marcas: [true, true, true, true] },
  { rotulo: "Oferecer produtos e serviços no catálogo", marcas: [false, true, false, true] },
];


export function CartaoEmpresaGrupo({ e }: { e: EmpresaGrupo }) {
  const url = e.site ? (/^https?:/.test(e.site) ? e.site : `https://${e.site}`) : null;
  return (
    <li className="flex min-w-0 flex-col rounded-[14px] border border-white/10 bg-card p-5">
      <p className="break-words text-lg font-semibold">{e.nome}</p>
      {e.descricao && <p className="mt-2 text-sm text-neutro-300">{e.descricao}</p>}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm text-neutro-300 hover:text-white">
          Conhecer o site<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only"> (abre em outra aba)</span>
        </a>
      )}
    </li>
  );
}


function Marca({ sim }: { sim: boolean }) {
  return sim ? <Check className="mx-auto h-5 w-5 text-menta-400" role="img" aria-label="Sim" /> : <X className="mx-auto h-5 w-5 text-neutro-300" role="img" aria-label="Não" />;
}


// Tabela no computador; no celular, um cartão por perfil com o que ele acessa
export function QuadroAcessos() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[14px] border border-white/10 bg-card lg:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">O que cada empresa acessa na comunidade</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-5 py-3"><span className="sr-only">Acesso</span></th>
              {PERFIS_ACESSO.map((p) => <th key={p} scope="col" className="w-36 px-2 py-3 text-center text-sm font-semibold">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {LINHAS_ACESSO.map((l) => (
              <tr key={l.rotulo} className="border-b border-white/10 last:border-0">
                <th scope="row" className="px-5 py-3 font-normal">{l.rotulo}</th>
                {l.marcas.map((m, i) => <td key={i} className="px-2 py-3 text-center"><Marca sim={m} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {PERFIS_ACESSO.map((p, i) => (
          <li key={p} className="rounded-[14px] border border-white/10 bg-card p-4">
            <p className="font-semibold">{p}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {LINHAS_ACESSO.map((l) => (
                <li key={l.rotulo} className={`flex items-start gap-2 ${l.marcas[i] ? "" : "text-neutro-300"}`}>
                  {l.marcas[i] ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" role="img" aria-label="Sim" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-neutro-300" role="img" aria-label="Não" />}
                  {l.rotulo}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

export function NumerosCatalogo({ resumo, nota }: { resumo: ResumoComunidade | null | undefined; nota: string }) {
  const tem = !!resumo && resumo.ofertas > 0;
  const numero = (valor: number, rotulo: string) => (
    <div className="rounded-[14px] border border-white/10 bg-card p-5">
      <p className="font-display text-[36px] font-bold leading-none tabular-nums">{valor.toLocaleString("pt-BR")}</p>
      <p className="mt-2 text-sm text-neutro-300">{rotulo}</p>
    </div>
  );
  return (
    <div className="space-y-6">
      {tem ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {numero(resumo.ofertas, resumo.ofertas === 1 ? "oferta com condição especial" : "ofertas com condição especial")}
          {numero(resumo.empresas_ofertando, resumo.empresas_ofertando === 1 ? "empresa oferecendo" : "empresas oferecendo")}
          {numero(resumo.membros, "empresas no ecossistema")}
        </div>
      ) : (
        <p className="rounded-[14px] border border-white/10 bg-card px-5 py-4 text-sm text-neutro-300">
          O catálogo está começando: as primeiras ofertas estão em validação pela Wise. Quem se cadastra agora acompanha cada empresa que entra.
        </p>
      )}
      {!!resumo?.categorias.length && (
        <div>
          <p className="text-sm font-semibold">Categorias com ofertas</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {resumo.categorias.map((c) => <li key={c} className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutro-100">{c}</li>)}
          </ul>
        </div>
      )}
      {nota && <p className="flex items-start gap-2 text-sm text-neutro-300"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{nota}</p>}
    </div>
  );
}

