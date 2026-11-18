import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      'test/.tmp/**',
      'test/fixtures/**',
      'eval/**',
    ],
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
})
