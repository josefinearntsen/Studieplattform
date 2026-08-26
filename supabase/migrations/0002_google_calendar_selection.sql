-- Legg til støtte for å velge hvilke Google-kalendere som skal synkroniseres
-- (i stedet for kun "primary"). Kjør denne i Supabase SQL Editor.

alter table public.user_integrations
  add column if not exists google_calendar_ids text[] not null default array['primary'];
