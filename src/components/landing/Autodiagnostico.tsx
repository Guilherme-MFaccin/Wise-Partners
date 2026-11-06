import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enviarCliente } from "@/lib/landing";
import {
  AFIRMACOES, CRITERIOS, ESCALA, NIVEIS, PILARES, TOTAL_PERGUNTAS, chaveResposta, nomePilar, type ResultadoMatriz,
} from "@/lib/diagnostico";

// Autodiagnóstico (Matriz 5x5): um pilar por etapa, cinco afirmações por pilar, nota de 1 a 5.
// O resultado vem pronto do banco; só depois dele a pessoa recebe o link do Wise Hub (FO-10).
export function Autodiagnostico({ id, chave, email }: { id: string; chave: string; email: string }) {
  const [etapa, setEtapa] = useState(0);
  const [resp, setResp] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoMatriz | null>(null);
  const topo = useRef<HTMLDivElement>(null);

  const pilar = PILARES[etapa];
  const feitas = Object.keys(resp).length;
  const etapaCompleta = CRITERIOS.every((c) => resp[chaveResposta(pilar.chave, c.chave)]);

  function irPara(n: number) {
    setEtapa(n);
    topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function concluir() {
    setFalha(null);
    setEnviando(true);
    try {
      const r = await enviarCliente<ResultadoMatriz>({ acao: "diagnostico", id, chave, respostas: resp });
      setResultado(r);
      topo.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível enviar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) return <div ref={topo} className="scroll-mt-20"><Resultado r={resultado} email={email} /></div>;

  return (
    <div ref={topo} className="scroll-mt-20 space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Autodiagnóstico · pilar {etapa + 1} de {PILARES.length}</p>
        <h3 className="mt-2 text-[22px] font-semibold leading-snug">{pilar.nome}</h3>
        <p className="mt-1 text-sm text-neutro-300">{pilar.dica} Marque o quanto cada frase vale para a sua empresa hoje.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_PERGUNTAS} aria-valuenow={feitas}
          aria-label="Perguntas respondidas">
          <div className="h-full rounded-full bg-menta-500 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(feitas / TOTAL_PERGUNTAS) * 100}%` }} />
        </div>
      </div>

      <ol className="space-y-4">
        {CRITERIOS.map((c, i) => {
          const k = chaveResposta(pilar.chave, c.chave);
          return (
            <li key={k}>
              <fieldset className="rounded-[14px] border border-white/10 bg-background/40 p-4">
                <legend className="sr-only">{c.nome}</legend>
                <p className="text-sm font-medium"><span className="mr-1.5 tabular-nums text-neutro-300">{etapa * 5 + i + 1}.</span>{AFIRMACOES[pilar.chave][c.chave]}</p>
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {ESCALA.map((e) => {
                    const marcado = resp[k] === e.nota;
                    return (
                      <label key={e.nota} className={`flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border px-1 py-2 text-center transition-colors ${marcado ? "border-menta-500 bg-menta-500/10" : "border-white/15 hover:border-white/40"}`}>
                        <input type="radio" name={k} value={e.nota} checked={marcado} onChange={() => setResp((x) => ({ ...x, [k]: e.nota }))} className="sr-only" />
                        <span className="text-base font-bold tabular-nums">{e.nota}</span>
                        <span className="text-[11px] leading-tight text-neutro-300">{e.rotulo}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </li>
          );
        })}
      </ol>

      {falha && <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{falha}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => irPara(etapa - 1)} disabled={etapa === 0}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden />Voltar</Button>
        {etapa < PILARES.length - 1 ? (
          <Button onClick={() => irPara(etapa + 1)} disabled={!etapaCompleta}>Próximo pilar<ArrowRight className="ml-1 h-4 w-4" aria-hidden /></Button>
        ) : (
          <Button onClick={concluir} disabled={!etapaCompleta || feitas < TOTAL_PERGUNTAS || enviando}>
            {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Calculando...</> : "Ver meu resultado"}
          </Button>
        )}
      </div>
      {!etapaCompleta && <p className="text-right text-xs text-neutro-300">Responda as cinco frases para seguir.</p>}
    </div>
  );
}

function Resultado({ r, email }: { r: ResultadoMatriz; email: string }) {
  const nivel = NIVEIS[r.nivel];
  return (
    <div className="space-y-6" role="status">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Seu resultado</p>
        <h3 className="mt-2 text-[28px] font-semibold leading-tight">Nível {nivel?.nome ?? r.nivel}</h3>
        <p className="mt-1 text-sm text-neutro-300">Maturidade comercial geral: <span className="font-semibold text-foreground tabular-nums">{r.percentual}%</span></p>
        <p className="mt-3 text-neutro-100">{nivel?.texto}</p>
      </div>
      <ul className="space-y-3" aria-label="Maturidade por pilar">
        {r.pilares.map((p) => {
          const fragil = p.chave === r.pilar_mais_fragil;
          return (
            <li key={p.chave}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={fragil ? "font-semibold" : "text-neutro-100"}>{nomePilar(p.chave)}{fragil && <span className="ml-2 text-xs font-normal text-menta-300">comece por aqui</span>}</span>
                <span className="tabular-nums text-neutro-300">{p.percentual}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full ${fragil ? "bg-menta-500" : "bg-neutro-300"}`} style={{ width: `${Math.max(p.percentual, 2)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-5">
        <p className="font-semibold">Próximo passo: o Wise Hub</p>
        <p className="mt-1 text-sm text-neutro-100">
          No Hub você monta o plano de 30, 60 e 90 dias, começa pelas trilhas de {nomePilar(r.pilar_mais_fragil).toLowerCase()} e usa as ferramentas sem custo. Crie a sua conta com o e-mail {email}.
        </p>
        <Button asChild className="mt-4 h-11">
          <a href={r.hub_url ?? "https://www.wisemakershub.com/auth"} target="_blank" rel="noopener noreferrer">
            Acessar o Wise Hub<ExternalLink className="ml-1.5 h-4 w-4" aria-hidden /><span className="sr-only"> (abre em outra aba)</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
