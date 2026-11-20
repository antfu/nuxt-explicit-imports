export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  devtools: { enabled: false },
  telemetry: false,
  // Auto-imports are off: import every composable, util and component explicitly.
  imports: { autoImport: false },
  components: { dirs: [] },
  nitro: { imports: { autoImport: false } },
})
