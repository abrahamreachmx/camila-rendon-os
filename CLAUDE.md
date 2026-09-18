# Camila Rendón OS

Sistema privado de Ana (manager de Camila Rendón) para campañas con marcas, cobros, comisiones, facturas, gifting, cotizaciones PDF y reportes mensuales. Una sola usuaria. Costo $0: SPA en GitHub Pages + Supabase Free.

> El diseño completo está en `BLUEPRINT.md` (generado por The Architect). Ante cualquier duda de alcance, modelo de datos o diseño, esa es la fuente de verdad. Este archivo es el resumen operativo.

## Comandos

- `pnpm dev` — servidor de desarrollo
- `pnpm build` — build de producción (genera también `dist/404.html`)
- `pnpm preview` — sirve el build
- `pnpm lint` — oxlint
- `pnpm test` — Vitest (funciones puras)
- `pnpm test:e2e` — Playwright smoke (requiere `pnpm dev` y seed)
- `pnpm db:migrate` — `supabase db push`
- `pnpm db:seed` — `supabase db query --linked --file supabase/seed.sql`
- `pnpm db:types` — regenera `src/types/database.ts`

Los comandos `db:*` necesitan `SUPABASE_DB_PASSWORD` en el entorno (está en `.db-password.local`, fuera de git).

## Stack

Vite 8 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui (base radix) + React Router 8 (modo declarativo) + TanStack Query v5 + React Hook Form/Zod + Supabase (Postgres, Auth, Storage) + @react-pdf/renderer + Recharts + GitHub Pages.

Proyecto Supabase: `camila-rendon-os`, ref `wfuouypnhvkknrxftdxi`, org **Camila Rendon** (separada de Birdie y de Reach).

Desviaciones conscientes respecto al `BLUEPRINT.md`, y por qué:
- **Sin `@tanstack/react-table`.** La v9 es una reescritura (`useTable` + `tableFeatures`); para orden + filtro de texto sale más barato y más corto un `DataTable` propio.
- **Fuentes en dos formatos.** `@react-pdf/renderer` usa fontkit y no lee woff2: `src/fonts/*.woff2` para la web y `src/pdf/fonts/*.ttf` para el PDF. Los TTF son **instancias estáticas** generadas con `fonttools varLib.instancer`; el default del variable de Fraunces es wght=900/opsz=9/WONK=1 y se vería mal.
- **Las fuentes web viven en `src/`, no en `public/`.** En `public/` las URLs quedarían absolutas y romperían bajo el `base` de GitHub Pages.

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
- Errores: `AppError { code, message }` con mensaje en español para el toast (`src/lib/errors.ts`).
- "Vencido" no se guarda: es `status <> 'pagado' and due_date < hoy`, calculado en consulta.

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

En el código son tokens de Tailwind: `canvas`, `surface`, `surface-2`, `ink`, `ink-muted`, `line`, `plum`, `plum-hover`, `sage`, `pending`, `paid`, `overdue`, `info`.

### Tipografía
- Títulos y nombres de campaña/marca: Fraunces 500 (32 / 24 px) — clase `font-heading`
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
