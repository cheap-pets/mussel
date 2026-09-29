import { ref, reactive, computed, watch } from 'vue'
import { debounce } from 'throttle-debounce'

import { resolveSize, resolvePixel } from '@/utils/size'
import { createDragSession, bounded } from './resize-shared'

// 边在角之前，角部重叠区靠 DOM 顺序让角手柄优先命中
const resizeDirs = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']

const resizeCursorMap = {
  n: 'n-resize',
  s: 's-resize',
  e: 'e-resize',
  w: 'w-resize',
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize'
}

// 对话框窗口的移动与调整大小：标题栏拖拽移动、边缘/角调整大小、越界校正。
// 定位为「flex 居中 + 显式坐标」混合模型：未拖拽时 top/left 为 auto（居中），
// 首次有效位移才物化为 px，单击不改写布局模型
export function useDialogMoveResize ({ props, dialogEl, maskEl, maximized, modalVisible }) {
  const dragging = ref()
  const resizing = ref(null) // resize 进行中的方向光标；非 resize 态为 null，兼作 class 开关与内联 cursor

  const position = reactive({})
  const userSize = reactive({ width: undefined, height: undefined })

  const size = computed(() => ({
    width: userSize.width ?? resolveSize(props.width),
    height: userSize.height ?? resolveSize(props.height)
  }))

  function reset () {
    position.top = position.left = undefined
    userSize.width = userSize.height = undefined
  }

  function correctPosition () {
    if (!modalVisible.value) return

    const { offsetTop: top, offsetLeft: left, offsetHeight: height, offsetWidth: width } = dialogEl.value
    const { clientHeight: maxHeight, clientWidth: maxWidth } = maskEl.value

    const maxTop = maxHeight - (height <= maxHeight ? height : maxHeight)
    const maxLeft = maxWidth - (width <= maxWidth ? width : maxWidth)

    if (top < 0) {
      position.top = 0
    } else if (top > maxTop) {
      position.top = `${maxTop}px`
    }

    if (left < 0) {
      position.left = 0
    } else if (left > maxLeft) {
      position.left = `${maxLeft}px`
    }
  }

  const debounceCorrectPosition = debounce(300, correctPosition)

  const { bindWindowListeners } = createDragSession(modalVisible)

  function onDragStart (event) {
    if (
      maximized.value ||
      !['mu-dialog__header', 'mu-dialog__header-content'].find(cls => event.target.classList.contains(cls))
    ) return

    event.currentTarget.setPointerCapture(event.pointerId)

    const { pageY, pageX } = event
    const { offsetTop: startY, offsetLeft: startX } = dialogEl.value

    dragging.value = true

    function onPointerMove (e) {
      position.top = `${parseInt(startY + e.pageY - pageY)}px`
      position.left = `${parseInt(startX + e.pageX - pageX)}px`
    }

    function onPointerUp () {
      release()
      correctPosition()
    }

    const release = bindWindowListeners(onPointerMove, onPointerUp, () => {
      dragging.value = null
    })
  }

  function onResizeStart (event, dir) {
    if (maximized.value || event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)

    const mask = maskEl.value
    const dlg = dialogEl.value
    const cs = getComputedStyle(dlg)

    const maskW = mask.clientWidth
    const maskH = mask.clientHeight

    // min/max 可能被用户 class 覆盖且可能是百分比（getComputedStyle 不做 px 归一），
    // 只能读 computed 后按 mask 尺寸换算；"none"/"auto"/calc() 换算失败回落 0/Infinity
    const minW = resolvePixel(cs.minWidth, maskW) || 0
    const minH = resolvePixel(cs.minHeight, maskH) || 0
    const cssMaxW = resolvePixel(cs.maxWidth, maskW)
    const cssMaxH = resolvePixel(cs.maxHeight, maskH)

    const { pageX, pageY } = event
    const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = dlg

    const right = left + width
    const bottom = top + height

    // 上限 = CSS max 与「不越出 mask」取小：东/南防死区，西/北防锚点漂移
    const maxW = cssMaxW ?? Infinity
    const maxH = cssMaxH ?? Infinity

    const maxEast = Math.min(maxW, maskW - left)
    const maxSouth = Math.min(maxH, maskH - top)
    const maxWest = Math.min(maxW, right)
    const maxNorth = Math.min(maxH, bottom)

    const prevCursor = document.documentElement.style.cursor

    let materialized = false

    // 物化延后到首次有效位移：边缘上的单击不应把 width="50%" 永久变成 px、废掉 flex 居中
    function materialize () {
      position.top = `${top}px`
      position.left = `${left}px`

      userSize.width = `${width}px`
      userSize.height = `${height}px`

      materialized = true

      resizing.value = resizeCursorMap[dir]
      document.documentElement.style.cursor = resizing.value
    }

    function onPointerMove (e) {
      const dx = e.pageX - pageX
      const dy = e.pageY - pageY

      if (!materialized) {
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return
        materialize()
      }

      if (dir.includes('e')) userSize.width = `${bounded(width + dx, minW, maxEast)}px`
      if (dir.includes('s')) userSize.height = `${bounded(height + dy, minH, maxSouth)}px`

      // 西/北边缘锚定对侧：改尺寸同时反向改 left/top
      if (dir.includes('w')) {
        const w = bounded(width - dx, minW, maxWest)

        userSize.width = `${w}px`
        position.left = `${right - w}px`
      }

      if (dir.includes('n')) {
        const h = bounded(height - dy, minH, maxNorth)

        userSize.height = `${h}px`
        position.top = `${bottom - h}px`
      }
    }

    function onPointerUp () {
      release()

      // 纯点击未物化时不校正，避免把 flex 居中的负偏移钉死成绝对坐标
      if (materialized) correctPosition()
    }

    const release = bindWindowListeners(onPointerMove, onPointerUp, () => {
      resizing.value = null
      document.documentElement.style.cursor = prevCursor
    })
  }

  // props 尺寸为真源：父组件变更 width/height 时丢弃用户 resize 覆盖值
  watch(
    () => [props.width, props.height],
    () => { userSize.width = userSize.height = undefined }
  )

  return {
    dragging,
    resizing,
    position,
    size,
    resizeDirs,
    reset,
    onDragStart,
    onResizeStart,
    correctPosition,
    debounceCorrectPosition
  }
}
