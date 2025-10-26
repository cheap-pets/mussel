import { isFunction } from 'es-toolkit'

export function ensureFn (value, defaultFn) {
  return isFunction(value)
    ? value
    : defaultFn || (() => value)
}

export function getPixelNumber (value) {
  if (value == null) return
  const v = String(value).match(/^(\d+(\.\d+)?)(px)?$/)?.[1]
  return v && Number(v)
}

export function getCellAlignClass (align) {
  return ['left', 'center', 'right'].includes(align)
    ? `text-${align}`
    : undefined
}
