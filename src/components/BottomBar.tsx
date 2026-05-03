import { useState, useRef } from 'react'
import { useIPInfo, resetFetchInFlight } from '../hooks/useIPInfo'
import { useWeather } from '../hooks/useWeather'
import { useClock } from '../hooks/useClock'
import { useAppDispatch, useAppSelector } from '../store'
import { clearIP } from '../store/ipSlice'
import { flagUrl } from '../lib/geo'
import { Popup, StatRow, PopupDivider, PopupTimestamp } from './Popup'
import type { PopupPos } from './Popup'

function Divider() {
  return <span className="text-[#2a2d3a] select-none">|</span>
}

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

export function BottomBar() {
  const dispatch = useAppDispatch()
  const ipStatus = useAppSelector(s => s.ip.status)
  const { data: ip, loading: ipLoading, fetchedAt: ipFetchedAt } = useIPInfo()
  const ipApiUrl = 'https://ipapi.co/json/'
  const { weather, loading: weatherLoading, fetchedAt, apiUrl } = useWeather(ip?.latitude ?? null, ip?.longitude ?? null)
  const time = useClock(ip?.timezone ?? null)

  const [ipOpen,  setIpOpen]  = useState(false)
  const [ipPos,   setIpPos]   = useState<PopupPos | null>(null)
  const [locOpen, setLocOpen] = useState(false)
  const [locPos,  setLocPos]  = useState<PopupPos | null>(null)
  const [wxOpen,  setWxOpen]  = useState(false)
  const [wxPos,   setWxPos]   = useState<PopupPos | null>(null)

  const ipBtnRef  = useRef<HTMLButtonElement>(null)
  const locBtnRef = useRef<HTMLButtonElement>(null)
  const wxBtnRef  = useRef<HTMLButtonElement>(null)

  function openPopup(
    btnRef: React.RefObject<HTMLButtonElement | null>,
    setOpen: (v: boolean) => void,
    setPos: (p: PopupPos) => void,
    isOpen: boolean,
  ) {
    if (isOpen) { setOpen(false); return }
    setIpOpen(false); setLocOpen(false); setWxOpen(false)
    const r = btnRef.current?.getBoundingClientRect()
    if (r) setPos({ left: r.left })
    setOpen(true)
  }

  const val          = 'text-[#e2e4ed] font-mono'
  const placeholder  = 'text-[#3a3d4a] font-mono'
  const activeCls    = `${val} text-[#c4af64]`
  const clickableCls = `${val} hover:text-[#c4af64] transition-colors cursor-pointer`

  return (
    <footer className="h-10 bg-[#1a1d27] border-t border-[#2a2d3a] flex items-center px-2 sm:px-4 gap-1.5 sm:gap-3 text-xs shrink-0 overflow-hidden">

      {/* IP */}
      <button
        ref={ipBtnRef}
        onClick={() => openPopup(ipBtnRef, setIpOpen, setIpPos, ipOpen)}
        disabled={!ip}
        className={!ip ? placeholder : ipOpen ? activeCls : clickableCls}
      >
        {ipLoading ? '···' : (ip?.ip ?? '—')}
      </button>

      {ipOpen && ip && ipPos && (
        <Popup pos={ipPos} triggerRef={ipBtnRef} onClose={() => setIpOpen(false)}>
          <StatRow label="IP"   value={ip.ip} />
          <StatRow label="Type" value={ip.version} />
          <StatRow label="ASN"  value={ip.asn} />
          <StatRow label="TLD"  value={ip.country_tld} />
          {ipFetchedAt && <PopupTimestamp date={ipFetchedAt} url={ipApiUrl} />}
        </Popup>
      )}

      <Divider />

      {/* Location */}
      <button
        ref={locBtnRef}
        onClick={() => openPopup(locBtnRef, setLocOpen, setLocPos, locOpen)}
        disabled={!ip}
        className={!ip ? placeholder : locOpen ? activeCls : clickableCls}
      >
        {ipLoading ? '···' : ip
          ? <>{ip.city}, {ip.country_code} <img src={flagUrl(ip.country_code)} alt={ip.country_code} className="w-4 inline-block align-middle ml-0.5" /></>
          : '—'}
      </button>

      {locOpen && ip && locPos && (
        <Popup pos={locPos} triggerRef={locBtnRef} onClose={() => setLocOpen(false)}>
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
          {ipFetchedAt && <PopupTimestamp date={ipFetchedAt} url={ipApiUrl} />}
        </Popup>
      )}

      <Divider />

      {/* Weather */}
      <button
        ref={wxBtnRef}
        onClick={() => openPopup(wxBtnRef, setWxOpen, setWxPos, wxOpen)}
        disabled={!weather}
        className={!weather ? placeholder : wxOpen ? activeCls : clickableCls}
      >
        {weatherLoading ? '···' : (weather?.summary ?? '—')}
      </button>

      {wxOpen && weather && wxPos && (
        <Popup pos={wxPos} triggerRef={wxBtnRef} onClose={() => setWxOpen(false)}>
          <StatRow label="Wind"     value={weather.wind} />
          <StatRow label="Humidity" value={weather.humidity} />
          <StatRow label="UV"       value={weather.uv} />
          <StatRow label="Cloud"    value={weather.cloud} />
          <StatRow label="Pressure" value={weather.pressure} />
          <StatRow label="Precip"   value={weather.precipitation} />
          {fetchedAt && apiUrl && <PopupTimestamp date={fetchedAt} url={apiUrl} />}
        </Popup>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="text-[#6b7280] hidden sm:inline">
          {ip?.timezone
            ? ip.timezone.split('/').pop()?.replace(/_/g, ' ')
            : Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ')}
        </span>
        <span className={`${val} hidden sm:inline`}>{time}</span>
        <button onClick={() => { dispatch(clearIP()); resetFetchInFlight() }} title="Refresh IP info" className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ipStatus === 'loading' ? 'animate-spin' : ''}>
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>
    </footer>
  )
}
