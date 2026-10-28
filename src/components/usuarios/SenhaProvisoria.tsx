import { useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { gerarSenha, MINIMO_SENHA_PROVISORIA } from "@/lib/senha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Senha provisória de um acesso novo ou redefinido: digitada ou gerada (12 caracteres sem ambiguidade)
export function CampoSenhaProvisoria({ id, valor, onChange }: { id: string; valor: string; onChange: (v: string) => void }) {
  const [visivel, setVisivel] = useState(true);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Senha provisória</Label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input id={id} type={visivel ? "text" : "password"} autoComplete="new-password" value={valor}
            onChange={(e) => onChange(e.target.value)} className="pr-11 font-mono" aria-describedby={`${id}-dica`} />
          <button type="button" onClick={() => setVisivel((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={visivel ? "Esconder senha" : "Mostrar senha"} aria-pressed={visivel}>
            {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="button" variant="outline" onClick={() => onChange(gerarSenha())}><RefreshCw /> Gerar</Button>
      </div>
      <p id={`${id}-dica`} className="text-xs text-muted-foreground">
        Pelo menos {MINIMO_SENHA_PROVISORIA} caracteres. A pessoa entra com ela e o portal pede a troca por uma senha só dela.
      </p>
    </div>
  );
}

function LinhaCopiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie.");
    }
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-white/5 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        <p className="select-all break-all font-mono text-sm">{valor}</p>
      </div>
      <Button type="button" size="icon" variant="ghost" onClick={copiar} aria-label={`Copiar ${rotulo.toLowerCase()}`}>
        {copiado ? <Check className="text-menta-400" /> : <Copy />}
      </Button>
    </div>
  );
}

// Dados para repassar à pessoa depois de criar ou redefinir o acesso
export function CredenciaisCriadas({ email, senha }: { email: string; senha: string }) {
  const endereco = `${window.location.origin}/entrar`;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Repasse estes dados à pessoa por um canal direto (WhatsApp ou ligação). A senha não fica salva aqui e não vai por e-mail.
      </p>
      <LinhaCopiavel rotulo="Endereço" valor={endereco} />
      <LinhaCopiavel rotulo="Login" valor={email} />
      <LinhaCopiavel rotulo="Senha provisória" valor={senha} />
    </div>
  );
}
