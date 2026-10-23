# Tasks: Portal Wise Partners

**Input**: `plan.md`, `spec.md`, `briefing-tecnico.md`. Todas as histórias entram na primeira versão.

## Fase 1: Base

- [x] T001 Estrutura Vite, React, TypeScript, Tailwind e shadcn/ui no formato do Lovable
- [x] T002 Tema Wise Makers (fundo escuro, menta `#00E193`, Plus Jakarta Sans, botões em pílula)
- [x] T003 Cliente Supabase, autenticação por link no e-mail sem cadastro aberto, rotas `/app`, `/parceiro`, `/r/:token`, `/entrar`

## Fase 2: Banco e acesso (bloqueia todas as histórias)

- [x] T010 Migrações de configuração, parceiros, indicações, comissões, RFP, histórico e notificações
- [x] T011 Regras do programa em gatilhos e funções (nível, pacote, funil, status, contrapartidas, comissões, primeiro registro, RFP)
- [x] T012 RLS em todas as tabelas e políticas de Storage
- [x] T013 Dados iniciais: empresas, níveis, pacotes, contrapartidas, atividades, etapas, ICP, parâmetros, feriados, textos de e-mail, 22 categorias comerciais e 24 institucionais com campos
- [x] T014 Testes de RLS para cada linha da matriz de permissões (`tests/db/rls.test.ts`)
- [x] T015 Testes das regras (`tests/db/regras.test.ts`)

## Fase 3: Histórias P1

- [x] T020 [US1] Visão por categoria, funil, lista com filtros (inclusive campo da categoria) e busca
- [x] T021 [US1] Ficha completa com perfil comum e campos de todas as categorias marcadas
- [x] T022 [US2] Registro rápido de contato com resumo por IA, leitura de print e próximo passo
- [x] T023 [US3] Painel semanal com período e pauta da semana
- [x] T024 [US3] Resumo diário por responsável e relatório semanal do Diretor (Edge Functions e pg_cron)

## Fase 4: Histórias P2

- [x] T030 [US4] Aprovação do Diretor, Quadro de Identificação, minuta em Word e PDF, contrato assinado, onboarding e convite
- [x] T031 [US4] Testes da geração de contrato (`tests/unit/contrato.test.ts`)
- [x] T032 [US5] Classificação, pacote por nível, contrapartidas com comprovação e validação, status de atividade, estratégico sugerido
- [x] T033 [US6] Indicações nos dois sentidos, comissões das três empresas, aviso ao financeiro, indicadores de qualidade
- [x] T034 [US7] Atividades por parceiro, pessoa e período; fila e ciclos do Base Ativa

## Fase 5: Histórias P3

- [x] T040 [US8] Portal do parceiro: resumo, contrapartidas, indicações, RFPs, ficha proposta, materiais, usuários, Wise Hub
- [x] T041 [US9] Pedido de RFP, recomendação por IA, seleção com mínimo de 3, montagem da página em blocos, publicação, renovação e revogação
- [x] T042 [US9] Página pública `/r/:token` com botão de WhatsApp
- [x] T043 [US10] Importação por planilha com prévia, extração de dossiê por IA, contexto do parceiro e ficha em PDF

## Fase 6: Acabamento

- [x] T050 Configurações administráveis e gestão de usuários
- [x] T051 Backup semanal e sob demanda em JSON e CSV
- [x] T052 README de implantação e `.env.example`
- [ ] T053 Testar com dados fictícios no projeto Supabase real antes de importar os parceiros (responsável: time Wise)
- [ ] T054 Informar e-mail do Igor e do financeiro, chave do Resend, domínio de envio e endereço do Wise Hub (responsável: time Wise)
