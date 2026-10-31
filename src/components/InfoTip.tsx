// A small "?" affordance that reveals an explanatory tooltip on hover or keyboard focus.
// App-wide (not game-specific). The tooltip is absolutely positioned and pointer-transparent
// so it never blocks clicks; it anchors to the icon's right edge by default and extends left,
// so it stays on-screen when the icon sits near the right of its container.
export function InfoTip({ text, side = 'right', className }: {
  text: string
  side?: 'left' | 'right'
  className?: string
}) {
  return (
    <span className={`group relative inline-flex items-center ${className ?? ''}`}>
      <button
        type="button"
        aria-label="More information"
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-forge-line text-[10px] leading-none text-forge-dim transition-colors hover:border-forge-accent hover:text-forge-accent focus:border-forge-accent focus:text-forge-accent focus:outline-none"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-5 z-50 w-56 rounded-md border border-forge-border bg-forge-surface p-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-forge-soft opacity-0 shadow-xl transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100 ${side === 'right' ? 'right-0' : 'left-0'}`}
      >
        {text}
      </span>
    </span>
  )
}
