# Camila Rendón OS

Sistema privado de Ana (manager de Camila Rendón) para campañas con marcas, cobros,
comisiones, facturas, gifting, cotizaciones en PDF y reportes mensuales.

Una sola usuaria, sin roles, costo $0 al mes: SPA estática en GitHub Pages + Supabase Free.

## Arrancar en local

```bash
pnpm install
cp .env.example .env.local        # pegar la URL y la llave publicable de Supabase
pnpm dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | servidor de desarrollo |
| `pnpm build` | build de producción (genera también `dist/404.html`) |
| `pnpm lint` | oxlint |
| `pnpm test` | Vitest sobre las funciones puras (dinero, plan de pagos, periodos, CSV, contraste) |
| `pnpm test:e2e` | Playwright: recorrido completo + accesibilidad de todas las páginas |
| `pnpm db:migrate` | aplica `supabase/migrations/` |
| `pnpm db:seed` | carga los datos demo (re-ejecutable) |
| `pnpm db:types` | regenera `src/types/database.ts` |

Los comandos `db:*` necesitan `SUPABASE_DB_PASSWORD` en el entorno.

## Documentación

- `CLAUDE.md` — resumen operativo: stack, arquitectura, reglas y sistema de diseño.
- `BLUEPRINT.md` — el diseño completo del que salió el proyecto. Fuente de verdad.

## Despliegue

Push a `main` → GitHub Actions corre lint, pruebas y build, y publica `dist/` en GitHub Pages.
Un segundo workflow llama al RPC `ping()` cada 3 días para que Supabase Free no pause el proyecto.

Secretos que espera el repo: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_URL`.
Nunca la llave secreta de Supabase: esta app corre entera en el navegador.

## Quién puede entrar

Dos capas, a propósito:

1. El registro público de Supabase está deshabilitado.
2. Las políticas RLS no se conforman con que haya sesión: exigen que el usuario esté
   en la tabla `app_users`. Si el primer candado se abriera por error, quien se registre
   obtiene sesión pero no ve una sola fila.

Para dar acceso a alguien más, desde el SQL editor de Supabase:

```sql
insert into app_users (user_id, email)
select id, email from auth.users where email = 'persona@ejemplo.com';
```
