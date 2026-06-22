-- Quick Todo / Time Tracker — schéma initial.
-- Modèle "sans compte" : un unique jeu de données partagé, persistance en base.
-- L'accès est régi par des policies RLS permissives (rôle anon/authenticated).

create table if not exists public.missions (
  id text primary key,
  title text not null,
  created_at bigint not null,
  status text not null default 'active' check (status in ('active', 'done'))
);

create table if not exists public.tasks (
  id text primary key,
  mission_id text not null references public.missions (id) on delete cascade,
  title text not null,
  "order" integer not null default 0,
  allocated_min integer not null default 0,
  elapsed_sec integer not null default 0,
  status text not null default 'todo'
    check (status in ('todo', 'running', 'paused', 'done')),
  pauses jsonb not null default '[]'::jsonb,
  started_at bigint,
  completed_at bigint
);

create index if not exists tasks_mission_id_idx on public.tasks (mission_id);
create index if not exists tasks_order_idx on public.tasks (mission_id, "order");

alter table public.missions enable row level security;
alter table public.tasks enable row level security;

-- Accès public (pas d'authentification) — compromis assumé pour ce projet.
drop policy if exists "missions_public_all" on public.missions;
create policy "missions_public_all" on public.missions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "tasks_public_all" on public.tasks;
create policy "tasks_public_all" on public.tasks
  for all to anon, authenticated using (true) with check (true);
