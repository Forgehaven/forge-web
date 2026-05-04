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
    <div className="px-3 py-1.5 border-b border-[#2a2d3a]">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2.5 py-1.5 text-xs text-[#e2e4ed] placeholder-[#6b7280] focus:outline-none focus:border-[#c4af64] pr-6"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#e2e4ed] transition-colors leading-none cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
