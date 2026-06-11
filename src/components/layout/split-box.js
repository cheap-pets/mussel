import './split-box.scss'

import { reactive, computed } from 'vue'
import { resolveSize } from '@/utils/size.js'

export function useSplitBox (props) {
  const initialSize = reactive({})
  const currentSize = reactive({})
  const collapsed = reactive({})

  const startSizeStyle = computed(() => ({ flexBasis: currentSize.start, display: collapsed.start ? 'none' : undefined }))
  const endSizeStyle = computed(() => ({ flexBasis: currentSize.end, display: collapsed.end ? 'none' : undefined }))

  function init (startSize, endSize) {
    initialSize.start = currentSize.start = resolveSize(startSize)
    initialSize.end = currentSize.end = resolveSize(endSize)
  }

  function updateCollapsed (target, size) {
    collapsed[target] =
      !size &&
      (target === 'start' ? [true, 'top', 'left'] : [true, 'right', 'bottom']).includes(props.collapsible)
  }

  function reset (target) {
    if (initialSize[target]) {
      updateCollapsed(target, currentSize[target] = initialSize[target])
    }
  }

  function resize (target, size) {
    currentSize[target] = size
    updateCollapsed(target, size)
  }

  return {
    startSizeStyle,
    endSizeStyle,
    init,
    reset,
    resize
  }
}
