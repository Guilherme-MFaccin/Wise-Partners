import { Link } from "react-router-dom";
import { Logo } from "@/components/comum/Logo";

export default function NaoEncontrada() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="space-y-4">
        <Logo className="mx-auto h-8" />
        <h1 className="text-xl font-bold">Página não encontrada</h1>
        <Link to="/" className="text-menta-400 underline">Voltar ao início</Link>
      </div>
    </div>
  );
}
