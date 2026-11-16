import { useState } from '#app'

export function useBase() {
  return useState('base', () => 'base')
}
