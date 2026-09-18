import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// El sitio se publica en https://<usuario>.github.io/camila-rendon-os/
// En desarrollo se sirve en la raiz para que el E2E y los enlaces sean simples.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/camila-rendon-os/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts?(x)'],
  },
}))
