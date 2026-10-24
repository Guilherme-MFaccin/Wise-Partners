# Tokens do Portal Wise Partners

Proposta de camada semântica sobre o que já existe em `src/index.css` e `tailwind.config.ts`. Os nomes existentes do shadcn (`--background`, `--card`, `--primary` etc.) continuam valendo e passam a apontar para estes tokens. Valores em hexadecimal para leitura; no CSS, manter no formato HSL que o projeto já usa.

**Antes de adotar**: conferir o contraste de cada par texto e fundo com uma ferramenta (por exemplo, o painel de acessibilidade do Chrome DevTools) e ajustar o tom, nunca o papel do token.

## Base da marca (do Wise Makers Design System)

| Grupo | Valores |
|---|---|
| Menta | 900 `#0d4d37`, 800 `#0a6b48`, 700 `#00905e`, 600 `#00b877`, 500 `#00e193` (base), 400 `#12e893`, 300 `#4defa9`, 200 `#8ef7c9`, 100 `#c3fbe2` |
| Neutros | 1000 `#000000`, 900 `#101012`, 800 `#1c1c20`, 700 `#303036`, 500 `#61616a`, 300 `#adadb3`, 100 `#e7e7e9`, 0 `#ffffff` |
| Semânticas | Sucesso `#00e193`, Perigo `#f0473a`, Alerta `#f5a623` |
| Fontes | Plus Jakarta Sans (400 a 800), Baloo 2 (700 e 800) |

## Superfícies

| Token | Valor | Uso |
|---|---|---|
| `--surface-0` | `#101012` | Fundo da aplicação |
| `--surface-1` | `#151518` | Barra lateral, áreas agrupadas |
| `--surface-2` | `#1c1c20` | Cards |
| `--surface-3` | `#24242a` | Hover de card e de linha, card destacado |
| `--surface-4` | `#303036` | Popover, menu, campo de formulário |
| `--border-subtle` | branco 8% | Divisões internas |
| `--border-default` | branco 12% | Borda de card e de campo |
| `--border-strong` | branco 20% | Foco secundário, separador forte |

## Texto

| Token | Valor | Uso |
|---|---|---|
| `--text-primary` | `#ffffff` | Títulos, valores |
| `--text-secondary` | `#adadb3` | Rótulos, descrições |
| `--text-tertiary` | `#8b8b93` | Metadados, eixos de gráfico (conferir contraste em `surface-2`) |
| `--text-disabled` | `#61616a` | Só para desabilitado |
| `--text-accent` | `#12e893` | Link e destaque |

## Estado

| Token | Valor | Fundo suave (para selos) |
|---|---|---|
| `--state-success` | `#00e193` | menta 500 a 12% |
| `--state-warning` | `#f5a623` | âmbar a 14% |
| `--state-danger` | `#f0473a` | vermelho a 14% |
| `--state-info` | `#6b9cf5` | azul a 14% |

## Gráficos

Paleta categórica para fundo escuro, em ordem de uso. A série principal é sempre a 1; as demais entram só quando necessárias. Máximo de 5 séries por gráfico; acima disso, agrupe em "outros".

| Token | Valor | Nome |
|---|---|---|
| `--chart-1` | `#00e193` | Menta (série principal) |
| `--chart-2` | `#6b9cf5` | Azul |
| `--chart-3` | `#f5a623` | Âmbar |
| `--chart-4` | `#b794f6` | Violeta |
| `--chart-5` | `#f472b6` | Rosa |
| `--chart-muted` | `#4a4a52` | Séries de contexto, período anterior, "outros" |
| `--chart-grid` | branco 6% | Linhas de grade |
| `--chart-axis` | `#8b8b93` | Rótulos de eixo |

* **Sequencial** (intensidade, mapa de calor): menta 900, 800, 700, 600, 500, 300.
* **Divergente** (abaixo e acima da meta): `#f0473a`, `#61616a`, `#00e193`.
* **Período anterior**: mesma cor da série com 35% de opacidade ou `--chart-muted` tracejado.

## Níveis

| Nível | Selo (fundo e texto) | Em gráfico |
|---|---|---|
| Elite | `#111827` com texto e contorno `#D97706` | `#e9a23b` |
| Premium | `#1E3A8A` com texto `#c7d6ff` | `#6b8ff0` |
| Select | `#365314` com texto `#d9f99d` | `#8cc152` |

## Raio, sombra e movimento

| Token | Valor |
|---|---|
| `--radius-card` | 14px |
| `--radius-control` | 10px |
| `--radius-badge` | 6px |
| `--shadow-popover` | `0 8px 24px rgba(0,0,0,.45)` (só em camadas flutuantes) |
| `--duration-fast` | 120ms |
| `--duration-base` | 180ms |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` |
