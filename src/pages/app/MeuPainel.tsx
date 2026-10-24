import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";

// Esqueleto: tela da v2 em construção.
export default function Pagina() {
  return (
    <div>
      <Cabecalho titulo="Meu painel" descricao="Carteira e metas por pessoa." />
      <Vazio titulo="Em construção." />
    </div>
  );
}
