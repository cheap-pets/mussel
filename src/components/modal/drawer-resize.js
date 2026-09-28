import { ref, watch, onScopeDispose } from 'vue'

import { resolvePixel } from '@/utils/size'

// 对侧边线 → 受控维度与位移符号
const resizeMap = {
  left: { axis: 'width', sign: 1, cursor: 'e-resize' }, // 拖右边线：width + dx
  right: { axis: 'width', sign: -1, cursor: 'w-resize' }, // 拖左边线：width − dx
  top: { axis: 'height', sign: 1, cursor: 's-resize' }, // 拖底边线：height + dy
  bottom: { axis: 'height', sign: -1, cursor: 'n-resize' } // 拖顶边线：height − dy
}

// bounded / bindWindowListeners 与 dialog-move-resize.js 同步复制，勿单独改动

// min > max 时 min 胜出（与 CSS 一致；utils/math 的 clamp 会静默换序）
function bounded (value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)))
}

// 受控维度的拖拽约束：min/max 读 computed（可被 class 覆盖，百分比按 mask 换算，
// calc() 等换算失败回落 0/Infinity），上限再与「不越出 mask」取小
function resolveConstraints (drawer, mask, axis) {
  const horizontal = axis === 'width'
  const maskSize = horizontal ? mask.clientWidth : mask.clientHeight
  const cs = getComputedStyle(drawer)

  const min = resolvePixel(horizontal ? cs.minWidth : cs.minHeight, maskSize) || 0
  const cssMax = resolvePixel(horizontal ? cs.maxWidth : cs.maxHeight, maskSize)

  return { min, max: Math.min(cssMax ?? Infinity, maskSize) }
}

// 抽屉单轴边缘 resize：锚定三边，拖对侧边线只改一个维度；
// userSize 与状态协调在 drawer.vue，此处只负责手势
export function useDrawerResize ({ props, drawerEl, maskEl, modalVisible, userSize }) {
  const resizing = ref(null) // 进行中的 resize 光标；null = 非拖拽，兼作 class 开关与内联 cursor

  // 拖拽期间的 window 监听；隐藏/卸载时须兜底释放，否则整页 resize 光标残留
  let releaseWindowListeners = null

  function bindWindowListeners (onPointerMove, onPointerUp, onRelease) {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    const release = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      if (releaseWindowListeners === release) releaseWindowListeners = null
      onRelease?.()
    }

    releaseWindowListeners = release
    return release
  }

  // 供 drawer.vue 在 props 尺寸 / position 变更时终止拖拽，否则 move 闭包会覆盖 props 变更
  function releaseResize () {
    releaseWindowListeners?.()
  }

  // dispose-on-hide 只卸载 Teleport 子树、不触发 onScopeDispose，须 watch 隐藏兜底
  onScopeDispose(() => releaseWindowListeners?.())

  watch(modalVisible, v => {
    if (!v) releaseWindowListeners?.()
  })

  function onResizeStart (event) {
    if (event.button !== 0) return

    // validator 放行大写，查表同样归一；class 未归一是既有 bug（plans/drawer-resize.md §5），不在此修
    const { axis, sign, cursor } = resizeMap[props.position.toLowerCase()] || {}
    if (!axis) return

    event.currentTarget.setPointerCapture(event.pointerId)

    const horizontal = axis === 'width'
    const drawer = drawerEl.value
    const { min, max } = resolveConstraints(drawer, maskEl.value, axis)

    const startPoint = horizontal ? event.pageX : event.pageY
    // 渲染真值：props 宽被 CSS max 卡小时无首帧突跳
    const base = horizontal ? drawer.offsetWidth : drawer.offsetHeight

    const prevCursor = document.documentElement.style.cursor
    let materialized = false

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
