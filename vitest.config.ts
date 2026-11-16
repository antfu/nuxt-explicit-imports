import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'test/.tmp/**', 'test/fixtures/**'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
})
