import { pascalCase } from './case.js'
import { isDev } from '../env'

const warned = new Set()

export function warnDeprecated ({ component, deprecated, alternative, once = true } = {}) {
  if (!isDev || !deprecated) return

  const prefix = `MUSSEL${component ? ':' + pascalCase(component) : ''}`

  if (once) {
    const key = `${prefix}_${deprecated}_${alternative}`

    if (warned.has(key)) return
    else warned.add(key)
  }

  const message =
    (deprecated + ' is deprecated, and will be removed in future versions.') +
    (alternative && ` Please use "${alternative}" instead.`)

  console.warn(`[${prefix}]`, message)
}
