/** Se muestra cuando faltan las llaves de Supabase, en vez de dejar la app en blanco. */
export function ConfigScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col justify-center px-4 py-12">
      <h1 className="font-heading text-[32px] leading-[1.15]">Falta configurar Supabase</h1>
      <p className="mt-3 text-ink-muted">
        La app no encuentra las llaves del proyecto. Para dejarla funcionando:
      </p>
      <ol className="mt-6 space-y-3 text-[15px]">
        <li>
          <span className="font-semibold">1.</span> Copia <code className="rounded-sm bg-surface-2 px-1.5 py-0.5">.env.example</code>{' '}
          a <code className="rounded-sm bg-surface-2 px-1.5 py-0.5">.env.local</code>.
        </li>
        <li>
          <span className="font-semibold">2.</span> En Supabase, entra a tu proyecto → Project Settings → API.
        </li>
        <li>
          <span className="font-semibold">3.</span> Pega ahí la URL del proyecto y la llave publicable
          (<code className="rounded-sm bg-surface-2 px-1.5 py-0.5">sb_publishable_…</code>).
        </li>
        <li>
          <span className="font-semibold">4.</span> Vuelve a levantar el servidor.
        </li>
      </ol>
      <p className="mt-6 text-[13px] text-ink-muted">
        Nunca uses aquí la llave secreta (<code>sb_secret_…</code>): esta app corre en el navegador.
      </p>
    </main>
  )
}
