import { useState, useRef } from 'react'
import { useIPInfo } from '../../hooks/useIPInfo'
import { API_URLS } from '../../config/apiUrls'
import { flagUrl } from '../../lib/geo'
import { Popup, StatRow, PopupDivider, PopupTimestamp } from '../Popup'
import type { PopupPos } from '../Popup'

const bb    = 'text-[#e2e4ed] font-mono'
const bbDim = 'text-[#3a3d4a] font-mono'

function formatUtcOffset(offset: string): string {
  if (!offset || offset.length < 5) return offset
  return `UTC${offset[0]}${offset.slice(1, 3)}:${offset.slice(3, 5)}`
}

function formatPop(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toLocaleString()
}

function formatLatLon(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`
}

function formatLanguages(codes: string): string {
  if (!codes) return ''
  const dn = new Intl.DisplayNames(['en'], { type: 'language' })
  const seen = new Set<string>()
  return codes.split(',')
    .map(c => { try { return dn.of(c.trim()) ?? c.trim() } catch { return c.trim() } })
    .filter(name => { if (seen.has(name)) return false; seen.add(name); return true })
    .join(', ')
}

export function BottomBarLocation() {
  const { data: ip, loading, fetchedAt } = useIPInfo()
  const ipApiUrl = `${API_URLS.ipGeo}/json/`
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
        disabled={!ip}
        className={!ip ? bbDim : open ? `${bb} text-[#c4af64]` : `${bb} hover:text-[#c4af64] transition-colors cursor-pointer`}
      >
        {loading ? '···' : ip
          ? <>{ip.city}, {ip.country_code} <img src={flagUrl(ip.country_code)} alt={ip.country_code} className="w-4 inline-block align-middle ml-0.5" /></>
          : '—'}
      </button>
      {open && ip && pos && (
        <Popup pos={pos} triggerRef={btnRef} onClose={() => setOpen(false)}>
          <StatRow label="City"         value={ip.city} />
          <StatRow label="Region"       value={ip.region} />
          <StatRow label="Region Code"  value={ip.region_code} />
          <StatRow label="Country"      value={ip.country} />
          <StatRow label="Country Code" value={ip.country_code} />
          <StatRow label="Capital"      value={ip.country_capital} />
          {ip.country_population > 0 && <StatRow label="Population" value={formatPop(ip.country_population)} />}
          <StatRow label="Continent"    value={ip.continent_code} />
          <StatRow label="In EU"        value={ip.in_eu ? 'Yes' : 'No'} />
          {ip.postal && <StatRow label="Postal" value={ip.postal} />}
          <StatRow label="Coordinates"  value={formatLatLon(ip.latitude, ip.longitude)} />
          <PopupDivider />
          <StatRow label="Timezone"     value={ip.timezone} />
          <StatRow label="UTC Offset"   value={formatUtcOffset(ip.utc_offset)} />
          <StatRow label="Currency"     value={`${ip.currency} · ${ip.currency_name}`} />
          <StatRow label="Languages"    value={formatLanguages(ip.languages)} />
          {fetchedAt && <PopupTimestamp date={fetchedAt} url={ipApiUrl} />}
        </Popup>
      )}
    </>
  )
}
