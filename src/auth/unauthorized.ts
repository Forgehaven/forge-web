// 401 callback registry - bridges API clients (e.g. forgeFetch) to the AuthProvider without
// the auth layer depending on any game module. forgeFetch calls notifyUnauthenticated() on a
// 401; AuthProvider registers the handler via setOnUnauthenticated().
let onUnauthenticated: (() => void) | null = null

export function setOnUnauthenticated(cb: () => void) {
  onUnauthenticated = cb
}

export function notifyUnauthenticated() {
  onUnauthenticated?.()
}
