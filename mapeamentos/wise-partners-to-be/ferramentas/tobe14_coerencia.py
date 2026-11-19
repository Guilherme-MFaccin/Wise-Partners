# To-be v14 (20/11/2026): wireframe do portal e coerência da entrada do parceiro.
# Pedido do patrocinador: "estruture todo o Wireframe do portal [...] ajuste também tudo o que tem de incoerência lógica arquitetônica".
H14 = "2026-11-20"
EV_WIRE = ev_raw("entrevista", "Mensagem do patrocinador na sessão de trabalho (20/11/2026)",
    "Preciso que você estruture todo o Wireframe do portal wise partners e deixe disponível em algum lugar da aba de Programa. Você verá, pela lógica, "
    "que existem algumas inconsistências com relação ao login como parceiro, criação de conta como parceiro etc etc. Preciso que você ajuste também "
    "tudo o que tem de incoerência lógica arquitetônica do wireframe, além de deixa-lo visível no próprio portal",
    "Sessão de trabalho, wireframe do portal", pessoa="PE-01", data=H14)
PX14 = {p["id"]: p for p in d["processos"]}

def ajustar14(pid, portal):
    p = PX14[pid]
    p["portal"] = portal
    if EV_WIRE not in p.setdefault("evidencias", []): p["evidencias"].append(EV_WIRE)

ajustar14("P-23", "aprova o cadastro, cria o parceiro como Select com o aceite registrado e gera a conta com senha provisória e a mensagem de acesso; no primeiro acesso, o portal pede a senha própria antes de qualquer tela. Não existe acesso sem a conversa de entrada.")
ajustar14("P-93", "controla os acessos (time da Wise em Usuários, colegas do parceiro pelo responsável), sempre com senha provisória trocada no primeiro acesso, e registra quem acessou o quê.")
ajustar14("P-94", "mostra ao parceiro as seis etapas em Primeiros passos, sem prazo em dias: marca sozinho o acesso, o minicurso, o primeiro cliente e o primeiro diagnóstico, e deixa o parceiro marcar o anúncio e o envio do link.")
ajustar14("P-30", "ativa sozinho no primeiro cliente cadastrado pelo link, ignora o cadastro com o CNPJ do próprio parceiro e avisa os dois lados.")
ajustar14("P-97", "conta os dias parado na etapa e põe o caso em Tarefas a partir de 14 dias.")
ajustar14("P-60", PX14["P-60"].get("portal", "") + " O wireframe de todas as telas e jornadas fica em Programa, Wireframe.")

for g in d.get("glossario", []):
    if g.get("termo") == "Parceiro ativo":
        g["definicao"] = "Parceiro cujo primeiro cliente se cadastrou pelo link exclusivo (P-30); cadastro com o CNPJ do próprio parceiro não conta."
        g.setdefault("evidencias", []).append(EV_WIRE)

add("perguntas", "Q", texto="Os pacotes (Base Ativa, Formação, Prateleira) continuam, ou os benefícios passam a seguir só o nível (Select, Premium, Elite)?",
    tipo="aberta", opcoes=[], alvo=["P-61"], para=["PE-01"], rodada=12, bloco="Níveis", status="aberta", formulario=None, respostas=[], respondida_por=[],
    chave="pendente-v14", contexto=["Hoje todo Select aprovado recebe o pacote Prateleira, mas no canvas ser recomendado na Prateleira é benefício do Premium."],
    logica="", citacoes=[], visual="", recomendo="")
for texto in [
    "A entrada do parceiro é sempre pela fila, WhatsApp e conversa de entrada; não existe acesso direto pela página.",
    "Quem recebe senha provisória cria a própria senha no primeiro acesso, antes de usar o portal.",
    "O endereço do portal sem login abre a página dos parceiros.",
]:
    add("decisoes", "DE", data=H14, texto=texto, por="PE-01", provisoria=False, evidencias=[EV_WIRE])
d["historico"].append({"data": H14, "evento": "To-be v14: wireframe do portal em Programa, Wireframe; entrada sempre pela fila; senha própria no primeiro acesso; onboarding por etapas e ativação no primeiro cliente pelo link aplicados no portal; glossário de parceiro ativo corrigido; pergunta aberta sobre pacotes e níveis."})
print("v14: coerência do portal")
