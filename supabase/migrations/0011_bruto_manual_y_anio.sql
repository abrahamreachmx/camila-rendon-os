-- Bruto capturado a mano y reportes anuales.
--
-- 1. El bruto deja de ser siempre la suma de servicios: cada pais trae su IVA,
--    retenciones y demas, asi que Ana lo captura a mano desde la tabla. Con
--    gross_manual encendido el trigger respeta ese bruto al editar servicios.
--    La regla de que el neto "acompana" ahora se compara contra la suma
--    ANTERIOR de servicios, no contra el bruto: si se comparara contra un bruto
--    con IVA, el neto dejaria de seguir a los servicios sin que nadie lo decida.
-- 2. Los reportes guardados aceptan el periodo 'anio'.

alter table campaigns add column gross_manual boolean not null default false;

create or replace function recalc_campaign_totals() returns trigger language plpgsql as $$
declare
  cid uuid;
  new_sum numeric(14,2);
  old_sum numeric(14,2);
  delta_new numeric(14,2) := 0;
  delta_old numeric(14,2) := 0;
begin
  cid := coalesce(new.campaign_id, old.campaign_id);
  perform 1 from campaigns where id = cid;
  if not found then
    return null; -- la campana se esta borrando en cascada
  end if;

  select coalesce(sum(line_total), 0) into new_sum from campaign_items where campaign_id = cid;

  -- En INSERT no hay OLD y en DELETE no hay NEW: se leen segun la operacion.
  if tg_op in ('INSERT', 'UPDATE') then delta_new := new.line_total; end if;
  if tg_op in ('UPDATE', 'DELETE') then delta_old := old.line_total; end if;
  old_sum := new_sum - delta_new + delta_old;

  update campaigns
     set gross_amount = case when gross_manual then gross_amount else new_sum end,
         net_amount = case when net_amount = old_sum then new_sum else net_amount end
   where id = cid;
  return null;
end $$;

alter table reports drop constraint if exists reports_period_type_check;
alter table reports add constraint reports_period_type_check
  check (period_type in ('mes', 'trimestre', 'anio', 'rango'));
