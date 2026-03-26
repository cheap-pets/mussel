export function autoIncrementKeyBuilder () {
  const map = new WeakMap()

  let i = 0

  function newKey (obj) {
    map.set(obj, i)
    return i++
  }

  return obj => map.get(obj) ?? newKey(obj)
}
