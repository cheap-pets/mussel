import { isString } from './type'

function buildDeprecatedMessage (oldFn, newFn) {
  return (
    (
      oldFn.name
        ? `Function "${oldFn.name}"`
        : 'This function'
    ) +
    ' is deprecated and will be removed in future versions.' +
    (
      newFn?.name
        ? ` Please use "${newFn.name}" instead.`
        : ''
    )
  )
}

export function deprecated (fn, messageOrNewFn, thisArg) {
  const message = isString(messageOrNewFn)
    ? messageOrNewFn
    : buildDeprecatedMessage(fn, messageOrNewFn)

  return (...args) => {
    console.warn(message)

    return fn.apply(thisArg || this, args)
  }
}
