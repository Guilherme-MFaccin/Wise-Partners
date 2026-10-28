import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MINIMO_SENHA_PESSOAL } from "@/lib/senha";

// Campo de senha com botão de mostrar e esconder
export function CampoSenha({
  id, rotulo, valor, onChange, autoComplete, dica,
}: { id: string; rotulo: string; valor: string; onChange: (v: string) => void; autoComplete: string; dica?: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <div className="relative">
        <Input id={id} type={visivel ? "text" : "password"} autoComplete={autoComplete} value={valor}
          onChange={(e) => onChange(e.target.value)} className="pr-11" aria-describedby={dica ? `${id}-dica` : undefined} />
        <button type="button" onClick={() => setVisivel((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"} aria-pressed={visivel}>
          {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {dica && <p id={`${id}-dica`} className="text-xs text-muted-foreground">{dica}</p>}
    </div>
  );
}

// Nova senha e confirmação, usados na troca de senha e na redefinição pelo e-mail
export function CamposNovaSenha({
  nova, confirmacao, onNova, onConfirmacao,
}: { nova: string; confirmacao: string; onNova: (v: string) => void; onConfirmacao: (v: string) => void }) {
  return (
    <>
      <CampoSenha id="nova-senha" rotulo="Nova senha" valor={nova} onChange={onNova} autoComplete="new-password"
        dica={`Pelo menos ${MINIMO_SENHA_PESSOAL} caracteres. Uma frase curta é mais segura e fácil de lembrar.`} />
      <CampoSenha id="confirmar-senha" rotulo="Confirme a nova senha" valor={confirmacao} onChange={onConfirmacao} autoComplete="new-password" />
    </>
  );
}
