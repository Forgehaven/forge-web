import { useState } from 'react'

function copyViaExecCommand(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(el)
  el.focus()
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false)

  function copy(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => copyViaExecCommand(text))
    } else {
      copyViaExecCommand(text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), timeoutMs)
  }

  return { copy, copied }
}
