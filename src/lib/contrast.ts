/**
 * Contraste de texto. Ana elige el color de cada estatus con un selector, así
 * que el badge no puede confiar en que ese color sea legible sobre su propio
 * tinte: aquí se oscurece lo necesario para llegar al 4.5:1 que pide WCAG AA.
 */

type Rgb = [number, number, number]

/**
 * Superficie de referencia: la más oscura de las tres del §7 (superficie 2).
 * Calcular contra blanco daría un texto demasiado claro para el mismo badge
 * puesto sobre el fondo de página, que es más oscuro.
 */
const DARKEST_SURFACE: Rgb = [239, 231, 222]

export function parseHex(hex: string): Rgb {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const value = Number.parseInt(full.slice(0, 6), 16)
  if (Number.isNaN(value)) return [0, 0, 0]
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export function toHex([r, g, b]: Rgb): string {
  const part = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')
  return `#${part(r)}${part(g)}${part(b)}`
}

function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Compone un color translúcido sobre un fondo opaco. */
export function composite(color: Rgb, alpha: number, background: Rgb): Rgb {
  return color.map((value, index) => value * alpha + background[index] * (1 - alpha)) as Rgb
}

/**
 * Devuelve el mismo color oscurecido lo justo para alcanzar `minRatio` contra
 * su propio tinte. Si ya cumple, lo devuelve intacto.
 */
export function readableTextColor(
  hex: string,
  options: { tintAlpha?: number; surface?: Rgb; minRatio?: number } = {},
): string {
  const { tintAlpha = 0.12, surface = DARKEST_SURFACE, minRatio = 4.6 } = options
  const base = parseHex(hex)
  const background = composite(base, tintAlpha, surface)

  if (contrastRatio(base, background) >= minRatio) return toHex(base)

  for (let step = 1; step <= 100; step += 1) {
    const candidate = base.map((value) => value * (1 - step / 100)) as Rgb
    if (contrastRatio(candidate, background) >= minRatio) return toHex(candidate)
  }
  return '#000000'
}
