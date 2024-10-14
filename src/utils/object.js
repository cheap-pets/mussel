import { isObject } from './type'

export function pick (obj, keys = []) {
  if (isObject(obj)) {
    const result = {}

    keys.forEach(key => {
      if (Object.hasOwn(obj, key) && obj[key] !== undefined) {
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

export function defaults (target = {}, ...sources) {
  for (const source of sources) {
    if (isObject(source)) {
      Object.keys(source).forEach(key => (
        (source[key] !== undefined) &&
        (target[key] === undefined) &&
        (target[key] = source[key])
      ))
    }
  }

  return target
}
