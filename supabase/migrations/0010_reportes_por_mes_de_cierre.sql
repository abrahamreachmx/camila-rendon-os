-- Reportes por mes de cierre.
--
-- Cambia el criterio con el que una campana pertenece a un periodo: antes era
-- la fecha de publicacion (y a falta de esa, la de alta); ahora es el mes de
-- cierre del trato. Las campanas sin mes de cierre quedan fuera de todos los
-- periodos, por decision explicita: el trato aun no se concreto.
--
-- De paso, "entregas a tiempo" deja de comparar la fecha de entrega contra la
-- del periodo (con el mes de cierre esa cuenta era trivialmente cierta) y pasa
-- a medir entregables reales: entregados en o antes de su fecha comprometida.

-- Resumen de resultados de un periodo, consolidado en MXN con el fx_rate_mxn de cada campana.
-- "Campana del periodo" = close_month dentro del rango. Una campana sin mes de
-- cierre NO entra a ningun periodo: el trato todavia no se ha concretado.
create or replace function report_summary(from_date date, to_date date)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  with camp as (
    select c.*,
           c.close_month as period_date,
           s.name as status_name,
           coalesce(s.is_closed, false) as is_closed,
           co.name as company_name
      from campaigns c
      left join campaign_statuses s on s.id = c.status_id
      join companies co on co.id = c.company_id
     where c.close_month is not null
       and c.close_month between date_trunc('month', from_date)::date and to_date
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
        -- Entregas puntuales medidas pieza por pieza: entregada y no despues
        -- de la fecha comprometida.
        'on_time',  (select count(*) from campaign_deliverables d
                       join camp c on c.id = d.campaign_id
                      where d.delivered and d.due_date is not null
                        and d.delivered_at is not null and d.delivered_at <= d.due_date),
        'deliverables', (select count(*) from campaign_deliverables d join camp c on c.id = d.campaign_id),
        'deliverables_pending', (select count(*) from campaign_deliverables d
                                   join camp c on c.id = d.campaign_id where not d.delivered)
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
