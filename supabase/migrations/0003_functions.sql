-- Funciones de negocio (BLUEPRINT.md §4)

-- Keep-alive. La llama GitHub Actions cada 3 dias con la publishable key.
-- Supabase Free pausa el proyecto tras 7 dias sin trafico. No toca datos.
create or replace function ping() returns text
  language sql stable security definer set search_path = '' as $$ select 'ok' $$;
grant execute on function ping() to anon, authenticated;

-- Folio de cotizacion COT-YYYY-NNN
create or replace function next_quote_folio() returns text
  language plpgsql security definer set search_path = public as $$
declare
  y text := to_char(current_date, 'YYYY');
  n int;
begin
  select count(*) + 1 into n from quotes where folio like 'COT-' || y || '-%';
  return 'COT-' || y || '-' || lpad(n::text, 3, '0');
end $$;
grant execute on function next_quote_folio() to authenticated;

-- Resumen de resultados de un periodo, consolidado en MXN con el fx_rate_mxn de cada campana.
-- "Campana del periodo" = publish_date dentro del rango; si es null, created_at.
create or replace function report_summary(from_date date, to_date date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  with camp as (
    select c.*,
           coalesce(c.publish_date, c.created_at::date) as period_date,
           s.name as status_name,
           coalesce(s.is_closed, false) as is_closed,
           co.name as company_name
      from campaigns c
      left join campaign_statuses s on s.id = c.status_id
      join companies co on co.id = c.company_id
     where coalesce(c.publish_date, c.created_at::date) between from_date and to_date
  ),
  pay as (
    select p.*, c.currency, c.fx_rate_mxn
      from payment_schedules p
      join campaigns c on c.id = p.campaign_id
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', from_date, 'to', to_date),
    'campaigns', jsonb_build_object(
        'total',    (select count(*) from camp),
        'closed',   (select count(*) from camp where is_closed),
        'by_status',(select coalesce(jsonb_agg(jsonb_build_object('status', status_name, 'count', n)), '[]'::jsonb)
                       from (select status_name, count(*) n from camp group by status_name) x),
        'produced', (select count(*) from camp where produced),
        'on_time',  (select count(*) from camp
                      where produced and content_due_date is not null and content_due_date >= period_date)
    ),
    'sales', jsonb_build_object(
        'gross_mxn',      (select coalesce(sum(gross_amount * fx_rate_mxn), 0) from camp),
        'net_mxn',        (select coalesce(sum(net_amount   * fx_rate_mxn), 0) from camp),
        'avg_ticket_mxn', (select coalesce(avg(net_amount   * fx_rate_mxn), 0) from camp),
        'by_currency',    (select coalesce(jsonb_agg(jsonb_build_object(
                                    'currency', currency, 'gross', g, 'net', n, 'count', c)), '[]'::jsonb)
                             from (select currency, sum(gross_amount) g, sum(net_amount) n, count(*) c
                                     from camp group by currency) x)
    ),
    'commissions', jsonb_build_object(
        'generated_mxn', (select coalesce(sum(net_amount * commission_pct / 100 * fx_rate_mxn), 0) from camp),
        'paid_mxn',      (select coalesce(sum(net_amount * commission_pct / 100 * fx_rate_mxn), 0) from camp where commission_paid),
        'pending_mxn',   (select coalesce(sum(net_amount * commission_pct / 100 * fx_rate_mxn), 0) from camp where not commission_paid)
    ),
    'collections', jsonb_build_object(
        'collected_mxn',     (select coalesce(sum(amount * fx_rate_mxn), 0) from pay
                               where status = 'pagado' and paid_at between from_date and to_date),
        'due_in_period_mxn', (select coalesce(sum(amount * fx_rate_mxn), 0) from pay
                               where due_date between from_date and to_date),
        'pending_mxn',       (select coalesce(sum(amount * fx_rate_mxn), 0) from pay
                               where status <> 'pagado' and due_date between from_date and to_date),
        'overdue_mxn',       (select coalesce(sum(amount * fx_rate_mxn), 0) from pay
                               where status <> 'pagado' and due_date < least(to_date, current_date))
    ),
    'top_companies', (select coalesce(jsonb_agg(jsonb_build_object(
                                'company', company_name, 'net_mxn', n, 'count', c) order by n desc), '[]'::jsonb)
                        from (select company_name, sum(net_amount * fx_rate_mxn) n, count(*) c
                                from camp group by company_name order by n desc limit 5) x),
    'top_services',  (select coalesce(jsonb_agg(jsonb_build_object(
                                'service', d, 'units', u, 'revenue_mxn', r) order by r desc), '[]'::jsonb)
                        from (select coalesce(s.name, i.description) d,
                                     sum(i.quantity) u,
                                     sum(i.line_total * c.fx_rate_mxn) r
                                from campaign_items i
                                join camp c on c.id = i.campaign_id
                                left join services s on s.id = i.service_id
                               group by 1 order by r desc limit 8) x),
    'crm', jsonb_build_object(
        'new_companies',  (select count(*) from companies where created_at::date between from_date and to_date),
        'became_clients', (select count(distinct company_id) from camp where is_closed),
        'by_stage',       (select coalesce(jsonb_agg(jsonb_build_object('stage', stage, 'count', n)), '[]'::jsonb)
                             from (select stage, count(*) n from companies group by stage) x)
    ),
    'gifting', jsonb_build_object(
        'received',        (select count(*) from gifting where received_at between from_date and to_date),
        'total_in_period', (select count(*) from gifting where created_at::date between from_date and to_date)
    ),
    'monthly_sales', (select coalesce(jsonb_agg(jsonb_build_object('month', m, 'net_mxn', n) order by m), '[]'::jsonb)
                        from (select to_char(date_trunc('month', period_date), 'YYYY-MM') m,
                                     sum(net_amount * fx_rate_mxn) n
                                from camp group by 1) x)
  ) into result;
  return result;
end $$;
grant execute on function report_summary(date, date) to authenticated;
