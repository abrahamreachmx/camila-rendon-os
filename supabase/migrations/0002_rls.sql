-- RLS (BLUEPRINT.md §4). Una sola usuaria: basta con exigir sesion.
-- El sign-up publico esta deshabilitado en Supabase Auth, asi que "authenticated" == Ana.
do $$
declare t text;
begin
  foreach t in array array[
    'settings','companies','contacts','services','campaign_statuses','campaigns',
    'campaign_items','payment_schedules','invoices','quotes','gifting','reports'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_auth_all', t
    );
  end loop;
end $$;
