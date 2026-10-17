import { pascalCase } from './case.js'
import { isDev } from '../env'

const warned = new Set()

export function warn ({ component, message, once = true, devOnly = true } = {}) {
  if ((devOnly && !isDev) || !message) return

  const prefix = `MUSSEL${component ? ':' + pascalCase(component) : ''}`

  if (once) {
    const key = `${prefix}_${message}`

    if (warned.has(key)) return
    else warned.add(key)
  }

  console.warn(`[${prefix}]`, message)
}

export function warnDeprecated ({ component, deprecated, alternative, once = true, devOnly = true } = {}) {
  if (!deprecated) return

  warn({
    component,
    message:
      `${deprecated} is deprecated and will be removed in future versions.` +
      (alternative ? ` Please use "${alternative}" instead.` : ''),
    once,
    devOnly
  })
}
