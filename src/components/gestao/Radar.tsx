// Radar em SVG puro (sem biblioteca de gráficos): eixos de 1 a `maximo`, uma ou mais séries.
export type SerieRadar = { rotulo: string; valores: Record<string, number | null | undefined>; cor?: string; tracejada?: boolean };

const COR_PADRAO = "#00e193"; // menta-500

function quebrar(texto: string): string[] {
  if (texto.length <= 14) return [texto];
  const palavras = texto.split(" ");
  let melhor = [texto];
  let menor = Infinity;
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(" ");
    const b = palavras.slice(i).join(" ");
    const d = Math.abs(a.length - b.length);
    if (d < menor) { menor = d; melhor = [a, b]; }
  }
  return melhor;
}

export function Radar({
  eixos, series, maximo = 5, tamanho = 360, className,
}: { eixos: { chave: string; rotulo: string }[]; series: SerieRadar[]; maximo?: number; tamanho?: number; className?: string }) {
  const n = eixos.length;
  const r = 100;
  const angulo = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const ponto = (i: number, v: number) => {
    const a = angulo(i);
    const raio = (Math.max(0, Math.min(maximo, v)) / maximo) * r;
    return [Math.cos(a) * raio, Math.sin(a) * raio] as const;
  };
  const aneis = Array.from({ length: maximo }, (_, k) => k + 1);

  return (
    <svg viewBox="-175 -150 350 300" width="100%" style={{ maxWidth: tamanho }} className={className} role="img"
      aria-label={`Radar: ${series.map((s) => s.rotulo).join(", ")}`}>
      {/* Anéis da régua */}
      {aneis.map((k) => (
        <polygon key={k} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1}
          points={eixos.map((_, i) => ponto(i, k).join(",")).join(" ")} />
      ))}
      {/* Eixos */}
      {eixos.map((e, i) => {
        const [x, y] = ponto(i, maximo);
        return <line key={e.chave} x1={0} y1={0} x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />;
      })}
      {/* Valores da régua no primeiro eixo */}
      {aneis.map((k) => {
        const [x, y] = ponto(0, k);
        return <text key={k} x={x + 4} y={y + 3} fontSize={8} fill="rgba(255,255,255,0.35)">{k}</text>;
      })}
      {/* Séries */}
      {series.map((s, si) => {
        const cor = s.cor ?? COR_PADRAO;
        const pts = eixos.map((e, i) => ponto(i, Number(s.valores[e.chave] ?? 0)));
        return (
          <g key={si}>
            <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={cor} fillOpacity={s.tracejada ? 0.05 : 0.22}
              stroke={cor} strokeWidth={2} strokeDasharray={s.tracejada ? "4 3" : undefined} strokeLinejoin="round" />
            {!s.tracejada && pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={cor} />)}
          </g>
        );
      })}
      {/* Rótulos dos eixos */}
      {eixos.map((e, i) => {
        const a = angulo(i);
        const x = Math.cos(a) * (r + 14);
        const y = Math.sin(a) * (r + 14);
        const ancora = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        const linhas = quebrar(e.rotulo);
        const valor = series[0]?.valores[e.chave];
        const dy = Math.sin(a) > 0.2 ? 6 : Math.sin(a) < -0.2 ? -((linhas.length - 1) * 11) - 2 : -((linhas.length - 1) * 11) / 2 + 3;
        return (
          <text key={e.chave} x={x} y={y + dy} textAnchor={ancora} fontSize={10} fill="rgba(255,255,255,0.75)">
            {linhas.map((l, k) => (
              <tspan key={k} x={x} dy={k === 0 ? 0 : 11}>
                {l}
                {k === linhas.length - 1 && valor !== null && valor !== undefined && (
                  <tspan fill={series[0]?.cor ?? COR_PADRAO} fontWeight={600}> {Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</tspan>
                )}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
