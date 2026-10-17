import { computed } from 'vue'
import { icons } from '@/icons'
import { warn } from '@/utils/warn'

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

      if (!icon) {
        warn({
          component: 'Icon',
          message: `Invalid icon "${value}": unregistered icon name or invalid icon property.`
        })
      }

      return Object.assign(result, icon)
    }

    return result
  })

  return { data }
}
