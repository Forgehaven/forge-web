import { API_URLS } from '../config/apiUrls'

// Item icons ride forge-api's caching proxy (GET /game/albion/icon/{id}, public, 7-day
// immutable browser cache) instead of hitting render.albiononline.com per user. Fetch sizes
// are normalized to TWO canonical variants so the same item shares one cached URL across
// tables/trees/strips (64) and detail headers (128) - `displaySize` is the CSS size.
export function itemIconUrl(uniqueName: string, displaySize = 32, quality?: number): string {
  const size = displaySize <= 32 ? 64 : 128
  let url = `${API_URLS.forgeAPI}/game/albion/icon/${encodeURIComponent(uniqueName)}?size=${size}`
  if (quality !== undefined && quality >= 1 && quality <= 5) url += `&quality=${quality}`
  return url
}
