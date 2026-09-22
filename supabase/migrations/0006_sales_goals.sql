-- Metas de venta anuales (Configuración → Metas).
--
-- Viven como jsonb en la fila única de `settings`, igual que `payment_presets`:
-- son un puñado de objetos por año, siempre se leen completos y así heredan la
-- política RLS de la tabla sin trabajo extra. Siguen siendo consultables desde
-- SQL con jsonb_array_elements si algún día el RPC de reportes las necesita.
--
-- Forma: [{"year": 2026, "target_net_mxn": 3600000}]
-- La meta se mide sobre ventas netas consolidadas en MXN y se prorratea en
-- partes iguales (anual / 12) para el avance mensual y trimestral.

alter table settings
  add column if not exists sales_goals jsonb not null default '[]'::jsonb;

-- Un CHECK no admite subconsultas, así que la validación de forma va en una
-- función inmutable. Sólo usa funciones de pg_catalog, por eso search_path = ''.
create or replace function valid_sales_goals(goals jsonb) returns boolean
  language sql immutable set search_path = '' as $$
  select jsonb_typeof(goals) = 'array'
     and not exists (
           select 1
             from jsonb_array_elements(goals) g
            where jsonb_typeof(g) <> 'object'
               or jsonb_typeof(g -> 'year') <> 'number'
               or jsonb_typeof(g -> 'target_net_mxn') <> 'number'
               or (g ->> 'year')::int not between 2000 and 2100
               or (g ->> 'target_net_mxn')::numeric < 0
         )
     and (select count(*) = count(distinct g ->> 'year')
            from jsonb_array_elements(goals) g)
$$;

alter table settings
  drop constraint if exists settings_sales_goals_valid;

alter table settings
  add constraint settings_sales_goals_valid check (valid_sales_goals(sales_goals));
