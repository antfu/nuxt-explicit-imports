import { useState } from '#imports'

export function useTheme() {
  return useState('theme', () => 'light')
}
