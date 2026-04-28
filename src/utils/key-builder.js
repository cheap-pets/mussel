function isValidWeakMapKey (value) {
  if (value == null) return false

  const type = typeof value

  return type === 'symbol'
    ? Symbol.keyFor(value) === undefined
    : type === 'object' || type === 'function'
}

export function autoIncrementKeyBuilder () {
  const map = new WeakMap()

  let i = 0

  function newKey (v) {
    map.set(v, i)
    return i++
  }

  return v => isValidWeakMapKey(v)
    ? map.get(v) ?? newKey(v)
    : i++
}

export function UUIDKeyBuilder () {
  const map = new WeakMap()

  function newKey (v) {
    const key = crypto.randomUUID()
    map.set(v, key)
    return key
  }

  return v => isValidWeakMapKey(v)
    ? map.get(v) ?? newKey(v)
    : crypto.randomUUID()
}
