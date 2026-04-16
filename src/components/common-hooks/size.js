import { computed } from 'vue'
import { resolveSize } from '@/utils/size'

export const sizeProps = {
  width: [String, Number],
  height: [String, Number]
}

export function useSize (props) {
  const resolved = computed(() => {
    const result = {}

    if (props.width != null) {
      result.width = resolveSize(props.width)
    }

    if (props.height != null) {
      result.height = resolveSize(props.height)
    }

    return result
  })

  return {
    resolved
  }
}
