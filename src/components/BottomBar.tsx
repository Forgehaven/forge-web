import { useIPInfo, resetFetchInFlight } from '../hooks/useIPInfo'
import { useWeather } from '../hooks/useWeather'
import { useClock } from '../hooks/useClock'
import { useAppDispatch, useAppSelector } from '../store'
import { clearIP } from '../store/ipSlice'

function Divider({ className = '' }: { className?: string }) {
  return <span className={`text-[#2a2d3a] select-none ${className}`}>|</span>
}

export function BottomBar() {
  const dispatch = useAppDispatch()
  const ipStatus = useAppSelector(s => s.ip.status)
  const { data: ip, loading: ipLoading } = useIPInfo()
  const { weather, loading: weatherLoading } = useWeather(ip?.latitude ?? null, ip?.longitude ?? null)
  const time = useClock(ip?.timezone ?? null)

  const dim = 'text-[#6b7280]'
  const val = 'text-[#e2e4ed] font-mono'
  const placeholder = 'text-[#3a3d4a] font-mono'

  function handleRefresh() {
    resetFetchInFlight()
    dispatch(clearIP())
  }

  return (
    <footer className="h-10 bg-[#1a1d27] border-t border-[#2a2d3a] flex items-center px-4 gap-3 text-xs shrink-0 overflow-hidden">
      <span className={ipLoading ? placeholder : val}>
        {ipLoading ? '···' : (ip?.ip ?? '—')}
      </span>

      <Divider />
      <span className={ip ? val : placeholder}>
        {ipLoading ? '···' : ip ? `${ip.city}, ${ip.country_code}` : '—'}
      </span>

      <Divider />
      <span className={weather ? val : placeholder}>
        {weatherLoading ? '···' : (weather ?? '—')}
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className={`${dim} hidden sm:inline`}>
          {ip?.timezone
            ? ip.timezone.split('/').pop()?.replace(/_/g, ' ')
            : Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ')
          }
        </span>
        <span className={`${val} hidden sm:inline`}>{time}</span>
        <button
          onClick={handleRefresh}
          title="Refresh IP info"
          className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={ipStatus === 'loading' ? 'animate-spin' : ''}
          >
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
