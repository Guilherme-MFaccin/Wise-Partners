import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";
import { data } from "@/lib/formato";
import { GRUPOS_REQUISITO, rotulo } from "@/lib/rotulos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { SeloNivel } from "@/components/comum/Selos";

type Conteudo = {
  niveis?: { codigo: string; nome: string; requisitos: { grupo: string; descricao: string }[] | null }[] | null;
  pacotes?: { codigo: string; nome: string; entregas: string[] | null }[] | null;
  comissoes?: { empresa: string; base: string | null; percentual_parceiro: number | null }[] | null;
  protecao_dias?: number;
  sla?: Record<string, number>;
  regua?: { chave: string; descricao: string }[] | null;
  desligamento?: Record<string, number>;
  ranking?: Record<string, number> | null;
  premiacao?: string[] | null;
  revisao?: { janela_dias?: number; isencao_dias?: number };
};
type Versao = { id: string; versao: number; conteudo: Conteudo; mudancas: string | null; vigente_desde: string };

const PONTOS: Record<string, string> = {
  indicacao_qualificada: "Indicação qualificada",
  reuniao: "Indicação que virou reunião",
  cliente_icp: "Cliente fechado no perfil ideal (ICP)",
  pessoa_certificada: "Pessoa certificada (uma vez por pessoa e trilha)",
  acao_comprovada: "Ação conjunta do parceiro concluída e comprovada no prazo",
};
const ORDEM_GRUPOS = ["resultado", "capacitacao", "regras"];

// Regras do programa (História 13): geradas da configuração publicada, com a versão vigente e a próxima.
export default function Regras() {
  const q = useQuery({
    queryKey: ["portal-regras"],
    queryFn: async () => ok<any>(await supabase.rpc("regras_publicadas")) as { vigente: Versao | null; proxima: Versao | null } | null,
  });
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const vigente = q.data?.vigente ?? null;
  const proxima = q.data?.proxima ?? null;
  if (!vigente && !proxima) {
    return (
      <div>
        <Cabecalho titulo="Regras do programa" />
        <Vazio titulo="Regras ainda não publicadas">Quando a Wise publicar as regras do programa, elas aparecem aqui.</Vazio>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Regras do programa"
        descricao="Como funciona o Wise Partners: níveis, pacotes, comissão, proteção das indicações, prazos, ranking e premiação." />

      {proxima && (
        <div className="flex gap-3 rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-4 text-sm">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" />
          <div>
            <p className="font-semibold">Nova versão {proxima.versao} vale a partir de {data(proxima.vigente_desde)}</p>
            {proxima.mudancas && <p className="mt-1 whitespace-pre-line text-muted-foreground">{proxima.mudancas}</p>}
          </div>
        </div>
      )}

      {vigente && proxima ? (
        <Tabs defaultValue="vigente">
          <TabsList className="mb-4 h-auto w-full flex-wrap justify-start sm:w-auto">
            <TabsTrigger value="vigente">Vigente (versão {vigente.versao})</TabsTrigger>
            <TabsTrigger value="proxima">A partir de {data(proxima.vigente_desde)}</TabsTrigger>
          </TabsList>
          <TabsContent value="vigente"><VersaoRegras v={vigente} /></TabsContent>
          <TabsContent value="proxima"><VersaoRegras v={proxima} /></TabsContent>
        </Tabs>
      ) : (
        <VersaoRegras v={(vigente ?? proxima)!} />
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{titulo}</h2>
      <div className="mt-3 text-sm">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /><span>{i}</span></li>)}
    </ul>
  );
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
const dias = (n: number | undefined, uteis = false) => (n === undefined ? "" : `${n} ${n === 1 ? "dia" : "dias"}${uteis ? (n === 1 ? " útil" : " úteis") : ""}`);

function VersaoRegras({ v }: { v: Versao }) {
  const c = v.conteudo ?? {};
  const sla = {
    validacao_dias_uteis: 2, retorno_parceiro_dias_uteis: 5, atualizacao_dias: 15, parceiro_contato_dias_uteis: 2, parceiro_atualizacao_dias_uteis: 5,
    ...(c.sla ?? {}),
  };
  const des = c.desligamento ?? {};
  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" /> Versão {v.versao}, vigente desde {data(v.vigente_desde)}.
      </p>
      {v.mudancas && (
        <Secao titulo="O que mudou nesta versão"><p className="whitespace-pre-line text-muted-foreground">{v.mudancas}</p></Secao>
      )}

      {!!c.niveis?.length && (
        <Secao titulo="Níveis e requisitos">
          <p className="mb-3 text-muted-foreground">
            O nível é revisto a cada trimestre pelos resultados dos últimos {c.revisao?.janela_dias ?? 180} dias. Quem cumpre os requisitos de um nível acima sobe na hora;
            quem deixa de cumprir os do nível atual fica um trimestre em observação antes de qualquer mudança.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {c.niveis.map((n) => (
              <div key={n.codigo} className="rounded-[10px] border border-white/10 p-3">
                <SeloNivel tipo="comercial" nivel={n.codigo} />
                <dl className="mt-3 space-y-2">
                  {[...(n.requisitos ?? [])].sort((a, b) => ORDEM_GRUPOS.indexOf(a.grupo) - ORDEM_GRUPOS.indexOf(b.grupo)).map((r) => (
                    <div key={r.grupo}>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{rotulo(GRUPOS_REQUISITO, r.grupo)}</dt>
                      <dd>{r.descricao}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Secao>
      )}

      {!!c.pacotes?.length && (
        <Secao titulo="Pacotes e benefícios">
          <div className="grid gap-3 md:grid-cols-3">
            {c.pacotes.map((p) => (
              <div key={p.codigo} className="rounded-[10px] border border-white/10 p-3">
                <p className="mb-2 font-semibold">Pacote {p.nome}</p>
                <Lista itens={p.entregas ?? []} />
              </div>
            ))}
          </div>
        </Secao>
      )}

      {!!c.comissoes?.length && (
        <Secao titulo="Comissão da Wise ao parceiro">
          <ul className="divide-y divide-white/5">
            {c.comissoes.map((k) => (
              <li key={k.empresa} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold">{k.empresa}</span>
                <span className="text-muted-foreground">{pct(k.percentual_parceiro)}{k.base ? ` sobre ${k.base.charAt(0).toLowerCase()}${k.base.slice(1)}` : ""}</span>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Secao titulo="Proteção da indicação">
          <p>
            A indicação fica protegida por {dias(c.protecao_dias ?? 180)} contados da última interação registrada com o cliente.
            Nesse prazo vale o primeiro registro. Depois dele, um novo registro do mesmo cliente é aceito e atribuído a quem reengajou.
          </p>
        </Secao>
        <Secao titulo="Prazos das indicações (SLA)">
          <p className="mb-2 font-semibold">Quando vocês indicam para a Wise</p>
          <Lista itens={[
            "Confirmação de recebimento imediata e automática",
            `Validação e primeiro contato com o cliente em até ${dias(sla.validacao_dias_uteis, true)}`,
            `Retorno a vocês sobre o primeiro contato em até ${dias(sla.retorno_parceiro_dias_uteis, true)} do registro`,
            `Atualização a cada mudança de etapa e no mínimo a cada ${dias(sla.atualizacao_dias)}`,
          ]} />
          <p className="mb-2 mt-4 font-semibold">Quando a Wise indica para vocês</p>
          <Lista itens={[
            `Primeiro contato de vocês com o cliente em até ${dias(sla.parceiro_contato_dias_uteis, true)}`,
            `Atualização no portal em até ${dias(sla.parceiro_atualizacao_dias_uteis, true)} do registro e no mínimo a cada ${dias(sla.atualizacao_dias)}`,
          ]} />
        </Secao>
      </div>

      {!!c.regua?.length && (
        <Secao titulo="Acompanhamento da Wise (régua de atendimento)">
          <Lista itens={c.regua.map((r) => r.descricao)} />
        </Secao>
      )}

      {!!(des.dias_assinatura || des.janela_dias) && (
        <Secao titulo="Encerramento da parceria por inatividade">
          <p>
            Uma parceria com mais de {dias(des.dias_assinatura)} de assinatura que fique {dias(des.janela_dias)} sem indicação qualificada e sem ação conjunta comprovada
            recebe duas tentativas de retomada da Wise, com pelo menos {dias(des.intervalo_tentativas)} entre elas. Sem resposta em {dias(des.espera_dias)} depois da segunda,
            o encerramento pode ser proposto, sempre com aprovação da diretoria e aviso formal de {dias(des.aviso_dias)}. Comissões e indicações em aberto são preservadas.
          </p>
        </Secao>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {c.ranking && Object.keys(c.ranking).length > 0 && (
          <Secao titulo="Pontos do ranking">
            <ul className="divide-y divide-white/5">
              {Object.entries(c.ranking).map(([k, pts]) => (
                <li key={k} className="flex items-center justify-between gap-3 py-2">
                  <span>{PONTOS[k] ?? k}</span>
                  <span className="shrink-0 font-semibold text-menta-300">{pts} {Number(pts) === 1 ? "ponto" : "pontos"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Ranking do ano (janeiro a dezembro) e do trimestre. Empate: mais clientes fechados, depois a assinatura mais antiga.
              Quem preferir pode aparecer como "Parceiro Wise", sem o nome.
            </p>
          </Secao>
        )}
        {!!c.premiacao?.length && (
          <Secao titulo="Premiação anual">
            <Lista itens={c.premiacao} />
            <p className="mt-3 text-xs text-muted-foreground">O vencedor de cada categoria recebe o selo da premiação nos materiais do portal.</p>
          </Secao>
        )}
      </div>
    </div>
  );
}
