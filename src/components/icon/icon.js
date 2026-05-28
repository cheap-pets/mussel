import { computed } from 'vue'
import { icons } from '@/icons'

const warned = {}

function parseIconValue (value = '') {
  const match = value.match(/^([^:]+):?(.*)$/)

  if (match) {
    const name = match[1]
    const animation = match[2]

    const result = icons[name] || (
      name.startsWith('.') &&
      name !== '.' &&
      { cls: name.replaceAll('.', ' ').replace(/ +/g, ' ') }
    )

    if (result && animation) {
      result.animation = animation
    }

    return result
  }
}

export function useIcon (props) {
  const data = computed(() => {
    const value = props.icon?.trim()
    const result = {}

    if (value) {
      const icon = parseIconValue(value)

      if (!icon && !warned[value]) {
        warned[value] = true
        console.warn('[MUSSEL:Icon]', `Unregistered icon name or invalid icon property "${value}" is detected.`)
      }

      return Object.assign(result, icon)
    }

    return result
  })

  return { data }
}
