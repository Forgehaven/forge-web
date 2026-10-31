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
      className={`text-[10px] text-forge-muted font-mono hover:text-forge-accent transition-colors ${className}`}
    >
      {formatFetchedAt(date)}
    </a>
  )
}
