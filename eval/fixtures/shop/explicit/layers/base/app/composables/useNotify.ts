import { useState } from '#imports'

export function useNotify() {
  const message = useState<string | null>('notify', () => null)
  function notify(text: string) {
    message.value = text
  }
  return { message, notify }
}
