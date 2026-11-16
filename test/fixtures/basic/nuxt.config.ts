export default defineNuxtConfig({
  modules: ['../../../src/module'],
  explicitImports: {
    mode: 'warn',
  },
  compatibilityDate: '2026-01-01',
  devtools: { enabled: false },
  telemetry: false,
})
