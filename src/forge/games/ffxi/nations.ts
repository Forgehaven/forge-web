import bastokIcon from './data/BastokIcon.png'
import windurstIcon from './data/WindurstIcon.png'
import sandoriaIcon from './data/SandoriaIcon.png'

export type NationMeta = { name: string; symbol: string; color: string; icon?: string }

// Char-API nation id space (0 San d'Oria, 1 Bastok, 2 Windurst) - used by
// tools keyed to registered characters. FactionConquest keeps its own 1-4 map
// (it adds Beastmen and predates the char API).
export const CHAR_NATIONS: Record<number, NationMeta> = {
  0: { name: "San d'Oria", symbol: '⚔', color: '#c0453a', icon: sandoriaIcon },
  1: { name: 'Bastok',     symbol: '⚙', color: '#5b8db8', icon: bastokIcon },
  2: { name: 'Windurst',   symbol: '✦', color: '#8aab7e', icon: windurstIcon },
}
