import { Link } from 'react-router-dom'
import ffxiLogo from './ffxi/ffxi-logo.png'
import albionLogo from './albion/albion-logo.png'

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

      <div className="w-full max-w-xs border-t border-[#2a2d3a] mt-6 pt-5">
        <p className="text-sm text-[#9ca3af] mb-4">Check out tools for games:</p>
        <div className="flex items-start justify-center gap-8">
          <Link
            to="/games/ffxi"
            className="group flex flex-col items-center gap-2 text-sm text-[#9ca3af] hover:text-[#e2e4ed] transition-colors"
          >
            <img
              src={ffxiLogo}
              alt=""
              className="w-12 h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
            FFXI Horizon
          </Link>
          <Link
            to="/games/albion"
            className="group flex flex-col items-center gap-2 text-sm text-[#9ca3af] hover:text-[#e2e4ed] transition-colors"
          >
            <img
              src={albionLogo}
              alt=""
              className="h-12 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
            Albion Online
          </Link>
        </div>
      </div>
    </div>
  )
}
