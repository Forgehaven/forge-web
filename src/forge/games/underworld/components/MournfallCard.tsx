// Promo for Mournfall, the Ottawa chapter of Underworld LARP.
export function MournfallCard({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-lg border border-[#800c18]/60 bg-gradient-to-br from-[#450303]/70 to-[#1a1d27] p-4 text-sm">
      <p className="text-[10px] uppercase tracking-widest text-[#e8a0a6]/70 mb-1">Play in Ottawa</p>
      <p className="font-semibold text-[#f3e6e7] mb-1">Mournfall</p>
      {!compact && (
        <p className="text-xs leading-relaxed text-[#d8c4c6] mb-3">
          Ottawa's home in Underworld LARP: 18+ dark fantasy, tent-camp weekends and medium-touch
          combat in a story running for over 20 years. Your first event is free.
        </p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <a href="https://mournfall.com/pages/getting-started" target="_blank" rel="noopener noreferrer" className="text-[#f0b9be] hover:underline">
          Getting started →
        </a>
        <a href="https://discord.gg/yq35tPfRGH" target="_blank" rel="noopener noreferrer" className="text-[#f0b9be] hover:underline">
          Discord →
        </a>
        {!compact && (
          <a href="https://mournfall.com/pages/our-events" target="_blank" rel="noopener noreferrer" className="text-[#f0b9be] hover:underline">
            Events →
          </a>
        )}
      </div>
    </aside>
  )
}
