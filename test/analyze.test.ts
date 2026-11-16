import type { Project } from '../src/project'
import { join } from 'pathe'
import { beforeAll, describe, expect, it } from 'vitest'
import { analyzeFile, toFindings } from '../src/analyze'
import { applyFixes } from '../src/fix'
import { openSession } from '../src/run'
import { copyFixture } from './_utils'

let dir: string
let project: Project

beforeAll(async () => {
  dir = await copyFixture('basic', 'analyze')
  project = (await openSession({ root: dir })).project
})

async function run(file: string, code: string): Promise<{ names: string[], manual: string[], output: string | undefined }> {
  const analysis = await analyzeFile(project, join(dir, file), code)
  const findings = toFindings(project, analysis)
  return {
    names: findings.filter(f => f.fixable).map(f => f.name),
    manual: findings.filter(f => !f.fixable).map(f => `${f.name}: ${f.reason}`),
    output: applyFixes(analysis),
  }
}

describe('scope analysis', () => {
  it('ignores shadowed and locally declared names', async () => {
    const { names } = await run('app/utils/a.ts', [
      'function read(useState: () => number) {',
      '  return useState()',
      '}',
      'const useRoute = () => 1',
      'export const value = read(useRoute)',
      'export { ref } from \'vue\'',
      'const obj = { computed: 1 }',
      'export const x = obj.computed',
    ].join('\n'))
    expect(names).toEqual([])
  })

  it('uses `import type` for type-only usage', async () => {
    const { output } = await run('app/utils/b.ts', [
      'export const a: Ref<number> = ref(1)',
      'export type R = ReturnType<typeof useRoute>',
      'export type C = ComputedRef<string>',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "import type { Ref, ComputedRef } from 'vue'
      import { ref } from 'vue'
      import { useRoute } from '#app'

      export const a: Ref<number> = ref(1)
      export type R = ReturnType<typeof useRoute>
      export type C = ComputedRef<string>"
    `)
  })

  it('merges into existing imports from the same source', async () => {
    const { output } = await run('app/utils/c.ts', [
      'import { ref } from \'vue\'',
      'import type { Ref } from \'vue\'',
      '',
      'export const a: Ref<number> = computed(() => ref(1).value)',
      'export const b: ComputedRef<number> = a',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "import { ref, computed } from 'vue'
      import type { Ref, ComputedRef } from 'vue'

      export const a: Ref<number> = computed(() => ref(1).value)
      export const b: ComputedRef<number> = a"
    `)
  })

  it('keeps a shebang first', async () => {
    const { output } = await run('app/utils/d.ts', '#!/usr/bin/env node\nexport const a = ref(1)\n')
    expect(output).toMatchInlineSnapshot(`
      "#!/usr/bin/env node
      import { ref } from 'vue'

      export const a = ref(1)
      "
    `)
  })
})

describe('sfc', () => {
  it('adds `<script setup>` to template-only components', async () => {
    const { output } = await run('app/components/T.vue', [
      '<template>',
      '  <p>{{ formatDate(new Date()) }}</p>',
      '  <lazy-heavy-chart />',
      '</template>',
      '',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "<script setup lang="ts">
      import { formatDate } from '~/utils/format'
      import { defineAsyncComponent } from 'vue'

      const LazyHeavyChart = defineAsyncComponent(() => import('~/components/HeavyChart.vue'))
      </script>

      <template>
        <p>{{ formatDate(new Date()) }}</p>
        <lazy-heavy-chart />
      </template>
      "
    `)
  })

  it('reuses an existing helper import', async () => {
    const { output } = await run('app/components/U.vue', [
      '<script setup lang="ts">',
      'import { defineAsyncComponent } from \'vue\'',
      '</script>',
      '',
      '<template>',
      '  <LazyHeavyChart />',
      '</template>',
      '',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "<script setup lang="ts">
      import { defineAsyncComponent } from 'vue'

      const LazyHeavyChart = defineAsyncComponent(() => import('~/components/HeavyChart.vue'))
      </script>

      <template>
        <LazyHeavyChart />
      </template>
      "
    `)
  })

  it('appends to an existing Options API `components` option', async () => {
    const { output, manual } = await run('app/components/O.vue', [
      '<script>',
      'import Other from \'./Other.vue\'',
      '',
      'export default {',
      '  components: { Other },',
      '}',
      '</script>',
      '',
      '<template>',
      '  <Other />',
      '  <MyButton />',
      '  <p>{{ formatDate(new Date()) }}</p>',
      '</template>',
      '',
    ].join('\n'))
    expect(manual).toEqual([
      'formatDate: Used in the template of an Options API component. Return it from `setup()` or convert the component to `<script setup>`.',
    ])
    expect(output).toMatchInlineSnapshot(`
      "<script>
      import Other from './Other.vue'
      import MyButton from '~/components/MyButton.vue'

      export default {
        components: { Other, MyButton },
      }
      </script>

      <template>
        <Other />
        <MyButton />
        <p>{{ formatDate(new Date()) }}</p>
      </template>
      "
    `)
  })

  it('reports mixed hydration strategies as manual', async () => {
    const { manual, output } = await run('app/components/H.vue', [
      '<template>',
      '  <LazyFancyCard hydrate-on-visible />',
      '  <LazyFancyCard hydrate-on-idle />',
      '</template>',
      '',
    ].join('\n'))
    expect(manual).toHaveLength(1)
    expect(manual[0]).toContain('different hydration strategies')
    expect(output).toBeUndefined()
  })

  it('imports client-only and built-in components from `#components`', async () => {
    const { output } = await run('app/components/C.vue', [
      '<script setup lang="ts">',
      'const a = 1',
      '</script>',
      '',
      '<template>',
      '  <ClientOnly><ClientWidget :a="a" /></ClientOnly>',
      '  <LazyClientWidget />',
      '</template>',
      '',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "<script setup lang="ts">
      import { ClientWidget, ClientOnly, LazyClientWidget } from '#components'

      const a = 1
      </script>

      <template>
        <ClientOnly><ClientWidget :a="a" /></ClientOnly>
        <LazyClientWidget />
      </template>
      "
    `)
  })

  it('does not report components bound in `<script setup>`', async () => {
    const { names } = await run('app/components/B.vue', [
      '<script setup lang="ts">',
      'import MyButton from \'~/components/MyButton.vue\'',
      'const useRoute = () => 1',
      '</script>',
      '',
      '<template>',
      '  <my-button>{{ useRoute() }}</my-button>',
      '</template>',
      '',
    ].join('\n'))
    expect(names).toEqual([])
  })
})

describe('server', () => {
  it('uses the Nitro context and aliases for server files', async () => {
    const { output } = await run('server/api/x.ts', [
      'export default defineEventHandler(async () => {',
      '  const config = useRuntimeConfig()',
      '  return { greeting: useGreeting(\'x\'), config }',
      '})',
    ].join('\n'))
    expect(output).toMatchInlineSnapshot(`
      "import { defineEventHandler } from 'h3'
      import { useRuntimeConfig } from 'nitropack/runtime'
      import { useGreeting } from '#server/utils/greeting'

      export default defineEventHandler(async () => {
        const config = useRuntimeConfig()
        return { greeting: useGreeting('x'), config }
      })"
    `)
  })
})
