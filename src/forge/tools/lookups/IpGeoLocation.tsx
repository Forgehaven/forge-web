import { useState, useEffect } from 'react'
import { useIPInfo } from '../../../hooks/useIPInfo'
import { API_URLS } from '../../../config/apiUrls'

interface GeoData {
  ip: string
  city: string
  region: string
  country_name: string
  country_code: string
  postal: string
  latitude: number
  longitude: number
  timezone: string
  org: string
  asn: string
}

export function IpGeoLocation() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GeoData | null>(null)
  const [error, setError] = useState('')
  const { data: cachedIP, loading: ipLoading } = useIPInfo()

  // On mount, populate with cached IP data if available
  useEffect(() => {
    if (cachedIP && !data) {
      setData({ // eslint-disable-line react-hooks/set-state-in-effect
        ip: cachedIP.ip,
        city: cachedIP.city,
        region: '',
        country_name: '',
        country_code: cachedIP.country_code,
        postal: '',
        latitude: cachedIP.latitude,
        longitude: cachedIP.longitude,
        timezone: cachedIP.timezone,
        org: cachedIP.org,
        asn: '',
      })
    }
  }, [cachedIP]) // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(ip?: string) {
    // For own IP, use the Redux cache if fresh
    if (!ip && cachedIP) {
      setData({
        ip: cachedIP.ip,
        city: cachedIP.city,
        region: '',
        country_name: '',
        country_code: cachedIP.country_code,
        postal: '',
        latitude: cachedIP.latitude,
        longitude: cachedIP.longitude,
        timezone: cachedIP.timezone,
        org: cachedIP.org,
        asn: '',
      })
      setError('')
      return
    }

    setLoading(true)
    setError('')
    setData(null)
    try {
      const url = ip ? `${API_URLS.ipGeo}/${ip.trim()}/json/` : `${API_URLS.ipGeo}/json/`
      const res = await fetch(url)
      const json = await res.json()
      if (json.error) throw new Error(json.reason ?? 'Lookup failed')
      setData(json)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lookup failed'
      const isRateLimit = msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('throttl') || msg.toLowerCase().includes('limit')
      setError(isRateLimit
        ? 'Lookup failed - you\'ve likely hit the 1,000/day free limit. Try again tomorrow.'
        : `${msg} - you may have hit the daily free limit (1,000 lookups/day).`
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "bg-[#0f1117] border border-[#2a2d3a] text-[#e2e4ed] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#c4af64] flex-1 font-mono"
  const btnClass = "px-4 py-2 text-sm rounded bg-[#c4af64]/10 text-[#c4af64] border border-[#c4af64]/30 hover:bg-[#c4af64]/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

  const rows: [string, string][] = data ? [
    ['IP Address',  data.ip],
    ['City',        data.city],
    ['Region',      data.region],
    ['Country',     `${data.country_name} (${data.country_code})`],
    ['Postal',      data.postal],
    ['Coordinates', `${data.latitude}, ${data.longitude}`],
    ['Timezone',    data.timezone],
    ['ISP / Org',   data.org],
    ['ASN',         data.asn],
  ].filter(([, v]) => v && v !== 'undefined') as [string, string][] : []

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[#e2e4ed] mb-6">IP Geolocation</h1>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-6 flex flex-col gap-5">

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup(input || undefined)}
            placeholder="IP address (leave blank for your own)"
            className={inputClass}
          />
          <button onClick={() => lookup(input || undefined)} disabled={loading} className={btnClass}>
            {loading ? 'Looking up…' : 'Lookup'}
          </button>
          <button onClick={() => { setInput(''); lookup(undefined) }} disabled={loading || ipLoading} className={btnClass}>
            My IP
          </button>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {data && (
          <div className="bg-[#0f1117] rounded-lg px-4 pt-2 pb-1">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center gap-4 py-2 border-b border-[#2a2d3a] last:border-0">
                <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
                {label === 'Coordinates' ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-[#e2e4ed] font-mono">{value}</span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}&zoom=12`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#6b7280] hover:text-[#c4af64] underline transition-colors"
                    >
                      OpenStreetMap
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#6b7280] hover:text-[#c4af64] underline transition-colors"
                    >
                      Google Maps
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-[#e2e4ed] font-mono">{value}</span>
                )}
              </div>
            ))}
          </div>
        )}


</div>
    </div>
  )
}
