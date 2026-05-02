import { useState, useMemo } from 'react'

interface UAResult {
  browser:  { name: string; version: string } | null
  engine:   { name: string; version: string } | null
  os:       { name: string; version: string } | null
  device:   'Mobile' | 'Tablet' | 'Desktop'
}

function parseUA(ua: string): UAResult {
  const isTablet = /Tablet|iPad/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
  const isMobile = !isTablet && /Mobile|Android|iPhone|iPod|Windows Phone/i.test(ua)
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'

  // OS
  let os: UAResult['os'] = null
  const winMatch = ua.match(/Windows NT ([\d.]+)/)
  if (winMatch) {
    const vMap: Record<string, string> = {
      '10.0': '10 / 11', '6.3': '8.1', '6.2': '8',
      '6.1': '7', '6.0': 'Vista', '5.1': 'XP',
    }
    os = { name: 'Windows', version: vMap[winMatch[1]] ?? winMatch[1] }
  } else if (/iPhone OS/.test(ua)) {
    const m = ua.match(/iPhone OS ([\d_]+)/)
    os = { name: 'iOS', version: m ? m[1].replace(/_/g, '.') : '' }
  } else if (/iPad/.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/)
    os = { name: 'iPadOS', version: m ? m[1].replace(/_/g, '.') : '' }
  } else if (/Android/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/)
    os = { name: 'Android', version: m ? m[1] : '' }
  } else if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_.]+)/)
    os = { name: 'macOS', version: m ? m[1].replace(/_/g, '.') : '' }
  } else if (/Linux/.test(ua)) {
    os = { name: 'Linux', version: '' }
  } else if (/CrOS/.test(ua)) {
    os = { name: 'ChromeOS', version: '' }
  }

  // Browser + engine (order matters — specialised tokens before generic ones)
  let browser: UAResult['browser'] = null
  let engine: UAResult['engine'] = null

  if (/Edg\//.test(ua)) {
    browser = { name: 'Edge', version: ua.match(/Edg\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Blink', version: '' }
  } else if (/OPR\//.test(ua)) {
    browser = { name: 'Opera', version: ua.match(/OPR\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Blink', version: '' }
  } else if (/SamsungBrowser\//.test(ua)) {
    browser = { name: 'Samsung Internet', version: ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Blink', version: '' }
  } else if (/YaBrowser\//.test(ua)) {
    browser = { name: 'Yandex Browser', version: ua.match(/YaBrowser\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Blink', version: '' }
  } else if (/Firefox\//.test(ua)) {
    browser = { name: 'Firefox', version: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Gecko', version: ua.match(/Gecko\/([\d.]+)/)?.[1] ?? '' }
  } else if (/Chrome\//.test(ua)) {
    browser = { name: 'Chrome', version: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'Blink', version: '' }
  } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
    browser = { name: 'Safari', version: ua.match(/Version\/([\d.]+)/)?.[1] ?? '' }
    engine  = { name: 'WebKit', version: ua.match(/WebKit\/([\d.]+)/)?.[1] ?? '' }
  } else if (/Trident\//.test(ua) || /MSIE/.test(ua)) {
    const m = ua.match(/(?:rv:|MSIE )([\d.]+)/)
    browser = { name: 'Internet Explorer', version: m?.[1] ?? '' }
    engine  = { name: 'Trident', version: ua.match(/Trident\/([\d.]+)/)?.[1] ?? '' }
  }

  return { browser, engine, os, device }
}

const DEVICE_ICON: Record<string, string> = {
  Desktop: '🖥️',
  Mobile:  '📱',
  Tablet:  '📋',
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-[#2a2d3a] last:border-0">
      <span className="text-xs text-[#6b7280] w-24 shrink-0">{label}</span>
      <span className={`text-sm text-[#e2e4ed] break-all ${mono ? 'font-mono text-[#c4af64]' : ''}`}>{value}</span>
    </div>
  )
}

export function UserAgentParser() {
  const [ua, setUa] = useState(() => navigator.userAgent)

  const result = useMemo(() => parseUA(ua), [ua])

  return (
    <div className="pb-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">User Agent Parser</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs text-[#6b7280] mb-1">User Agent string</label>
          <textarea
            className="bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] w-full font-mono resize-none"
            rows={3}
            value={ua}
            onChange={e => setUa(e.target.value)}
            spellCheck={false}
          />
        </div>

        <button
          onClick={() => setUa(navigator.userAgent)}
          className="self-start text-xs text-[#6b7280] hover:text-[#c4af64] transition-colors cursor-pointer border border-[#2a2d3a] rounded px-2.5 py-1 hover:border-[#c4af64]"
        >
          Use my browser's UA
        </button>

        {ua.trim() && (
          <div className="pt-2 border-t border-[#2a2d3a]">
            <Row label="Device"   value={`${DEVICE_ICON[result.device]} ${result.device}`} />
            <Row label="Browser"  value={[result.browser?.name, result.browser?.version].filter(Boolean).join(' ')} />
            <Row label="Engine"   value={[result.engine?.name, result.engine?.version].filter(Boolean).join(' ')} />
            <Row label="OS"       value={[result.os?.name, result.os?.version].filter(Boolean).join(' ')} />

            {!result.browser && !result.os && (
              <p className="text-xs text-[#6b7280] pt-2">Could not identify this user agent.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
