-- Mes de cierre de la campaña.
--
-- Ana no lleva fechas exactas de cierre: lo que le importa es el mes en que se
-- concretó el trato. Ese pasa a ser el criterio con el que los reportes ubican
-- una campaña en un periodo, en lugar de la fecha de publicación.
--
-- Se guarda como `date` normalizada al día 1 y no como texto 'YYYY-MM' porque
-- así se compara por rango y se agrupa con date_trunc sin convertir nada.

alter table campaigns
  add column if not exists close_month date;

alter table campaigns
  drop constraint if exists campaigns_close_month_day1;

alter table campaigns
  add constraint campaigns_close_month_day1
  check (close_month is null or extract(day from close_month) = 1);

create index if not exists idx_campaigns_close_month on campaigns(close_month);

-- Relleno del histórico con el mes de la fecha de publicación. Es la única
-- señal disponible y deja las cifras de los reportes exactamente donde estaban.
-- Las campañas sin fecha de publicación quedan sin mes, y por lo tanto fuera
-- de los reportes hasta que Ana las capture.
update campaigns
   set close_month = date_trunc('month', publish_date)::date
 where close_month is null
   and publish_date is not null;
