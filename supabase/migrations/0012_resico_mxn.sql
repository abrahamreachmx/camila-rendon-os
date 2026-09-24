-- Bruto automatico RESICO para campanas en pesos.
--
-- Camila factura bajo RESICO: a cada factura en MXN se le suma IVA 16 % sobre
-- el subtotal y la marca retiene ISR 1.25 % de ese mismo subtotal. El bruto
-- (lo que paga la marca) pasa a calcularse solo a partir del neto:
--   bruto = neto + round(neto * 0.16, 2) - round(neto * 0.0125, 2)
-- USD, COP y EUR no llevan impuestos y no cambian.
--
-- Alcance decidido por Abraham (23-sep-2026):
--   * Solo se recalculan las campanas MXN ABIERTAS. Las cerradas (Ejecutada,
--     Cancelada) conservan el bruto historico que vino de Airtable: se
--     congelan con gross_manual antes de crear el trigger.
--   * Las abiertas que ya se cobraron completas tambien se congelan.
--   * En las abiertas, los cobros NO pagados se reescalan para que el plan
--     cuadre con el bruto. Los pagados no se tocan.
--   * Ana puede sobrescribir el bruto a mano (gross_manual) como hasta ahora.
--
-- La misma aritmetica vive en el cliente: src/lib/taxes.ts.

begin;

-- 1. Congelar lo historico ANTES de que exista el trigger. Si no, marcar la
--    comision pagada de una Ejecutada reescribiria su bruto de Airtable.
update campaigns c
   set gross_manual = true
  from campaign_statuses s
 where s.id = c.status_id
   and s.is_closed
   and c.currency = 'MXN'
   and not c.gross_manual;

-- Tambien las abiertas que ya se cobraron completas (hoy: YSL febrero 2026,
-- $120,000 pagados). La factura ya se emitio y se pago: recalcularles el bruto
-- inventaria un saldo pendiente que nadie va a cubrir.
update campaigns c
   set gross_manual = true
 where c.currency = 'MXN'
   and not c.gross_manual
   and exists (select 1 from payment_schedules p where p.campaign_id = c.id)
   and not exists (select 1 from payment_schedules p where p.campaign_id = c.id and p.status <> 'pagado');

-- 2. El calculo.
create or replace function resico_total(net numeric) returns numeric
language sql immutable as $$
  select round(net, 2) + round(net * 0.16, 2) - round(net * 0.0125, 2)
$$;

create or replace function apply_resico_gross() returns trigger language plpgsql as $$
begin
  if new.gross_manual then
    return new;
  end if;
  if new.currency = 'MXN' then
    new.gross_amount := resico_total(new.net_amount);
  elsif tg_op = 'UPDATE' and old.currency = 'MXN' then
    -- Deja de ser una factura mexicana: sin impuestos, el bruto es el neto.
    new.gross_amount := new.net_amount;
  end if;
  return new;
end $$;

drop trigger if exists trg_campaigns_resico on campaigns;
create trigger trg_campaigns_resico before insert or update on campaigns
  for each row execute function apply_resico_gross();

-- 3. Las MXN abiertas: quitar cualquier bruto manual y dejar que el trigger
--    lo calcule (el update dispara trg_campaigns_resico).
create or replace view resico_open_campaigns as
  select c.id
    from campaigns c
    left join campaign_statuses s on s.id = c.status_id
   where c.currency = 'MXN'
     and not coalesce(s.is_closed, false)
     -- Las cobradas completas se congelaron arriba y se quedan como estan.
     and not (exists (select 1 from payment_schedules p where p.campaign_id = c.id)
              and not exists (select 1 from payment_schedules p
                               where p.campaign_id = c.id and p.status <> 'pagado'));

update campaigns
   set gross_manual = false,
       gross_amount = resico_total(net_amount)
 where id in (select id from resico_open_campaigns);

-- 4. Reescalar los cobros no pagados de esas campanas: lo que falta
--    (bruto - pagado) se reparte en proporcion a los montos actuales y el
--    ultimo cobro absorbe los centavos para que la suma cuadre exacta.
with totals as (
  select c.id as campaign_id,
         c.gross_amount - coalesce(sum(p.amount) filter (where p.status = 'pagado'), 0) as remaining,
         coalesce(sum(p.amount) filter (where p.status <> 'pagado'), 0) as unpaid
    from campaigns c
    join payment_schedules p on p.campaign_id = c.id
   where c.id in (select id from resico_open_campaigns)
   group by c.id, c.gross_amount
),
ranked as (
  select p.id, p.campaign_id, p.amount,
         t.remaining, t.unpaid,
         row_number() over (partition by p.campaign_id order by p.due_date desc, p.id desc) as from_last
    from payment_schedules p
    join totals t on t.campaign_id = p.campaign_id
   where p.status <> 'pagado'
     and t.unpaid > 0
     and t.remaining >= 0
),
scaled as (
  select id, campaign_id, from_last, remaining,
         round(amount * remaining / unpaid, 2) as new_amount
    from ranked
),
final as (
  select s.id,
         case when s.from_last = 1
              then s.remaining - coalesce((select sum(o.new_amount) from scaled o
                                            where o.campaign_id = s.campaign_id and o.from_last > 1), 0)
              else s.new_amount
         end as amount
    from scaled s
)
update payment_schedules p
   set amount = f.amount
  from final f
 where f.id = p.id
   and f.amount >= 0;

drop view resico_open_campaigns;

commit;
