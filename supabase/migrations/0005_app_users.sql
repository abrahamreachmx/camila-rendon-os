-- Defensa en profundidad sobre el §4.
--
-- Las políticas originales daban acceso total a cualquier sesión, apoyándose en
-- que el registro público estuviera deshabilitado. Eso deja toda la seguridad
-- colgando de un switch del dashboard: si alguien lo reactiva, cualquier
-- desconocido que se registre queda 'authenticated' y lee todo.
--
-- A partir de aquí el acceso exige, además de sesión, estar en `app_users`.
-- Un registro colado no sirve de nada. Dar de alta a alguien es un INSERT.

create table app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  note text,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;

-- security definer para que la función pueda leer app_users sin que su propia
-- RLS provoque recursión al evaluar las políticas de las demás tablas.
create or replace function is_app_user() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_users where user_id = auth.uid())
$$;
grant execute on function is_app_user() to authenticated;

-- Quien ya está dentro puede ver la lista; nadie puede modificarla desde la app
-- (dar de alta a alguien se hace desde el dashboard o con la llave de servicio).
create policy app_users_select on app_users for select to authenticated
  using ((select is_app_user()));

-- Sembrar a los usuarios que ya existen. En este momento es sólo Ana, así que
-- la migración no puede dejar a nadie fuera de su propia app.
insert into app_users (user_id, email, note)
select id, email, 'Alta automática al endurecer las políticas'
  from auth.users
on conflict (user_id) do nothing;

-- Reemplazar las 12 políticas de "basta con sesión".
do $$
declare t text;
begin
  foreach t in array array[
    'settings','companies','contacts','services','campaign_statuses','campaigns',
    'campaign_items','payment_schedules','invoices','quotes','gifting','reports'
  ]
  loop
    execute format('drop policy if exists %I on %I', t || '_auth_all', t);
    -- el (select ...) hace que Postgres evalúe la función una vez por consulta,
    -- no una vez por fila
    execute format(
      'create policy %I on %I for all to authenticated using ((select is_app_user())) with check ((select is_app_user()))',
      t || '_app_user_all', t
    );
  end loop;
end $$;

-- Lo mismo para las facturas en Storage.
drop policy if exists "facturas_auth_read"   on storage.objects;
drop policy if exists "facturas_auth_insert" on storage.objects;
drop policy if exists "facturas_auth_update" on storage.objects;
drop policy if exists "facturas_auth_delete" on storage.objects;

create policy "facturas_app_read"   on storage.objects for select to authenticated
  using (bucket_id = 'facturas' and (select is_app_user()));
create policy "facturas_app_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'facturas' and (select is_app_user()));
create policy "facturas_app_update" on storage.objects for update to authenticated
  using (bucket_id = 'facturas' and (select is_app_user()));
create policy "facturas_app_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'facturas' and (select is_app_user()));
