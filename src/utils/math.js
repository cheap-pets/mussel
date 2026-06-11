export function clamp (value, min, max) {
  if (min > max) {
    [min, max] = [max, min]
  }

  return Math.min(Math.max(value, min), max)
}
