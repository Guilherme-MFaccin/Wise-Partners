import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ParceiroBusca, useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { normalizar } from "@/components/parceiros/dados";
import { toastErro } from "@/lib/erros";
import { data as fmtData } from "@/lib/formato";
import { useCertificados, type Certificado, type Trilha } from "./dados";

const TODAS = "__todas";

// Certificados emitidos, com código, versão e data. Administradores podem desativar ou reativar.
export function ListaCertificados({ trilhas }: { trilhas: Trilha[] }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const q = useCertificados();
  const { data: parceiros = [] } = useParceirosResumo();
  const [trilha, setTrilha] = useState(TODAS);
  const [parceiro, setParceiro] = useState<string | null>(null);
  const [situacao, setSituacao] = useState("ativos");
  const [busca, setBusca] = useState("");
  const [alterar, setAlterar] = useState<Certificado | null>(null);

  const nomeParceiro = (id: string | null) => parceiros.find((p) => p.id === id)?.nome_fantasia ?? "";
  const lista = useMemo(() => {
    const b = normalizar(busca);
    return (q.data ?? []).filter((c) =>
      (trilha === TODAS || c.trilha_id === trilha)
      && (!parceiro || c.parceiro_id === parceiro)
      && (situacao === "todos" || (situacao === "ativos" ? c.ativo : !c.ativo))
      && (!b || normalizar(`${c.nome_pessoa} ${c.codigo}`).includes(b)));
  }, [q.data, trilha, parceiro, situacao, busca]);

  const mudanca = useMutation({
    mutationFn: async (c: Certificado) => {
      const { error } = await supabase.from("certificados").update({ ativo: !c.ativo }).eq("id", c.id);
      if (error) throw error;
      return !c.ativo;
    },
    onSuccess: (ativo) => {
      toast.success(ativo ? "Certificado reativado." : "Certificado desativado: deixa de contar nos requisitos de nível e no ranking.");
      qc.invalidateQueries({ queryKey: ["capacitacao"] });
      setAlterar(null);
    },
    onError: toastErro,
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={trilha} onValueChange={setTrilha}>
          <SelectTrigger aria-label="Trilha"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as trilhas</SelectItem>
            {trilhas.map((t) => <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <ParceiroBusca valor={parceiro} onChange={setParceiro} placeholder="Todos os parceiros" />
          {parceiro && <Button variant="ghost" size="icon" aria-label="Limpar parceiro" onClick={() => setParceiro(null)}><X /></Button>}
        </div>
        <Select value={situacao} onValueChange={setSituacao}>
          <SelectTrigger aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Pessoa ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && !lista.length && <Vazio titulo="Nenhum certificado encontrado." />}

      {lista.length > 0 && (
        <div className="rounded-[14px] border border-white/10 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead>Parceiro</TableHead>
                <TableHead>Trilha</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Emitido em</TableHead>
                <TableHead>Situação</TableHead>
                {isAdmin && <TableHead className="w-28" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome_pessoa}</TableCell>
                  <TableCell>
                    {c.parceiro_id
                      ? <Link to={`/app/parceiros/${c.parceiro_id}`} className="text-menta-400 hover:underline">{nomeParceiro(c.parceiro_id) || "Abrir ficha"}</Link>
                      : ""}
                  </TableCell>
                  <TableCell className="min-w-[160px]">{c.titulo_trilha} <span className="text-xs text-muted-foreground">v{c.versao}</span></TableCell>
                  <TableCell><code className="rounded bg-white/5 px-1 text-xs">{c.codigo}</code></TableCell>
                  <TableCell>{fmtData(c.emitido_em)}</TableCell>
                  <TableCell>{c.ativo ? <Pilula tom="menta">Ativo</Pilula> : <Pilula>Inativo</Pilula>}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setAlterar(c)}>{c.ativo ? "Desativar" : "Reativar"}</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!alterar} onOpenChange={(v) => !v && setAlterar(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{alterar?.ativo ? "Desativar certificado?" : "Reativar certificado?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {alterar?.nome_pessoa} · {alterar?.titulo_trilha} (código {alterar?.codigo}).{" "}
              {alterar?.ativo
                ? "O certificado deixa de contar nos requisitos de nível, na matriz e no ranking."
                : "O certificado volta a contar nos requisitos de nível, na matriz e no ranking."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={mudanca.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (alterar) mudanca.mutate(alterar);
              }}
            >
              {alterar?.ativo ? "Desativar" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
