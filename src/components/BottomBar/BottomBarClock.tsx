import { useIPInfo } from '../../hooks/useIPInfo'
import { useClock } from '../../hooks/useClock'

export function BottomBarClock() {
  const { data: ip } = useIPInfo()
  const time = useClock(ip?.timezone ?? null)

  const tz = ip?.timezone
    ? ip.timezone.split('/').pop()?.replace(/_/g, ' ')
    : Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ')

  return (
    <>
      <span className="text-[#6b7280] hidden sm:inline">{tz}</span>
      <span className="text-[#e2e4ed] font-mono hidden sm:inline">{time}</span>
    </>
  )
}
