<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      class="mu-tooltip-panel"
      :style="popupStyle"
      :arrow="state.arrow || null"
      @mouseover.stop="controller.clearHideTimer"
      @mouseleave.stop="controller.delayHide"
      @sizechange="updatePosition">
      <component :is="contentComponent" />
    </div>
  </Teleport>
</template>

<script setup>
  import './tooltip-panel.scss'

  import { ref, shallowRef, computed, watch, inject, h } from 'vue'
  import { usePopupManager, runPopupSequence } from '@/components/common/popup'
  import { isString, isFunction } from '@/utils/type'

  import { isElementInViewport } from '@/utils/dom'
  import { getTransitionDuration } from '@/utils/style'
  import { delay } from '@/utils/timer'

  defineOptions({ name: 'MusselTooltipPanel' })

  const props = defineProps({ controller: Object })

  const rootEl = inject('$mussel').rootElement
  const controller = props.controller
  const state = controller.state

  const ready = ref()
  const visible = ref()
  const popupStyle = ref()

  const panelEl = shallowRef()
  const container = shallowRef(rootEl)

  // content 为 String 或 vnode 工厂（#tooltip 插槽）；每次渲染重新取 vnode，不缓存
  const contentComponent = computed(() => {
    const content = state.content

    if (isString(content)) return { render: () => h('span', null, content) }
    if (isFunction(content)) return { render: () => content() }
    return null
  })

  function isPositionAssignable () {
    return visible.value && popupStyle.value && state.anchor
  }

  function clamp (value, min, max) {
    return value < min ? min : value > max ? max : value
  }

  // MARGIN = --mu-half-spacing，ARROW 为箭头中心距面板边缘的最小留白
  const MARGIN = 4
  const ARROW = 8
  // 无箭头时面板与锚点的间距（--mu-half-spacing，同 dropdown-panel 观感）
  const PANEL_GAP = 4
  // 箭头（含边线层）尖端突出面板边缘的长度（10px 方块旋转 45°，半对角 ≈ 7.07px，取整）
  const ARROW_PROTRUSION = 7
  // 有箭头时尖端与锚点的间距
  const ARROW_TIP_GAP = 2

  const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

  // 主轴：请求侧放得下优先请求侧，否则翻转，两侧都不足放空间更大一侧（允许溢出）
  function resolveMainAxis (side, fitsSide, fitsOpposite, spaceSide, spaceOpposite) {
    if (fitsSide) return side
    if (fitsOpposite) return OPPOSITE[side]
    return spaceSide >= spaceOpposite ? side : OPPOSITE[side]
  }

  // 交叉轴：对齐档理想位置 + 视口夹紧
  function resolveCrossAxis (align, start, end, size, viewportSize) {
    const ideal = align === 'start'
      ? start
      : align === 'end'
        ? end - size
        : start + (end - start - size) / 2

    return clamp(ideal, MARGIN, viewportSize - size - MARGIN)
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const rect = state.anchor.getBoundingClientRect()
    const { width: dw, height: dh } = el.getBoundingClientRect()
    const { innerWidth: tw, innerHeight: th } = window

    const [side = 'top', align] = String(state.placement).split('-')
    const vertical = side === 'top' || side === 'bottom'

    // 有箭头时面板退到尖端间距 + 箭头突出量处，无箭头时面板与锚点间距为 PANEL_GAP
    const gap = state.arrow ? ARROW_TIP_GAP + ARROW_PROTRUSION : PANEL_GAP

    const style = {}
    let position
    let arrowCenter

    if (vertical) {
      // fits/space 参数按请求侧取向：top/left 取上/左空间，bottom/right 取下/右空间
      const spaceStart = rect.top
      const spaceEnd = th - rect.bottom
      const sideIsStart = side === 'top'

      position = resolveMainAxis(
        side,
        (sideIsStart ? spaceStart : spaceEnd) - gap >= dh,
        (sideIsStart ? spaceEnd : spaceStart) - gap >= dh,
        sideIsStart ? spaceStart : spaceEnd,
        sideIsStart ? spaceEnd : spaceStart
      )

      if (position === 'top') style.bottom = `${th - rect.top + gap}px`
      else style.top = `${rect.bottom + gap}px`

      const left = resolveCrossAxis(align, rect.left, rect.right, dw, tw)

      style.left = `${left}px`

      // 箭头始终指向锚点中心
      arrowCenter = rect.left + rect.width / 2 - (left + dw / 2)
    } else {
      const spaceStart = rect.left
      const spaceEnd = tw - rect.right
      const sideIsStart = side === 'left'

      position = resolveMainAxis(
        side,
        (sideIsStart ? spaceStart : spaceEnd) - gap >= dw,
        (sideIsStart ? spaceEnd : spaceStart) - gap >= dw,
        sideIsStart ? spaceStart : spaceEnd,
        sideIsStart ? spaceEnd : spaceStart
      )

      if (position === 'left') style.right = `${tw - rect.left + gap}px`
      else style.left = `${rect.right + gap}px`

      const top = resolveCrossAxis(align, rect.top, rect.bottom, dh, th)

      style.top = `${top}px`

      arrowCenter = rect.top + rect.height / 2 - (top + dh / 2)
    }

    const limit = Math.max((vertical ? dw : dh) / 2 - ARROW, 0)

    style['--mu-tooltip-arrow-offset'] = `${clamp(arrowCenter, -limit, limit)}px`

    el.setAttribute('position', position)
    popupStyle.value = style

    return true
  }

  watch(() => state.visible, v => {
    // 同步置位满足 runPopupSequence 的调用前提（编舞各守卫据此中止）
    visible.value = v

    if (v) {
      state.onShow?.()
      container.value = document.fullscreenElement || rootEl
      runPopupSequence({ visible, ready, popupStyle, panelEl, updatePosition })
    } else {
      state.onHide?.()
      hide()
    }
  })

  // 显示中的热更新（锚点切换 / placement 调整）：直接重定位，不重播动画
  watch(
    () => [state.anchor, state.placement, state.arrow],
    () => {
      if (isPositionAssignable()) updatePosition()
    }
  )

  function hide () {
    // 首次 show 的同步窗口内面板未挂载，无 DOM 可收尾；
    // 编舞（runPopupSequence）在 nextTick 后的守卫处自然中止
    const el = panelEl.value
    if (!el) return

    const duration = getTransitionDuration(el)

    el.removeAttribute('pop-up')

    delay(duration).then(() => {
      if (!visible.value) popupStyle.value = null
    })
  }

  function onCaptureEscKeyDown () {
    if (visible.value && state.trigger !== 'hover') controller.hide()
  }

  function onCaptureMouseDown (event) {
    if (
      visible.value &&
      state.trigger === 'click' &&
      !state.anchor?.contains(event.target) &&
      !panelEl.value?.contains(event.target)
    ) controller.hide()
  }

  function hideOrReposition () {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(state.anchor)) controller.hide()
    else updatePosition()
  }

  function onCaptureScroll (event) {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(state.anchor)) {
      controller.hide()
    } else if (event.target.contains(state.anchor)) {
      updatePosition()
    }
  }

  usePopupManager(visible, {
    hide: controller.hide,
    onCaptureWindowResize: hideOrReposition,
    onCaptureEscKeyDown,
    onCaptureMouseDown,
    onCaptureScroll,
    onCaptureWindowBlur: controller.hide,
    onCaptureFullscreenChange: controller.hide
  })

  controller.bindPanel({ updatePosition })
</script>
