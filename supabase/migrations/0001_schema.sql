-- Camila Rendon OS — esquema base (BLUEPRINT.md §4)
-- Dinero: numeric(14,2) en la moneda de la campana. fx_rate_mxn consolida a MXN.

create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- settings
create table settings (
  id smallint primary key default 1 check (id = 1),
  commission_pct numeric(5,2) not null default 20.00 check (commission_pct >= 0 and commission_pct <= 100),
  default_currency text not null default 'MXN' check (default_currency in ('MXN','USD','COP')),
  brand_name text not null default 'Camila Rendón',
  brand_handle text,
  brand_email text,
  brand_phone text,
  brand_logo_path text,
  quote_footer text,
  quote_validity_days int not null default 15 check (quote_validity_days > 0),
  payment_presets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on settings
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  stage text not null default 'prospecto' check (stage in ('prospecto','negociando','cliente')),
  industry text,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_companies_updated before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- contacts
create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  linkedin text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_contacts_company_id on contacts(company_id);
-- un solo contacto principal por marca
create unique index uq_contacts_primary_per_company on contacts(company_id) where is_primary;
create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- services
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price numeric(14,2) not null default 0 check (default_price >= 0),
  currency text not null default 'MXN' check (currency in ('MXN','USD','COP')),
  paid_media_default boolean not null default false,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();

-- -------------------------------------------------------- campaign_statuses
create table campaign_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#8B8079',
  sort_order int not null default 0,
  is_default boolean not null default false,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- solo un estatus puede ser el default
create unique index uq_status_default on campaign_statuses(is_default) where is_default;
create trigger trg_statuses_updated before update on campaign_statuses
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  contact_id uuid references contacts(id) on delete set null,
  name text not null,
  status_id uuid references campaign_statuses(id) on delete set null,
  currency text not null default 'MXN' check (currency in ('MXN','USD','COP')),
  fx_rate_mxn numeric(12,6) not null default 1 check (fx_rate_mxn > 0),
  gross_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  commission_pct numeric(5,2) not null default 20.00 check (commission_pct >= 0 and commission_pct <= 100),
  commission_paid boolean not null default false,
  commission_paid_at date,
  produced boolean not null default false,
  content_due_date date,
  publish_date date,
  signed_at date,
  contract_signed boolean not null default false,
  brief text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaigns_company_id on campaigns(company_id);
create index idx_campaigns_status_id on campaigns(status_id);
create index idx_campaigns_publish_date on campaigns(publish_date);
create trigger trg_campaigns_updated before update on campaigns
  for each row execute function set_updated_at();

-- ---------------------------------------------------------- campaign_items
create table campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  description text not null,
  quantity numeric(8,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  line_total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  paid_media boolean not null default false,
  collab boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaign_items_campaign_id on campaign_items(campaign_id);
create trigger trg_items_updated before update on campaign_items
  for each row execute function set_updated_at();

-- gross_amount = suma de lineas. Si net_amount seguia igual al bruto anterior
-- (es decir, Ana no lo habia ajustado a mano), lo acompana.
create or replace function recalc_campaign_totals() returns trigger language plpgsql as $$
declare
  cid uuid;
  new_gross numeric(14,2);
  old_gross numeric(14,2);
begin
  cid := coalesce(new.campaign_id, old.campaign_id);
  select gross_amount into old_gross from campaigns where id = cid;
  if not found then
    return null; -- la campana se esta borrando en cascada
  end if;
  select coalesce(sum(line_total), 0) into new_gross from campaign_items where campaign_id = cid;
  update campaigns
     set gross_amount = new_gross,
         net_amount = case when net_amount = old_gross then new_gross else net_amount end
   where id = cid;
  return null;
end $$;
create trigger trg_items_recalc after insert or update or delete on campaign_items
  for each row execute function recalc_campaign_totals();

-- ------------------------------------------------------- payment_schedules
-- "Vencido" NO se guarda: es status <> 'pagado' and due_date < today, calculado en consulta.
create table payment_schedules (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  status text not null default 'pendiente' check (status in ('pendiente','en_proceso','pagado')),
  paid_at date,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_campaign_id on payment_schedules(campaign_id);
create index idx_payments_due_date on payment_schedules(due_date);
create trigger trg_payments_updated before update on payment_schedules
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------- invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  kind text not null check (kind in ('pdf','xml')),
  storage_path text not null,
  filename text not null,
  size_bytes int,
  uuid_fiscal text,
  created_at timestamptz not null default now()
);
create index idx_invoices_campaign_id on invoices(campaign_id);

-- ------------------------------------------------------------------ quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  folio text not null unique,
  issued_at date not null default current_date,
  valid_until date,
  currency text not null check (currency in ('MXN','USD','COP')),
  items_snapshot jsonb not null,
  total numeric(14,2) not null,
  payment_terms_label text,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_quotes_campaign_id on quotes(campaign_id);

-- ----------------------------------------------------------------- gifting
create table gifting (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  company_name text not null,
  contact_email text,
  products text,
  tracking_links text[] not null default '{}',
  status text not null default 'propuesto' check (status in ('propuesto','enviado','recibido','publicado','declinado')),
  received_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_gifting_company_id on gifting(company_id);
create trigger trg_gifting_updated before update on gifting
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------- reports
-- snapshot inmutable: reabrir un reporte guardado nunca recalcula.
create table reports (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('mes','trimestre','rango')),
  period_start date not null,
  period_end date not null,
  title text not null,
  snapshot jsonb not null,
  pdf_path text,
  created_at timestamptz not null default now()
);
create index idx_reports_period_start on reports(period_start);
