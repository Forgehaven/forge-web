import { useAppDispatch, useAppSelector } from '../../store'
import { clearIP } from '../../store/ipSlice'
import { resetFetchInFlight } from '../../hooks/useIPInfo'

export function BottomBarRefresh() {
  const dispatch = useAppDispatch()
  const ipStatus = useAppSelector(s => s.ip.status)

  return (
    <button
      onClick={() => { dispatch(clearIP()); resetFetchInFlight() }}
      title="Refresh IP info"
      className="text-[#6b7280] hover:text-[#e2e4ed] transition-colors cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={ipStatus === 'loading' ? 'animate-spin' : ''}>
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M3 22v-6h6" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      </svg>
    </button>
  )
}
