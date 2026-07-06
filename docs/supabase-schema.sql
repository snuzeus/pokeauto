create table if not exists public.pokemon_sets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  poke_key text not null,
  nickname text,
  level integer not null default 50,
  nature_key integer not null,
  item_key integer,
  ability_key integer,
  evs jsonb not null,
  moves integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pokemon_sets enable row level security;

create policy "pokemon_sets_select_own"
on public.pokemon_sets
for select
using (auth.uid() = user_id);

create policy "pokemon_sets_insert_own"
on public.pokemon_sets
for insert
with check (auth.uid() = user_id);

create policy "pokemon_sets_update_own"
on public.pokemon_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "pokemon_sets_delete_own"
on public.pokemon_sets
for delete
using (auth.uid() = user_id);
