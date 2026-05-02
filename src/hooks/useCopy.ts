import { useState } from 'react'

export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), timeoutMs)
  }

  return { copy, copied }
}
