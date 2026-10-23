# Portal Wise Partners: pacote de especificação

Pacote completo para desenvolver o Portal Wise Partners em outra conta do Claude, com o Spec Kit, e levar depois ao Lovable. Tudo o que é preciso para entender o programa e construir o sistema está aqui dentro.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `.specify/memory/constitution.md` | Princípios não negociáveis: fronteiras de acesso, regras do programa, identidade visual, idioma e pilha técnica |
| `specs/001-portal-wise-partners/spec.md` | A especificação: públicos, 10 histórias com cenários de teste, 71 requisitos funcionais, entidades, critérios de sucesso e apêndices com regras, comissões, atividades e contrapartidas |
| `specs/001-portal-wise-partners/categorias-campos.md` | Perfil comum e campos específicos das 22 categorias comerciais e dos 4 perfis institucionais |
| `specs/001-portal-wise-partners/briefing-tecnico.md` | Decisões técnicas e ponto de partida para o plano: modelo de dados, matriz de permissões, automações, IA, contratos, página pública de RFP e testes |
| `specs/001-portal-wise-partners/checklists/requirements.md` | Checklist de qualidade do spec, todo aprovado |
| `specs/001-portal-wise-partners/dados-iniciais/parceiros.csv` | Os 20 parceiros atuais para a importação |
| `specs/001-portal-wise-partners/referencias/` | Playbook, modelos de contrato com marcadores, dossiês, design system e logo |
| `.specify/feature.json` | Aponta a feature ativa para os comandos do Spec Kit |

## Recomendação: Claude Code, não chat

Use o **Claude Code**. O portal tem dezenas de telas, banco de dados com regras de acesso, funções no servidor, agendamentos e testes. No chat, o código fica espalhado em mensagens, sem rodar, sem testar e sem versionar. O Claude Code trabalha numa pasta de projeto de verdade: cria e edita os arquivos, roda os comandos, executa os testes, faz commits no GitHub e segue o fluxo do Spec Kit do começo ao fim.

Qualquer forma de usar o Claude Code serve: no aplicativo do Claude para computador (aba Code), no navegador em claude.ai/code ligado ao GitHub, ou no terminal. Para quem não programa no dia a dia, o aplicativo de computador ou o navegador são os mais fáceis.

## Passo a passo na outra conta

1. **Crie um repositório vazio no GitHub**, por exemplo `portal-wise-partners`.
2. **Crie um projeto no Supabase** (o plano gratuito serve para começar) e guarde a URL e as chaves. Se preferir, o projeto Supabase pode ser criado depois pelo próprio Lovable.
3. **Abra o Claude Code** ligado a esse repositório.
4. **Envie este pacote** (o zip) para a pasta do projeto e peça para descompactar na raiz.
5. **Mande a mensagem de abertura** abaixo.
6. **Siga os comandos do Spec Kit, um de cada vez, revisando cada saída:**
   * `/speckit.plan` (já com a pilha definida; o `briefing-tecnico.md` é a entrada)
   * `/speckit.tasks`
   * `/speckit.analyze` (confere se spec, plano e tarefas estão coerentes)
   * `/speckit.implement` (constrói, por fases, com testes)
7. **Teste com dados fictícios**, principalmente os acessos de parceiro e da página de RFP. Só depois importe os parceiros reais.
8. **Conecte o repositório ao Lovable** para seguir ajustando visual e detalhes por lá.

## Mensagem de abertura para o Claude Code

> Este repositório vai conter o Portal Wise Partners. Descompactei na raiz um pacote do Spec Kit com a constituição em `.specify/memory/constitution.md` e a especificação completa em `specs/001-portal-wise-partners/` (spec.md, categorias-campos.md, briefing-tecnico.md, dados iniciais e referências).
>
> 1. Instale o Spec Kit neste projeto para o Claude Code (`uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai claude`), sem sobrescrever a constituição nem a pasta `specs/` que já existem.
> 2. Leia a constituição, o spec, o categorias-campos e o briefing-tecnico por inteiro antes de qualquer outra ação.
> 3. Me diga em poucas linhas o que entendeu do sistema e liste qualquer contradição ou lacuna que encontrar.
> 4. Depois disso, rode `/speckit.plan` usando a pilha da constituição (Vite, React, TypeScript, Tailwind, shadcn/ui, Supabase com RLS, Edge Functions, pg_cron, Resend) e o briefing técnico como ponto de partida.
>
> Regras para todo o projeto: interface em português do Brasil, identidade visual do Wise Makers Design System, nenhum texto com travessão, testes de permissão antes de qualquer acesso externo, e nada de dado real antes desses testes passarem.

## O que você vai precisar ter à mão

* Chave do Resend e o domínio de envio da Wise.
* E-mail do Igor e do responsável financeiro.
* Endereço do Wise Hub (para o botão do portal do parceiro).
* Chave do provedor de IA, se não for usar o Lovable AI desde o início.

## Decisões já tomadas (resumo)

* O portal substitui o RD Station para parceiros, sem integração com ele.
* Login por link de acesso no e-mail, sem senha. Não é aplicativo instalável.
* Comissões visíveis só ao time de parcerias e administradores (o financeiro vê as "a pagar"). Wise Makers: 40% da primeira mensalidade ao parceiro e 10% ao responsável. Tríade: 40% da primeira parcela e 10%. Swallow: 6% do projeto e 2%.
* Só o Igor aprova assinaturas. O portal gera o contrato em PDF e Word; a assinatura segue manual no Autentique.
* Contrapartidas entram já; atraso só gera alerta.
* Sem limite de horas: atividades só registram o esforço.
* Wise Hub é plataforma separada; o portal só tem o botão de acesso.
* O parceiro propõe alterações da própria ficha, que só valem com validação da Wise, e vê os RFPs em que foi apresentado, com o nome do cliente.
* O cliente não pede proposta. O consultor registra o pedido, a IA recomenda e monta a página em blocos, com no mínimo 3 opções por categoria quando houver e um botão de WhatsApp por parceiro. O link abre sem senha e vale 30 dias, renovável.
* Alertas diários às 7h e relatório semanal para o Igor.
