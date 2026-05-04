export function GamesHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">
      <img
        src="/images/logo.png"
        alt="Forgehaven"
        className="w-16 h-16 mb-5 opacity-40"
      />
      <h1 className="text-2xl font-semibold text-[#e2e4ed] mb-2 tracking-wide">
        Forge<span className="text-[#c4af64]">Games</span>
      </h1>
      <p className="text-sm text-[#6b7280]">Games coming soon.</p>
    </div>
  )
}
