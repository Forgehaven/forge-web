import { formatFetchedAt } from '../lib/weather'

interface FetchedAtLinkProps {
  date: Date
  url: string
  className?: string
}

export function FetchedAtLink({ date, url, className = '' }: FetchedAtLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-[10px] text-[#6b7280] font-mono hover:text-[#c4af64] transition-colors ${className}`}
    >
      {formatFetchedAt(date)}
    </a>
  )
}
