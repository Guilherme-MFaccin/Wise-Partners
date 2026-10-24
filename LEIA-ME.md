# Portal Wise Partners 2.0: pacote de especificação

Atualização do Portal Wise Partners com base no livro *Ecossistema de Parceiros: Método Octo®*. A versão 1 já está programada; este pacote acrescenta a feature 002 sem mexer no que foi construído, exceto onde o próprio spec declara a mudança.

## O que tem aqui

| Arquivo | Para que serve |
|---|---|
| `.specify/memory/constitution.md` | Constituição 2.0.0. Muda os princípios do nível (IV.4) e da base de clientes do parceiro (IV.3) e acrescenta desligamento, proteção da indicação e resultado do canal |
| `.specify/feature.json` | Passa a apontar para a feature 002 |
| `specs/002-evolucao-metodo-octo/spec.md` | 15 histórias, requisitos FR-101 a FR-182, tabela de alterações da v1, critérios de sucesso e apêndices A a O com todas as regras novas |
| `specs/002-evolucao-metodo-octo/briefing-tecnico.md` | Ponto de partida do plano, escrito sobre as migrações 0001 a 0009 do repositório: tabelas e colunas novas, funções alteradas, permissões, rotinas, telas e testes |
| `specs/002-evolucao-metodo-octo/checklists/requirements.md` | Checklist de qualidade do spec |
| `specs/002-evolucao-metodo-octo/referencias/planilhas/Modelo_Custos_ROI_Canal.xlsx` | Modelo de custos e ROI. O portal precisa chegar aos mesmos números (SC-101) |
| `specs/002-evolucao-metodo-octo/referencias/contratos/` | Contrato de Parceria Comercial versão 2 em Word e PDF e o modelo com marcadores para o portal |

## Como aplicar no repositório

1. No Claude Code, abra o repositório do portal.
2. Envie este zip e peça para descompactar na raiz. Ele substitui a constituição e o `feature.json` e cria `specs/002-evolucao-metodo-octo/`. A pasta `specs/001-portal-wise-partners/` não é tocada (o `plan.md` e o `tasks.md` da v1 continuam lá).
3. Mande a mensagem de abertura abaixo.
4. Rode os comandos do Spec Kit, um de cada vez, revisando cada saída: `/speckit.plan`, `/speckit.tasks`, `/speckit.analyze`, `/speckit.implement`.
5. Rode os testes da v1 e da v2 com dados fictícios. Só depois importe os parceiros reais de `specs/001-portal-wise-partners/dados-iniciais/parceiros.csv`.
6. Suba o modelo de contrato v2 na tela de configurações (modelos de contrato), como versão vigente.

## Mensagem de abertura para o Claude Code

> Descompactei na raiz o pacote da versão 2.0 do Portal Wise Partners. A constituição foi para 2.0.0 e a feature ativa agora é `specs/002-evolucao-metodo-octo/`. A v1 já está implementada (migrações 0001 a 0009) e a pasta `specs/001-portal-wise-partners/` continua valendo no que a 002 não altera.
>
> 1. Leia a constituição, o `spec.md` e o `briefing-tecnico.md` da 002 por inteiro, e o `spec.md` da 001 para contexto.
> 2. Confira o briefing contra o código real (migrações, funções, Edge Functions e telas) e me diga em poucas linhas o que entendeu e qualquer contradição ou lacuna.
> 3. Depois rode `/speckit.plan` para a 002, com migrações novas e aditivas a partir de 0010, RLS em toda tabela nova e os testes da seção 10 do briefing.
>
> Regras: interface em português do Brasil, identidade Wise Makers, nenhum texto com travessão, nenhuma migração antiga editada, testes da v1 continuam passando (os que testavam 6 meses e 30 dias passam a testar 180 e 15 dias), e nada de dado real antes dos testes de acesso.

## O que você vai precisar ter à mão

* Os mesmos itens da v1 que ainda faltarem: chave do Resend, domínio de envio, e-mail do Igor e do financeiro.
* Remuneração de referência de quem mais registrar atividades (o Igor, por exemplo), se quiser o custo dessas horas no ROI.
* Margem de contribuição da consultoria, se quiser o ROI sobre margem em vez de receita.
* Prazo médio real dos contratos de consultoria (o padrão é 12 meses).
* Ciclo médio da venda direta, para comparar com o ciclo via parceiro.
* Meta de clientes fechados no ICP via parceiros, se quiserem uma.
* Conteúdo da trilha "Como vender a Wise Makers" (roteiro no Apêndice G do spec).
* Base da Wise para o cruzamento de carteiras: CNPJ e tipo (cliente ou prospect) de cada empresa.

## Contrato

O contrato comercial passou para a versão 2 por causa de quatro regras novas: nível revisto por resultado, proteção da indicação de 180 dias com prazos de resposta, cruzamento de carteiras e encerramento por inatividade. As mudanças estão no Apêndice O do spec. O contrato institucional não muda.

Antes de usar, a versão 2 precisa da mesma revisão do Igor e do jurídico que a versão 1 está tendo. Parceiros que assinarem a versão 1 seguem com as regras dela até assinarem a versão 2 ou um aditivo; o portal só oferece o cruzamento de carteiras a quem tiver a cláusula 10.4.

## Decisões desta versão (resumo)

* Número principal: clientes fechados no ICP via parceiros. O canal é medido por ROI, com custo-hora de R$ 20,45 (R$ 4.500,00 ÷ 220 horas), comissões e custos diretos.
* Nível de entrada pela base no ICP ajustada pelo scorecard; depois, nível por resultado com revisão trimestral, subida imediata e descida só após um trimestre de observação e confirmação de uma pessoa.
* Onboarding de 90 dias com quatro encontros; ativação na primeira indicação no ICP que virou reunião.
* Trilhas de venda dentro do portal, nunca no Wise Hub; certificado por pessoa.
* Link exclusivo de indicação, nota de qualidade, proteção de 180 dias, SLA de 2 e 5 dias úteis, checagens do cliente aos 6 e 12 meses.
* Ações conjuntas nos dois sentidos, sem verba de marketing. Comissões fixas.
* Faixas internas de desempenho, régua de atendimento, desligamento com aprovação do Igor.
* Regras do programa, comunicados, ranking visível e premiação anual no portal do parceiro.
* Cruzamento de carteiras facultativo, só por CNPJ, sem guardar a lista do parceiro.
* Matriz de maturidade de 8 eixos por parceiro, interna, sem rotina obrigatória.
* Fase atual do programa: experimentação.
