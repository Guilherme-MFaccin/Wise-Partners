-- Formato do quadro do vídeo nas landing pages (o vídeo dos parceiros foi gravado em 1:1).
-- auto: Shorts do YouTube em 9:16, os demais em 16:9.
alter table public.config_landing add column if not exists video_formato text not null default 'auto'
  check (video_formato in ('auto', 'horizontal', 'vertical', 'quadrado'));
alter table public.config_landing_cliente add column if not exists video_formato text not null default 'auto'
  check (video_formato in ('auto', 'horizontal', 'vertical', 'quadrado'));
