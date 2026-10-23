# Portal Wise Partners Constitution

Princípios que valem para todas as especificações, planos e implementações do Portal Wise Partners. Em caso de conflito, esta constituição prevalece sobre qualquer outra instrução.

## Core Principles

### I. Fonte única da verdade do programa

O Portal Wise Partners substitui o RD Station como registro oficial de parceiros, negociações, pontos de contato, indicações, contrapartidas, contratos e comissões. Nenhuma funcionalidade pode exigir que o mesmo dado seja mantido em dois lugares. O RD Station não é integrado, porque a conta é compartilhada entre empresas do grupo.

### II. Cada público vê só o que é seu (NÃO NEGOCIÁVEL)

* **Time Wise e gerentes de conta do grupo:** veem o programa conforme o papel. Valores de comissão só são visíveis ao papel "time de parcerias" e a administradores.
* **Parceiro:** vê apenas a própria parceria, os próprios materiais, as próprias indicações e comissões, os pedidos de RFP em que foi apresentado (com o nome do cliente) e conteúdos institucionais do grupo (Wise Makers, Tríade, Swallow).
* **Cliente:** não tem conta. Vê apenas a página de RFP gerada para ele, por link, sem comissões, sem dados internos e sem dados de outros clientes.

O controle de acesso é aplicado na camada de dados, nunca só na interface. Toda tela, consulta, arquivo e exportação precisa de teste que prove que um público não acessa o dado de outro.

### III. Regras do programa são dados configuráveis

Categorias, campos por categoria, níveis e faixas, pacotes, entregas, catálogo de contrapartidas, prazos de status de atividade, tipos de atividade, regras de comissão por empresa do grupo, critérios do ICP, etapas, motivos de perda, modelos de contrato, textos de e-mail e validade dos links são cadastros administráveis. Mudança de regra não pode exigir nova programação e vale só para registros novos.

### IV. As regras do Wise Partners são lei

1. Nenhuma entrega antes da assinatura. Parceiro sem contrato assinado nunca aparece em página de RFP.
2. Toda página de RFP apresenta no mínimo 3 opções por categoria sempre que houver 3 ou mais parceiros assinados elegíveis, nunca recomenda nome único e informa que a Wise mantém relação comercial com os fornecedores.
3. A Wise não recebe lista ou base de clientes do parceiro. Dados pessoais de terceiros só entram com consentimento declarado.
4. O nível mede potencial (clientes da carteira no ICP da Wise) e nunca muda por inatividade.
5. A passagem para "fechamento" exige aprovação registrada de Igor Makoto, Diretor.
6. Parceiro estratégico é classificação interna e nunca aparece para parceiros ou clientes.
7. Nos textos para parceiros e clientes, os níveis aparecem pelo nome (Elite, Premium, Select), nunca pela letra.
8. Contrapartida não cumprida gera alerta, nunca punição automática.

### V. Registro rápido acima de tudo

Registrar um ponto de contato, um próximo passo ou uma indicação deve levar menos de 1 minuto no celular. A IA resume e estrutura, mas nunca grava nada sem confirmação humana.

### VI. Rastreabilidade

Toda alteração relevante (etapa, nível, pacote, status, contrapartida, indicação, comissão, aprovação, contrato gerado, acesso concedido ou revogado, link de RFP gerado, renovado ou revogado, alteração de ficha proposta pelo parceiro) fica em histórico com autor, data, valor anterior e novo.

### VII. Simplicidade

Construir o que resolve a rotina real. Nada especulativo. Toda complexidade adicional precisa de justificativa no plano.

## Identidade, idioma e redação

* Interface inteiramente em português do Brasil.
* Wise Makers Design System: fundo escuro, verde menta `#00E193` como cor da marca, logo Wise Makers na versão clara. Cores dos níveis (Elite `#111827` com dourado `#D97706`, Premium `#1E3A8A`, Select `#365314`) só em selos e marcações de nível.
* Textos do sistema e gerados por IA nunca usam travessão nem meia-risca.
* "Mentoria mensal", nunca "webinário". O Base Ativa nunca é apresentado como opcional em textos para parceiros.
* Responsivo para computador e celular. Não é aplicativo instalável.

## Restrições técnicas

* Compatível com o Lovable, para seguir evoluindo lá: React com TypeScript, Vite, Tailwind CSS, shadcn/ui e Supabase (autenticação, PostgreSQL com Row Level Security, Storage e Edge Functions).
* Login por link de acesso enviado por e-mail, sem senha, para todos os usuários com conta.
* IA pelo provedor disponível no ambiente (Lovable AI ou equivalente configurado por variável de ambiente), sem contratar serviço pago novo sem aprovação.
* E-mails pelo Resend, no domínio da Wise.
* O Wise Hub é uma plataforma separada; o portal apenas oferece o link de acesso. Os dois sistemas não compartilham banco nem login.
* Assinatura eletrônica continua no Autentique, fora do portal.
* Sem integração com WhatsApp, Instagram ou caixa de e-mail na primeira versão: registros entram por texto colado, print ou arquivo.
* LGPD: consentimento declarado, finalidade explícita, exclusão sob pedido.
* Exportação completa dos dados ao menos semanal.
* Sem domínio próprio na primeira versão; o endereço é configurável para adotar um subdomínio da Wise depois.

## Fluxo de desenvolvimento

* Spec Kit: especificação, plano, tarefas, análise, implementação.
* Cada história de usuário testável de forma independente.
* Testes de controle de acesso (princípio II) obrigatórios antes de liberar qualquer acesso externo.
* Dados reais só entram depois que os testes de acesso passam.

## Governance

Esta constituição prevalece sobre outras práticas. Alterações exigem registro, aprovação de Guilherme Faccin (Gerente de Parcerias) e Igor Makoto (Diretor) e plano de migração quando afetarem dados existentes. Toda revisão verifica conformidade com os princípios acima.

**Version**: 1.1.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23
