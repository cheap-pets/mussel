import { computed } from 'vue'
import { icons } from '@/icons'

export function useIcon (props) {
  const data = computed(() => {
    const icon = props.icon && icons[props.icon]

    if (props.icon && !icon) {
      console.warn(`Unregistered icon "${props.icon}" is detected.`)
    }

    return { ...icon }
  })

  return { data }
}
