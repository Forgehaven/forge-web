import { useState, useRef } from 'react'
import { useIPInfo } from '../../hooks/useIPInfo'
import { useWeather } from '../../hooks/useWeather'
import { Popup, StatRow, PopupTimestamp } from '../Popup'
import type { PopupPos } from '../Popup'

const bb    = 'text-[#e2e4ed] font-mono'
const bbDim = 'text-[#3a3d4a] font-mono'

export function BottomBarWeather() {
  const { data: ip } = useIPInfo()
  const { weather, loading, fetchedAt, apiUrl } = useWeather(ip?.latitude ?? null, ip?.longitude ?? null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<PopupPos | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  function toggle() {
    if (open) { setOpen(false); return }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ left: r.left })
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={!weather}
        className={!weather ? bbDim : open ? `${bb} text-[#c4af64]` : `${bb} hover:text-[#c4af64] transition-colors cursor-pointer`}
      >
        {loading ? '···' : (weather?.summary ?? '—')}
      </button>
      {open && weather && pos && (
        <Popup pos={pos} triggerRef={btnRef} onClose={() => setOpen(false)}>
          <StatRow label="Wind"     value={weather.wind} />
          <StatRow label="Humidity" value={weather.humidity} />
          <StatRow label="UV"       value={weather.uv} />
          <StatRow label="Cloud"    value={weather.cloud} />
          <StatRow label="Pressure" value={weather.pressure} />
          <StatRow label="Precip"   value={weather.precipitation} />
          {fetchedAt && apiUrl && <PopupTimestamp date={fetchedAt} url={apiUrl} />}
        </Popup>
      )}
    </>
  )
}
