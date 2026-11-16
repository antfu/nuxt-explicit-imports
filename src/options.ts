import type { Category, Mode, ModeOption } from './types'
import { CATEGORIES } from './types'

const MODES: readonly Mode[] = ['off', 'warn', 'strict']

export function resolveModes(option: ModeOption | undefined): Record<Category, Mode> {
  const modes = {} as Record<Category, Mode>
  for (const category of CATEGORIES) {
    const value = typeof option === 'string'
      ? option
      : option?.[category]
    modes[category] = value ?? 'warn'
    if (!MODES.includes(modes[category]))
      throw new Error(`[nuxt-explicit-imports] Invalid mode "${String(value)}" for "${category}". Use one of: ${MODES.join(', ')}.`)
  }
  return modes
}
