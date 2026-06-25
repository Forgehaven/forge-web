import type { SCAttr } from './elements'

export type Avatar =
  | 'Carbuncle' | 'Fenrir' | 'Ifrit' | 'Titan'
  | 'Leviathan' | 'Garuda' | 'Shiva' | 'Ramuh' | 'Diabolos'

export interface BloodPact {
  name: string
  avatar: Avatar
  attrs: SCAttr[]
  level: number
}

export const AVATARS: Avatar[] = [
  'Carbuncle', 'Fenrir', 'Ifrit', 'Titan',
  'Leviathan', 'Garuda', 'Shiva', 'Ramuh', 'Diabolos',
]

export const AVATAR_LEVELS: Record<Avatar, number> = {
  Carbuncle: 1,
  Fenrir: 1,
  Ifrit: 20,
  Titan: 30,
  Leviathan: 38,
  Garuda: 45,
  Shiva: 50,
  Ramuh: 56,
  Diabolos: 1,
}

export function getAvailableAvatars(level: number): Avatar[] {
  return AVATARS.filter(a => level >= AVATAR_LEVELS[a])
}

export const BLOOD_PACTS: BloodPact[] = [
  { name: 'Claw',           avatar: 'Garuda',    attrs: ['Detonation'],    level: 1 },
  { name: 'Rock Throw',     avatar: 'Titan',     attrs: ['Scission'],      level: 1 },
  { name: 'Axe Kick',       avatar: 'Shiva',     attrs: ['Induration'],    level: 1 },
  { name: 'Punch',          avatar: 'Ifrit',     attrs: ['Liquefaction'],  level: 1 },
  { name: 'Shock Strike',   avatar: 'Ramuh',     attrs: ['Impaction'],     level: 1 },
  { name: 'Barracuda Dive', avatar: 'Leviathan', attrs: ['Reverberation'], level: 1 },
  { name: 'Camisado',       avatar: 'Diabolos',  attrs: ['Compression'],   level: 1 },
  { name: 'Poison Nails',   avatar: 'Carbuncle', attrs: ['Transfixion'],   level: 5 },
  { name: 'Moonlit Charge', avatar: 'Fenrir',    attrs: ['Compression'],   level: 5 },
  { name: 'Crescent Fang',  avatar: 'Fenrir',    attrs: ['Transfixion'],   level: 10 },
  { name: 'Rock Buster',    avatar: 'Titan',     attrs: ['Reverberation'], level: 21 },
  { name: 'Burning Strike', avatar: 'Ifrit',     attrs: ['Impaction'],     level: 23 },
  { name: 'Tail Whip',      avatar: 'Leviathan', attrs: ['Detonation'],    level: 26 },
  { name: 'Double Punch',   avatar: 'Ifrit',     attrs: ['Compression'],   level: 30 },
  { name: 'Megalith Throw', avatar: 'Titan',     attrs: ['Induration'],    level: 35 },
  { name: 'Double Slap',    avatar: 'Shiva',     attrs: ['Scission'],      level: 50 },
]

export function getBloodPacts(avatar: Avatar, level: number): BloodPact[] {
  return BLOOD_PACTS.filter(bp => bp.avatar === avatar && level >= bp.level)
}
