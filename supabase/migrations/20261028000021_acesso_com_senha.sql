-- Portal Wise Partners: acesso por e-mail e senha (FR-002 alterado em 28/10/2026).
-- A conta nasce com uma senha provisória, repassada por quem cria o acesso; o portal pede a troca no primeiro acesso.
-- Atualiza os textos dos e-mails de acesso que ainda falam em "link no e-mail, sem senha".
-- Só troca o texto original: um texto já editado em Configurações não é alterado.

update public.textos_email
set corpo = 'Olá, {{nome}}.

A parceria com a Wise Makers começou, e o portal do parceiro já está disponível para você. Lá você acompanha a parceria, envia comprovações, registra indicações e vê os pedidos em que a sua empresa foi apresentada.

Entre com este e-mail e a senha provisória que a Wise passou para você. No primeiro acesso, o portal pede para você escolher uma senha só sua.'
where chave = 'convite_parceiro' and corpo like '%link no e-mail, sem senha%';

update public.textos_email
set corpo = 'Olá, {{nome}}.

Você recebeu acesso ao Portal Wise Partners. Entre com este e-mail e a senha provisória que passamos para você. No primeiro acesso, o portal pede para você escolher uma senha só sua.'
where chave = 'convite_interno' and corpo like '%link no e-mail, sem senha%';
