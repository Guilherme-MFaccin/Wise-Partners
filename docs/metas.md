# Metas do Portal Wise Partners

Revisão de 28/10/2026, decidida no formulário de metas. Migração `20261028000022_metas_cascata.sql`.

## Modelo

Cascata em três níveis, com um único cadastro em **Configurações, Metas**. As outras telas só mostram.

| Nível | Onde se define | Onde aparece | Período |
|---|---|---|---|
| Programa (Wise) | Metas, aba Programa (tabela `metas`) | Painel (bloco "Metas do trimestre"), relatório semanal | Trimestre; o ano é a soma dos trimestres |
| Representante | Metas, aba Pessoas (tabela `metas_pessoa`) | Meu painel | Trimestre |
| Parceiro | Requisitos de nível, marcos do onboarding, contrapartidas | Portal do parceiro, quadro "Seus objetivos" | 180 dias móveis (nível), com recorte do trimestre |

* **Meta principal**: clientes fechados no ICP via parceiros. Assinados, ativados e os demais indicadores de resultado são metas de apoio.
* **Só indicadores de resultado recebem meta** (`indicadores.aceita_meta`): assinados, ativados, clientes no ICP, receita atribuída, conversão do funil, NPS, ativos sobre assinados e ROI. Os demais mostram só tendência.
* **Assinados contam no período**, com o acumulado desde o início do programa ao lado.
* **Pessoa**: assinados, ativados, clientes no ICP, reuniões com possíveis parceiros e régua em dia. A meta da Wise se divide entre as pessoas; a tela avisa quando a soma não fecha. O crédito vai para o responsável pelo parceiro na data do evento.
* **Fases do programa**: os critérios ficam em `criterios_fase`, editáveis. Critério sem indicador é marcado à mão. A sugestão de mudança aparece quando todos os da fase atual estão atingidos; o administrador decide.

## Funil

Cada etapa tem **chance de assinatura** e **prazo em dias úteis** (`etapas_funil`). O prazo marca a negociação como parada. O **funil até a meta** (`funil_reverso`) parte da meta de assinados do trimestre, soma a projeção das etapas e diz quantas reuniões ou contatos faltam. Aparece no Painel, no Meu painel, no topo do kanban e no relatório semanal.

## Parceiro

* **Marcos do onboarding** (`marcos_onboarding_config`): prazo, texto e critérios editáveis. O marco de 90 dias é a ativação.
* **Contrapartidas**: meta estruturada (quantidade, unidade, prazo e forma de medir). "Contagem" soma as comprovações validadas; "valor" usa o número informado na última comprovação validada.
* **Ranking**: reconhecimento anual, sem meta. Quem define o nível são os requisitos.

## Vocabulário

Meta: número a atingir no trimestre. Requisito: condição de nível. Marco: item do onboarding. Critério: mudança de fase. Etapa: só o kanban. Frente: grupos do painel (captação, onboarding, relacionamento, produção, canal).
