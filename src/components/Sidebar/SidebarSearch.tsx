export function SidebarSearch({
  query,
  onChange,
  placeholder = 'Search...',
}: {
  query: string
  onChange: (q: string) => void
  placeholder?: string
}) {
  return (
    <div className="px-3 py-1.5 border-b border-forge-border">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-forge-bg border border-forge-border rounded px-2.5 py-1.5 text-xs text-forge-text placeholder-forge-muted focus:outline-none focus:border-forge-accent pr-6"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-text transition-colors leading-none cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
