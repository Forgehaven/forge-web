// Albion market locations. Values are the exact tokens the forge-api prices endpoint expects
// (no spaces); labels are for display. No Black Market - the price API covers royal cities + Brecilien.
export const CITIES: { value: string; label: string }[] = [
  { value: 'Caerleon', label: 'Caerleon' },
  { value: 'Bridgewatch', label: 'Bridgewatch' },
  { value: 'Martlock', label: 'Martlock' },
  { value: 'Thetford', label: 'Thetford' },
  { value: 'FortSterling', label: 'Fort Sterling' },
  { value: 'Lymhurst', label: 'Lymhurst' },
  { value: 'Brecilien', label: 'Brecilien' },
]

export const DEFAULT_CITY = 'Caerleon'

// Item quality tiers. Drives the prices request + display.
export const QUALITIES: { value: number; label: string }[] = [
  { value: 1, label: 'Normal' },
  { value: 2, label: 'Good' },
  { value: 3, label: 'Outstanding' },
  { value: 4, label: 'Excellent' },
  { value: 5, label: 'Masterpiece' },
]

export const DEFAULT_QUALITY = 1
