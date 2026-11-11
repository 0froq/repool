const UNITS: [number, string][] = [
  [60, 's'],
  [60, 'm'],
  [24, 'h'],
  [30, 'd'],
  [12, 'mo'],
  [Infinity, 'y'],
]

export function ago(iso: string, now = Date.now()) {
  let value = Math.max(0, (now - Date.parse(iso)) / 1000)
  if (value < 60) return 'now'
  for (const [size, unit] of UNITS) {
    if (value < size) return `${Math.floor(value)}${unit}`
    value /= size
  }
  return ''
}
