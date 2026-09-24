import { expect, test } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

// Nombre único por corrida: si una corrida anterior falló a medias y dejó su
// campaña, la siguiente no debe chocar con ella ni borrar la equivocada.
const CAMPAIGN = `E2E · Campaña de prueba ${Date.now()}`

test.skip(!EMAIL || !PASSWORD, 'Faltan E2E_EMAIL y E2E_PASSWORD')

/**
 * El recorrido que Ana hace de verdad: entrar, capturar una campaña con su
 * plan de cobro, verla aparecer en Inicio y borrarla.
 */
test('login, nueva campaña, plan 50/50 y aparición en Inicio', async ({ page }) => {
  await page.goto('/campanas')

  await expect(
    page.getByRole('heading', { name: 'Falta configurar Supabase' }),
    'La app arrancó sin las llaves de Supabase',
  ).toHaveCount(0)
  await expect(page.locator('#email')).toBeVisible()

  await page.fill('#email', EMAIL)
  await page.fill('#password', PASSWORD)
  await page.click('button[type=submit]')
  await expect(page).toHaveURL(/\/campanas$/)

  // --- alta ---
  await page.click('button:has-text("Nueva campaña")')
  await page.click('#campaign-company')
  await page.locator('div[role=option]').first().click()
  await page.fill('#campaign-name', CAMPAIGN)
  await page.fill('#campaign-signed', isoInDays(3))

  await page.click('#add-service')
  await page.locator('div[role=option]').first().click()
  await page.fill('input[aria-label="Cantidad de la línea 1"]', '1')
  await page.fill('input[aria-label="Precio de la línea 1"]', '20000')

  await page.click('#payment-preset')
  await page.click('div[role=option]:has-text("50 %")')

  const montos = page.locator('input[aria-label^="Monto del cobro"]')
  await expect(montos).toHaveCount(2)

  // Las fechas se leen del generador y no se recalculan aquí: dependen de si
  // el plan se contó en días hábiles o naturales, y esa casilla puede cambiar.
  const fechasDelPlan = await page
    .locator('input[aria-label^="Vencimiento del cobro"]')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
  // Campaña en pesos: el plan se arma sobre el total a facturar (RESICO),
  // 20,000 + IVA 3,200 − retención ISR 250 = 22,950, mitad y mitad.
  await expect(page.getByTestId('items-total')).toHaveText('$22,950.00')
  await expect(montos.first()).toHaveValue('11475')
  await expect(montos.nth(1)).toHaveValue('11475')

  await page.click('button:has-text("Crear campaña")')
  await expect(page).toHaveURL(/\/campanas\/[0-9a-f-]{36}/)
  const campaignUrl = page.url()

  await expect(page.getByRole('heading', { name: CAMPAIGN })).toBeVisible()

  // --- los dos cobros salen en el calendario del Inicio ---
  // El plan 50/50 parte de la fecha de firma, así que el segundo cobro cae
  // semanas después y puede quedar en otro mes. Se abre el calendario en el
  // mes de cada cobro.
  const enlace = `a[href="/campanas/${campaignUrl.split('/').pop()}"]`
  for (const fecha of fechasDelPlan) {
    const [anio, mes] = fecha.split('-')
    await page.goto(`/?anio=${Number(anio)}&mes=${Number(mes)}`)
    const calendario = page.locator('section[aria-label="Calendario de cobros"]')
    await expect(calendario).toBeVisible()
    await expect(calendario.locator(enlace).first()).toBeVisible()
  }

  // --- limpieza ---
  await page.goto(campaignUrl)
  await page.click('button:has-text("Eliminar")')
  await page.click('div[role=alertdialog] button:has-text("Eliminar")')
  await expect(page).toHaveURL(/\/campanas$/)
  await expect(page.locator(`table tbody tr:has-text("${CAMPAIGN}")`)).toHaveCount(0)
})

function isoInDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
