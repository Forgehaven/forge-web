import { useState } from 'react'

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const n = parseInt(clean, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function Badge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono ${
      pass
        ? 'bg-green-500/10 border-green-500/30 text-green-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      <span>{pass ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  )
}

export function ContrastChecker() {
  const [fg, setFg] = useState('#e2e4ed')
  const [bg, setBg] = useState('#0f1117')

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] font-mono w-40"

  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)
  const ratio = fgRgb && bgRgb
    ? contrastRatio(luminance(...fgRgb), luminance(...bgRgb))
    : null

  const aaLarge = ratio !== null && ratio >= 3
  const aa = ratio !== null && ratio >= 4.5
  const aaaLarge = ratio !== null && ratio >= 4.5
  const aaa = ratio !== null && ratio >= 7

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">Contrast Checker</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Foreground</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgRgb ? fg : '#000000'}
                onChange={e => setFg(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[#2a2d3a] bg-transparent"
              />
              <input
                className={inputClass}
                value={fg}
                onChange={e => setFg(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#6b7280] mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgRgb ? bg : '#ffffff'}
                onChange={e => setBg(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-[#2a2d3a] bg-transparent"
              />
              <input
                className={inputClass}
                value={bg}
                onChange={e => setBg(e.target.value)}
              />
            </div>
          </div>
        </div>

        {fgRgb && bgRgb && (
          <div
            className="w-full rounded-lg border border-[#2a2d3a] p-4 flex items-center justify-center"
            style={{ backgroundColor: bg }}
          >
            <p className="text-lg font-semibold" style={{ color: fg }}>
              Sample Text Preview
            </p>
          </div>
        )}

        {ratio !== null && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <p className="text-xs text-[#6b7280] mb-2">Contrast Ratio</p>
            <p className="font-mono text-2xl text-[#c4af64] mb-3">{ratio.toFixed(2)}:1</p>
            <div className="grid grid-cols-2 gap-2">
              <Badge pass={aa} label="AA Normal" />
              <Badge pass={aaLarge} label="AA Large" />
              <Badge pass={aaa} label="AAA Normal" />
              <Badge pass={aaaLarge} label="AAA Large" />
            </div>
          </div>
        )}

        {(!fgRgb || !bgRgb) && (
          <p className="text-xs text-red-400">Enter valid 6-digit hex colors</p>
        )}
      </div>
    </div>
  )
}
