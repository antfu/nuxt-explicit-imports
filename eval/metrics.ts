import type { AgentMetrics, ToolKind } from './types'

/** Appended to every harness's system prompt, so all agents get the same framing. */
export const APPEND = 'You are working on a Nuxt 4 app in the current working directory. Only read and change files inside it.'

/** Tool names in lower case, so Claude Code's `Read` and pi's `read` sort the same. */
const TOOL_KINDS: Record<string, ToolKind> = {
  read: 'explore',
  grep: 'explore',
  glob: 'explore',
  find: 'explore',
  ls: 'explore',
  edit: 'edit',
  multiedit: 'edit',
  write: 'edit',
  notebookedit: 'edit',
}

/** Sort one simple command by what it does. Verify wins over edit, edit over explore. */
function commandKind(command: string): ToolKind {
  if (/\b(?:typecheck|vue-tsc|tsc|build|vitest|test)\b/.test(command))
    return 'verify'
  // `>` writes a file, but not `2>`, `&>`, `>&2` or `> /dev/null`.
  if (/\bsed\s+-i\b|\b(?:mv|cp|rm|mkdir|touch|tee)\s|(?<![\d&])>(?!&|\s*\/dev\/null)|\bgit\s+mv\b/.test(command))
    return 'edit'
  if (/\b(?:cat|head|tail|less|grep|rg|find|ls|tree|sed|awk|wc|git\s+(?:grep|log|show|diff|status))\b/.test(command))
    return 'explore'
  return 'other'
}

/** Drop heredoc bodies: keep each `<<EOF` line, skip the lines up to the closing `EOF`. */
function dropHeredocs(command: string): string {
  const out: string[] = []
  let end: string | undefined
  for (const line of command.split('\n')) {
    if (end !== undefined) {
      if (line.trim() === end)
        end = undefined
      continue
    }
    out.push(line)
    end = /<<-?\s*['"]?(\w+)/.exec(line)?.[1]
  }
  return out.join('\n')
}

/**
 * Every kind a Bash command does. Heredoc bodies and quoted text are dropped first,
 * so a `>` in written content or in a search pattern is not read as a redirect.
 * Chained commands (`&&`, `||`, `;`, new lines) are sorted one by one.
 */
function bashKinds(command: string): ToolKind[] {
  const skeleton = dropHeredocs(command).replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, '""')
  const kinds = new Set<ToolKind>()
  for (const command of skeleton.split(/&&|\|\||[;\n]/)) {
    // Later pipeline stages (`| tail`, `| grep`) only filter output, unless they write a file.
    const [first = '', ...rest] = command.split('|')
    kinds.add(commandKind(first))
    if (rest.some(stage => commandKind(stage) === 'edit'))
      kinds.add('edit')
  }
  if (kinds.size > 1)
    kinds.delete('other')
  return [...kinds]
}

function toolKinds(name: string, input: unknown): ToolKind[] {
  if (name.toLowerCase() === 'bash') {
    const command = input && typeof input === 'object' && 'command' in input
      ? String(input.command)
      : ''
    return bashKinds(command)
  }
  return [TOOL_KINDS[name.toLowerCase()] ?? 'other']
}

/** Text of a tool result: a string, or the text parts of a content array. */
export function toolResultText(content: unknown): string {
  if (typeof content === 'string')
    return content
  if (Array.isArray(content)) {
    return content.map(part => (part && typeof part === 'object' && 'text' in part
      ? String(part.text)
      : '')).join('\n')
  }
  return ''
}

export function emptyMetrics(): AgentMetrics {
  return {
    stop: 'unknown',
    turns: 0,
    toolCalls: {},
    toolKinds: {
      explore: 0,
      edit: 0,
      verify: 0,
      other: 0,
    },
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    toolOutputChars: 0,
    costUsd: 0,
    ms: 0,
    apiMs: 0,
    calls: [],
  }
}

export function recordCall(metrics: AgentMetrics, id: string, name: string, input: unknown): void {
  metrics.toolCalls[name] = (metrics.toolCalls[name] ?? 0) + 1
  const kinds = toolKinds(name, input)
  for (const kind of kinds)
    metrics.toolKinds[kind]++
  metrics.calls.push({
    id,
    name,
    kinds,
    input,
    output: '',
  })
}

export function recordOutput(metrics: AgentMetrics, id: string, text: string): void {
  metrics.toolOutputChars += text.length
  const call = metrics.calls.find(c => c.id === id)
  if (call) {
    call.output = text
    return
  }
  metrics.calls.push({
    id,
    name: 'unknown',
    kinds: ['other'],
    input: null,
    output: text,
  })
}
