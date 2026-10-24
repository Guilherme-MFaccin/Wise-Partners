# Tasks: Evolução Método Octo (Wise Partners 2.0)

## Banco
- [x] 0010 custos e esforço: remunerações, custo por atividade, custos diretos, catálogo de atividades por etapa, correção de `config()`
- [x] 0011 recrutamento: colunas novas do parceiro, etapas qualificação, parceria ativa e nutrição, scorecard e nível de entrada
- [x] 0012 onboarding de 90 dias, ativação, trilhas, teste, certificados e bucket `trilhas`
- [x] 0013 indicações v2: nota de qualidade, SLA, proteção de 180 dias, checagens, link exclusivo e página pública
- [x] 0014 ações da Wise, pontos, ranking, premiação, faixas, régua, desligamento, requisitos e revisão de nível
- [x] 0015 resultado do canal, planilha de custos, painel por etapa, fase, pesquisa, maturidade, regras, comunicados e metas por pessoa
- [x] 0016 cruzamento de carteiras
- [x] 0017 rotinas diária e trimestral, pendências v2, painel da v1 com 15 dias, ajustes de RLS e de funções da v1
- [x] 0018 dados iniciais da v2
- [x] 0019 agendamento da rotina trimestral

## Testes
- [x] Testes da v1 atualizados (proteção de 180 dias e indicação parada em 15 dias)
- [x] Matriz de acesso das tabelas novas e funções exclusivas
- [x] Regras: nível de entrada, subida, observação, rebaixamento, pacote pendente, qualidade, SLA, pontos, ativação, 90 e 120 dias, faixas, desligamento, ROI, cruzamento e link público
- [x] Unitários: cruzamento em memória e certificado em PDF

## Edge Functions
- [x] `indicacao-publica` e `cruzamento-carteiras`
- [x] `resumo-diario` com as chaves novas, `relatorio-semanal` com número principal, ROI e destaques, `backup` com as tabelas novas

## Telas
- [x] Painel por etapa da jornada (v1 como lista completa), resultado do canal, custos, meu painel, ranking, maturidade e configurações novas
- [x] Ficha: nossa parceria, scorecard, nível, onboarding e link, ações conjuntas, maturidade, desligamento; funil com nutrição; indicações com validação, SLA, qualidade e checagens
- [x] Ações conjuntas, capacitação, comunicados e cruzamento (internos)
- [x] Portal do parceiro: início, nível, parceria, onboarding, capacitação e trilha, indicar com QR Code, ações, regras, comunicados, ranking, pesquisa e cruzamento
- [x] Página pública `/i/:token`

## Entrega
- [x] README com a atualização da v1 para a v2
- [ ] Testes de acesso com parceiros fictícios no ambiente publicado antes de dados reais (equipe Wise)
