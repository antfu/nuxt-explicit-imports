export function sumBy<T>(list: T[], fn: (item: T) => number): number {
  return list.reduce((total, item) => total + fn(item), 0)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
