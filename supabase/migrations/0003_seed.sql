-- Prime Horse — Estoque: dados iniciais (o Administrador pode editar tudo depois)
insert into public.units (name) values
  ('fardo'), ('kg'), ('litro'), ('unidade'), ('saco'), ('ton'), ('pacote')
on conflict (name) do nothing;

insert into public.categories (name) values
  ('Feno'), ('Insumo'), ('Medicamento')
on conflict (name) do nothing;

insert into public.locations (name) values
  ('Galpão A'), ('Galpão B'), ('Depósito'), ('Farmácia')
on conflict (name) do nothing;
