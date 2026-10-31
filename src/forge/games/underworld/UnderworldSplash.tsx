import { Link } from 'react-router-dom'
import { MournfallCard } from './components/MournfallCard'
import logo from './underworld-logo.png'

export function UnderworldSplash() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center gap-6">
      <div className="flex flex-col items-center">
        <img src={logo} alt="Underworld LARP" className="w-16 h-16 mb-5 object-contain opacity-60" />
        <h1 className="text-2xl font-semibold text-forge-text mb-2 tracking-wide">
          Underworld <span className="text-forge-accent">LARP</span>
        </h1>
        <p className="text-sm text-forge-muted">Unofficial planning tools for Underworld LARP players.</p>
      </div>
      <div className="flex gap-6 text-sm">
        <Link to="/games/underworld/planner" className="text-forge-accent hover:underline">Character Planner →</Link>
        <Link to="/games/underworld/compendium" className="text-forge-accent hover:underline">Rules Compendium →</Link>
        <a href="https://underworldlarp.com" target="_blank" rel="noopener noreferrer" className="text-forge-accent hover:underline">underworldlarp.com →</a>
      </div>
      <div className="w-full max-w-sm text-left"><MournfallCard /></div>
    </div>
  )
}
