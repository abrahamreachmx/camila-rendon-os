# Camila Rendón OS — Blueprint

> Generado por The Architect el 18 de septiembre de 2026
> Arquetipo: Herramienta interna / Dashboard (SPA estática, una sola usuaria)
> Idioma del proyecto: español (UI, textos, commits); código en inglés.

---

## 1. Visión del Proyecto

### Visión
**Camila Rendón OS** es el sistema operativo privado de **Ana**, manager de la influencer Camila Rendón. Hoy las campañas con marcas, los pagos a 30/60/90 días, las facturas, los regalos (gifting) y las cotizaciones viven repartidos entre WhatsApp, correo y hojas de cálculo. El sistema los concentra en una sola app web: cada campaña tiene su marca, su contacto, su desglose de servicios, su plan de pagos con calendario automático de cobros, sus facturas, su brief y su comisión; desde la misma campaña se genera la cotización en PDF; y al cierre de cada mes o trimestre Ana obtiene un reporte de resultados listo para compartir.

La única usuaria es Ana. No hay equipo, no hay clientes entrando, no hay roles. Costo objetivo: **$0 al mes** (GitHub Pages + Supabase Free).

### Objetivos
- Registrar el 100 % de las campañas con marca, contacto, servicios, montos bruto/neto, moneda, estatus, fechas y contrato.
- Generar automáticamente el calendario de cobros a partir del plan de pagos y ver en una sola pantalla qué entra y cuándo.
- Calcular y dar seguimiento a la comisión de la manager (porcentaje editable, pagada / no pagada).
- Producir cotizaciones PDF en menos de un minuto a partir del catálogo de tarifas.
- Producir reportes de resultados mensuales y trimestrales con ventas, cobros, comisiones y campañas trabajadas.
- Operar sin ninguna suscripción de pago.

### Métricas de éxito
- Ana captura una campaña nueva, con plan de pagos, en menos de 3 minutos.
- Cero cobros olvidados: todo pago vencido aparece en Inicio y en Cobros.
- La cotización PDF sale del sistema sin retocarla en otra herramienta.
- El reporte mensual se genera y exporta en un clic.
- Factura mensual de infraestructura: $0.

---

## 2. Tech Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | Vite 6 + React 19 + TypeScript (SPA) | No hay servidor: el sitio es estático y se hospeda gratis en GitHub Pages. Next.js sobraría. |
| Lenguaje | TypeScript `strict` | Menos errores en cálculos de dinero y fechas. |
| Estilos | Tailwind CSS v4 | Tokens del §7 en `@theme`; sin CSS suelto. |
| Componentes | shadcn/ui (variante Vite) | Tabla, formulario, diálogo, pestañas, calendario y toasts listos. |
| Gráficas | Recharts vía shadcn charts | Ya viene con shadcn; 3 gráficas en Reportes. |
| Ruteo | React Router 7 (`BrowserRouter`) | URLs limpias; GitHub Pages usa `404.html` = copia de `index.html`. |
| Datos cliente | TanStack Query v5 | Caché, invalidación tras mutaciones, estados de carga. |
| Formularios | React Hook Form + Zod | Validación en el borde, mismo esquema en cliente. |
| Base de datos | Supabase Free (Postgres 15) vía `@supabase/supabase-js` | Persistencia real, RLS, 500 MB. Proyecto **nuevo y dedicado**. |
| Archivos | Supabase Storage, bucket privado `facturas` | PDF y XML de facturas, logo para el PDF; URLs firmadas. 1 GB gratis. |
| Auth | Supabase Auth, correo + contraseña, registro público **deshabilitado** | Una sola usuaria; sin roles. |
| PDF | `@react-pdf/renderer` (en el navegador) | Cotizaciones y reportes sin backend; se descarga o comparte el blob. |
| Fechas | `date-fns` + `date-fns-tz` | Generador de calendario de pagos, zona `America/Mexico_City`. |
| Iconos | `lucide-react` | Un solo set, sin emojis en la UI. |
| Hosting | GitHub Pages vía GitHub Actions | Gratis, ya probado por el usuario en otros proyectos. |
| Keep-alive | GitHub Actions cron cada 3 días → RPC `ping()` | Supabase Free pausa el proyecto tras 7 días sin tráfico. |
| Package manager | pnpm | Rápido, lockfile determinista. |

**Cuentas a usar:** GitHub del usuario `abrahamreachmx` (no la organización de Birdie). Supabase: crear un proyecto nuevo llamado `camila-rendon-os` en la organización personal de Abraham; **no** reutilizar los proyectos de Control Center, Reach ni Birdie.

---

## 3. Estructura de Directorios

```
camila-rendon-os/
  .github/
    workflows/
      deploy.yml              # build con pnpm → publica dist/ en GitHub Pages
      keepalive.yml           # cron cada 3 días: llama al RPC ping() de Supabase
  public/
    favicon.svg
    fonts/                    # Fraunces + Instrument Sans (woff2) para la app y para react-pdf
  supabase/
    migrations/
      0001_schema.sql         # tablas, índices, triggers updated_at
      0002_rls.sql            # RLS: todo requiere rol authenticated
      0003_functions.sql      # ping(), report_summary(), recalc de totales
      0004_storage.sql        # bucket facturas + políticas
    seed.sql                  # datos demo: marcas, contactos, servicios, estatus, campañas, pagos, gifting
  src/
    main.tsx                  # monta React, QueryClientProvider, RouterProvider
    App.tsx                   # árbol de rutas
    index.css                 # @import "tailwindcss" + @theme con los tokens del §7
    routes/
      login/LoginPage.tsx
      home/HomePage.tsx                   # Inicio: Línea de cobros + KPIs
      home/PaymentTimeline.tsx            # el componente hero
      campaigns/CampaignsPage.tsx         # lista + filtros
      campaigns/CampaignNewPage.tsx
      campaigns/CampaignDetailPage.tsx    # pestañas
      campaigns/tabs/SummaryTab.tsx
      campaigns/tabs/ServicesTab.tsx
      campaigns/tabs/PaymentsTab.tsx
      campaigns/tabs/InvoicesTab.tsx
      campaigns/tabs/QuoteTab.tsx
      payments/PaymentsPage.tsx           # /cobros: calendario mensual + lista
      companies/CompaniesPage.tsx         # /marcas
      companies/CompanyDetailPage.tsx
      gifting/GiftingPage.tsx
      reports/ReportsPage.tsx             # /reportes
      reports/ReportCharts.tsx
      settings/SettingsPage.tsx           # pestañas: Tarifas, Estatus, Comisión, Plazos, Marca del PDF
    components/
      ui/                                 # primitivas shadcn (generadas)
      layout/AppShell.tsx                 # sidebar + header + <Outlet/>
      layout/Sidebar.tsx
      layout/PageHeader.tsx
      data/DataTable.tsx                  # tabla genérica (TanStack Table) con orden y filtro
      data/MoneyCell.tsx                  # formatea moneda con tabular-nums
      data/StatusBadge.tsx
      data/EmptyState.tsx
      forms/CompanyForm.tsx
      forms/ContactForm.tsx
      forms/CampaignForm.tsx
      forms/CampaignItemsEditor.tsx       # desglose de servicios con totales en vivo
      forms/PaymentPlanGenerator.tsx      # presets → filas de pago editables
      forms/GiftingForm.tsx
      forms/ServiceForm.tsx
      forms/StatusForm.tsx
      forms/InvoiceUploader.tsx
    pdf/
      theme.ts                            # colores y fuentes registradas para react-pdf
      QuotePdf.tsx                        # documento de cotización
      ReportPdf.tsx                       # documento de reporte mensual/trimestral
      downloadPdf.ts                      # blob → descarga / Web Share API
    lib/
      supabase.ts                         # cliente supabase-js (publishable key)
      queryClient.ts
      auth.tsx                            # AuthProvider, useSession, RequireAuth
      money.ts                            # formatMoney, toMxn, sumBy — funciones puras
      paymentPlan.ts                      # generatePaymentPlan(preset, baseDate, total) — pura
      commission.ts                       # calcCommission(net, pct) — pura
      periods.ts                          # rangos de mes/trimestre, periodo anterior — pura
      csv.ts                              # toCsv(rows) — pura
      api/
        companies.ts
        contacts.ts
        services.ts
        statuses.ts
        campaigns.ts
        campaignItems.ts
        payments.ts
        invoices.ts
        quotes.ts
        gifting.ts
        reports.ts
        settings.ts
      schemas/                            # esquemas Zod compartidos por formularios y api
        campaign.ts
        company.ts
        payment.ts
        gifting.ts
        settings.ts
    types/
      database.ts                         # tipos generados: supabase gen types
      index.ts                            # tipos de dominio (Campaign, PaymentRow, ReportSummary…)
  tests/
    unit/
      money.test.ts
      paymentPlan.test.ts
      commission.test.ts
      periods.test.ts
    e2e/
      smoke.spec.ts                       # login → nueva campaña → generar pagos
    setup.ts
  .env.example
  index.html
  vite.config.ts
  tsconfig.json
  components.json                         # config shadcn
  package.json
  CLAUDE.md
```

---

## 4. Modelo de Datos

Moneda: los montos se guardan como `numeric(14,2)` en la moneda de la campaña. Para consolidar, cada campaña guarda `fx_rate_mxn` (cuántos MXN vale 1 unidad de su moneda; para MXN es 1). El reporte multiplica por ese tipo de cambio.

### Entidades

**settings** (una sola fila, `id = 1`)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | smallint | PK, siempre 1 |
| commission_pct | numeric(5,2) | % de comisión de la manager, editable. Default 20.00 |
| default_currency | text | 'MXN' |
| brand_name | text | "Camila Rendón" — cabecera del PDF |
| brand_handle | text | Instagram / TikTok |
| brand_email | text | correo de contacto de Ana |
| brand_phone | text | |
| brand_logo_path | text | ruta en Storage (bucket `facturas`, carpeta `brand/`) |
| quote_footer | text | condiciones legales / pie del PDF |
| quote_validity_days | int | vigencia de cotización, default 15 |
| payment_presets | jsonb | ver formato abajo |
| updated_at | timestamptz | |

Formato de `payment_presets`:
```json
[
  { "key": "contado", "label": "Contado (a la firma)", "parts": [{ "pct": 100, "days": 0 }] },
  { "key": "30",      "label": "30 días",              "parts": [{ "pct": 100, "days": 30 }] },
  { "key": "60",      "label": "60 días",              "parts": [{ "pct": 100, "days": 60 }] },
  { "key": "90",      "label": "90 días",              "parts": [{ "pct": 100, "days": 90 }] },
  { "key": "50-50",   "label": "50 % firma / 50 % a 30 días", "parts": [{ "pct": 50, "days": 0 }, { "pct": 50, "days": 30 }] }
]
```

**companies** (marcas)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | text | único, obligatorio |
| stage | text | 'prospecto' \| 'negociando' \| 'cliente' |
| industry | text | opcional |
| website | text | opcional |
| notes | text | |
| created_at, updated_at | timestamptz | |

**contacts**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK companies, on delete cascade |
| name | text | obligatorio |
| role | text | puesto |
| phone | text | |
| email | text | |
| linkedin | text | URL |
| is_primary | boolean | un contacto principal por marca |
| created_at, updated_at | timestamptz | |

**services** (catálogo de tarifas editable)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | text | "Reel", "TikTok", "Story de Instagram", "Carrusel", "Colaboración"… |
| default_price | numeric(14,2) | |
| currency | text | 'MXN' \| 'USD' \| 'COP' |
| paid_media_default | boolean | si por defecto incluye pauta |
| description | text | texto que sale en la cotización |
| active | boolean | los inactivos no aparecen al cotizar |
| sort_order | int | |
| created_at, updated_at | timestamptz | |

**campaign_statuses** (estatus personalizables)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| name | text | único |
| color | text | hex |
| sort_order | int | |
| is_default | boolean | el que toma una campaña nueva (solo uno) |
| is_closed | boolean | cuenta como "ejecutada" en reportes |
| created_at, updated_at | timestamptz | |

**campaigns**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK companies, obligatorio |
| contact_id | uuid | FK contacts, opcional |
| name | text | obligatorio |
| status_id | uuid | FK campaign_statuses |
| currency | text | 'MXN' \| 'USD' \| 'COP' |
| fx_rate_mxn | numeric(12,6) | 1 para MXN; Ana lo captura para USD/COP |
| gross_amount | numeric(14,2) | suma de items; se recalcula por trigger |
| net_amount | numeric(14,2) | editable; default = gross_amount |
| commission_pct | numeric(5,2) | snapshot de settings al crear; editable |
| commission_paid | boolean | default false |
| commission_paid_at | date | |
| produced | boolean | contenido ya producido |
| content_due_date | date | entrega de contenido |
| publish_date | date | publicación |
| signed_at | date | fecha base del plan de pagos (si null, usa created_at) |
| contract_signed | boolean | |
| brief | text | |
| notes | text | |
| created_at, updated_at | timestamptz | |

**campaign_items** (desglose de servicios)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| campaign_id | uuid | FK campaigns, cascade |
| service_id | uuid | FK services, opcional (puede ser línea libre) |
| description | text | obligatorio |
| quantity | numeric(8,2) | default 1 |
| unit_price | numeric(14,2) | |
| paid_media | boolean | con pauta |
| collab | boolean | publicación en colaboración |
| sort_order | int | |
| created_at, updated_at | timestamptz | |

Total de la línea = `quantity × unit_price` (columna generada `line_total`).

**payment_schedules** (plan de pagos → calendario de cobros)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| campaign_id | uuid | FK campaigns, cascade |
| due_date | date | obligatorio |
| amount | numeric(14,2) | en la moneda de la campaña |
| status | text | 'pendiente' \| 'en_proceso' \| 'pagado' |
| paid_at | date | |
| notes | text | |
| sort_order | int | |
| created_at, updated_at | timestamptz | |

"Vencido" no es un estatus guardado: es `status <> 'pagado' AND due_date < today`, calculado en consultas.

**invoices** (facturas)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| campaign_id | uuid | FK campaigns, cascade |
| kind | text | 'pdf' \| 'xml' |
| storage_path | text | `campaigns/<campaign_id>/<uuid>.<ext>` |
| filename | text | nombre original |
| size_bytes | int | |
| uuid_fiscal | text | folio fiscal, opcional |
| created_at | timestamptz | |

**quotes** (cotizaciones)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| campaign_id | uuid | FK campaigns, cascade |
| folio | text | 'COT-2026-001', secuencia por año |
| issued_at | date | |
| valid_until | date | |
| currency | text | |
| items_snapshot | jsonb | copia de los items al emitir |
| total | numeric(14,2) | |
| payment_terms_label | text | texto del preset elegido |
| notes | text | |
| created_at | timestamptz | |

**gifting**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| company_id | uuid | FK companies, opcional (si la marca ya existe en CRM) |
| company_name | text | obligatorio (texto libre si no está en CRM) |
| contact_email | text | |
| products | text | qué se recibe |
| tracking_links | text[] | ligas de rastreo |
| status | text | 'propuesto' \| 'enviado' \| 'recibido' \| 'publicado' \| 'declinado' |
| received_at | date | |
| notes | text | |
| created_at, updated_at | timestamptz | |

**reports** (historial de reportes guardados)
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| period_type | text | 'mes' \| 'trimestre' \| 'rango' |
| period_start | date | |
| period_end | date | |
| title | text | "Resultados septiembre 2026" |
| snapshot | jsonb | salida completa de `report_summary` al momento de guardar |
| pdf_path | text | opcional, si se subió el PDF a Storage |
| created_at | timestamptz | |

### Relaciones
- `companies 1—N contacts`, `companies 1—N campaigns`, `companies 1—N gifting` (opcional).
- `campaigns 1—N campaign_items`, `campaigns 1—N payment_schedules`, `campaigns 1—N invoices`, `campaigns 1—N quotes`.
- `campaign_statuses 1—N campaigns`; `services 1—N campaign_items` (opcional).
- `settings` es singleton; `reports` no depende de nada (snapshot).

### Esquema SQL

`supabase/migrations/0001_schema.sql`
```sql
create extension if not exists "pgcrypto";

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table settings (
  id smallint primary key default 1 check (id = 1),
  commission_pct numeric(5,2) not null default 20.00,
  default_currency text not null default 'MXN' check (default_currency in ('MXN','USD','COP')),
  brand_name text not null default 'Camila Rendón',
  brand_handle text,
  brand_email text,
  brand_phone text,
  brand_logo_path text,
  quote_footer text,
  quote_validity_days int not null default 15,
  payment_presets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on settings for each row execute function set_updated_at();

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
create trigger trg_companies_updated before update on companies for each row execute function set_updated_at();

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
create trigger trg_contacts_updated before update on contacts for each row execute function set_updated_at();

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_price numeric(14,2) not null default 0,
  currency text not null default 'MXN' check (currency in ('MXN','USD','COP')),
  paid_media_default boolean not null default false,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_services_updated before update on services for each row execute function set_updated_at();

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
create unique index uq_status_default on campaign_statuses(is_default) where is_default;
create trigger trg_statuses_updated before update on campaign_statuses for each row execute function set_updated_at();

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  contact_id uuid references contacts(id) on delete set null,
  name text not null,
  status_id uuid references campaign_statuses(id) on delete set null,
  currency text not null default 'MXN' check (currency in ('MXN','USD','COP')),
  fx_rate_mxn numeric(12,6) not null default 1,
  gross_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  commission_pct numeric(5,2) not null default 20.00,
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
create trigger trg_campaigns_updated before update on campaigns for each row execute function set_updated_at();

create table campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  description text not null,
  quantity numeric(8,2) not null default 1 check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  paid_media boolean not null default false,
  collab boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_campaign_items_campaign_id on campaign_items(campaign_id);
create trigger trg_items_updated before update on campaign_items for each row execute function set_updated_at();

-- gross_amount = suma de líneas; si net_amount seguía igual al bruto anterior, lo acompaña
create or replace function recalc_campaign_totals() returns trigger language plpgsql as $$
declare cid uuid; new_gross numeric(14,2); old_gross numeric(14,2);
begin
  cid := coalesce(new.campaign_id, old.campaign_id);
  select gross_amount into old_gross from campaigns where id = cid;
  select coalesce(sum(line_total),0) into new_gross from campaign_items where campaign_id = cid;
  update campaigns
     set gross_amount = new_gross,
         net_amount = case when net_amount = old_gross then new_gross else net_amount end
   where id = cid;
  return null;
end $$;
create trigger trg_items_recalc after insert or update or delete on campaign_items
  for each row execute function recalc_campaign_totals();

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
create trigger trg_payments_updated before update on payment_schedules for each row execute function set_updated_at();

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

create table quotes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  folio text not null unique,
  issued_at date not null default current_date,
  valid_until date,
  currency text not null,
  items_snapshot jsonb not null,
  total numeric(14,2) not null,
  payment_terms_label text,
  notes text,
  created_at timestamptz not null default now()
);
create index idx_quotes_campaign_id on quotes(campaign_id);

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
create trigger trg_gifting_updated before update on gifting for each row execute function set_updated_at();

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
```

`supabase/migrations/0002_rls.sql` — una sola usuaria: basta con exigir sesión.
```sql
do $$ declare t text;
begin
  foreach t in array array['settings','companies','contacts','services','campaign_statuses','campaigns',
                            'campaign_items','payment_schedules','invoices','quotes','gifting','reports']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s_auth_all" on %I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
```

`supabase/migrations/0003_functions.sql`
```sql
-- keep-alive (la llama GitHub Actions con la publishable key; no toca datos)
create or replace function ping() returns text language sql stable security definer as $$ select 'ok' $$;
grant execute on function ping() to anon, authenticated;

-- folio de cotización COT-YYYY-NNN
create or replace function next_quote_folio() returns text language plpgsql as $$
declare y text := to_char(current_date,'YYYY'); n int;
begin
  select count(*)+1 into n from quotes where folio like 'COT-'||y||'-%';
  return 'COT-'||y||'-'||lpad(n::text,3,'0');
end $$;

-- Resumen de resultados para un periodo. Consolidado en MXN con fx_rate_mxn de cada campaña.
-- Criterio de "campaña del periodo": publish_date dentro del rango; si es null, created_at.
create or replace function report_summary(from_date date, to_date date)
returns jsonb language plpgsql stable as $$
declare result jsonb;
begin
  with camp as (
    select c.*, coalesce(c.publish_date, c.created_at::date) as period_date,
           s.name as status_name, s.is_closed, co.name as company_name
      from campaigns c
      left join campaign_statuses s on s.id = c.status_id
      join companies co on co.id = c.company_id
     where coalesce(c.publish_date, c.created_at::date) between from_date and to_date
  ),
  pay as (
    select p.*, c.currency, c.fx_rate_mxn
      from payment_schedules p join campaigns c on c.id = p.campaign_id
  )
  select jsonb_build_object(
    'period', jsonb_build_object('from', from_date, 'to', to_date),
    'campaigns', jsonb_build_object(
        'total', (select count(*) from camp),
        'closed', (select count(*) from camp where is_closed),
        'by_status', (select coalesce(jsonb_agg(jsonb_build_object('status', status_name, 'count', n)), '[]')
                        from (select status_name, count(*) n from camp group by status_name) x),
        'produced', (select count(*) from camp where produced),
        'on_time', (select count(*) from camp where produced and content_due_date is not null and content_due_date >= period_date)
    ),
    'sales', jsonb_build_object(
        'gross_mxn', (select coalesce(sum(gross_amount*fx_rate_mxn),0) from camp),
        'net_mxn',   (select coalesce(sum(net_amount*fx_rate_mxn),0) from camp),
        'avg_ticket_mxn', (select coalesce(avg(net_amount*fx_rate_mxn),0) from camp),
        'by_currency', (select coalesce(jsonb_agg(jsonb_build_object('currency', currency, 'gross', g, 'net', n, 'count', c)), '[]')
                          from (select currency, sum(gross_amount) g, sum(net_amount) n, count(*) c from camp group by currency) x)
    ),
    'commissions', jsonb_build_object(
        'generated_mxn', (select coalesce(sum(net_amount*commission_pct/100*fx_rate_mxn),0) from camp),
        'paid_mxn',      (select coalesce(sum(net_amount*commission_pct/100*fx_rate_mxn),0) from camp where commission_paid),
        'pending_mxn',   (select coalesce(sum(net_amount*commission_pct/100*fx_rate_mxn),0) from camp where not commission_paid)
    ),
    'collections', jsonb_build_object(
        'collected_mxn', (select coalesce(sum(amount*fx_rate_mxn),0) from pay where status='pagado' and paid_at between from_date and to_date),
        'due_in_period_mxn', (select coalesce(sum(amount*fx_rate_mxn),0) from pay where due_date between from_date and to_date),
        'pending_mxn', (select coalesce(sum(amount*fx_rate_mxn),0) from pay where status<>'pagado' and due_date between from_date and to_date),
        'overdue_mxn', (select coalesce(sum(amount*fx_rate_mxn),0) from pay where status<>'pagado' and due_date < least(to_date, current_date))
    ),
    'top_companies', (select coalesce(jsonb_agg(jsonb_build_object('company', company_name, 'net_mxn', n, 'count', c) order by n desc), '[]')
                        from (select company_name, sum(net_amount*fx_rate_mxn) n, count(*) c from camp group by company_name order by n desc limit 5) x),
    'top_services', (select coalesce(jsonb_agg(jsonb_build_object('service', d, 'units', u, 'revenue_mxn', r) order by r desc), '[]')
                       from (select coalesce(s.name, i.description) d, sum(i.quantity) u, sum(i.line_total*c.fx_rate_mxn) r
                               from campaign_items i join camp c on c.id = i.campaign_id
                               left join services s on s.id = i.service_id
                              group by 1 order by r desc limit 8) x),
    'crm', jsonb_build_object(
        'new_companies', (select count(*) from companies where created_at::date between from_date and to_date),
        'became_clients', (select count(distinct company_id) from camp where is_closed),
        'by_stage', (select coalesce(jsonb_agg(jsonb_build_object('stage', stage, 'count', n)), '[]')
                       from (select stage, count(*) n from companies group by stage) x)
    ),
    'gifting', jsonb_build_object(
        'received', (select count(*) from gifting where received_at between from_date and to_date),
        'total_in_period', (select count(*) from gifting where created_at::date between from_date and to_date)
    ),
    'monthly_sales', (select coalesce(jsonb_agg(jsonb_build_object('month', m, 'net_mxn', n) order by m), '[]')
                        from (select to_char(date_trunc('month', period_date),'YYYY-MM') m, sum(net_amount*fx_rate_mxn) n from camp group by 1) x)
  ) into result;
  return result;
end $$;
grant execute on function report_summary(date,date) to authenticated;
```

`supabase/migrations/0004_storage.sql`
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('facturas', 'facturas', false, 10485760, array['application/pdf','application/xml','text/xml','image/png','image/jpeg','image/svg+xml'])
on conflict (id) do nothing;

create policy "facturas_auth_read"   on storage.objects for select to authenticated using (bucket_id = 'facturas');
create policy "facturas_auth_insert" on storage.objects for insert to authenticated with check (bucket_id = 'facturas');
create policy "facturas_auth_update" on storage.objects for update to authenticated using (bucket_id = 'facturas');
create policy "facturas_auth_delete" on storage.objects for delete to authenticated using (bucket_id = 'facturas');
```

### Datos semilla
`supabase/seed.sql` — se ejecuta con `pnpm db:seed` (`supabase db query --linked --file supabase/seed.sql`). Debe insertar:

- `settings`: fila 1 con `commission_pct = 20`, `brand_name = 'Camila Rendón'`, `brand_email = 'ana@ejemplo.com'`, `quote_footer = 'Precios antes de impuestos. Cotización válida 15 días.'` y los 5 presets del formato de arriba.
- `campaign_statuses` (4): En aprobación (`#C08A2E`, default), Pendiente de ejecutar (`#6B2D4F`), Ejecutada (`#3E7C5A`, is_closed), Cancelada (`#8B8079`, is_closed).
- `services` (7): Reel Instagram 18 000 MXN · TikTok 15 000 MXN · Story Instagram (set de 3) 6 000 MXN · Carrusel 12 000 MXN · Reel + pauta 25 000 MXN (paid_media_default) · Colaboración (post en colab) 20 000 MXN · Asistencia a evento 30 000 MXN.
- `companies` (6): 2 clientes, 2 negociando, 2 prospectos, con industria (belleza, moda, fintech, bebidas, viajes, tecnología). Cada una con 1–2 `contacts` (uno `is_primary`).
- `campaigns` (8), repartidas en los últimos 4 meses y 2 futuras: 5 MXN, 2 USD (`fx_rate_mxn = 18.20`), 1 COP (`fx_rate_mxn = 0.0045`); mezcla de estatus; 3 con `contract_signed`, 2 con `commission_paid`. Cada una con 1–3 `campaign_items`.
- `payment_schedules`: generadas para cada campaña según presets (algunas 100 % a 30 días, una 50/50, una a 90), con al menos 2 pagadas, 3 pendientes futuras y **1 vencida** (para que Inicio muestre el estado rojo).
- `quotes` (2) con `items_snapshot` de sus campañas.
- `gifting` (4): uno por cada estatus salvo declinado.
- Usuaria: crear `ana@ejemplo.com` con contraseña temporal desde el dashboard de Supabase (Authentication → Users → Add user, "Auto confirm"). El seed no crea usuarios de auth.

---

## 5. Diseño de la capa de datos (API)

No hay servidor propio. La "API" son módulos en `src/lib/api/*.ts` que envuelven a `supabase-js`. Cada módulo exporta funciones puras async con esta firma y TanStack Query las consume.

### Operaciones

| Módulo | Función | Hace | Auth |
|--------|---------|------|------|
| settings | `getSettings()` / `updateSettings(patch)` | lee/actualiza fila 1 | sesión |
| companies | `listCompanies({stage?, q?})` / `getCompany(id)` / `createCompany` / `updateCompany` / `deleteCompany` | CRUD marcas; `getCompany` trae contactos, campañas y gifting | sesión |
| contacts | `createContact` / `updateContact` / `deleteContact` | CRUD; al marcar `is_primary` desmarca los demás de la marca | sesión |
| services | `listServices({activeOnly})` / `createService` / `updateService` / `reorderServices(ids)` | catálogo de tarifas | sesión |
| statuses | `listStatuses()` / `createStatus` / `updateStatus` / `deleteStatus(id, reassignTo)` | estatus personalizados; borrar reasigna campañas | sesión |
| campaigns | `listCampaigns({statusId?, companyId?, currency?, q?})` / `getCampaign(id)` / `createCampaign(input)` / `updateCampaign` / `deleteCampaign` | `getCampaign` incluye items, pagos, facturas, cotizaciones. `createCampaign` copia `commission_pct` de settings y asigna el estatus default | sesión |
| campaignItems | `replaceItems(campaignId, items[])` | borra e inserta el desglose completo en una sola llamada (trigger recalcula bruto) | sesión |
| payments | `listPayments({from, to, status?})` / `replacePlan(campaignId, rows[])` / `updatePayment(id, patch)` | calendario global y plan por campaña; `updatePayment` pone `paid_at` al marcar pagado | sesión |
| invoices | `uploadInvoice(campaignId, file)` / `getSignedUrl(path)` / `deleteInvoice(id)` | sube a `facturas/campaigns/<id>/` y registra fila; URL firmada 60 min | sesión |
| quotes | `createQuote(campaignId, {termsKey, notes})` / `listQuotes(campaignId)` | llama `next_quote_folio()`, congela items, devuelve la fila para renderizar PDF | sesión |
| gifting | `listGifting({status?})` / `createGifting` / `updateGifting` / `deleteGifting` | CRUD | sesión |
| reports | `getReportSummary(from, to)` / `saveReport(input)` / `listReports()` | RPC `report_summary`; guarda snapshot | sesión |

### Detalle de las operaciones críticas

**`createCampaign(input)`**
- Entrada (Zod `campaignSchema`): `company_id` uuid, `contact_id?`, `name` 2–120 chars, `currency` enum, `fx_rate_mxn` > 0 (obligatorio 1 si MXN), `status_id?`, `content_due_date?`, `publish_date?`, `signed_at?`, `contract_signed`, `brief?`, `notes?`, `items: CampaignItemInput[]` (mín. 0), `plan: {presetKey | rows[]}`.
- Flujo: inserta campaña con `commission_pct = settings.commission_pct` y `status_id = default` → `replaceItems` → si hay preset, `generatePaymentPlan(preset, signed_at ?? today, gross)` → `replacePlan`. Devuelve `getCampaign(id)`.
- Errores: marca inexistente → `NOT_FOUND`; suma de porcentajes del preset ≠ 100 → `VALIDATION`.

**`generatePaymentPlan(preset, baseDate, total)`** (función pura en `lib/paymentPlan.ts`)
- Devuelve filas `{ due_date, amount, sort_order }`. `due_date = addDays(baseDate, part.days)`. Los montos se redondean a 2 decimales y **la última fila absorbe la diferencia** para que la suma sea exactamente `total`.
- Regenerar el plan nunca borra pagos ya marcados `pagado`: la UI advierte y solo reemplaza filas no pagadas.

**`report_summary(from, to)`**
- Entrada: dos fechas; la UI las obtiene de `lib/periods.ts` (`monthRange(y,m)`, `quarterRange(y,q)`, `previousRange(range)`).
- Salida: el jsonb del §4 tipado como `ReportSummary` en `types/index.ts`. La página pide el periodo actual y el anterior para mostrar deltas.

**`uploadInvoice(campaignId, file)`**
- Acepta `.pdf` y `.xml` hasta 10 MB; `kind` se infiere de la extensión. Ruta: `campaigns/<campaignId>/<crypto.randomUUID()>.<ext>`. Si falla el insert en `invoices`, borra el objeto subido.

### Contratos globales
- **Éxito:** las funciones devuelven el dato tipado directamente (`Promise<Campaign>`).
- **Error:** lanzan `AppError { code: 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'AUTH' | 'STORAGE' | 'UNKNOWN', message: string (en español, para mostrar en toast), cause? }`. Un helper `fromSupabaseError(e)` mapea códigos Postgres (23505 → CONFLICT, PGRST116 → NOT_FOUND, 401/403 → AUTH).
- **Validación:** todo input pasa por su esquema Zod en `lib/schemas/*` antes de tocar Supabase; los formularios usan el mismo esquema con `zodResolver`.
- **Dinero:** nunca `float` en cálculos de negocio; usar `Number` solo para mostrar, y redondear con `Math.round(x*100)/100` en `lib/money.ts`.
- **Invalidación:** cada mutación invalida sus `queryKey` (`['campaigns']`, `['campaign', id]`, `['payments']`, `['report']`…).
- **Registro:** errores a `console.error` con el `code`; sin servicio externo (costo cero).

---

## 6. Arquitectura Frontend

### Páginas / rutas
| Ruta | Página | Qué ve Ana |
|------|--------|-----------|
| `/login` | LoginPage | Correo + contraseña. Enlace "Olvidé mi contraseña" → `resetPasswordForEmail`. |
| `/` | HomePage | **Línea de cobros** (próximos 90 días), tarjetas: cobros vencidos, por cobrar este mes, comisiones pendientes; listas: entregas próximas (content_due_date ≤ 14 días), publicaciones próximas, campañas en aprobación. |
| `/campanas` | CampaignsPage | Tabla: marca, campaña, estatus, moneda, bruto, neto, publicación, contrato, comisión pagada. Filtros por estatus, marca, moneda y búsqueda. Botón "Nueva campaña". |
| `/campanas/nueva` | CampaignNewPage | Formulario en 3 bloques: Marca y datos · Servicios (desglose con totales en vivo) · Plan de pagos (preset o manual). |
| `/campanas/:id` | CampaignDetailPage | Encabezado con nombre, marca, estatus editable inline, totales, comisión. Pestañas: Resumen (brief, notas, fechas, checkboxes producido / contrato / comisión pagada) · Servicios · Pagos · Facturas · Cotización. |
| `/cobros` | PaymentsPage | Calendario mensual con montos por día + lista filtrable (pendiente, en proceso, pagado, vencido). Cambiar estatus desde la fila. |
| `/marcas` | CompaniesPage | Tabla por etapa (prospecto / negociando / cliente), búsqueda. |
| `/marcas/:id` | CompanyDetailPage | Datos, contactos (CRUD inline), campañas de la marca, gifting de la marca. |
| `/gifting` | GiftingPage | Tabla + diálogo de alta/edición. Ligas de rastreo clicables. |
| `/reportes` | ReportsPage | Selector: Mes / Trimestre / Rango + navegación anterior/siguiente. KPIs con delta vs periodo anterior. 3 gráficas. Tablas top marcas y top servicios. Botones: Exportar PDF, Exportar CSV, Guardar reporte. Lista de reportes guardados. |
| `/configuracion` | SettingsPage | Pestañas: Tarifas (catálogo reordenable) · Estatus · Comisión y moneda · Plazos de pago (presets) · Marca del PDF (nombre, handle, correo, logo, pie). |

### Jerarquía de componentes (3 páginas clave)
```
HomePage
├─ PageHeader ("Hola, Ana" + fecha)
├─ PaymentTimeline            ← hero: eje horizontal de 90 días; cada cobro es un punto con monto y marca; agrupado por moneda
├─ KpiRow
│  ├─ KpiTile (Vencido, rojo)  KpiTile (Por cobrar este mes)  KpiTile (Comisiones pendientes)
├─ UpcomingList "Entregas de contenido"
├─ UpcomingList "Publicaciones"
└─ CampaignMiniList "En aprobación"

CampaignDetailPage
├─ PageHeader (nombre en Fraunces, marca, StatusBadge editable, botón Cotizar)
├─ TotalsBar (bruto · neto · comisión · moneda + tipo de cambio)
└─ Tabs
   ├─ SummaryTab (CampaignForm parcial + checkboxes)
   ├─ ServicesTab (CampaignItemsEditor)
   ├─ PaymentsTab (PaymentPlanGenerator + tabla de pagos con estatus)
   ├─ InvoicesTab (InvoiceUploader + lista con abrir/descargar/eliminar)
   └─ QuoteTab (lista de cotizaciones + "Nueva cotización" → PDFViewer de QuotePdf + Descargar / Compartir)

ReportsPage
├─ PeriodPicker (segmentado Mes | Trimestre | Rango; flechas ‹ ›)
├─ KpiGrid (ventas netas, brutas, cobrado, pendiente, vencido, comisiones, campañas, ticket promedio — cada uno con delta)
├─ ReportCharts
│  ├─ BarChart ventas netas por mes
│  ├─ StackedBar cobrado vs pendiente vs vencido
│  └─ HorizontalBar ventas por marca (top 5)
├─ DataTable top servicios
├─ DataTable campañas del periodo
├─ ActionBar (Exportar PDF · Exportar CSV · Guardar reporte)
└─ SavedReportsList
```

### Manejo de estado
- **Servidor → cliente:** TanStack Query. `staleTime` 30 s. Sin realtime (una usuaria).
- **Formularios:** React Hook Form + Zod; el desglose de servicios usa `useFieldArray` y calcula totales con `useWatch`.
- **UI:** estado local con `useState`; filtros de tablas en la URL con `useSearchParams`.
- **Sesión:** `AuthProvider` escucha `onAuthStateChange`; `RequireAuth` redirige a `/login` guardando `returnTo`.
- **PDF:** `@react-pdf/renderer` genera el blob en el cliente; `downloadPdf.ts` usa `navigator.share` si está disponible (móvil) y si no, descarga.

---

## 7. Sistema de Diseño

Dirección: **editorial / lifestyle**. Cálido pero no "crema con terracota"; el acento es mora profunda y el verde salvia hace de contrapeso. La personalidad la lleva la tipografía serif en nombres de campañas y marcas; los datos van en sans con cifras tabulares. Un solo elemento memorable: la Línea de cobros del Inicio.

### Colores
| Rol | Hex | Uso |
|-----|-----|-----|
| Fondo | `#F7F2EC` | fondo de página |
| Superficie | `#FFFFFF` | paneles, tablas, diálogos |
| Superficie 2 | `#EFE7DE` | filas alternas, hover, fondos de pestaña |
| Tinta | `#2A2320` | texto principal |
| Apagado | `#8B8079` | texto secundario, bordes (`#E3D9CE` para líneas) |
| Primario (mora) | `#6B2D4F` | botones principales, enlaces, pestaña activa, foco |
| Primario hover | `#55233F` | |
| Secundario (salvia) | `#7E9276` | acentos suaves, gráfica secundaria |
| Pendiente | `#C08A2E` | estatus pendiente / en aprobación |
| Pagado / éxito | `#3E7C5A` | confirmaciones, pagos hechos |
| Vencido / error | `#B4433B` | pagos vencidos, errores, eliminar |
| Información | `#3F5F8A` | estatus "en proceso" |

Estatus de pago: pendiente → ámbar, en proceso → azul, pagado → verde, vencido → rojo (calculado).

### Tipografía
| Rol | Fuente | Tamaño | Peso |
|-----|--------|--------|------|
| Título de página (h1) | Fraunces, `opsz` auto | 32 px / 1.15 | 500 |
| Nombre de campaña o marca (h2) | Fraunces | 24 px / 1.2 | 500 |
| Sección (h3) | Instrument Sans | 16 px / 1.4 | 600 |
| Cuerpo | Instrument Sans | 15 px / 1.55 | 400 |
| Tabla y cifras | Instrument Sans, `font-variant-numeric: tabular-nums` | 14 px | 400 / 600 en totales |
| Pie / ayuda | Instrument Sans | 13 px | 400 |

Reglas: sin mayúsculas sostenidas en etiquetas; sin monospace; sin colorear una sola palabra del título; los importes grandes del Inicio pueden ir en Fraunces 40 px con `tabular-nums`.

Fuentes servidas desde `public/fonts/` (woff2) y registradas también en `pdf/theme.ts` con `Font.register` para que el PDF use las mismas familias.

### Espaciado y layout
- Escala: 4 px base — 4, 8, 12, 16, 24, 32, 48, 64.
- Radios: 6 px controles, 10 px paneles, 999 px en badges.
- Sombras: ninguna en paneles (borde `#E3D9CE` de 1 px); solo el diálogo lleva `0 12px 32px rgba(42,35,32,.12)`.
- Sidebar fija de 232 px en ≥ 1024 px; en móvil se vuelve barra inferior con 5 destinos (Inicio, Campañas, Cobros, Marcas, Más).
- Contenido alineado a la izquierda, ancho máximo 1200 px, padding 24 px (16 px en móvil).
- Breakpoints Tailwind por defecto (sm 640, md 768, lg 1024, xl 1280).

### Estilo de componentes
- Botón primario: fondo mora, texto blanco, radio 6, sin sombra; secundario: borde `#E3D9CE`, texto tinta; destructivo: texto rojo con borde.
- Tablas: encabezado en Superficie 2, filas separadas por líneas de 1 px, cifras alineadas a la derecha.
- Badges de estatus: fondo del color al 12 % de opacidad, texto del color, punto sólido a la izquierda.
- Movimiento: solo el que responde a una acción (abrir diálogo, expandir fila, confirmar). Respetar `prefers-reduced-motion`. Sin animaciones de entrada por sección.
- Estados vacíos: una frase que indica qué hacer + botón ("Aún no hay campañas. Crea la primera.").
- Foco visible: anillo de 2 px mora sobre fondo.

### PDF de cotización (`QuotePdf.tsx`)
Carta, márgenes 48 pt. Cabecera: nombre de la marca (Fraunces 26 pt) y handle a la izquierda, logo a la derecha si existe; folio y fechas bajo la cabecera. Bloque "Para:" con marca y contacto. Tabla: servicio, descripción, cantidad, precio, total; filas con "con pauta" / "en colaboración" como nota bajo la descripción. Total en Fraunces 18 pt alineado a la derecha con la moneda. Condiciones de pago (texto del preset) y pie con `quote_footer` y contacto de Ana. Colores: tinta, mora para líneas finas, salvia para el fondo del total.

### PDF de reporte (`ReportPdf.tsx`)
Misma cabecera. Título "Resultados · Septiembre 2026". Página 1: grid de 8 KPIs (valor grande en Fraunces, etiqueta debajo, delta con flecha y color). Página 2: tablas de campañas del periodo, top marcas y top servicios. Las gráficas no se dibujan en el PDF (react-pdf no renderiza Recharts); en su lugar tabla "Ventas por mes".

---

## 8. Autenticación y Autorización

### Flujo
1. Ana abre la app → `RequireAuth` consulta `supabase.auth.getSession()`.
2. Sin sesión → `/login`. Ingresa correo y contraseña → `signInWithPassword`.
3. Con sesión → redirige a `returnTo` o `/`.
4. "Olvidé mi contraseña" → `resetPasswordForEmail(email, { redirectTo: <APP_URL>/login })`; el enlace del correo vuelve a la app con `type=recovery` y la LoginPage muestra el formulario de nueva contraseña (`updateUser({password})`).
5. Cerrar sesión desde el menú del header.

### Configuración obligatoria en Supabase (Authentication → Settings)
- **Deshabilitar "Allow new users to sign up"**. Solo existe la usuaria creada a mano.
- Site URL y Redirect URLs: la URL de GitHub Pages.
- Proveedor: solo Email. Confirmación de correo puede quedar activada (la usuaria se crea con auto-confirm).

### Rutas protegidas
Todas menos `/login`. `App.tsx` envuelve el `AppShell` en `RequireAuth`.

### Roles y permisos
| Rol | Puede |
|-----|-------|
| Usuaria autenticada (Ana) | Todo. No hay más roles. |

Si en el futuro entra Camila en solo lectura, agregar tabla `profiles(role)` y políticas RLS por rol; el diseño actual no lo bloquea.

### Sesión
Supabase gestiona JWT + refresh token en `localStorage` (`persistSession: true`, `autoRefreshToken: true`). Al expirar el refresh, `onAuthStateChange` emite `SIGNED_OUT` y la app vuelve a `/login`.

---

## 9. Orden de Construcción

Cada paso termina con un criterio verificable. No avanzar sin cumplirlo.

**Paso 1: Scaffold**
```bash
pnpm create vite camila-rendon-os --template react-ts
cd camila-rendon-os && pnpm install
pnpm add tailwindcss @tailwindcss/vite
pnpm dlx shadcn@latest init        # estilo New York, CSS variables, alias @/
pnpm add react-router @tanstack/react-query @supabase/supabase-js react-hook-form @hookform/resolvers zod date-fns date-fns-tz lucide-react @react-pdf/renderer recharts @tanstack/react-table
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```
Configurar alias `@/` en `vite.config.ts` y `tsconfig.json`; `index.css` con `@import "tailwindcss"` y el bloque `@theme` con todos los tokens del §7; copiar woff2 de Fraunces e Instrument Sans a `public/fonts/` con `@font-face`. Añadir scripts a `package.json`: `dev`, `build` (incluye `cp dist/index.html dist/404.html`), `preview`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:types`. Crear `.env.example` y `CLAUDE.md` (§15).
✓ Listo cuando: `pnpm dev` sirve una página con el fondo `#F7F2EC` y un título en Fraunces sin errores en consola; `pnpm build` produce `dist/404.html`.

**Paso 2: Supabase — esquema, funciones, storage, seed**
Crear el proyecto `camila-rendon-os` (región `us-east-1` o la más cercana a México). Guardar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env.local`. Escribir las 4 migraciones del §4 y `seed.sql`. `supabase init` + `supabase link --project-ref <ref>`; aplicar con `supabase db push` (o `supabase db query --linked --file`). Ejecutar seed. Crear la usuaria Ana en Authentication → Users con auto-confirm. Deshabilitar sign-ups. Generar tipos: `supabase gen types typescript --linked > src/types/database.ts`.
✓ Listo cuando: `select count(*) from campaigns` devuelve 8; `select report_summary('2026-06-01','2026-09-30')` devuelve un jsonb con `sales.net_mxn > 0`; `select ping()` devuelve `ok`; el bucket `facturas` existe y es privado.

**Paso 3: Auth + shell**
`lib/supabase.ts`, `lib/auth.tsx` (AuthProvider, useSession, RequireAuth), `LoginPage` con recuperación de contraseña, `AppShell` con `Sidebar` (Inicio, Campañas, Cobros, Marcas, Gifting, Reportes, Configuración) y `PageHeader`; barra inferior en móvil. Rutas en `App.tsx` con páginas placeholder.
✓ Listo cuando: sin sesión, `/campanas` redirige a `/login`; con la cuenta de Ana entra y ve la sidebar; cerrar sesión vuelve al login; en 375 px de ancho aparece la barra inferior.

**Paso 4: Configuración**
`api/settings.ts`, `api/services.ts`, `api/statuses.ts` y `SettingsPage` con 5 pestañas. Tarifas: tabla editable con activar/desactivar y reordenar. Estatus: crear/editar/borrar con reasignación y un solo default. Comisión y moneda. Plazos: editor de presets (cada parte con % y días; validar suma 100). Marca del PDF: campos + subida de logo a `facturas/brand/logo.<ext>`.
✓ Listo cuando: cambiar el % de comisión a 25 y recargar lo conserva; crear el estatus "Pausada" aparece al instante en la lista; un preset cuyos porcentajes no suman 100 no se guarda y muestra el error.

**Paso 5: CRM — marcas y contactos**
`api/companies.ts`, `api/contacts.ts`, `CompaniesPage` (tabla con filtro por etapa y búsqueda), `CompanyDetailPage` (datos editables, contactos CRUD inline con contacto principal, listas de campañas y gifting de la marca), `CompanyForm`, `ContactForm`.
✓ Listo cuando: crear la marca "Prueba" con un contacto principal y cambiar su etapa a "cliente" persiste; borrar una marca con campañas muestra error legible (restrict) en vez de romper.

**Paso 6: Campañas — CRUD y desglose de servicios**
`api/campaigns.ts`, `api/campaignItems.ts`, esquemas Zod, `CampaignsPage` con filtros en URL, `CampaignNewPage`, `CampaignDetailPage` con pestañas Resumen y Servicios, `CampaignItemsEditor` (agregar desde catálogo con precio precargado o línea libre; cantidad, precio, pauta, colab; totales en vivo). Selector de moneda con campo de tipo de cambio (oculto y = 1 si MXN). Cambio de estatus inline en el encabezado.
✓ Listo cuando: crear una campaña USD con 2 Reels a 1 000 USD y `fx 18.20` muestra bruto 2 000 USD, neto 2 000 (editable), comisión 400 USD; editar la cantidad a 3 actualiza el bruto a 3 000 tras guardar; `pnpm test` pasa `money.test.ts` y `commission.test.ts`.

**Paso 7: Plan de pagos**
`lib/paymentPlan.ts` (pura, con tests), `api/payments.ts`, `PaymentPlanGenerator` (elegir preset + fecha base → filas editables; o manual), tabla de pagos en `PaymentsTab` con estatus cambiable y `paid_at` automático. Regenerar plan respeta pagos ya pagados con confirmación.
✓ Listo cuando: preset 50/50 sobre 2 000 USD con fecha base 1-oct genera 1 000 el 1-oct y 1 000 el 31-oct; total 1 001 con preset 50/50 genera 500.50 y 500.50; total 1 000 a tres partes iguales genera 333.33 / 333.33 / 333.34; `paymentPlan.test.ts` pasa; marcar una fila como pagada guarda `paid_at = hoy`.

**Paso 8: Inicio — Línea de cobros y KPIs**
`HomePage`, `PaymentTimeline` (eje horizontal hoy → +90 días; marcas de semanas; puntos por cobro con monto, marca y color por estatus; agrupación por moneda en filas; scroll horizontal en móvil), `KpiRow`, listas de entregas y publicaciones próximas, campañas en aprobación.
✓ Listo cuando: con el seed, el Inicio muestra el pago vencido en rojo, la suma "por cobrar este mes" coincide con la suma manual de `payment_schedules` del mes, y la timeline es legible en 375 px.

**Paso 9: Facturas, contrato y comisión pagada**
`api/invoices.ts`, `InvoiceUploader` (arrastrar o elegir; PDF y XML; barra de progreso), lista con abrir en nueva pestaña (URL firmada), descargar y eliminar. En Resumen: checkboxes `contract_signed`, `produced`, `commission_paid` (al marcar, `commission_paid_at = hoy`).
✓ Listo cuando: subir un PDF y un XML a una campaña muestra 2 filas y el PDF abre desde la URL firmada; eliminar borra el objeto en Storage y la fila; un archivo `.docx` es rechazado con mensaje.

**Paso 10: Cotizador PDF**
`pdf/theme.ts` (registrar fuentes), `pdf/QuotePdf.tsx`, `pdf/downloadPdf.ts`, `api/quotes.ts`, `QuoteTab` con "Nueva cotización" (elige preset de pago y notas → crea fila con folio → muestra `PDFViewer` → Descargar / Compartir). Lista de cotizaciones anteriores re-renderizables desde `items_snapshot`.
✓ Listo cuando: crear una cotización genera folio `COT-2026-001`, el PDF muestra cabecera con "Camila Rendón" en Fraunces, tabla de servicios, total y condiciones; una segunda cotización obtiene `-002`; editar los items de la campaña después no cambia el PDF de la cotización anterior.

**Paso 11: Gifting**
`api/gifting.ts`, `GiftingPage` con tabla (empresa, productos, estatus, recibido, ligas), `GiftingForm` en diálogo con `tracking_links` como lista de URLs y vínculo opcional a una marca del CRM.
✓ Listo cuando: crear un gifting con 2 ligas de rastreo las muestra clicables; cambiar estatus a "recibido" pide/guarda fecha; el gifting ligado a una marca aparece en `CompanyDetailPage`.

**Paso 12: Cobros (calendario)**
`PaymentsPage`: vista mensual (grid de días con el total del día y puntos por moneda) + lista filtrable por estatus incluyendo "vencido"; navegación de mes; clic en un pago abre la campaña.
✓ Listo cuando: el mes actual muestra los pagos del seed en sus días; el filtro "vencido" lista exactamente los `status <> 'pagado'` con fecha pasada; cambiar un estatus desde la lista refresca Inicio sin recargar.

**Paso 13: Reportes**
`lib/periods.ts` (con tests), `api/reports.ts`, `ReportsPage`, `PeriodPicker`, `KpiGrid` con deltas vs periodo anterior, `ReportCharts` (3 gráficas Recharts con los colores del §7), tablas top marcas / top servicios / campañas del periodo, `lib/csv.ts` (exporta la tabla de campañas del periodo con columnas: marca, campaña, estatus, moneda, bruto, neto, neto MXN, comisión, comisión pagada, publicación), `pdf/ReportPdf.tsx`, "Guardar reporte" → `reports` + `SavedReportsList` (abrir reabre el snapshot sin recalcular).
✓ Listo cuando: seleccionar "Trimestre · Q3 2026" muestra `sales.net_mxn` igual al resultado del RPC ejecutado a mano en SQL; el delta contra Q2 tiene signo correcto; Exportar CSV descarga un archivo que abre en Excel con acentos correctos (BOM UTF-8); Exportar PDF produce 2 páginas; Guardar reporte crea una fila y reabrirla muestra los mismos números aunque se edite una campaña después; `periods.test.ts` pasa.

**Paso 14: Pulido**
Estados vacíos en todas las tablas, esqueletos de carga, toasts de éxito/error en español, confirmaciones antes de borrar, foco visible, `prefers-reduced-motion`, revisión en 375 px y 1280 px, `title` por página, favicon.
✓ Listo cuando: con una base vacía (sin seed) cada página muestra su estado vacío con acción; Lighthouse accesibilidad ≥ 90 en Inicio y Campañas; `pnpm lint` y `pnpm build` sin errores; `pnpm test:e2e` pasa `smoke.spec.ts`.

**Paso 15: Deploy + keep-alive**
`deploy.yml`: en push a `main`, `pnpm install --frozen-lockfile`, `pnpm build` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` desde GitHub Secrets, publicar `dist/` con `actions/deploy-pages`. Configurar `base` en `vite.config.ts` si el sitio va bajo `/camila-rendon-os/` (o usar dominio propio). `keepalive.yml`: `schedule: cron '0 12 */3 * *'` + `workflow_dispatch`; paso `curl -f "$SUPABASE_URL/rest/v1/rpc/ping" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -X POST -d '{}'`. Registrar la URL de Pages en Supabase Auth (Site URL + Redirect). Commit de `.env.example`.
✓ Listo cuando: la URL de GitHub Pages carga la app, el login funciona y una recarga en `/campanas` no da 404; el workflow keep-alive ejecutado a mano termina en verde y aparece la llamada en los logs de la API de Supabase.

---

## 10. Setup del Entorno

### Prerrequisitos
- Node.js 22 LTS, pnpm 9+
- Supabase CLI (`brew install supabase/tap/supabase`) con sesión iniciada en la cuenta personal de Abraham
- Cuenta GitHub `abrahamreachmx` con Pages habilitado en el repo
- Fuentes: descargar Fraunces e Instrument Sans (Google Fonts, licencia OFL) en woff2

### Variables de entorno
| Variable | Descripción | Dónde se obtiene | Qué bloquea si falta |
|----------|-------------|------------------|----------------------|
| `VITE_SUPABASE_URL` | URL del proyecto | Supabase → Project Settings → API | Toda la app (muestra pantalla "Configura Supabase" en vez de romper) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | clave pública `sb_publishable_…` | mismo lugar | Igual que arriba |
| `VITE_APP_URL` | URL pública (GitHub Pages) | tú la defines | Solo el enlace de recuperación de contraseña |
| `SUPABASE_PROJECT_REF` (solo CLI/CI) | ref del proyecto | URL del dashboard | `db:migrate`, `db:types` |
| `SUPABASE_ACCESS_TOKEN` (solo CI, opcional) | PAT para CLI en Actions | Supabase → Account → Access Tokens | Migraciones desde CI (no necesarias para deploy) |

### Protocolo de secretos
- Commitear `.env.example` con placeholders para todas las variables anteriores.
- El constructor **no se detiene** si faltan claves reales: `lib/supabase.ts` detecta placeholders y la app muestra una pantalla con los pasos para configurarlas; el resto compila.
- Nunca commitear `.env.local`. En GitHub, guardar las dos `VITE_*` como Repository Secrets para el build y la publishable key también para keep-alive.
- La publishable key es pública por diseño; la seguridad la dan RLS y el sign-up deshabilitado. **Nunca** usar la `sb_secret_` en el frontend ni en Actions.

### Comandos iniciales
```bash
git clone git@github.com:abrahamreachmx/camila-rendon-os.git && cd camila-rendon-os
pnpm install
cp .env.example .env.local        # pegar URL y publishable key
supabase init && supabase link --project-ref <ref>
pnpm db:migrate                   # supabase db push
pnpm db:seed                      # supabase db query --linked --file supabase/seed.sql
pnpm db:types                     # supabase gen types typescript --linked > src/types/database.ts
pnpm dev
```

---

## 11. Dependencias

### Producción
| Paquete | Propósito |
|---------|-----------|
| react, react-dom (19) | UI |
| react-router (7) | ruteo SPA |
| @supabase/supabase-js | datos, auth, storage |
| @tanstack/react-query | caché de datos y mutaciones |
| @tanstack/react-table | tabla genérica con orden y filtro |
| react-hook-form, @hookform/resolvers, zod | formularios y validación |
| date-fns, date-fns-tz | fechas, generador de plan de pagos, periodos |
| @react-pdf/renderer | PDF de cotización y reporte |
| recharts | gráficas de Reportes |
| lucide-react | iconos |
| tailwindcss, @tailwindcss/vite | estilos |
| class-variance-authority, clsx, tailwind-merge, radix-ui primitives | requeridos por shadcn/ui |

### Desarrollo
| Paquete | Propósito |
|---------|-----------|
| vite, @vitejs/plugin-react, typescript | build |
| vitest, @testing-library/react, @testing-library/jest-dom, jsdom | pruebas unitarias |
| @playwright/test | smoke E2E |
| eslint, typescript-eslint, eslint-plugin-react-hooks | lint |
| supabase (CLI, global) | migraciones, tipos, seed |

---

## 12. Estrategia de Despliegue

### Hosting
GitHub Pages desde GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`). Sitio estático; sin funciones. Costo $0.

### CI/CD
- Push a `main` → lint + test + build + deploy a Pages.
- Pull requests → lint + test (sin preview; GitHub Pages solo publica una rama). Para revisar visualmente, `pnpm preview` local.
- `keepalive.yml` cada 3 días llama `ping()`; si Supabase pausa el proyecto de todos modos, se reactiva desde el dashboard en un clic (los datos no se pierden).

### Dominio
Por defecto `https://abrahamreachmx.github.io/camila-rendon-os/` (`base: '/camila-rendon-os/'` en Vite). Si se quiere `os.camilarendon.com`: CNAME en DNS → `abrahamreachmx.github.io`, archivo `public/CNAME`, `base: '/'`, y actualizar Site URL en Supabase Auth.

### Entornos
| Entorno | Frontend | Base de datos |
|---------|----------|---------------|
| Desarrollo | `pnpm dev` local | el mismo proyecto Supabase (una usuaria; sin datos sensibles de terceros) |
| Producción | GitHub Pages | mismo proyecto |

Respaldo: Supabase Free no incluye backups automáticos. Añadir al `keepalive.yml` un paso mensual opcional que exporte CSV de `campaigns`, `payment_schedules` e `invoices` con `supabase db dump --data-only` y lo guarde como artifact del workflow (90 días de retención). Alternativa manual: botón "Exportar todo (CSV)" en Configuración.

---

## 13. Estrategia de Pruebas

### Unitarias (Vitest) — obligatorias
- `money.test.ts`: `formatMoney` para MXN/USD/COP, `toMxn`, redondeo a 2 decimales.
- `commission.test.ts`: `calcCommission(net, pct)` con 0, decimales y redondeo.
- `paymentPlan.test.ts`: presets contado/30/60/90/50-50, absorción de centavos en la última fila, fechas con `addDays`, error si los % no suman 100.
- `periods.test.ts`: rango de mes, de trimestre, periodo anterior (incluye cambio de año), rango personalizado.
- `csv.test.ts`: escape de comas y comillas, BOM UTF-8.

### Integración
No se prueban componentes con base real; las funciones `api/*` son envoltorios delgados y se verifican con el E2E.

### E2E (Playwright) — un solo smoke
`smoke.spec.ts` contra `pnpm dev` con el seed: login con Ana → crear campaña "E2E" para una marca existente con 1 servicio → generar plan 50/50 → verificar que Inicio muestra los 2 cobros → eliminar la campaña. Corre en CI antes del deploy. Credenciales de prueba en GitHub Secrets (`E2E_EMAIL`, `E2E_PASSWORD`).

---

## 14. Skills a Usar Durante la Construcción

> Todos los skills son **aceleradores opcionales**. El constructor revisa su lista de skills disponibles; si alguno no está, aplica el fallback y sigue.

| Capacidad | Skill si existe | Cuándo | Fallback si falta |
|-----------|-----------------|--------|-------------------|
| UI de calidad producción | `frontend-design` (`frontend-design:frontend-design`) | Pasos 3, 8, 10, 13, 14 | Construir a mano siguiendo el §7 al pie de la letra |
| Componentes shadcn | `vercel:shadcn` | Paso 1 y cada vez que se agrega un componente | `pnpm dlx shadcn@latest add <componente>` + docs |
| Documentación actual de librerías | `context7` MCP | React Router 7, TanStack Query v5, @react-pdf/renderer, Tailwind v4 | `WebFetch` a la documentación oficial |
| Migraciones Supabase | `supabase` MCP o CLI | Paso 2 | CLI `supabase db push` / SQL Editor del dashboard |
| Gráficas | `dataviz` | Paso 13 | Recharts con los colores del §7, sin gradientes |
| Pruebas E2E | — | Paso 14 | Playwright directo (`pnpm create playwright`) |
| Generación de PDF | — | Pasos 10 y 13 | `@react-pdf/renderer` según §7 |

---

## 15. CLAUDE.md para el Proyecto Destino

```markdown
# Camila Rendón OS

Sistema privado de Ana (manager de Camila Rendón) para campañas con marcas, cobros, comisiones, facturas, gifting, cotizaciones PDF y reportes mensuales. Una sola usuaria. Costo $0: SPA en GitHub Pages + Supabase Free.

## Comandos

- `pnpm dev` — servidor de desarrollo
- `pnpm build` — build de producción (genera también `dist/404.html`)
- `pnpm preview` — sirve el build
- `pnpm lint` — ESLint
- `pnpm test` — Vitest (funciones puras)
- `pnpm test:e2e` — Playwright smoke (requiere `pnpm dev` y seed)
- `pnpm db:migrate` — `supabase db push`
- `pnpm db:seed` — `supabase db query --linked --file supabase/seed.sql`
- `pnpm db:types` — regenera `src/types/database.ts`

## Stack

Vite 6 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + React Router 7 + TanStack Query + React Hook Form/Zod + Supabase (Postgres, Auth, Storage) + @react-pdf/renderer + Recharts + GitHub Pages.

## Arquitectura

### Directorios
- `src/routes/` — una carpeta por sección; la página vive junto a sus pestañas y componentes específicos
- `src/components/ui/` — primitivas shadcn (no editar a mano salvo tokens)
- `src/components/{layout,data,forms}/` — compartidos
- `src/lib/api/` — único lugar que habla con Supabase; una función por operación
- `src/lib/*.ts` — funciones puras (dinero, plan de pagos, comisión, periodos, CSV) con tests
- `src/lib/schemas/` — esquemas Zod compartidos por formularios y api
- `src/pdf/` — documentos react-pdf y tema
- `supabase/migrations/` — SQL numerado; `supabase/seed.sql`

### Flujo de datos
Componente → hook de TanStack Query → `lib/api/*` → supabase-js → Postgres (RLS: sesión requerida). Mutación → invalida `queryKey`. No hay servidor propio ni edge functions.

### Patrones
- Totales de campaña los calcula el trigger `recalc_campaign_totals`; el cliente solo muestra.
- El plan de pagos se genera en el cliente con `generatePaymentPlan` (pura) y se guarda con `replacePlan`.
- Los reportes son una llamada al RPC `report_summary(from, to)`; el cliente no agrega en JS.
- Los PDF se generan en el navegador; nunca se envían datos a terceros.
- Errores: `AppError { code, message }` con mensaje en español para el toast.

## Reglas de organización

1. Un componente por archivo, máximo 250 líneas; extraer si crece.
2. Alias `@/` para `src/`. Sin barrel files.
3. Estado de filtros en la URL (`useSearchParams`); estado de UI con `useState`; nada global.
4. Todo input pasa por Zod antes de `lib/api`.
5. Dinero: `numeric` en BD, redondeo en `lib/money.ts`; jamás sumar floats sin redondear.
6. Fechas de negocio son `date` (sin hora) en zona `America/Mexico_City`.

## Sistema de diseño

### Colores
Fondo `#F7F2EC` · Superficie `#FFFFFF` · Superficie 2 `#EFE7DE` · Tinta `#2A2320` · Apagado `#8B8079` · Línea `#E3D9CE` · Primario mora `#6B2D4F` (hover `#55233F`) · Secundario salvia `#7E9276` · Pendiente `#C08A2E` · Pagado `#3E7C5A` · Vencido `#B4433B` · Info `#3F5F8A`

### Tipografía
- Títulos y nombres de campaña/marca: Fraunces 500 (32 / 24 px)
- Cuerpo, tablas y cifras: Instrument Sans (15 / 14 px), `tabular-nums` en números
- Sin mayúsculas sostenidas, sin monospace, sin resaltar una sola palabra del título

### Estilo
- Radios 6 px controles / 10 px paneles; paneles con borde de 1 px, sin sombra
- Sidebar 232 px en escritorio; barra inferior en móvil
- Movimiento solo como respuesta a una acción; respetar `prefers-reduced-motion`
- Un elemento memorable: la Línea de cobros del Inicio. Todo lo demás sobrio.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | clave pública `sb_publishable_…` |
| `VITE_APP_URL` | URL pública del sitio (para recuperación de contraseña) |

## Reglas no negociables

1. UI 100 % en español, sentence case, sin emojis; código e identificadores en inglés.
2. Nunca usar la `sb_secret_` en frontend ni en GitHub Actions. Sign-up público siempre deshabilitado.
3. Toda tabla nueva lleva `id uuid`, `created_at`, `updated_at`, RLS habilitada y política `authenticated`.
4. Ninguna dependencia de pago ni servicio con suscripción. Si algo lo requiere, se descarta.
5. Los PDF y los reportes deben poder regenerarse desde su snapshot aunque los datos originales cambien.
6. No hacer commit de `.env*` salvo `.env.example`.
```

---

## 16. Reglas No Negociables

1. **Costo cero.** Ninguna librería, API o servicio de pago. GitHub Pages + Supabase Free únicamente. Si una funcionalidad exigiera pago, se documenta como pendiente y no se construye.
2. **Sin servidor propio.** Toda la lógica vive en el cliente o en SQL (triggers, funciones). Nada de edge functions ni backends externos.
3. **Seguridad por RLS + sign-up deshabilitado.** Nunca exponer la clave secreta. Toda tabla con RLS habilitada y política que exija sesión.
4. **Dinero exacto.** `numeric(14,2)` en BD, redondeo explícito en `lib/money.ts`, la última cuota absorbe centavos. Prohibido sumar floats sin redondear.
5. **Snapshots inmutables.** Cotizaciones y reportes guardados se renderizan desde su `snapshot` jsonb, nunca desde datos vivos.
6. **UI en español, código en inglés.** Textos en sentence case, sin emojis, iconos de lucide.
7. **TypeScript strict, sin `any`.** Tipos de BD generados con `supabase gen types`; tipos de dominio en `types/index.ts`.
8. **Cada paso del §9 se verifica con su criterio "✓ Listo cuando" antes de continuar.** Sin saltarse pasos ni marcar completo lo que no se probó.
9. **Un componente por archivo, máx. 250 líneas.** Funciones de negocio puras y con test en `lib/`.
10. **Diseño según §7 sin desviaciones.** Nada de tarjetas idénticas con sombra gris, gradientes decorativos, eyebrows en mayúsculas ni animaciones de entrada.
11. **Móvil funcional.** Toda pantalla usable en 375 px; la Línea de cobros con scroll horizontal, tablas con columnas prioritarias.
12. **Nunca commitear secretos.** `.env.example` sí; `.env.local` jamás.
