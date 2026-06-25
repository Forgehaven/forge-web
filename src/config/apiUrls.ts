export const API_URLS = {
  ipGeo:              'https://ipapi.co',
  weather:            'https://api.open-meteo.com/v1/forecast',
  geocoding:          'https://geocoding-api.open-meteo.com/v1/search',
  currencyCdn:        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1',
  forgeAPI:           'https://api.forgehaven.io',
  horizonXiPlayers:   'https://horizonxi.com/players',
  horizonXiAvatarBase:'https://pub-8d18c77b6a6c43f2ae9fc4c782ef9b78.r2.dev/images/account/create-character/face',
  horizonXiWiki:      'https://horizonffxi.wiki',
  myMemory:           'https://api.mymemory.translated.net/get',
} as const

export const POLL_INTERVALS = {
  weather:  600_000,
  currency:  60_000,
} as const
