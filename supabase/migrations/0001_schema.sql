-- Prime Horse — Estoque: schema inicial
create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'operador', 'financeiro');
create type public.user_status as enum ('ativo', 'inativo');
create type public.movement_type as enum ('entrada', 'saida');

-- ---------------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.user_role not null default 'operador',
  status public.user_status not null default 'ativo',
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- configurações administráveis
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- itens de estoque
-- ---------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  location_id uuid references public.locations(id) on delete set null,
  unit text not null,
  current_quantity numeric not null default 0,
  min_quantity numeric not null default 0,
  expiry_date date,
  supplier text,
  cost_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_category_id_idx on public.items (category_id);
create index items_location_id_idx on public.items (location_id);

-- ---------------------------------------------------------------------------
-- movimentações (entrada/saída) — imutáveis, quantidade nunca é bloqueada
-- ---------------------------------------------------------------------------
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  client_id text unique,
  item_id uuid not null references public.items(id) on delete cascade,
  type public.movement_type not null,
  quantity numeric not null check (quantity > 0),
  resulting_quantity numeric not null,
  reason text not null check (btrim(reason) <> ''),
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index movements_item_id_idx on public.movements (item_id);
create index movements_occurred_at_idx on public.movements (occurred_at desc);

-- ---------------------------------------------------------------------------
-- notificações push
-- ---------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade,
  type text not null default 'low_stock',
  message text not null,
  created_at timestamptz not null default now()
);

create index notifications_created_at_idx on public.notifications (created_at desc);

-- ---------------------------------------------------------------------------
-- triggers utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at before update on public.items
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- cria automaticamente um profile quando um usuário é criado no Supabase Auth
-- (o backend informa name/role via user_metadata ao criar o usuário)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, status, must_change_password)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'operador'),
    'ativo',
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- registro atômico de movimentação (usado pelo backend via service role)
-- ---------------------------------------------------------------------------
create or replace function public.fn_register_movement(
  p_item_id uuid,
  p_type public.movement_type,
  p_quantity numeric,
  p_reason text,
  p_user_id uuid,
  p_user_name text,
  p_client_id text default null,
  p_occurred_at timestamptz default now()
) returns table (
  movement_id uuid,
  is_new boolean,
  item_id uuid,
  item_name text,
  old_quantity numeric,
  new_quantity numeric,
  min_quantity numeric
) language plpgsql security definer set search_path = public as $$
declare
  v_existing record;
  v_old numeric;
  v_new numeric;
  v_min numeric;
  v_name text;
  v_movement_id uuid;
begin
  if p_client_id is not null then
    select m.id, m.resulting_quantity into v_existing
    from public.movements m where m.client_id = p_client_id;
    if found then
      select i.min_quantity, i.name into v_min, v_name from public.items i where i.id = p_item_id;
      return query select v_existing.id, false, p_item_id, v_name, v_existing.resulting_quantity, v_existing.resulting_quantity, v_min;
      return;
    end if;
  end if;

  select current_quantity, min_quantity, name into v_old, v_min, v_name
  from public.items where id = p_item_id
  for update;

  if not found then
    raise exception 'item_not_found';
  end if;

  v_new := case when p_type = 'entrada' then v_old + p_quantity else v_old - p_quantity end;

  update public.items set current_quantity = v_new where id = p_item_id;

  insert into public.movements (item_id, type, quantity, resulting_quantity, reason, user_id, user_name, client_id, occurred_at)
  values (p_item_id, p_type, p_quantity, v_new, p_reason, p_user_id, p_user_name, p_client_id, coalesce(p_occurred_at, now()))
  returning id into v_movement_id;

  return query select v_movement_id, true, p_item_id, v_name, v_old, v_new, v_min;
end;
$$;
