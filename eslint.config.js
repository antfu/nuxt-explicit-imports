// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
    antislop: true,
    ignores: [
      // Fixtures rely on auto-imports on purpose; snapshots are generated.
      'test/fixtures/**',
      'test/__snapshots__/**',
      'test/.tmp/**',
      // Eval apps: the auto arm relies on auto-imports on purpose.
      'eval/fixtures/**',
      // Eval output: stored runs are data, written by the runner.
      'eval/results/**',
      'eval/runs/**',
      'eval/.tmp/**',
    ],
  },
)
