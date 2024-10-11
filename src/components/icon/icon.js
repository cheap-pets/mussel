import { computed } from 'vue'
import { icons } from '@/icons'
import { resolveSafeHTML } from '@/utils/dom'

export function useIcon (props) {
  const data = computed(() => {
    const { type, content } = Object(props.icon && icons[props.icon])

    return {
      svg: (type === 'svg' && resolveSafeHTML(content)) || null,
      cls: (type === 'cls' && content) || null
    }
  })

  return { data }
}
