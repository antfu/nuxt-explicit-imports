import { useState } from '#app'

export function useCounter() {
  const count = useState('count', () => 0)
  function increment() {
    count.value++
  }
  return { count, increment }
}
