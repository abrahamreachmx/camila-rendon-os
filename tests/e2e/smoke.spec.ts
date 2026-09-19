import { expect, test } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

const CAMPAIGN = 'E2E · Campaña de prueba'

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
  await expect(montos.first()).toHaveValue('10000')
  await expect(montos.nth(1)).toHaveValue('10000')

  await page.click('button:has-text("Crear campaña")')
  await expect(page).toHaveURL(/\/campanas\/[0-9a-f-]{36}/)
  const campaignUrl = page.url()

  await expect(page.getByRole('heading', { name: CAMPAIGN })).toBeVisible()

  // --- los dos cobros salen en la Línea de cobros del Inicio ---
  await page.click('aside nav a:has-text("Inicio")')
  const timeline = page.locator('section').filter({ hasText: 'Línea de cobros' }).first()
  await expect(timeline).toBeVisible()
  await expect(timeline.locator(`a[href="/campanas/${campaignUrl.split('/').pop()}"]`)).toHaveCount(2)

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
