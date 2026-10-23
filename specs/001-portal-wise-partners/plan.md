# Implementation Plan: Portal Wise Partners

**Branch**: `001-portal-wise-partners` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: `spec.md`, `categorias-campos.md`, `briefing-tecnico.md` e a constituição.

## Summary

Aplicação de página única (Vite, React, TypeScript, Tailwind, shadcn/ui) sobre Supabase. Todas as regras de acesso e as regras do programa ficam no banco (RLS, gatilhos e funções), para que a interface só oriente o usuário. A IA passa por uma Edge Function única com saída validada por esquema. Contratos são gerados a partir dos modelos oficiais com marcadores.

## Technical Context

**Language/Version**: TypeScript 5.8 (frontend), Deno 2 (Edge Functions), PL/pgSQL (PostgreSQL 15+)
**Primary Dependencies**: React 18, react-router 6, TanStack Query 5, shadcn/ui, supabase-js 2, docxtemplater, pdf-lib, zod
**Storage**: PostgreSQL com RLS; Storage privado nos buckets `documentos`, `anexos`, `comprovacoes`, `modelos`, `materiais`, `backups`
**Testing**: Vitest; testes de banco contra PostgreSQL 16 real com imitação mínima do ambiente Supabase (`tests/db/supabase_shim.sql`)
**Target Platform**: navegador, computador e celular; não é aplicativo instalável
**Performance Goals**: 100 parceiros, 2.000 pontos de contato por ano, 300 usuários de parceiros (SC-007): volume pequeno, consultas diretas sem paginação no servidor
**Constraints**: português do Brasil, sem travessão, identidade Wise, compatível com Lovable

## Constitution Check

| Princípio | Como o plano atende |
|---|---|
| I. Fonte única | Nenhum dado em dois lugares. Carteira no ICP, instrumento do parceiro, natureza jurídica e perfil institucional são colunas do parceiro e por isso não viram campos dinâmicos |
| II. Cada público vê só o que é seu | RLS em todas as tabelas; comissões em tabela separada; estratégico e anotações em `parceiros_interno`; instrumento em `parceiros_instrumento`; página pública por função que devolve só campos permitidos; 29 testes de acesso |
| III. Regras configuráveis | Categorias, campos, níveis, pacotes, contrapartidas, tipos de atividade, comissões, ICP, etapas, modelos, textos de e-mail, prazos e validade em tabelas editáveis; contrapartidas e comissões guardam cópia da regra da época |
| IV. Regras do programa | Gatilhos: fechamento só com aprovação do Diretor, pacote por nível, nível nunca muda por inatividade, contrapartida atrasada só alerta; funções: mínimo de 3 opções, só assinados na RFP, primeiro registro, consentimento |
| V. Registro rápido | Botão de registro em todas as telas internas; IA só sugere, nada é gravado sem confirmação |
| VI. Rastreabilidade | Gatilho genérico de histórico com autor, data, valor anterior e novo |
| VII. Simplicidade | Sem renderização no servidor, sem fila externa, sem serviço de conversão de PDF |

## Decisões técnicas

1. **Regras no banco.** Funções `registrar_indicacao`, `publicar_pagina_rfp`, `rfp_pagina_publica`, `rfp_registrar_clique`, `painel_semanal`, `pendencias_diarias` e `rotina_diaria` concentram as regras. Indicações só entram pela função, para que a regra do primeiro registro valha mesmo para o parceiro, que não enxerga os clientes de outros.
2. **Contrato no navegador.** O Word é preenchido com docxtemplater e o PDF é desenhado com pdf-lib a partir do mesmo Word preenchido (opção c do briefing, sem custo novo). Foi feito no navegador, e não numa Edge Function `gerar-contrato`, porque assim o mesmo código é testado no Vitest e não depende de bibliotecas no Deno; a RLS controla quem grava a minuta e os arquivos.
3. **Página pública.** As Edge Functions `rfp-publica` e `rfp-clique` usam a service_role só para chamar duas funções do banco que validam o token (32 bytes aleatórios), a validade e a revogação; o anônimo não lê nenhuma tabela. Cabeçalho `noindex` e limite por IP.
4. **Agendamentos.** `rotina_diaria` roda direto no pg_cron às 6h30. Resumo diário e relatório semanal são chamados de hora em hora e conferem o dia útil, o dia da semana e o horário configurados, para que a mudança de horário não exija reagendar. Avisos imediatos saem de uma fila (`notificacoes`) processada a cada 5 minutos.
5. **Convites.** Não há cadastro aberto. O convite cria um registro em `convites`, e o gatilho de criação de usuário do Auth gera o perfil a partir dele.
6. **IA.** `ai-gateway` com provedores Lovable AI, OpenAI, Gemini e Anthropic; resposta validada por zod, uma nova tentativa quando o formato falha, travessões removidos de todas as strings.

## Project Structure

```text
src/                     # frontend (pages/app, pages/parceiro, pages/publico, components, lib)
supabase/migrations/     # 0001 base e configuração · 0002 parceiros · 0003 indicações, RFP, sistema
                         # 0004 regras · 0005 RFP, painel e rotinas · 0006 RLS e storage
                         # 0007 e 0008 dados iniciais · 0009 agendamentos
supabase/functions/      # ai-gateway, rfp-publica, rfp-clique, convidar-usuario,
                         # enviar-notificacoes, resumo-diario, relatorio-semanal, backup
tests/db/                # RLS e regras (PostgreSQL real)
tests/unit/              # geração de contrato
```

## Complexity Tracking

| Item | Por que é necessário |
|---|---|
| Imitação do Supabase nos testes | Docker não está disponível no ambiente de desenvolvimento; os testes rodam as migrações reais num PostgreSQL 16 com papéis `anon`, `authenticated` e `service_role` e `auth.uid()` lido do JWT, como no Supabase |
| Leitor próprio do XML do Word | Necessário para desenhar o PDF com o mesmo texto do Word sem LibreOffice |
