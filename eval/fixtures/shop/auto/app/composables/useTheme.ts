/** The shop is dark. Overrides the base layer's `useTheme`. */
export function useTheme() {
  return useState('theme', () => 'dark')
}
