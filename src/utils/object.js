import { isObject } from './type'

export function pick (obj, keys = []) {
  if (isObject(obj)) {
    const result = {}

    keys.forEach(key => {
      if (Object.hasOwn(obj, key)) {
        result[key] = obj[key]
      }
    })

    return result
  }
}

export function pickBy (obj, shouldPick) {
  if (isObject(obj)) {
    const result = {}

    Object.keys(obj).forEach(key => {
      const value = obj[key]

      if (shouldPick(key, value)) {
        result[key] = value
      }
    })

    return result
  }
}
