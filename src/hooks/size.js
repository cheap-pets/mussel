import { computed } from 'vue'
import { resolveSize } from '@/utils/size'

export const sizeProps = {
  width: [String, Number],
  height: [String, Number]
}

export function useSize (proxy) {
  const sizeStyle = computed(() => ({
    width: resolveSize(proxy.width),
    height: resolveSize(proxy.height)
  }))

  return {
    sizeStyle
  }
}
