// FFXI Zone / Teleport Data - HorizonXI
// Source: horizonffxi.wiki/Outpost_Teleportation, /Teleport_(Spell)

// ---------------------------------------------------------------------------
// Outpost data
// ---------------------------------------------------------------------------

export type Access = { lv: number; owned: number; notOwned: number }
export type Outpost = { zone: string; region: string; home: Access; jeuno: Access }

// Conquest-influence regions with no outpost (no teleport, no costs): they
// still count toward the weekly tally standings. Owners map keys by region.
export const NO_OUTPOST_REGIONS = ['Movalpolos', "Tu'Lia"] as const

export const OUTPOSTS: Outpost[] = [
  { zone: 'North Gustaberg',         region: 'Gustaberg',             home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'West Ronfaure',           region: 'Ronfaure',              home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'West Sarutabaruta',       region: 'Sarutabaruta',          home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Valkurm Dunes',           region: 'Zulkheim',              home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Buburimu Peninsula',      region: 'Kolshushu',             home: { lv: 20, owned: 200,  notOwned: 800  }, jeuno: { lv: 10, owned: 250,  notOwned: 1000 } },
  { zone: 'Meriphataud Mountains',   region: 'Aragoneu',              home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Pashhow Marshlands',      region: 'Derfland',              home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Jugner Forest',           region: 'Norvallen',             home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Qufim Island',            region: 'Qufim',                 home: { lv: 25, owned: 250,  notOwned: 1000 }, jeuno: { lv: 15, owned: 300,  notOwned: 1200 } },
  { zone: 'Lufaise Meadows',         region: 'Tavnazian Archipelago', home: { lv: 30, owned: 300,  notOwned: 1200 }, jeuno: { lv: 30, owned: 350,  notOwned: 1750 } },
  { zone: 'Yuhtunga Jungle',         region: 'Elshimo Lowlands',      home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 25, owned: 400,  notOwned: 1600 } },
  { zone: 'Beaucedine Glacier',      region: 'Fauregandi',            home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 35, owned: 400,  notOwned: 1600 } },
  { zone: "The Sanctuary of Zi'Tah", region: "Li'Telor",              home: { lv: 35, owned: 350,  notOwned: 1400 }, jeuno: { lv: 25, owned: 400,  notOwned: 1600 } },
  { zone: 'Eastern Altepa Desert',   region: 'Kuzotz',                home: { lv: 40, owned: 400,  notOwned: 1600 }, jeuno: { lv: 30, owned: 450,  notOwned: 1800 } },
  { zone: 'Xarcabard',               region: 'Valdeaunia',            home: { lv: 40, owned: 400,  notOwned: 1600 }, jeuno: { lv: 40, owned: 450,  notOwned: 1800 } },
  { zone: 'Yhoator Jungle',          region: 'Elshimo Uplands',       home: { lv: 45, owned: 450,  notOwned: 1800 }, jeuno: { lv: 35, owned: 350,  notOwned: 2000 } },
  { zone: 'Cape Teriggan',           region: 'Vollbow',               home: { lv: 65, owned: 650,  notOwned: 2600 }, jeuno: { lv: 50, owned: 500,  notOwned: 3500 } },
]

// ---------------------------------------------------------------------------
// WHM Teleport spell destinations
// Source: horizonffxi.wiki/Teleport_(Spell)
// ---------------------------------------------------------------------------

export type TeleportDestination = { crag: string; zone: string }

export const TELEPORT_DESTINATIONS: Record<string, TeleportDestination> = {
  'Teleport-Dem':   { crag: 'Dem',   zone: 'Konschtat Highlands'  },
  'Teleport-Holla': { crag: 'Holla', zone: 'La Theine Plateau'    },
  'Teleport-Mea':   { crag: 'Mea',   zone: 'Tahrongi Canyon'      },
  'Teleport-Altep': { crag: 'Altep', zone: 'Eastern Altepa Desert' },
  'Teleport-Yhoat': { crag: 'Yhoat', zone: 'Yhoator Jungle'       },
  'Teleport-Vahzl': { crag: 'Vahzl', zone: 'Beaucedine Glacier'   },
}
