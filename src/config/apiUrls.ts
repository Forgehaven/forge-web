export const DISCORD_CLIENT_ID = '1519734763139633354'

export const API_URLS = {
  ipGeo:              'https://ipapi.co',
  weather:            'https://api.open-meteo.com/v1/forecast',
  geocoding:          'https://geocoding-api.open-meteo.com/v1/search',
  currencyCdn:        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1',
  forgeAPI:           typeof __API_URL__ !== 'undefined' ? __API_URL__ : 'https://api.forgehaven.io',
  discordAuthorize:   'https://discord.com/api/oauth2/authorize',
  horizonXiPlayers:   'https://horizonxi.com/players',
  horizonXiAvatarBase:'https://pub-8d18c77b6a6c43f2ae9fc4c782ef9b78.r2.dev/images/account/create-character/face',
} as const

export const POLL_INTERVALS = {
  weather:  600_000,
  currency:  60_000,
} as const
