<!--
Sync Impact Report
Versão: 1.1.0 para 2.0.0 (MAJOR: redefinição dos princípios IV.3 e IV.4)
Princípios alterados:
  II. Cada público vê só o que é seu: custos e ROI só para administradores; ranking do programa com posição, nome e pontos, com opção de anonimato
  III. Regras configuráveis: inclui scorecard, critérios de nível, SLA, régua, desligamento, esforço, custos e trilhas
  IV.3 Base de clientes do parceiro: passa a admitir o cruzamento de carteiras com aceite e sem guarda da lista
  IV.4 Nível: passa a ser híbrido (entrada por potencial, permanência e evolução por resultado, com carência)
  IV.8 Contrapartidas: sem mudança de texto; esclarecida a relação com a revisão de nível
Princípios novos: IV.9 (desligamento nunca automático), IV.10 (proteção da indicação), VIII (o canal se mede pelo resultado)
Restrições técnicas: trilhas de venda ficam no portal, nunca no Wise Hub
Modelos afetados: specs/002-evolucao-metodo-octo (spec, briefing, checklist); contrato comercial v2
Pendências: playbook do programa (V3.1) precisa refletir IV.3, IV.4, IV.9 e IV.10
-->
# Portal Wise Partners Constitution

Princípios que valem para todas as especificações, planos e implementações do Portal Wise Partners. Em caso de conflito, esta constituição prevalece sobre qualquer outra instrução.

## Core Principles

### I. Fonte única da verdade do programa

O Portal Wise Partners substitui o RD Station como registro oficial de parceiros, negociações, pontos de contato, indicações, contrapartidas, contratos, comissões, capacitação, custos e resultados do canal. Nenhuma funcionalidade pode exigir que o mesmo dado seja mantido em dois lugares. O RD Station não é integrado, porque a conta é compartilhada entre empresas do grupo.

### II. Cada público vê só o que é seu (NÃO NEGOCIÁVEL)

* **Time Wise e gerentes de conta do grupo:** veem o programa conforme o papel. Valores de comissão só são visíveis ao papel "time de parcerias" e a administradores. Salários, custo-hora e custos do programa só são visíveis a administradores.
* **Parceiro:** vê apenas a própria parceria, os próprios materiais, as próprias indicações e comissões, a própria capacitação, os pedidos de RFP em que foi apresentado (com o nome do cliente), as regras do programa, os comunicados e conteúdos institucionais do grupo (Wise Makers, Tríade, Swallow). A única informação de outros parceiros que ele vê é o ranking do programa, com posição, nome e pontos, nunca valores, clientes ou comissões; qualquer parceiro pode pedir para aparecer sem o nome.
* **Cliente:** não tem conta. Vê apenas a página de RFP gerada para ele, por link, sem comissões, sem dados internos e sem dados de outros clientes. Quem preenche o formulário de indicação de um parceiro vê só a confirmação do envio.

O controle de acesso é aplicado na camada de dados, nunca só na interface. Toda tela, consulta, arquivo e exportação precisa de teste que prove que um público não acessa o dado de outro.

### III. Regras do programa são dados configuráveis

Categorias, campos por categoria, níveis e faixas, critérios e pesos do scorecard de entrada, requisitos de cada nível, carência de rebaixamento, pacotes, entregas, catálogo de contrapartidas e de ações conjuntas, prazos de status de atividade, régua de atendimento, critérios de desligamento, prazos do SLA de indicações, prazo de proteção da indicação, pontuação do ranking, tipos de atividade e esforço estimado, custo-hora das pessoas, parâmetros de receita e de custo do canal, trilhas de capacitação, regras de comissão por empresa do grupo, critérios do ICP, etapas, motivos de perda, modelos de contrato, textos de e-mail e validade dos links são cadastros administráveis. Mudança de regra não pode exigir nova programação, vale só para registros novos ou para a próxima revisão, e é comunicada aos parceiros quando os afeta.

### IV. As regras do Wise Partners são lei

1. Nenhuma entrega antes da assinatura. Parceiro sem contrato assinado nunca aparece em página de RFP.
2. Toda página de RFP apresenta no mínimo 3 opções por categoria sempre que houver 3 ou mais parceiros assinados elegíveis, nunca recomenda nome único e informa que a Wise mantém relação comercial com os fornecedores.
3. A Wise não recebe nem guarda a base de clientes do parceiro, ressalvado o cruzamento de carteiras. O cruzamento é facultativo, depende de aceite específico do parceiro a cada envio, compara apenas identificadores de empresas (CNPJ), descarta a lista do parceiro no mesmo processamento, guarda só as coincidências, por prazo limitado, e tem limites de tamanho e de frequência que impedem descobrir clientes da Wise por tentativa. Dados pessoais de terceiros só entram com consentimento declarado.
4. O nível de entrada mede potencial: clientes da carteira no ICP da Wise, ajustado pelo scorecard de entrada. A permanência e a evolução consideram resultado, capacitação e cumprimento das regras, revistos a cada trimestre. Subir de nível vale na hora. Descer exige um trimestre de carência com aviso e confirmação de uma pessoa, nunca é automático. A falta de contato, sozinha, nunca muda o nível.
5. A passagem para "fechamento" exige aprovação registrada de Igor Makoto, Diretor.
6. Parceiro estratégico, faixa de desempenho e avaliação de maturidade são classificações internas e nunca aparecem para parceiros ou clientes.
7. Nos textos para parceiros e clientes, os níveis aparecem pelo nome (Elite, Premium, Select), nunca pela letra.
8. Contrapartida não cumprida gera alerta, nunca punição automática. Ela pode pesar na revisão de nível, que segue o item 4.
9. Todo desligamento de parceiro exige aprovação do Diretor e aviso prévio. O desligamento por inatividade segue critério publicado nas regras do programa e exige tentativas de retomada registradas; o desligamento por inadequação exige motivo registrado. O sistema sugere, nunca desliga.
10. A indicação fica protegida por 180 dias contados da última interação registrada com o cliente. Dentro desse prazo, vale o primeiro registro, sem exceção.

### V. Registro rápido acima de tudo

Registrar um ponto de contato, um próximo passo ou uma indicação deve levar menos de 1 minuto no celular. O esforço de cada registro é estimado pelo catálogo de atividades, sem cronômetro. A IA resume e estrutura, mas nunca grava nada sem confirmação humana.

### VI. Rastreabilidade

Toda alteração relevante (etapa, nível, revisão de nível, pacote, status, contrapartida, ação conjunta, indicação, comissão, aprovação, contrato gerado, acesso concedido ou revogado, link de RFP ou de indicação gerado, renovado ou revogado, alteração de ficha proposta pelo parceiro, avaliação de maturidade, scorecard, certificado emitido, cruzamento de carteiras, comunicado enviado, desligamento) fica em histórico com autor, data, valor anterior e novo.

### VII. Simplicidade

Construir o que resolve a rotina real. Nada especulativo. Toda complexidade adicional precisa de justificativa no plano.

### VIII. O canal se mede pelo resultado

O Wise Partners é um canal de aquisição. O número principal do programa são os clientes fechados no ICP por meio de parceiros, e o canal é avaliado pelo retorno sobre o investimento: receita atribuída aos parceiros contra comissões, horas da equipe e custos diretos. Todo esforço registrado no portal entra nesse cálculo.

## Identidade, idioma e redação

* Interface inteiramente em português do Brasil, com termos próprios da Wise. O Método Octo® (Tubino e Guimarães, 2023) é referência interna do desenho do programa e não dá nome a telas.
* Wise Makers Design System: fundo escuro, verde menta `#00E193` como cor da marca, logo Wise Makers na versão clara. Cores dos níveis (Elite `#111827` com dourado `#D97706`, Premium `#1E3A8A`, Select `#365314`) só em selos e marcações de nível.
* Textos do sistema e gerados por IA nunca usam travessão nem meia-risca.
* "Mentoria mensal", nunca "webinário". O Base Ativa nunca é apresentado como opcional em textos para parceiros.
* Responsivo para computador e celular. Não é aplicativo instalável.

## Restrições técnicas

* Compatível com o Lovable, para seguir evoluindo lá: React com TypeScript, Vite, Tailwind CSS, shadcn/ui e Supabase (autenticação, PostgreSQL com Row Level Security, Storage e Edge Functions).
* Login por link de acesso enviado por e-mail, sem senha, para todos os usuários com conta.
* IA pelo provedor disponível no ambiente (Lovable AI ou equivalente configurado por variável de ambiente), sem contratar serviço pago novo sem aprovação.
* E-mails pelo Resend, no domínio da Wise.
* O Wise Hub é uma plataforma separada, voltada também à carteira do parceiro; o portal apenas oferece o link de acesso. Os dois sistemas não compartilham banco nem login. As trilhas que ensinam o parceiro a vender a Wise ficam no portal e nunca são publicadas no Wise Hub.
* Assinatura eletrônica continua no Autentique, fora do portal.
* Sem integração com WhatsApp, Instagram ou caixa de e-mail: registros entram por texto colado, print ou arquivo.
* LGPD: consentimento declarado, finalidade explícita, exclusão sob pedido, retenção limitada para dados do cruzamento de carteiras.
* Exportação completa dos dados ao menos semanal.
* Sem domínio próprio por enquanto; o endereço é configurável para adotar um subdomínio da Wise depois.

## Fluxo de desenvolvimento

* Spec Kit: especificação, plano, tarefas, análise, implementação.
* Cada feature nova é um diretório próprio em `specs/`. Uma feature posterior altera a anterior só pelo que declara no próprio spec, com o identificador do requisito alterado.
* Cada história de usuário testável de forma independente.
* Migrações são sempre novas e aditivas; uma migração já aplicada nunca é editada.
* Testes de controle de acesso (princípio II) obrigatórios antes de liberar qualquer acesso externo, inclusive páginas públicas novas.
* Dados reais só entram depois que os testes de acesso passam.

## Governance

Esta constituição prevalece sobre outras práticas. Alterações exigem registro, aprovação de Guilherme Faccin (Gerente de Parcerias) e Igor Makoto (Diretor) e plano de migração quando afetarem dados existentes. Mudança nos princípios IV.3, IV.4, IV.9 ou IV.10 exige também a versão correspondente do contrato de parceria. Toda revisão verifica conformidade com os princípios acima.

**Version**: 2.0.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23
