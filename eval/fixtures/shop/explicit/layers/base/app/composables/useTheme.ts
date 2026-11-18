import { useState } from '#app'

export function useTheme() {
  return useState('theme', () => 'light')
}
