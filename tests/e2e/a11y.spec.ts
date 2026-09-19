import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''

test.skip(!EMAIL || !PASSWORD, 'Faltan E2E_EMAIL y E2E_PASSWORD')

async function signIn(page: Page, path: string) {
  await page.goto(path)
  if (page.url().includes('/login')) {
    await page.fill('#email', EMAIL)
    await page.fill('#password', PASSWORD)
    await page.click('button[type=submit]')
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
  }
  await page.waitForLoadState('networkidle')
}

const PAGES = [
  { path: '/', name: 'Inicio' },
  { path: '/campanas', name: 'Campañas' },
  { path: '/cobros', name: 'Cobros' },
  { path: '/marcas', name: 'Marcas' },
  { path: '/gifting', name: 'Gifting' },
  { path: '/reportes', name: 'Reportes' },
  { path: '/configuracion', name: 'Configuración' },
]

for (const { path, name } of PAGES) {
  test(`${name} sin violaciones de accesibilidad`, async ({ page }) => {
    await signIn(page, path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    if (results.violations.length > 0) {
      console.log(
        `\n${name}:\n` +
          results.violations
            .map((v: { impact?: string | null; id: string; help: string; nodes: { target: unknown[] }[] }) => `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`)
            .join('\n'),
      )
    }
    expect(results.violations).toEqual([])
  })
}

test('login sin violaciones de accesibilidad', async ({ page }) => {
  await page.goto('/login')
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  if (results.violations.length > 0) {
    console.log('\nLogin:\n' + results.violations.map((v: { impact?: string | null; id: string; help: string; nodes: { target: unknown[] }[] }) => `  [${v.impact}] ${v.id}: ${v.help}`).join('\n'))
  }
  expect(results.violations).toEqual([])
})
