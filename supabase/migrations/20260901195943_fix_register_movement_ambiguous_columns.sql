-- Corrige a ambiguidade entre os nomes das colunas de retorno da função
-- (especialmente min_quantity) e as colunas da tabela public.items.
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
    select m.id, m.resulting_quantity
      into v_existing
      from public.movements as m
     where m.client_id = p_client_id;

    if found then
      select i.min_quantity, i.name
        into v_min, v_name
        from public.items as i
       where i.id = p_item_id;

      return query
      select
        v_existing.id,
        false,
        p_item_id,
        v_name,
        v_existing.resulting_quantity,
        v_existing.resulting_quantity,
        v_min;
      return;
    end if;
  end if;

  select i.current_quantity, i.min_quantity, i.name
    into v_old, v_min, v_name
    from public.items as i
   where i.id = p_item_id
     for update;

  if not found then
    raise exception 'item_not_found';
  end if;

  v_new := case
    when p_type = 'entrada' then v_old + p_quantity
    else v_old - p_quantity
  end;

  update public.items as i
     set current_quantity = v_new
   where i.id = p_item_id;

  insert into public.movements (
    item_id,
    type,
    quantity,
    resulting_quantity,
    reason,
    user_id,
    user_name,
    client_id,
    occurred_at
  )
  values (
    p_item_id,
    p_type,
    p_quantity,
    v_new,
    p_reason,
    p_user_id,
    p_user_name,
    p_client_id,
    coalesce(p_occurred_at, now())
  )
  returning id into v_movement_id;

  return query
  select
    v_movement_id,
    true,
    p_item_id,
    v_name,
    v_old,
    v_new,
    v_min;
end;
$$;

-- A função é chamada exclusivamente pelo backend com a service role.
-- Evita que clientes anon/authenticated contornem as validações das rotas.
revoke execute on function public.fn_register_movement(
  uuid,
  public.movement_type,
  numeric,
  text,
  uuid,
  text,
  text,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.fn_register_movement(
  uuid,
  public.movement_type,
  numeric,
  text,
  uuid,
  text,
  text,
  timestamptz
) to service_role;
