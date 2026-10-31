import { Link } from 'react-router-dom'
import ffxiLogo from './ffxi/ffxi-logo.png'
import underworldLogo from './underworld/underworld-logo.png'

export function GamesHome() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center select-none">
      <img
        src="/images/logo.png"
        alt="Forgehaven"
        className="w-16 h-16 mb-5 opacity-40"
      />
      <h1 className="text-2xl font-semibold text-forge-text mb-2 tracking-wide">
        Forge<span className="text-forge-accent">Games</span>
      </h1>
      <p className="text-sm text-forge-muted">Games coming soon.</p>

      <div className="w-full max-w-xs border-t border-forge-border mt-6 pt-5">
        <p className="text-sm text-forge-dim mb-4">Check out tools for games:</p>
        <div className="flex items-start justify-center gap-8">
          <Link
            to="/games/ffxi"
            className="group flex flex-col items-center gap-2 text-sm text-forge-dim hover:text-forge-text transition-colors"
          >
            <img
              src={ffxiLogo}
              alt=""
              className="w-12 h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
            FFXI Horizon
          </Link>
          <Link
            to="/games/underworld"
            className="group flex flex-col items-center gap-2 text-sm text-forge-dim hover:text-forge-text transition-colors"
          >
            <img
              src={underworldLogo}
              alt=""
              className="w-12 h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
            Underworld LARP
          </Link>
        </div>
      </div>
    </div>
  )
}
