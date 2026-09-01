-- Prime Horse — Estoque: Row Level Security por perfil
-- Observação: o backend (Node) usa a service role key e passa por cima do RLS
-- fazendo sua própria checagem de perfil; estas políticas são a camada de
-- defesa em profundidade caso as chaves anon/authenticated sejam usadas
-- diretamente contra o Postgres/REST do Supabase.

create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.units enable row level security;
alter table public.items enable row level security;
alter table public.movements enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications enable row level security;

-- profiles: cada um vê o próprio registro; admin vê e edita todos
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'admin');

create policy profiles_write_admin on public.profiles
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- categorias / locais / unidades: leitura para os 3 perfis, escrita só admin
create policy categories_select_all on public.categories
  for select using (auth.role() = 'authenticated');
create policy categories_write_admin on public.categories
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy locations_select_all on public.locations
  for select using (auth.role() = 'authenticated');
create policy locations_write_admin on public.locations
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy units_select_all on public.units
  for select using (auth.role() = 'authenticated');
create policy units_write_admin on public.units
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- itens: leitura para os 3 perfis, escrita só admin
create policy items_select_all on public.items
  for select using (auth.role() = 'authenticated');
create policy items_write_admin on public.items
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- movimentações: leitura para os 3 perfis; inserção admin + operador; sem update/delete
create policy movements_select_all on public.movements
  for select using (auth.role() = 'authenticated');
create policy movements_insert_admin_operador on public.movements
  for insert with check (public.current_role() in ('admin', 'operador'));

-- push subscriptions: cada usuário só mexe nas próprias
create policy push_subscriptions_own on public.push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notificações: leitura para os 3 perfis; escrita só via service role (sem policy de insert)
create policy notifications_select_all on public.notifications
  for select using (auth.role() = 'authenticated');
