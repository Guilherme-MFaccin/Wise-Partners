import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, BadgeCheck, ChevronRight, Download, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { data } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useMeuParceiro } from "@/components/portal/dados";
import { baixarCertificadoPdf, useProgresso, useTrilhas, type Certificado, type Trilha } from "@/components/capacitacao-parceiro/dados";

// Capacitação: trilhas publicadas com o progresso da pessoa; o responsável vê também a equipe e os certificados da empresa.
export default function Capacitacao() {
  const { perfil } = useAuth();
  const parceiroQ = useMeuParceiro();
  const trilhasQ = useTrilhas();
  const meuQ = useProgresso("eu");
  const responsavel = !!perfil?.is_responsavel_parceiro;
  const assinado = !!parceiroQ.data?.data_assinatura;

  if (trilhasQ.isLoading || meuQ.isLoading || parceiroQ.isLoading) return <Carregando />;
  const erro = trilhasQ.error || meuQ.error;
  if (erro) return <ErroCarga erro={erro} />;
  const trilhas = trilhasQ.data?.trilhas ?? [];
  const modulos = trilhasQ.data?.modulos ?? [];
  const feitos = new Set((meuQ.data?.progresso ?? []).map((p) => p.modulo_id));
  const certificados = meuQ.data?.certificados ?? [];

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Capacitação"
        descricao="Trilhas da Wise para a sua equipe vender melhor. Cada pessoa faz a trilha com o próprio login e recebe o próprio certificado." />

      {!assinado ? (
        <Vazio titulo="Capacitação disponível após a assinatura">As trilhas ficam disponíveis para parceiros com contrato assinado.</Vazio>
      ) : trilhas.length === 0 ? (
        <Vazio titulo="Nenhuma trilha publicada">Quando a Wise publicar uma trilha, ela aparece aqui.</Vazio>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {trilhas.map((t) => {
            const ids = modulos.filter((m) => m.trilha_id === t.id).map((m) => m.id);
            const n = ids.filter((id) => feitos.has(id)).length;
            const cert = certificados.find((c) => c.trilha_id === t.id);
            return <CartaoTrilha key={t.id} t={t} total={ids.length} feitos={n} cert={cert} parceiro={parceiroQ.data?.nome_fantasia} />;
          })}
        </ul>
      )}

      {certificados.length > 0 && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Award className="h-4 w-4 text-menta-400" /> Meus certificados</h2>
          <ListaCertificados certificados={certificados} parceiro={parceiroQ.data?.nome_fantasia} />
        </section>
      )}

      {responsavel && assinado && trilhas.length > 0 && (
        <Equipe trilhas={trilhas} modulos={modulos} parceiro={parceiroQ.data?.nome_fantasia} />
      )}
    </div>
  );
}

function CartaoTrilha({ t, total, feitos, cert, parceiro }: { t: Trilha; total: number; feitos: number; cert?: Certificado; parceiro?: string }) {
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  const certAtual = cert && cert.versao === t.versao;
  return (
    <li className="flex flex-col rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-menta-500/10 text-menta-400"><GraduationCap className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{t.titulo}</p>
            {certAtual ? <Pilula tom="menta"><BadgeCheck className="mr-1 h-3 w-3" /> Certificado</Pilula>
              : cert ? <Pilula tom="info">Certificado da versão {cert.versao}</Pilula>
              : feitos > 0 ? <Pilula tom="info">Em andamento</Pilula> : <Pilula>Não iniciada</Pilula>}
          </div>
          <p className="text-xs text-muted-foreground">Versão {t.versao} · {total} módulos · nota mínima {t.nota_minima}%</p>
        </div>
      </div>
      {t.descricao && <p className="mt-3 text-sm text-muted-foreground">{t.descricao}</p>}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span>{feitos} de {total}</span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-menta-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-auto sm:pt-4">
        <Button asChild size="sm">
          <Link to={`/parceiro/capacitacao/${t.id}`}>{feitos === 0 ? "Começar" : certAtual ? "Rever a trilha" : "Continuar"} <ChevronRight /></Link>
        </Button>
        {cert && (
          <Button size="sm" variant="outline" onClick={() => baixarCertificadoPdf(cert, parceiro)}><Download /> Certificado</Button>
        )}
      </div>
    </li>
  );
}

function ListaCertificados({ certificados, parceiro, mostrarPessoa }: { certificados: Certificado[]; parceiro?: string; mostrarPessoa?: boolean }) {
  return (
    <ul className="mt-3 divide-y divide-white/5">
      {certificados.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="font-semibold">{mostrarPessoa ? c.nome_pessoa : c.titulo_trilha}</p>
            <p className="text-xs text-muted-foreground">
              {mostrarPessoa && <>{c.titulo_trilha} · </>}Versão {c.versao} · emitido em {data(c.emitido_em)} · código {c.codigo}
              {!c.ativo && " · inativo"}
            </p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => baixarCertificadoPdf(c, parceiro)}><Download /> Baixar PDF</Button>
        </li>
      ))}
    </ul>
  );
}

// Equipe da empresa (só o responsável): progresso de cada pessoa por trilha e certificados
function Equipe({ trilhas, modulos, parceiro }: { trilhas: Trilha[]; modulos: { id: string; trilha_id: string }[]; parceiro?: string }) {
  const { perfil } = useAuth();
  const empresaQ = useProgresso("empresa");
  const pessoasQ = useQuery({
    enabled: !!perfil?.parceiro_id,
    queryKey: ["portal-usuarios-capacitacao", perfil?.parceiro_id],
    queryFn: async () => ok<any>(await supabase.from("perfis").select("id, nome, email, ativo")
      .eq("parceiro_id", perfil!.parceiro_id).order("nome")) as { id: string; nome: string; email: string; ativo: boolean }[],
  });
  const linhas = useMemo(() => {
    const prog = empresaQ.data?.progresso ?? [];
    const certs = empresaQ.data?.certificados ?? [];
    return (pessoasQ.data ?? []).filter((p) => p.ativo).map((p) => ({
      pessoa: p,
      porTrilha: trilhas.map((t) => {
        const ids = new Set(modulos.filter((m) => m.trilha_id === t.id).map((m) => m.id));
        const feitos = prog.filter((g) => g.perfil_id === p.id && ids.has(g.modulo_id)).length;
        const cert = certs.find((c) => c.perfil_id === p.id && c.trilha_id === t.id);
        return { trilha: t, total: ids.size, feitos, cert };
      }),
    }));
  }, [empresaQ.data, pessoasQ.data, trilhas, modulos]);

  if (empresaQ.isLoading || pessoasQ.isLoading) return <Carregando />;
  if (empresaQ.error || pessoasQ.error) return <ErroCarga erro={empresaQ.error || pessoasQ.error} />;
  const certs = (empresaQ.data?.certificados ?? []).filter((c) => c.ativo);

  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Equipe</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Progresso das pessoas da empresa. Pessoas certificadas contam para os requisitos de nível. Convide a equipe em Usuários.
      </p>
      <ul className="mt-4 space-y-3">
        {linhas.map(({ pessoa, porTrilha }) => (
          <li key={pessoa.id} className="rounded-[10px] border border-white/10 p-3">
            <p className="text-sm font-semibold">{pessoa.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{pessoa.email}</p>
            <ul className="mt-2 space-y-1.5">
              {porTrilha.map(({ trilha, total, feitos, cert }) => (
                <li key={trilha.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="min-w-0 flex-1">{trilha.titulo}</span>
                  <span className="text-xs text-muted-foreground">{feitos} de {total} módulos</span>
                  {cert ? <Pilula tom="menta">Certificado v{cert.versao}</Pilula> : feitos > 0 ? <Pilula tom="info">Em andamento</Pilula> : <Pilula>Não iniciada</Pilula>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {certs.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-semibold">Certificados da empresa ({certs.length})</h3>
          <ListaCertificados certificados={certs} parceiro={parceiro} mostrarPessoa />
        </>
      )}
    </section>
  );
}
