-- Entregables: los contenidos de una campaña, pieza por pieza.
--
-- Una campaña cotizada tiene varios contenidos y hasta ahora el sistema sólo
-- guardaba una fecha de entrega y una palomita para toda la campaña. Aquí cada
-- pieza lleva su fecha de compromiso, su palomita y su fecha real de entrega.
--
-- El entregable NO apunta a la línea de servicio que lo originó: al guardar los
-- servicios de una campaña el sistema borra todas las líneas y las recrea, así
-- que esos identificadores no sobreviven. La descripción se copia al generar, y
-- eso además es lo correcto: una entrega ya comprometida no debe cambiar de
-- nombre porque alguien editó la cotización.

create table if not exists campaign_deliverables (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  description text not null,
  -- Numeración dentro del lote: "Reel de Instagram 2 de 3".
  piece_number int not null default 1 check (piece_number >= 1),
  total_pieces int not null default 1 check (total_pieces >= 1),
  due_date date,
  delivered boolean not null default false,
  delivered_at date,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deliverables_campaign_id on campaign_deliverables(campaign_id);
create index if not exists idx_deliverables_due_date on campaign_deliverables(due_date);

drop trigger if exists trg_deliverables_updated on campaign_deliverables;
create trigger trg_deliverables_updated before update on campaign_deliverables
  for each row execute function set_updated_at();

-- Tener sesión no basta: hay que estar en app_users, como en el resto de las
-- tablas. El (select ...) hace que Postgres evalúe la función una vez por
-- consulta y no una vez por fila.
alter table campaign_deliverables enable row level security;

drop policy if exists campaign_deliverables_app_user_all on campaign_deliverables;
create policy campaign_deliverables_app_user_all on campaign_deliverables
  for all to authenticated
  using ((select is_app_user())) with check ((select is_app_user()));
