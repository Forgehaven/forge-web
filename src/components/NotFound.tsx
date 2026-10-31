import { Link } from 'react-router-dom'

interface NotFoundProps {
  backTo?: string
  backLabel?: string
}

export function NotFound({ backTo = '/', backLabel = 'Go home' }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">
      <p className="text-6xl font-bold text-forge-border mb-4">404</p>
      <h1 className="text-xl font-semibold text-forge-text mb-2">Page not found</h1>
      <p className="text-sm text-forge-muted mb-6">
        This page doesn't exist or was moved.
      </p>
      <Link
        to={backTo}
        className="px-4 py-2 text-sm rounded bg-forge-accent/10 text-forge-accent border border-forge-accent/30 hover:bg-forge-accent/20 transition-colors"
      >
        {backLabel}
      </Link>
    </div>
  )
}
