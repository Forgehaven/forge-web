// A tiny event bus so open pages re-read live when the shared craft settings change - the Craft
// Settings modal edits them while a table is on screen, and craftEconomics re-reads on the event.
export const PREFS_EVENT = 'albion-prefs-changed'

export function emitPrefsChanged(): void {
  window.dispatchEvent(new Event(PREFS_EVENT))
}

export function subscribePrefs(callback: () => void): () => void {
  window.addEventListener(PREFS_EVENT, callback)
  return () => window.removeEventListener(PREFS_EVENT, callback)
}
