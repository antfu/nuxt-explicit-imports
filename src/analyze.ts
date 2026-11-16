import type { Component } from 'nuxt/schema'
import type { Node, ParserOptions, Program } from 'oxc-parser'
import type { Import } from 'unimport'
import type { Project } from './project'
import type { Category, Finding, FindingKind } from './types'
import { compileTemplate, parse as parseSfc } from '@vue/compiler-sfc'
import { isReferenceIdentifier, parseAndWalk, ScopeTracker, walk } from 'oxc-walker'

export type BlockKind = 'file' | 'script' | 'scriptSetup'

export interface ScriptBlock {
  kind: BlockKind
  content: string
  /** Offset of `content` inside the whole file. */
  offset: number
  lang: NonNullable<ParserOptions['lang']>
  program: Program
  /** Names declared at the top level of the block. */
  topLevel: Set<string>
}

export interface ImportSpec {
  from: string
  /** The exported name: `default`, `*`, or a named export. */
  name: string
  local: string
  type: boolean
}

/** Where `migrate` writes the fix for a usage. */
interface Target {
  block: BlockKind | 'new-setup'
  /** Also register the component in the Options API `components` option. */
  register?: string
}

export interface Usage {
  category: Category
  kind: FindingKind
  name: string
  offset: number
  specs: ImportSpec[]
  decl?: string
  /** `undefined` when the usage cannot be fixed automatically. */
  target?: Target
  reason?: string
}

export interface FileAnalysis {
  file: string
  code: string
  blocks: ScriptBlock[]
  usages: Usage[]
  /** The `lang` to use when `migrate` adds a new `<script setup>` block. */
  setupLang?: string
}

interface Ref {
  start: number
  value: boolean
}

const RESOLVE_COMPONENT_RE = /_resolveComponent\("([^"]+)"/g
const CTX_IDENTIFIER_RE = /\b_ctx\.([$\w]+)/g
const LAZY_RE = /^Lazy(?=[A-Z])/
const KEBAB_LAZY_RE = /^lazy-/
const VUE_FILE_RE = /\.vue$/
const REGEX_SPECIAL_RE = /[.*+?^${}()|[\]\\]/g
const CAMELIZE_RE = /-(\w)/g

function camelize(value: string): string {
  return value.replace(CAMELIZE_RE, (_, c: string) => c.toUpperCase())
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const HYDRATION_PROPS = new Map([
  ['hydrateOnVisible', 'visible'],
  ['hydrateOnIdle', 'idle'],
  ['hydrateOnInteraction', 'interaction'],
  ['hydrateOnMediaQuery', 'mediaQuery'],
  ['hydrateAfter', 'time'],
  ['hydrateWhen', 'if'],
  ['hydrateNever', 'never'],
])

// Minimal shapes of the Vue template AST (`@vue/compiler-core`), which `@vue/compiler-sfc` does not re-export.
interface TemplateNode {
  type: number
  tag?: string
  props?: TemplateProp[]
  children?: TemplateNode[]
}

interface TemplateProp {
  type: number
  name: string
  arg?: { type: number, content: string, isStatic: boolean }
}

const ELEMENT_NODE = 1
const ATTRIBUTE_NODE = 6
const DIRECTIVE_NODE = 7
const SIMPLE_EXPRESSION_NODE = 4

function langOf(file: string): ScriptBlock['lang'] {
  if (/\.[cm]?ts$/.test(file))
    return 'ts'
  if (file.endsWith('.tsx'))
    return 'tsx'
  if (file.endsWith('.jsx'))
    return 'jsx'
  return 'js'
}

function blockLang(lang: string | undefined): ScriptBlock['lang'] {
  return lang === 'ts' || lang === 'tsx' || lang === 'jsx'
    ? lang
    : 'js'
}

function collectPatternNames(node: Node | null | undefined, names: Set<string>): void {
  if (!node)
    return
  switch (node.type) {
    case 'Identifier':
      names.add(node.name)
      break
    case 'ObjectPattern':
      for (const prop of node.properties) {
        collectPatternNames(prop.type === 'RestElement'
          ? prop.argument
          : prop.value, names)
      }
      break
    case 'ArrayPattern':
      for (const element of node.elements)
        collectPatternNames(element, names)
      break
    case 'AssignmentPattern':
      collectPatternNames(node.left, names)
      break
    case 'RestElement':
      collectPatternNames(node.argument, names)
      break
  }
}

function addDeclaredNames(node: Node, names: Set<string>): void {
  switch (node.type) {
    case 'ImportDeclaration':
      for (const specifier of node.specifiers)
        names.add(specifier.local.name)
      break
    case 'VariableDeclaration':
      for (const declarator of node.declarations)
        collectPatternNames(declarator.id, names)
      break
    case 'FunctionDeclaration':
    case 'ClassDeclaration':
    case 'TSEnumDeclaration':
      if (node.id)
        names.add(node.id.name)
      break
  }
}

function topLevelNames(program: Program): Set<string> {
  const names = new Set<string>()
  for (const statement of program.body) {
    const node = (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration')
      ? statement.declaration
      : statement
    if (node)
      addDeclaredNames(node as Node, names)
  }
  return names
}

function parseBlock(kind: BlockKind, content: string, offset: number, lang: ScriptBlock['lang']): { block: ScriptBlock, scopeTracker: ScopeTracker } {
  const scopeTracker = new ScopeTracker({ preserveExitedScopes: true })
  const { program } = parseAndWalk(content, `block.${lang}`, {
    scopeTracker,
    parseOptions: { lang, sourceType: 'module' },
  })
  scopeTracker.freeze()
  return {
    block: {
      kind,
      content,
      offset,
      lang,
      program,
      topLevel: topLevelNames(program),
    },
    scopeTracker,
  }
}

/**
 * Find references to auto-importable names that are not declared in scope.
 */
function findRefs(program: Program, scopeTracker: ScopeTracker, names: Map<string, Import>): Map<string, Ref> {
  const refs = new Map<string, Ref>()
  walk(program, {
    scopeTracker,
    enter(node, parent) {
      // `export { foo } from './foo'` refers to another module.
      if (node.type === 'ExportNamedDeclaration' && node.source) {
        this.skip()
        return
      }
      if (node.type !== 'Identifier' || !names.has(node.name))
        return
      if (!isReferenceIdentifier(node, parent, { mode: 'all' }))
        return
      const value = isReferenceIdentifier(node, parent, { mode: 'value' })
      if (scopeTracker.isDeclared(node.name, {
        mode: value ? 'value' : 'type',
      })) {
        return
      }
      const existing = refs.get(node.name)
      if (!existing)
        refs.set(node.name, { start: node.start, value })
      else if (value)
        existing.value = true
    },
  })
  return refs
}

function importsByName(imports: Import[]): Map<string, Import> {
  const map = new Map<string, Import>()
  for (const imp of imports) {
    if (imp.disabled)
      continue
    map.set(imp.as || imp.name, imp)
  }
  return map
}

/** Render import statements, one per source and kind. */
export function renderSpecs(specs: ImportSpec[]): string[] {
  const lines: string[] = []
  const named = new Map<string, ImportSpec[]>()
  for (const spec of specs) {
    if (spec.name === 'default' || spec.name === '*') {
      lines.push(renderSpec(spec))
      continue
    }
    const key = `${spec.type ? 'type' : 'value'}\0${spec.from}`
    named.set(key, [
      ...named.get(key) ?? [],
      spec,
    ])
  }
  for (const group of named.values()) {
    const bindings = group.map(s => s.name === s.local
      ? s.name
      : `${s.name} as ${s.local}`)
    lines.push(`${group[0]!.type ? 'import type' : 'import'} { ${bindings.join(', ')} } from '${group[0]!.from}'`)
  }
  return lines
}

function renderSpec(spec: ImportSpec): string {
  const keyword = spec.type ? 'import type' : 'import'
  if (spec.name === 'default')
    return `${keyword} ${spec.local} from '${spec.from}'`
  if (spec.name === '*')
    return `${keyword} * as ${spec.local} from '${spec.from}'`
  const binding = spec.name === spec.local
    ? spec.name
    : `${spec.name} as ${spec.local}`
  return `${keyword} { ${binding} } from '${spec.from}'`
}

function importSpec(project: Project, imp: Import, valueUse: boolean): ImportSpec {
  return {
    from: project.sourceFor(imp),
    name: imp.name,
    local: imp.as || imp.name,
    type: !!imp.type || !valueUse,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(REGEX_SPECIAL_RE, '\\$&')
}

function indexOfWord(source: string, word: string): number {
  return new RegExp(`(?<![\\w$.])${escapeRegExp(word)}(?![\\w$])`).exec(source)?.index ?? 0
}

/** Analyze a single file. `code` is the original source. */
export async function analyzeFile(project: Project, file: string, code: string): Promise<FileAnalysis> {
  const side = project.sideOf(file)
  const names = importsByName(await project.getImports(side))
  const category: Category = side === 'server'
    ? 'server'
    : 'imports'

  if (!VUE_FILE_RE.test(file)) {
    const { block, scopeTracker } = parseBlock('file', code, 0, langOf(file))
    const usages = scriptUsages(project, block, scopeTracker, names, category)
    return {
      file,
      code,
      blocks: [block],
      usages,
    }
  }

  return analyzeSfc(project, file, code, names)
}

function scriptUsages(project: Project, block: ScriptBlock, scopeTracker: ScopeTracker, names: Map<string, Import>, category: Category): Usage[] {
  const usages: Usage[] = []
  for (const [name, ref] of findRefs(block.program, scopeTracker, names)) {
    const spec = importSpec(project, names.get(name)!, ref.value)
    usages.push({
      category,
      kind: spec.type ? 'type' : 'import',
      name,
      offset: block.offset + ref.start,
      specs: [spec],
      target: { block: block.kind },
    })
  }
  return usages
}

function analyzeSfc(project: Project, file: string, code: string, names: Map<string, Import>): FileAnalysis {
  const { descriptor } = parseSfc(code, { filename: file, sourceMap: false, ignoreEmpty: false })
  const blocks: ScriptBlock[] = []
  const usages: Usage[] = []

  for (const [kind, sfcBlock] of [
    ['script', descriptor.script],
    ['scriptSetup', descriptor.scriptSetup],
  ] as const) {
    if (!sfcBlock)
      continue
    const { block, scopeTracker } = parseBlock(kind, sfcBlock.content, sfcBlock.loc.start.offset, blockLang(sfcBlock.lang))
    blocks.push(block)
    usages.push(...scriptUsages(project, block, scopeTracker, names, 'imports'))
  }

  const setupLang = descriptor.script?.lang ?? descriptor.scriptSetup?.lang ?? (project.typescript ? 'ts' : undefined)
  const template = descriptor.template
  if (template && (!template.lang || template.lang === 'html')) {
    const compiled = compileWithBindings(file, template.content, blocks)
    if (compiled !== undefined) {
      const ctx: TemplateContext = {
        project,
        names,
        content: template.content,
        offset: template.loc.start.offset,
        ast: template.ast as TemplateNode | undefined,
        compiled,
        ...templateTargets(blocks),
      }
      usages.push(
        ...templateExpressionUsages(ctx, usages),
        ...templateComponentUsages(ctx),
      )
    }
  }

  return {
    file,
    code,
    blocks,
    usages,
    setupLang,
  }
}

interface TemplateContext {
  project: Project
  names: Map<string, Import>
  content: string
  offset: number
  ast: TemplateNode | undefined
  compiled: string
  /** Components registered in the Options API `components` option. */
  registered: Set<string>
  /** Where fixes for template usages go. `undefined` means manual work. */
  target: (register?: string) => Target | undefined
}

/**
 * Compile the template with the script bindings, so unresolved names show up as
 * `_ctx.name` and unresolved components as `_resolveComponent("Name")`.
 */
function compileWithBindings(file: string, source: string, blocks: ScriptBlock[]): string | undefined {
  const bindingMetadata: Record<string, any> = {
    __isScriptSetup: blocks.some(b => b.kind === 'scriptSetup'),
  }
  for (const block of blocks) {
    for (const name of block.topLevel)
      bindingMetadata[name] = 'setup-maybe-ref'
  }
  try {
    return compileTemplate({
      source,
      filename: file,
      id: 'explicit-imports',
      compilerOptions: { bindingMetadata, prefixIdentifiers: true },
    }).code
  }
  catch {}
}

function templateTargets(blocks: ScriptBlock[]): Pick<TemplateContext, 'registered' | 'target'> {
  const setupBlock = blocks.find(b => b.kind === 'scriptSetup')
  const optionsBlock = blocks.find(b => b.kind === 'script')
  if (setupBlock) {
    return {
      registered: new Set(),
      target: () => ({ block: 'scriptSetup' }),
    }
  }
  if (!optionsBlock) {
    return {
      registered: new Set(),
      target: () => ({ block: 'new-setup' }),
    }
  }
  const optionsObject = findOptionsObject(optionsBlock.program)
  if (optionsObject) {
    return {
      registered: registeredComponents(optionsObject),
      target: register => register
        ? { block: 'script', register }
        : undefined,
    }
  }
  // A `<script>` without a default export: add a `<script setup>` next to it.
  const hasDefaultExport = optionsBlock.program.body.some(s => s.type === 'ExportDefaultDeclaration')
  return {
    registered: new Set(),
    target: () => hasDefaultExport
      ? undefined
      : { block: 'new-setup' },
  }
}

/** Composables and utils used in template expressions. */
function templateExpressionUsages(ctx: TemplateContext, scriptUsages: Usage[]): Usage[] {
  const usages: Usage[] = []
  for (const match of ctx.compiled.matchAll(CTX_IDENTIFIER_RE)) {
    const name = match[1]!
    const imp = ctx.names.get(name)
    if (!imp || [
      ...scriptUsages,
      ...usages,
    ].some(u => u.name === name)) {
      continue
    }
    const target = ctx.target()
    usages.push({
      category: 'imports',
      kind: 'import',
      name,
      offset: ctx.offset + indexOfWord(ctx.content, name),
      specs: [
        importSpec(ctx.project, imp, true),
      ],
      target,
      reason: target
        ? undefined
        : 'Used in the template of an Options API component. Return it from `setup()` or convert the component to `<script setup>`.',
    })
  }
  return usages
}

function templateComponentUsages(ctx: TemplateContext): Usage[] {
  const usages: Usage[] = []
  const index = indexComponents(ctx.project.getComponents())
  const seen = new Set<string>()
  for (const match of ctx.compiled.matchAll(RESOLVE_COMPONENT_RE)) {
    const tag = match[1]!
    if (seen.has(tag) || ctx.registered.has(pascalOf(tag)))
      continue
    seen.add(tag)
    const resolved = resolveComponent(index, tag)
    if (!resolved)
      continue
    const usage = componentUsage(ctx.project, resolved.component, resolved.lazy, tag, hydrationStrategies(ctx.ast, tag))
    const tagIndex = ctx.content.indexOf(`<${tag}`)
    usage.offset = ctx.offset + Math.max(tagIndex + 1, 0)
    if (usage.target) {
      usage.target = ctx.target(usage.target.register)
      if (!usage.target)
        usage.reason = 'The component options object could not be found. Register the component by hand.'
    }
    usages.push(usage)
  }
  return usages
}

function pascalOf(tag: string): string {
  return capitalize(camelize(tag))
}

type ComponentIndex = Map<string, Component>

function indexComponents(components: Component[]): ComponentIndex {
  const index: ComponentIndex = new Map()
  for (const component of components) {
    // Nuxt adds a server placeholder for every client-only component, skip it.
    const existing = index.get(component.pascalName)
    if (existing && (component.mode === 'server' || existing.mode !== 'server'))
      continue
    index.set(component.pascalName, component)
    index.set(component.kebabName, component)
  }
  return index
}

function resolveComponent(index: ComponentIndex, tag: string): { component: Component, lazy: boolean } | undefined {
  const direct = index.get(tag) ?? index.get(pascalOf(tag))
  if (direct)
    return { component: direct, lazy: false }
  const base = tag.replace(LAZY_RE, '').replace(KEBAB_LAZY_RE, '')
  if (base === tag)
    return
  const lazy = index.get(base) ?? index.get(pascalOf(base))
  if (lazy)
    return { component: lazy, lazy: true }
}

function hydrationStrategies(ast: TemplateNode | undefined, tag: string): Set<string | undefined> {
  const strategies = new Set<string | undefined>()
  const visit = (nodes: TemplateNode[] = []): void => {
    for (const node of nodes) {
      if (node.type !== ELEMENT_NODE)
        continue
      if (node.tag === tag) {
        let strategy: string | undefined
        for (const prop of node.props ?? []) {
          let propName: string | undefined
          if (prop.type === ATTRIBUTE_NODE)
            propName = prop.name
          else if (prop.type === DIRECTIVE_NODE && prop.name === 'bind' && prop.arg?.type === SIMPLE_EXPRESSION_NODE && prop.arg.isStatic)
            propName = prop.arg.content
          strategy = (propName && HYDRATION_PROPS.get(camelize(propName))) || strategy
        }
        strategies.add(strategy)
      }
      visit(node.children)
    }
  }
  visit(ast?.children)
  return strategies
}

function componentUsage(project: Project, component: Component, lazy: boolean, tag: string, strategies: Set<string | undefined>): Usage {
  const local = lazy
    ? `Lazy${component.pascalName}`
    : component.pascalName
  const isFileImport = project.isLocal(component.filePath)
    && component.mode === 'all'
    && !component.island
    && (component.export ?? 'default') === 'default'
  const strategy = strategies.size === 1
    ? [...strategies][0]
    : undefined
  const usage: Usage = {
    category: 'components',
    kind: lazy ? 'lazy-component' : 'component',
    name: tag,
    offset: 0,
    specs: [],
    target: { block: 'scriptSetup', register: local },
  }

  if (!isFileImport) {
    usage.specs.push({
      from: '#components',
      name: local,
      local,
      type: false,
    })
    if (lazy && strategy) {
      usage.target = undefined
      usage.reason = `Lazy hydration on a component that is not a local \`.vue\` file. Use \`defineLazyHydrationComponent()\` with its import path by hand.`
    }
    return usage
  }

  const path = project.aliasFor(component.filePath, component.filePath.endsWith('.vue')) ?? component.filePath
  if (!lazy) {
    usage.specs.push({
      from: path,
      name: 'default',
      local,
      type: false,
    })
    return usage
  }
  if (strategies.size > 1) {
    usage.target = undefined
    usage.reason = `\`<${tag}>\` is used with different hydration strategies. Define one \`defineLazyHydrationComponent()\` per strategy by hand.`
    return usage
  }
  if (strategy) {
    usage.specs.push({
      from: project.sourceFor({ from: '#app/composables/lazy-hydration', name: 'defineLazyHydrationComponent' }),
      name: 'defineLazyHydrationComponent',
      local: 'defineLazyHydrationComponent',
      type: false,
    })
    usage.decl = `const ${local} = defineLazyHydrationComponent('${strategy}', () => import('${path}'))`
  }
  else {
    usage.specs.push({
      from: 'vue',
      name: 'defineAsyncComponent',
      local: 'defineAsyncComponent',
      type: false,
    })
    usage.decl = `const ${local} = defineAsyncComponent(() => import('${path}'))`
  }
  return usage
}

type ObjectExpression = Extract<Node, { type: 'ObjectExpression' }>

/** The object literal of `export default {}` or `export default defineXxx({})`. */
export function findOptionsObject(program: Program): ObjectExpression | undefined {
  for (const statement of program.body) {
    if (statement.type !== 'ExportDefaultDeclaration')
      continue
    const declaration = statement.declaration as Node
    if (declaration.type === 'ObjectExpression')
      return declaration
    if (declaration.type === 'CallExpression' && declaration.arguments[0]?.type === 'ObjectExpression')
      return declaration.arguments[0]
  }
}

export function findComponentsProperty(object: ObjectExpression): ObjectExpression | undefined {
  for (const prop of object.properties) {
    if (prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'components' && prop.value.type === 'ObjectExpression')
      return prop.value
  }
}

function registeredComponents(object: ObjectExpression): Set<string> {
  const names = new Set<string>()
  for (const prop of findComponentsProperty(object)?.properties ?? []) {
    if (prop.type === 'Property' && prop.key.type === 'Identifier')
      names.add(pascalOf(prop.key.name))
  }
  return names
}

function lineColumn(code: string, offset: number): { line: number, column: number } {
  let line = 1
  let lineStart = 0
  for (let i = 0; i < offset && i < code.length; i++) {
    if (code[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, column: offset - lineStart + 1 }
}

function suggestionOf(usage: Usage): string {
  return [
    ...usage.specs.map(renderSpec),
    ...usage.decl
      ? [usage.decl]
      : [],
  ].join('\n')
}

export function toFindings(project: Project, analysis: FileAnalysis): Finding[] {
  const file = project.relative(analysis.file)
  return analysis.usages.map((usage) => {
    const finding: Finding = {
      file,
      ...lineColumn(analysis.code, usage.offset),
      category: usage.category,
      kind: usage.kind,
      name: usage.name,
      suggestion: suggestionOf(usage),
      fixable: !!usage.target,
    }
    if (!usage.target)
      finding.reason = usage.reason
    return finding
  })
}
