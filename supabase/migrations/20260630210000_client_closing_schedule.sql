-- client_closing_schedule: cronograma de fechamento do cliente
-- Tracks procurement commitments the client must close so the schedule holds.
-- Each row: what needs to be decided, by when (closing_date), and when it
-- arrives on site (delivery_date). Grouped by month in the UI.

create table if not exists public.client_closing_schedule (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  description text not null,
  delivery_date date,
  closing_date date,
  delivery_time text,
  estimated_value numeric(12,2),
  status text default 'em_cotacao'
    check (status in ('em_cotacao','aprovado','comprado','entregue')),
  display_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.client_closing_schedule enable row level security;

create policy "Team select client_closing_schedule"
  on public.client_closing_schedule for select
  using (user_id in (select get_team_user_ids()));

create policy "Team insert client_closing_schedule"
  on public.client_closing_schedule for insert
  with check (user_id in (select get_team_user_ids()));

create policy "Team update client_closing_schedule"
  on public.client_closing_schedule for update
  using (user_id in (select get_team_user_ids()));

create policy "Team delete client_closing_schedule"
  on public.client_closing_schedule for delete
  using (user_id in (select get_team_user_ids()));
