export function utcDate(ts: string): Date {
  return new Date(ts.endsWith('Z') ? ts : ts + 'Z')
}
