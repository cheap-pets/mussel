export function assignIfDefined (target, ...sources) {
  if (sources) {
    for (const source of sources) {
      Object.keys(source).forEach(key => {
        const v = source[key]
        if (v !== undefined) target[key] = v
      })
    }
  }
  return target
}
