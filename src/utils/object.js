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

export function pickBy (obj, fn) {
  const result = {}

  Object.keys(obj).forEach(key => {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      fn(key, obj[key])
    ) {
      result[key] = obj[key]
    }
  })

  return result
}
