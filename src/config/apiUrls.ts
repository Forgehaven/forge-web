export const API_URLS = {
  ipGeo:       'https://ipapi.co',
  weather:     'https://api.open-meteo.com/v1/forecast',
  geocoding:   'https://geocoding-api.open-meteo.com/v1/search',
  currencyCdn: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1',
} as const

export const POLL_INTERVALS = {
  weather:  600_000,
  currency:  60_000,
} as const
