import { useState, useRef, useEffect } from 'react'
import { FileDropZone } from '../../../components/FileDropZone'

interface CollageImg {
  id: number
  url: string
  el: HTMLImageElement
}

const MAX = 24

const CANVAS_PRESETS = [
  { label: '16:9',     w: 1920, h: 1080 },
  { label: '4:3',      w: 1600, h: 1200 },
  { label: '1:1',      w: 1080, h: 1080 },
  { label: 'Portrait', w: 1080, h: 1350 },
  { label: 'Story',    w: 1080, h: 1920 },
]

function autoCols(n: number) {
  return Math.max(1, Math.ceil(Math.sqrt(n)))
}

function drawCollage(
  canvas: HTMLCanvasElement,
  imgs: CollageImg[],
  W: number, H: number,
  bg: string, gap: number, C: number,
) {
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  if (imgs.length === 0) return

  const R = Math.ceil(imgs.length / C)
  const cellW = (W - gap * (C + 1)) / C
  const cellH = (H - gap * (R + 1)) / R
  if (cellW <= 0 || cellH <= 0) return

  const lastRowCount = imgs.length - (R - 1) * C
  const lastCellW = lastRowCount < C
    ? (W - gap * (lastRowCount + 1)) / lastRowCount
    : cellW

  imgs.forEach((img, i) => {
    if (!img.el.complete || img.el.naturalWidth === 0) return
    const row = Math.floor(i / C)
    const col = i % C
    const isLast = row === R - 1 && lastRowCount < C
    const w = isLast ? lastCellW : cellW
    const x = gap + col * (w + gap)
    const y = gap + row * (cellH + gap)

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, cellH)
    ctx.clip()
    const iw = img.el.naturalWidth
    const ih = img.el.naturalHeight
    const scale = Math.max(w / iw, cellH / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(img.el, x + (w - dw) / 2, y + (cellH - dh) / 2, dw, dh)
    ctx.restore()
  })
}

let uid = 0

export function ImgCollage() {
  const [imgs, setImgs] = useState<CollageImg[]>([])
  const [canvasW, setCanvasW] = useState('1920')
  const [canvasH, setCanvasH] = useState('1080')
  const [bg, setBg] = useState('#000000')
  const [gap, setGap] = useState(8)
  const [tick, setTick] = useState(0)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const dragIdxRef = useRef<number | null>(null)
  const touchDragRef = useRef<{ fromIdx: number; overIdx: number | null; startX: number; startY: number } | null>(null)

  const W = Math.max(1, parseInt(canvasW) || 1920)
  const H = Math.max(1, parseInt(canvasH) || 1080)
  const C = autoCols(imgs.length)

  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    if (imgs.length === 0) { canvas.width = 0; canvas.height = 0; return }
    drawCollage(canvas, imgs, W, H, bg, gap, C)
  }, [imgs, W, H, bg, gap, C, tick])

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX - imgs.length)
    if (arr.length === 0) return
    const newImgs: CollageImg[] = arr.map(f => {
      const id = uid++
      const url = URL.createObjectURL(f)
      const el = new Image()
      el.onload = () => setTick(t => t + 1)
      el.src = url
      return { id, url, el }
    })
    setImgs(prev => [...prev, ...newImgs])
  }

  function clearAll() {
    imgs.forEach(img => URL.revokeObjectURL(img.url))
    setImgs([])
  }

  function removeImg(id: number) {
    setImgs(prev => {
      const img = prev.find(i => i.id === id)
      if (img) URL.revokeObjectURL(img.url)
      return prev.filter(i => i.id !== id)
    })
  }

  function download() {
    if (imgs.length === 0) return
    const canvas = document.createElement('canvas')
    drawCollage(canvas, imgs, W, H, bg, gap, C)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'collage.png'
    a.click()
  }

  const btn = "px-4 py-2 text-sm rounded bg-forge-accent/10 text-forge-accent border border-forge-accent/30 hover:bg-forge-accent/20 transition-colors cursor-pointer self-start"
  const inputCls = "w-20 bg-forge-bg border border-forge-border text-forge-text rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-forge-accent"
  const chipBtn = (active: boolean) =>
    `px-2 py-0.5 text-xs rounded border transition-colors cursor-pointer ${
      active
        ? 'border-forge-accent/40 text-forge-accent bg-forge-accent/10'
        : 'border-forge-border text-forge-dim hover:border-forge-accent/40 hover:text-forge-accent'
    }`

  function onThumbDragStart(idx: number, id: number) {
    dragIdxRef.current = idx
    setDraggingId(id)
  }

  function onThumbDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const fromIdx = dragIdxRef.current
    if (fromIdx === null || fromIdx === idx) return
    dragIdxRef.current = idx
    setImgs(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
  }

  function onThumbDragEnd() {
    dragIdxRef.current = null
    setDraggingId(null)
  }

  function onThumbTouchStart(e: React.TouchEvent, idx: number) {
    const t = e.touches[0]
    touchDragRef.current = { fromIdx: idx, overIdx: null, startX: t.clientX, startY: t.clientY }
  }

  function onThumbTouchMove(e: React.TouchEvent) {
    const drag = touchDragRef.current
    if (!drag) return
    const t = e.touches[0]
    if (Math.abs(t.clientX - drag.startX) < 6 && Math.abs(t.clientY - drag.startY) < 6) return
    e.preventDefault()
    setDraggingId(imgs[drag.fromIdx]?.id ?? null)
    const under = document.elementFromPoint(t.clientX, t.clientY)
    const thumb = (under as HTMLElement | null)?.closest<HTMLElement>('[data-drag-idx]')
    if (thumb) drag.overIdx = Number(thumb.dataset.dragIdx)
  }

  function onThumbTouchEnd() {
    const drag = touchDragRef.current
    touchDragRef.current = null
    if (drag && drag.overIdx !== null && drag.fromIdx !== drag.overIdx) {
      setImgs(prev => {
        const next = [...prev]
        const [moved] = next.splice(drag.fromIdx, 1)
        next.splice(drag.overIdx!, 0, moved)
        return next
      })
    }
    setDraggingId(null)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-forge-text mb-6">Image Collage</h1>

      <div className="bg-forge-surface border border-forge-border rounded-lg p-6 flex flex-col gap-5">

        {/* Upload */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-forge-muted">Images ({imgs.length} / {MAX})</label>
            {imgs.length > 0 && (
              <button onClick={clearAll} className="text-xs text-forge-muted hover:text-red-400 transition-colors cursor-pointer">
                Clear all
              </button>
            )}
          </div>
          <FileDropZone accept="image/*" multiple inputRef={fileRef} className="p-6" onFiles={addFiles}>
            <p className="text-sm text-forge-muted">Drop images here or click to upload</p>
            <p className="text-xs text-forge-line mt-1">Up to {MAX} images · PNG, JPG, WEBP · all processing is local</p>
          </FileDropZone>
        </div>

        {/* Thumbnails */}
        {imgs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imgs.map((img, idx) => (
              <div
                key={img.id}
                data-drag-idx={idx}
                draggable
                onDragStart={() => onThumbDragStart(idx, img.id)}
                onDragOver={e => onThumbDragOver(e, idx)}
                onDragEnd={onThumbDragEnd}
                onTouchStart={e => onThumbTouchStart(e, idx)}
                onTouchMove={onThumbTouchMove}
                onTouchEnd={onThumbTouchEnd}
                className={`relative group shrink-0 cursor-grab active:cursor-grabbing transition-opacity ${draggingId === img.id ? 'opacity-40' : 'opacity-100'}`}
              >
                <img
                  src={img.url}
                  draggable={false}
                  className="w-14 h-14 object-cover rounded border border-forge-border pointer-events-none"
                  alt=""
                />
                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-white bg-black/50 rounded-b leading-tight py-0.5 pointer-events-none">
                  {idx + 1}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeImg(img.id) }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-forge-surface border border-forge-border text-forge-muted hover:text-forge-text text-xs leading-none flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >×</button>
              </div>
            ))}
            {imgs.length < MAX && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-14 h-14 rounded border-2 border-dashed border-forge-border hover:border-forge-line text-forge-line hover:text-forge-muted text-xl flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >+</button>
            )}
          </div>
        )}

        {/* Canvas size */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-forge-muted">Canvas size</label>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="number" inputMode="numeric" min={1} value={canvasW} onChange={e => setCanvasW(e.target.value)} className={inputCls} />
            <span className="text-xs text-forge-muted">×</span>
            <input type="number" inputMode="numeric" min={1} value={canvasH} onChange={e => setCanvasH(e.target.value)} className={inputCls} />
            <span className="text-xs text-forge-line">px</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CANVAS_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setCanvasW(String(p.w)); setCanvasH(String(p.h)) }}
                className={chipBtn(parseInt(canvasW) === p.w && parseInt(canvasH) === p.h)}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Background colour + spacing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-forge-muted">Background colour</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bg} onChange={e => setBg(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-forge-border bg-forge-bg p-0.5" />
              <span className="text-xs text-forge-muted font-mono">{bg}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-forge-muted">Spacing: <span className="text-forge-text">{gap}px</span></label>
            <input
              type="range" min={0} max={40} value={gap}
              onChange={e => setGap(Number(e.target.value))}
              className="w-full accent-forge-accent mt-1"
            />
          </div>
        </div>

        {/* Preview + download */}
        {imgs.length > 0 && (
          <div className="flex flex-col gap-3">
            <label className="text-xs text-forge-muted">Preview</label>
            <div className="bg-forge-bg rounded-lg p-3 flex justify-center overflow-hidden">
              <canvas ref={previewRef} className="max-w-full rounded" style={{ maxHeight: '60vh' }} />
            </div>
            <button onClick={download} className={btn}>Download PNG</button>
          </div>
        )}

      </div>
    </div>
  )
}
