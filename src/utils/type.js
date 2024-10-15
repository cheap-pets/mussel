export function typeOf (value) {
  return Object
    .prototype
    .toString
    .call(value)
    .match(/\[object (.*)\]/)[1]
    .toLowerCase()
}

export function isType (value, type) {
  return typeOf(value) === type
}

export function isArray (value) {
  return Array.isArray(value)
}

export function isBoolean (value) {
  return typeOf(value) === 'boolean'
}

export function isClass (value) {
  return (
    (typeOf(value) === 'function') &&
    !Reflect.ownKeys(value).some(el => el === 'arguments' || el === 'caller')
  )
}

export function isDate (value) {
  return typeOf(value) === 'date' && !isNaN(value.getTime())
}

export function isFunction (value) {
  return [
    // 'proxy'
    'function',
    'asyncfunction',
    'generatorfunction'
  ].includes(typeOf(value))
}

export function isObject (value) {
  return typeOf(value) === 'object'
}

export function isString (value) {
  return typeOf(value) === 'string'
}

const SVG_PATTERN = /<svg(?=[\s>])('[^']*'|"[^"]*"|[^'">])*>[\s\S]*?<\/svg>/i

export function isSVGString (value) {
  return isString(value) && SVG_PATTERN.test(value)
}

export function isIterable (value) {
  return Symbol.iterator in Object(value)
}

export function isEmpty (value, options = {}) {
  const { skipString, skipBoolean } = options

  const t = typeOf(value)

  return (
    (!skipString || t !== 'string') &&
    (
      (value == null) ||
      (!skipBoolean && t === 'boolean') ||
      (t === 'object' && Object.keys(value).length === 0) ||
      (isIterable(value) && Array.from(value).length === 0)
    )
  )
}

export function isHtmlElement (value) {
  return value instanceof HTMLElement
}
