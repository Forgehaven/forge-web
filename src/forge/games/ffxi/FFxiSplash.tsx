import logo from './ffxi-logo.png'

export function FFxiSplash() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">
      <img src={logo} alt="FFXI" className="w-16 h-16 mb-5 object-contain opacity-60" />
      <h1 className="text-2xl font-semibold text-[#e2e4ed] mb-2 tracking-wide">
        Horizon<span className="text-[#c4af64]">XI</span>
      </h1>
      <p className="text-sm text-[#6b7280]">Select a tool from the sidebar.</p>
      <a
        href="https://horizonxi.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#c4af64] hover:underline mt-4"
      >
        HorizonXI Homepage →
      </a>
    </div>
  )
}
