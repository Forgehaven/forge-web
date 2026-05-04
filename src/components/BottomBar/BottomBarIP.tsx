import { useState, useRef } from 'react'
import { useIPInfo } from '../../hooks/useIPInfo'
import { API_URLS } from '../../config/apiUrls'
import { Popup, StatRow, PopupTimestamp } from '../Popup'
import type { PopupPos } from '../Popup'

const bb    = 'text-[#e2e4ed] font-mono'
const bbDim = 'text-[#3a3d4a] font-mono'

export function BottomBarIP() {
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
        {loading ? '···' : (ip?.ip ?? '—')}
      </button>
      {open && ip && pos && (
        <Popup pos={pos} triggerRef={btnRef} onClose={() => setOpen(false)}>
          <StatRow label="IP"   value={ip.ip} />
          <StatRow label="Type" value={ip.version} />
          <StatRow label="ASN"  value={ip.asn} />
          <StatRow label="TLD"  value={ip.country_tld} />
          {fetchedAt && <PopupTimestamp date={fetchedAt} url={ipApiUrl} />}
        </Popup>
      )}
    </>
  )
}
