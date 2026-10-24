# Contexto do produto (rascunho para o PRODUCT.md)

Texto de partida para o `init` do Impeccable. Ele gera o `PRODUCT.md` na raiz; use este conteúdo como resposta às perguntas dele e ajuste o que estiver diferente.

## O que é

Portal Wise Partners: sistema de gestão do programa de parcerias da Wise Makers, consultoria de estruturação comercial de Maringá/PR, que faz parte de um grupo com a Tríade (marketing) e a Swallow (audiovisual). O portal governa parceiros, negociações, contratos, indicações, comissões, capacitação, ações conjuntas e o resultado do canal de parcerias como canal de aquisição de clientes.

## Para quem

| Pessoa | O que precisa | Onde usa |
|---|---|---|
| Gerente de Parcerias (Guilherme) | Saber o que fazer hoje, registrar contatos em menos de 1 minuto, preparar a reunião semanal, mostrar o ROI do canal | Computador o dia todo, celular entre reuniões |
| Diretor (Igor) | Ver se o canal se paga, aprovar assinaturas e desligamentos, ler o relatório semanal | Computador e e-mail |
| Consultores e gerentes de conta do grupo | Achar o parceiro certo para um cliente, montar a página de RFP, registrar indicações | Computador, às vezes durante a reunião com o cliente |
| Parceiros | Ver o próprio nível e o que falta para subir, indicar clientes, aprender a vender a Wise, acompanhar comissões | Celular na maior parte do tempo |
| Clientes e contatos indicados | Comparar fornecedores na página de RFP ou enviar uma indicação pelo link | Celular, uma vez, sem conta |

## O que o produto precisa transmitir

Confiança e controle. É uma ferramenta de trabalho diário e também a vitrine da Wise para parceiros e clientes. Precisa parecer tão bem resolvida quanto Linear, Stripe Dashboard e Attio, com a identidade Wise: fundo escuro, texto branco, verde menta usado com parcimônia.

## Princípios

1. Cada tela responde a uma pergunta.
2. Número sempre com contexto: meta, período anterior ou média.
3. Registrar é mais rápido do que lembrar.
4. O parceiro sempre sabe o próximo passo.
5. Nada de enfeite: cor, movimento e gráfico só quando carregam informação.

## Restrições

* Português do Brasil, sem travessão em nenhum texto.
* React, TypeScript, Vite, Tailwind 3, shadcn/ui, Supabase; compatível com o Lovable.
* Identidade do Wise Makers Design System (skill `wise-design-system`).
* Acesso controlado no banco; telas nunca escondem dado sensível só na interface.
