# Implementation Plan: Evolução Método Octo (Wise Partners 2.0)

**Branch**: `002-evolucao-metodo-octo` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: `spec.md`, `briefing-tecnico.md`, contrato comercial v2, `Modelo_Custos_ROI_Canal.xlsx` e a constituição 2.0.0.

## Summary

Evolução da v1 sem remover nada. Todas as regras novas ficam no banco (gatilhos, funções e RLS), em migrações aditivas de `20261024000010` a `20261024000020`. A interface ganha telas novas na área interna e no portal do parceiro e uma página pública para o link de indicação. Duas Edge Functions novas: `indicacao-publica` (pública, resposta neutra) e `cruzamento-carteiras` (comparação em memória, sem guardar a lista do parceiro).

## Technical Context

Igual à v1 (TypeScript 5.8, React 18, Deno 2, PL/pgSQL, Vitest com PostgreSQL 16 real). Dependências novas no front: `qrcode` (QR Code do link) e `read-excel-file` (planilhas do cruzamento e da base da Wise). Bucket novo `trilhas`, privado.

## Constitution Check

| Princípio | Como o plano atende |
|---|---|
| I. Fonte única | Custo-hora calculado da remuneração na data da atividade; custos de comissão vêm de `comissoes`; receita das indicações fechadas; nada é digitado duas vezes |
| II. Cada público vê só o que é seu | RLS em todas as 38 tabelas novas; remuneração, custos e resultado do canal só para administrador; faixas, maturidade, desligamento e coincidências invisíveis ao parceiro; ranking sem nível dos outros; funções auxiliares sem execução direta; correção de `config()` |
| III. Regras configuráveis | Critérios do scorecard, requisitos de nível (com vigência), régua, catálogo de ações, pontos, indicadores, metas, SLA, proteção, prazos do desligamento, termo do cruzamento: tudo em tabela ou parâmetro |
| IV. Regras do programa | Proteção de 180 dias sem exceção; proposta com o decisor só com scorecard completo; rebaixamento nunca automático; desligamento só com o Diretor; nutrição sem morno ou dormente; pacote pendente aplicado na data |
| V. Registro rápido | Atividades automáticas pelos tipos com `chave` (encontros, retomada); custo calculado por gatilho |
| VI. Rastreabilidade | Histórico nas tabelas novas com regra; histórico de remuneração e custos só para administrador |
| VII. Simplicidade | Comparação do cruzamento em memória na Edge Function; radar em SVG, sem biblioteca de gráficos |

## Decisões técnicas

1. **Proteção de 180 dias.** `registrar_indicacao` virou casca de `_registrar_indicacao_core`, que a página pública também usa. A última interação considera registro, atualização e checagem do cliente em qualquer empresa do grupo.
2. **Alertas sem repetição.** A rotina diária registra em `alertas_rotina` cada aviso enviado (SLA, régua, proteção, marcos, checagens), para avisar uma vez por ocorrência sem tocar nas tabelas de negócio.
3. **Rotina trimestral.** Agendada todo dia às 6h45 e só age no primeiro dia útil do trimestre: revisão de nível, faixas, pesquisa de satisfação e sugestão de fase.
4. **Requisitos de nível.** Valem os requisitos em vigor no início do trimestre avaliado; os iniciais valem desde 2026-10-01.
5. **Cruzamento.** O navegador extrai só raiz de CNPJ e tipo; a função compara com a base e chama `registrar_coincidencias` (só service_role), que confere aceite, contrato, intervalo de 30 dias e limites. O teste prova que nenhum dos CNPJs não coincidentes fica em tabela ou Storage.
6. **Relatório semanal.** `relatorio_semanal_v2` (só service_role) entrega número principal, ROI do trimestre e indicadores em destaque para a Edge Function.

## Verificação

* `npm run test:db`: 128 testes (69 da v1, atualizados para 180 e 15 dias, e 59 da v2).
* `npm test`: contrato, certificado e cruzamento.
* `deno check` das 10 Edge Functions; `tsc`, `eslint` e `vite build` do front.
