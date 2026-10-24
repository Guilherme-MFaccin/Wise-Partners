# Product

<!-- impeccable:product-schema 1 -->

Fonte: `docs/ux/PRODUCT_rascunho.md` (respostas do usuário à entrevista do `init`), completada com fatos já confirmados na constituição (`.specify/memory/constitution.md`) e nas especificações (`specs/001-portal-wise-partners/`, `specs/002-evolucao-metodo-octo/`). Itens marcados "(do repositório)" vêm dessas fontes, não do rascunho.

## Platform

web

## Users

| Pessoa | Situação e trabalho | Onde usa |
|---|---|---|
| Gerente de Parcerias (Guilherme) | Saber o que fazer hoje, registrar contatos em menos de 1 minuto, preparar a reunião semanal, mostrar o ROI do canal | Computador o dia todo, celular entre reuniões |
| Diretor (Igor) | Ver se o canal se paga, aprovar assinaturas e desligamentos, ler o relatório semanal | Computador e e-mail |
| Consultores e gerentes de conta do grupo | Achar o parceiro certo para um cliente, montar a página de RFP, registrar indicações | Computador, às vezes durante a reunião com o cliente |
| Parceiros | Ver o próprio nível e o que falta para subir, indicar clientes, aprender a vender a Wise, acompanhar comissões | Celular na maior parte do tempo |
| Clientes e contatos indicados | Comparar fornecedores na página de RFP ou enviar uma indicação pelo link | Celular, uma vez, sem conta |

Papéis internos com acesso próprio (do repositório): administrador, time de parcerias, consultor ou gerente de conta, comercial e financeiro; só o Diretor aprova assinaturas e desligamentos.

## Product Purpose

Portal Wise Partners: sistema de gestão do programa de parcerias da Wise Makers, consultoria de estruturação comercial de Maringá/PR, que faz parte de um grupo com a Tríade (marketing) e a Swallow (audiovisual). O portal governa parceiros, negociações, contratos, indicações, comissões, capacitação, ações conjuntas e o resultado do canal de parcerias como canal de aquisição de clientes.

Sucesso (do repositório): clientes fechados no perfil de cliente ideal (ICP) via parceiros é o número principal; meta de 100 parceiros assinados; o canal se paga (ROI).

## Positioning

Um único lugar que governa o programa inteiro de um canal de parcerias B2B pelo Método Octo (Tubino e Vaz Guimarães), com regras do programa aplicadas no banco: o mesmo portal é ferramenta de trabalho da equipe, vitrine da Wise para parceiros e página de comparação de fornecedores para clientes.

## Operating Context

* Rotina semanal: reunião do Gerente de Parcerias com o Diretor, apoiada pelo painel e pela pauta gerada.
* Registro de contato logo depois de cada conversa (WhatsApp, reunião, ligação), muitas vezes pelo celular.
* Consultor monta, durante ou depois da reunião com o cliente, uma página de RFP com no mínimo 3 opções por categoria.
* Parceiro usa o portal no celular: nível, indicações, trilha de capacitação, ações conjuntas, comunicados.
* Cliente abre a página de RFP ou o link de indicação uma vez, sem conta.
* E-mails diários e semanais complementam as telas (do repositório).

## Capabilities and Constraints

* Português do Brasil, sem travessão nem meia-risca em nenhum texto.
* React, TypeScript, Vite, Tailwind 3, shadcn/ui, Supabase; compatível com o Lovable.
* Acesso controlado no banco (RLS); telas nunca escondem dado sensível só na interface.
* Funcionalidades em produção no código (do repositório): carteira por categoria e funil, ficha do parceiro, contrato em Word e PDF, contrapartidas e ações conjuntas, indicações e comissões das três empresas, Base Ativa, RFP com página pública, painel por etapa da jornada, resultado do canal e custos, scorecard, níveis por resultado, onboarding de 90 dias, trilhas e certificados, ranking, maturidade, desligamento, comunicados, cruzamento de carteiras, portal do parceiro e link exclusivo de indicação.
* Dados de demonstração só em `supabase/seed_demo.sql`, nunca em produção.

## Brand Commitments

* Identidade do Wise Makers Design System, registrada na skill `wise-design-system` (que prevalece sobre sugestões de estilo de outras skills).
* Para parceiros e clientes, o nível aparece pelo nome (Elite, Premium, Select), nunca pela letra (do repositório).
* "Mentoria mensal", nunca "webinário"; Base Ativa nunca aparece como opcional para parceiros.
* Referências de qualidade citadas pelo usuário: Linear, Stripe Dashboard e Attio.

## Evidence on Hand

* Parceiros reais ainda não importados: `specs/001-portal-wise-partners/dados-iniciais/parceiros.csv` (do repositório). As telas são avaliadas com dados fictícios do seed de demonstração.
* Não há depoimentos, cases de clientes nem números de resultado reais para usar em telas ou páginas; não inventar.

## Product Principles

1. Cada tela responde a uma pergunta.
2. Número sempre com contexto: meta, período anterior ou média.
3. Registrar é mais rápido do que lembrar.
4. O parceiro sempre sabe o próximo passo.
5. Nada de enfeite: cor, movimento e gráfico só quando carregam informação.

## Accessibility & Inclusion

Contraste mínimo WCAG 2.2 AA (4,5:1 para texto, 3:1 para elementos gráficos e bordas de campos), uso completo por teclado nos fluxos principais e celular como uso principal dos parceiros (da skill `wise-design-system` e do checklist do plano de UX).
