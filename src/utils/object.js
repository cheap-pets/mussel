export function assignIf (target, ...sources) {
  for (const source of sources) {
    if (!source) continue

    Object.keys(source).forEach(key => {
      const v = source[key]

      if (v != null) target[key] = v
    })
  }

  return target
}
