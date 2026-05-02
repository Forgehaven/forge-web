import { useState, useLayoutEffect } from 'react'
import css from '../styles/forgehaven.css?inline'

export function useForgehavenStyles(): boolean {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    document.body.classList.add('fh-page', 'is-preload')
    const timer = setTimeout(() => document.body.classList.remove('is-preload'), 100)
    setReady(true) // eslint-disable-line react-hooks/set-state-in-effect

    return () => {
      clearTimeout(timer)
      style.remove()
      document.body.classList.remove('fh-page', 'is-preload', 'is-article-visible')
      setReady(false)
    }
  }, [])

  return ready
}
