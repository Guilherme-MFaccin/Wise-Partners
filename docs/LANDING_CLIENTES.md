# Landing page do cliente do parceiro

Página pública `/c/:codigo`, aberta pelo link de cada parceiro SaaS. O cliente do parceiro recebe a consultoria comercial incluída: cadastro de qualificação, diagnóstico e acesso ao Wise Hub. Decisões no FO-10 (`mapeamentos/wise-partners-to-be/respostas/FO-10/`).

## Como funciona

1. O parceiro pega o link em **Indicar**, no portal (cartão "Consultoria para os seus clientes"), com a mensagem pronta e o envio do logo.
2. O cliente abre a página, que tem o logo do parceiro ao lado da Wise Makers, e faz o cadastro: nome, cargo, e-mail, WhatsApp, empresa, CNPJ, faixa de faturamento, pessoas que vendem, segmento e principal desafio.
3. O banco decide o caminho pela regra do ICP (Configurações, Landing page dos clientes; padrão: mais de 3 vendedores, sem faturamento mínimo):
   * **No ICP:** a página mostra a agenda do Google para a reunião de diagnóstico. Sem agenda configurada, avisa que a equipe chama no WhatsApp.
   * **Fora do ICP:** autodiagnóstico pela Matriz 5x5 (25 frases, notas de 1 a 5). O resultado sai na hora: nível, percentual por pilar e o pilar mais frágil. Só depois aparece o link do Wise Hub.
4. O parceiro vê no portal quem entrou pelo link: empresa, data e andamento. O resultado só aparece quando o cliente marcou a autorização no cadastro.
5. O parceiro e o responsável interno recebem notificação no portal. O e-mail sai pelo envio de notificações quando o Resend estiver configurado.

## O que foi construído (06/11/2026)

| Parte | Arquivo |
| --- | --- |
| Migração 24 | `supabase/migrations/20261106000024_landing_clientes.sql`: logo do parceiro (bucket público `logos`), `links_cliente`, `config_landing_cliente`, `cadastros_cliente`, `cadastrar_cliente_parceiro`, `resultado_matriz_5x5`, `registrar_diagnostico_cliente`, `clientes_do_link` |
| Função pública | `supabase/functions/cliente-parceiro/index.ts` (sem verificação de JWT) |
| Página | `src/pages/publico/LandingCliente.tsx` e `src/components/landing/Autodiagnostico.tsx` |
| Blocos comuns | `src/components/landing/Blocos.tsx`: logos, vídeo, quadro de valor do Hub, depoimentos, foto do evento (usados nas duas páginas) |
| Perguntas do diagnóstico | `src/lib/diagnostico.ts` |
| Administração | `src/components/config/LandingCliente.tsx`: Configurações, aba "Landing page dos clientes" |
| Portal do parceiro | `src/components/portal/LinkClientes.tsx`, dentro de Indicar |
| Testes | `tests/db/landing_clientes.test.ts` (7 testes) |

O link de indicação de projeto (`/i/código`) continua como estava (FO-10: dois links).

## Mudanças na página dos parceiros

* Reunião individual: "mais de 3 vendedores" no lugar de "R$ 250 mil por mês e duas pessoas" (FO-10).
* Novo item "O Wise Hub com a sua marca" (FO-10: já funciona hoje).

## Pendências

* **Perguntas do autodiagnóstico:** as 25 frases são uma proposta a partir dos pilares e critérios da Matriz 5x5. Precisam da revisão do Guilherme; a versão da pesquisa depende do Comitê de Ética da UniCesumar.
* **Consentimento da pesquisa:** o aviso com a marca da UniCesumar, que autoriza o uso do diagnóstico na pesquisa, só entra depois da aprovação do CEP e do texto do TCLE. A página não cita a UniCesumar.
* **"Por tempo limitado" no título:** o FO-10 também diz que o acesso ao Hub não tem prazo. Confirmar a que o prazo se refere.
* **Wise Hub com a marca do parceiro:** a página promete; falta saber como o Hub reconhece o parceiro quando o cliente cria a conta sozinho (link com código?).
* **Política de privacidade:** a página usa a política da landing dos parceiros. Ela precisa cobrir o diagnóstico do cliente e o compartilhamento com o parceiro (revisão jurídica).
* **Agenda:** colar o endereço da página de agendamento do Google Agenda em Configurações.
* **Resumo semanal por e-mail para o parceiro:** depende do Resend.
* **Vídeo:** Igor com um trecho de depoimento (a página mostra a capa até lá).
