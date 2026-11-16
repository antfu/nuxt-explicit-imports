import type { BlockKind, FileAnalysis, ImportSpec, ScriptBlock, Usage } from './analyze'
import MagicString from 'magic-string'
import { findComponentsProperty, findOptionsObject, renderSpecs } from './analyze'

interface BlockPlan {
  specs: ImportSpec[]
  decls: string[]
  registers: string[]
}

const SHEBANG_RE = /^#!.*\n/
const INDENT_RE = /^[ \t]*/

function specKey(spec: ImportSpec): string {
  return `${spec.type ? 'type' : 'value'}:${spec.local}`
}

function addUnique<T>(list: T[], item: T, key: (item: T) => string = String): void {
  if (!list.some(i => key(i) === key(item)))
    list.push(item)
}

type PlanKey = BlockKind | 'new-setup'

function buildPlans(analysis: FileAnalysis, usages: Usage[]): Map<PlanKey, BlockPlan> {
  const plans = new Map<PlanKey, BlockPlan>()
  for (const usage of usages) {
    const target = usage.target
    if (!target)
      continue
    const plan = plans.get(target.block) ?? { specs: [], decls: [], registers: [] }
    plans.set(target.block, plan)
    const block = analysis.blocks.find(b => b.kind === target.block)
    // A helper like `defineAsyncComponent` may already be imported or declared.
    for (const spec of usage.specs.filter(spec => !block?.topLevel.has(spec.local)))
      addUnique(plan.specs, spec, specKey)
    if (usage.decl)
      addUnique(plan.decls, usage.decl)
    if (target.register)
      addUnique(plan.registers, target.register)
  }
  return plans
}

/**
 * Apply the fixable usages to the file. Returns the new code, or `undefined` when nothing changed.
 */
export function applyFixes(analysis: FileAnalysis, usages: Usage[] = analysis.usages): string | undefined {
  const plans = buildPlans(analysis, usages)
  if (!plans.size)
    return

  const s = new MagicString(analysis.code)
  for (const [kind, plan] of plans) {
    if (kind === 'new-setup') {
      const lang = analysis.setupLang
        ? ` lang="${analysis.setupLang}"`
        : ''
      const body = [
        renderSpecs(plan.specs).join('\n'),
        plan.decls.join('\n'),
      ].filter(Boolean).join('\n\n')
      s.prepend(`<script setup${lang}>\n${body}\n</script>\n\n`)
      continue
    }
    const block = analysis.blocks.find(b => b.kind === kind)!
    insertImports(s, block, plan)
    if (plan.registers.length)
      registerComponents(s, block, plan.registers)
  }
  return s.toString()
}

type ImportDeclaration = Extract<ScriptBlock['program']['body'][number], { type: 'ImportDeclaration' }>

function insertImports(s: MagicString, block: ScriptBlock, plan: BlockPlan): void {
  const declarations = block.program.body.filter((n): n is ImportDeclaration => n.type === 'ImportDeclaration')
  const lines = renderSpecs(plan.specs.filter(spec => !mergeIntoExisting(s, block, declarations, spec)))
  if (!lines.length && !plan.decls.length)
    return

  const last = declarations.at(-1)
  if (last) {
    const text = lines.map(line => `\n${line}`).join('') + (plan.decls.length
      ? `\n\n${plan.decls.join('\n')}`
      : '')
    s.appendLeft(block.offset + last.end, text)
    return
  }

  let start = 0
  if (block.kind === 'file')
    start = SHEBANG_RE.exec(block.content)?.[0].length ?? 0
  else if (block.content.startsWith('\n'))
    start = 1
  const rest = block.content.slice(start)
  const parts = [
    lines.join('\n'),
    plan.decls.join('\n'),
  ].filter(Boolean)
  // Keep a blank line between the new imports and the existing code.
  const separator = rest.trim()
    ? (rest.startsWith('\n')
        ? '\n'
        : '\n\n')
    : '\n'
  s.appendLeft(block.offset + start, parts.join('\n\n') + separator)
}

/** Add the binding to an existing `import { ... } from 'source'` of the same kind. */
function mergeIntoExisting(s: MagicString, block: ScriptBlock, declarations: ImportDeclaration[], spec: ImportSpec): boolean {
  if (spec.name === 'default' || spec.name === '*')
    return false
  for (const declaration of declarations) {
    if (declaration.source.value !== spec.from || (declaration.importKind === 'type') !== spec.type)
      continue
    const named = declaration.specifiers.filter(i => i.type === 'ImportSpecifier')
    if (!named.length || declaration.specifiers.some(i => i.type === 'ImportNamespaceSpecifier'))
      continue
    const binding = spec.name === spec.local
      ? spec.name
      : `${spec.name} as ${spec.local}`
    s.appendLeft(block.offset + named.at(-1)!.end, `, ${binding}`)
    return true
  }
  return false
}

function registerComponents(s: MagicString, block: ScriptBlock, names: string[]): void {
  const object = findOptionsObject(block.program)
  if (!object)
    return
  const existing = findComponentsProperty(object)
  if (existing) {
    const last = existing.properties.at(-1)
    if (last)
      s.appendLeft(block.offset + last.end, `, ${names.join(', ')}`)
    else
      s.overwrite(block.offset + existing.start, block.offset + existing.end, `{ ${names.join(', ')} }`)
    return
  }
  const first = object.properties[0]
  const lineStart = first
    ? block.content.lastIndexOf('\n', first.start) + 1
    : -1
  const indent = first
    ? INDENT_RE.exec(block.content.slice(lineStart))![0]
    : '  '
  s.appendLeft(block.offset + object.start + 1, `\n${indent}components: { ${names.join(', ')} },`)
}
