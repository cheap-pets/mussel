import { ref } from 'vue'

import { resolvePixel } from '@/utils/size'
import { createDragSession, bounded } from './resize-shared'

// 对侧边线 → 受控维度与位移符号
const resizeMap = {
  left: { axis: 'width', sign: 1, cursor: 'e-resize' }, // 拖右边线：width + dx
  right: { axis: 'width', sign: -1, cursor: 'w-resize' }, // 拖左边线：width − dx
  top: { axis: 'height', sign: 1, cursor: 's-resize' }, // 拖底边线：height + dy
  bottom: { axis: 'height', sign: -1, cursor: 'n-resize' } // 拖顶边线：height − dy
}

// 受控维度的拖拽约束：min/max 读 computed（可被 class 覆盖，百分比按 mask 换算，
// calc() 等换算失败回落 0/Infinity），上限再与「不越出 mask」取小
function resolveConstraints (drawer, mask, axis) {
  const horizontal = axis === 'width'
  const maskSize = horizontal ? mask.clientWidth : mask.clientHeight
  const cs = getComputedStyle(drawer)

  const min = resolvePixel(horizontal ? cs.minWidth : cs.minHeight, maskSize) || 0
  const max = resolvePixel(horizontal ? cs.maxWidth : cs.maxHeight, maskSize)

  return { min, max: Math.min(max ?? Infinity, maskSize) }
}

// 抽屉单轴边缘 resize：锚定三边，拖对侧边线只改一个维度；
// userSize 与状态协调在 drawer.vue，此处只负责手势
export function useDrawerResize ({ props, drawerEl, maskEl, modalVisible, userSize }) {
  const resizing = ref(null) // 进行中的 resize 光标；null = 非拖拽，兼作 class 开关与内联 cursor

  const { bindWindowListeners, releaseActive } = createDragSession(modalVisible)

  // 供 drawer.vue 在 props 尺寸 / position 变更时终止拖拽，否则 move 闭包会覆盖 props 变更
  const releaseResize = releaseActive

  function onResizeStart (event) {
    if (event.button !== 0) return

    const { axis, sign, cursor } = resizeMap[props.position] || {}
    if (!axis) return

    event.currentTarget.setPointerCapture(event.pointerId)

    const drawer = drawerEl.value
    const horizontal = axis === 'width'

    const { cursor: prevCursor } = document.documentElement.style
    const { min, max } = resolveConstraints(drawer, maskEl.value, axis)

    const [startPoint, base] = horizontal
      ? [event.pageX, drawer.offsetWidth]
      : [event.pageY, drawer.offsetHeight]

    let materialized = false // 是否真正开始拖拽缩放

    function onPointerMove (e) {
      const delta = (horizontal ? e.pageX : e.pageY) - startPoint

      // 3px 阈值延迟物化且只判受控轴：单击不改写百分比布局，非受控轴抖动不触发
      if (!materialized) {
        if (Math.abs(delta) < 3) return

        materialized = true
        resizing.value = cursor
        document.documentElement.style.cursor = cursor
      }

      userSize[axis] = `${bounded(base + sign * delta, min, max)}px`
    }

    function onPointerUp () {
      release()
    }

    const release = bindWindowListeners(onPointerMove, onPointerUp, () => {
      resizing.value = null
      document.documentElement.style.cursor = prevCursor
    })
  }

  return { resizing, onResizeStart, releaseResize }
}
