import './split-box.scss'

import { reactive, computed } from 'vue'
import { resolveSize } from '@/utils/size.js'

export function useSplitBox () {
  const initialSize = reactive({})
  const currentSize = reactive({})

  const startSizeStyle = computed(() => ({ flexBasis: resolveSize(currentSize.start) }))
  const endSizeStyle = computed(() => ({ flexBasis: resolveSize(currentSize.end) }))

  function init (startSize, endSize) {
    initialSize.start = currentSize.start = startSize
    initialSize.end = currentSize.end = endSize
  }

  function reset (target) {
    if (initialSize[target]) {
      currentSize[target] = initialSize[target]
    }
  }

  function resize (target, size) {
    currentSize[target] = size
  }

  return {
    startSizeStyle,
    endSizeStyle,
    init,
    reset,
    resize
  }
}
