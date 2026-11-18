import { useState } from '#app'

export function useNotify() {
  const message = useState<string | null>('notify', () => null)
  function notify(text: string) {
    message.value = text
  }
  return { message, notify }
}
