-- Schéma Supabase pour l'app Patrimoine.
-- À exécuter une fois dans le SQL Editor du projet Supabase.
-- Chaque utilisateur possède UNE ligne contenant tout son patrimoine (JSONB).

create table if not exists public.portfolios (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sécurité au niveau des lignes : chacun ne voit et ne modifie que SA ligne.
alter table public.portfolios enable row level security;

drop policy if exists "portfolios_select_own" on public.portfolios;
create policy "portfolios_select_own" on public.portfolios
  for select using (auth.uid() = user_id);

drop policy if exists "portfolios_insert_own" on public.portfolios;
create policy "portfolios_insert_own" on public.portfolios
  for insert with check (auth.uid() = user_id);

drop policy if exists "portfolios_update_own" on public.portfolios;
create policy "portfolios_update_own" on public.portfolios
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
