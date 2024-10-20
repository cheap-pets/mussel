import { computed } from 'vue'
import { icons } from '@/icons'

const warned = {}

export function useIcon (props) {
  const data = computed(() => {
    const name = props.icon?.trim()
    const icon = name && icons[name]

    if (name && !icon && !warned[name]) {
      warned[name] = true
      console.warn('[MUSSEL:ICON]', `Unregistered icon "${name}" is detected.`)
    }

    return { ...icon }
  })

  return { data }
}
