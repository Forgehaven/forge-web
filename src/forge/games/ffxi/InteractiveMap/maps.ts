import { MAP_IDS } from './mapIds'

export interface MapEntry {
  id: string
  name: string
  file: string
}

// Post-title-case substring fixes for FFXI's apostrophes and stylings.
const FIXUPS: [string, string][] = [
  ["San Doria", "San d'Oria"],
  ['Delkfutts', "Delkfutt's"],
  ['Behemoths Dominion', "Behemoth's Dominion"],
  ['Crawlers Nest', "Crawlers' Nest"],
  ['Rulude', "Ru'Lude"],
  ['Ruaun', "Ru'Aun"],
  ['Altaieu', "Al'Taieu"],
  ['Psoxja', "Pso'Xja"],
  ['Doraguille', "d'Oraguille"],
  ['Zitah', "Zi'Tah"],
  ['Feiyin', "Fei'Yin"],
  ['Qubia', "Qu'Bia"],
  ['Ranperres', "Ranperre's"],
  ['Ordelles', "Ordelle's"],
  ['Ifrits', "Ifrit's"],
  ['Romaeve', "Ro'Maeve"],
  ['Huxzol', "Hu'Xzol"],
  ['Sealions', "Sealion's"],
  ['Balgas', "Balga's"],
  ['Carpenters Landing', "Carpenters' Landing"],
  ['#a01', '#A01'],
  ['#b01', '#B01'],
  [' Of ', ' of '],
  [' The ', ' the '],
]

function nameFor(id: string): string {
  const parts = id.split('_')
  const floor = /^\d+$/.test(parts[parts.length - 1]) ? parts.pop() : null
  let name = parts
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  for (const [from, to] of FIXUPS) name = name.replace(from, to)
  return floor ? `${name} (${floor})` : name
}

export const MAPS: MapEntry[] = MAP_IDS
  .map(id => ({ id, name: nameFor(id), file: `${id}.webp` }))
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
