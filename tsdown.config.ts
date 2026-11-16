import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: [
    'src/module.ts',
    'src/cli.ts',
  ],
  dts: true,
  exports: {
    customExports(exports) {
      exports['.'] = exports['./module']
      delete exports['./module']
      delete exports['./cli']
      return exports
    },
  },
  publint: true,
  plugins: [
    StaleGuardRecorder(),
  ],
})
