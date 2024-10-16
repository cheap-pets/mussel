import { computed } from 'vue'
import { icons } from '@/icons'

export function useIcon (props) {
  const data = computed(() => {
    const name = props.icon?.trim()
    const icon = name && icons[name]

    if (name && !icon) {
      console.warn(`Unregistered icon "${props.icon}" is detected.`)
    }

    return { ...icon }
  })

  return { data }
}
