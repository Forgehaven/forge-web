import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { FetchedAtLink } from './FetchedAtLink'

export type PopupPos = { left: number }

const POPUP_EDGE = 12
const POPUP_BOTTOM = 48

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-[#c4af64]/50 shrink-0">{label}</span>
      <span className="text-[#e2e4ed] font-mono text-right">{value}</span>
    </div>
  )
}

export function PopupDivider() {
  return <div className="border-t border-[#2a2d3a] my-0.5" />
}

export function PopupTimestamp({ date, url }: { date: Date; url: string }) {
  return (
    <div className="flex justify-end pt-1.5 mt-0.5 border-t border-[#2a2d3a]">
      <FetchedAtLink date={date} url={url} />
    </div>
  )
}

interface PopupProps {
  pos: PopupPos
  triggerRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  children: React.ReactNode
}

export function Popup({ pos, triggerRef, onClose, children }: PopupProps) {
  const popRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({
    left: pos.left,
    bottom: POPUP_BOTTOM,
    marginRight: POPUP_EDGE,
    maxWidth: window.innerWidth - POPUP_EDGE * 2,
    opacity: 0,
  })

  useLayoutEffect(() => {
    const el = popRef.current
    if (!el) return
    const maxW = window.innerWidth - POPUP_EDGE * 2
    el.style.maxWidth = `${maxW}px`
    const w = el.offsetWidth
    const left = Math.max(POPUP_EDGE, Math.min(pos.left, window.innerWidth - w - POPUP_EDGE))
    setStyle({ left, bottom: POPUP_BOTTOM, marginRight: POPUP_EDGE, maxWidth: maxW, opacity: 1 })
  }, [pos.left])

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (!popRef.current?.contains(t) && !triggerRef.current?.contains(t)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [triggerRef, onClose])

  return createPortal(
    <div
      ref={popRef}
      style={style}
      className="fixed bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-3 shadow-xl z-[200] text-xs flex flex-col gap-1.5"
    >
      {children}
    </div>,
    document.body
  )
}
