import { generateUUID } from '@/utils/crypto'

export function useKeyGen () {
  const keys = new WeakMap()

  function genKey (obj) {
    const key = generateUUID()

    if (obj) {
      keys.set(obj, key)
    }

    return key
  }

  function getObjectKey (obj) {
    let key = keys.get(obj)

    if (!key) {
      key = generateUUID()
      keys.set(obj, key)
    }

    return key
  }

  return {
    genKey,
    getObjectKey
  }
}
