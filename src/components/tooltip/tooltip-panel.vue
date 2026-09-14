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
      <component :is="contentComponent" v-if="contentComponent" />
      <span v-else>{{ state.content }}</span>
    </div>
  </Teleport>
</template>

<script setup>
  import './tooltip-panel.scss'

  import { ref, shallowRef, computed, watch } from 'vue'
  import { usePopupManager, usePopupRunner } from '@/components/common/popup'
  import { isFunction } from '@/utils/type'

  import { isElementInViewport } from '@/utils/dom'

  defineOptions({ name: 'MusselTooltipPanel' })

  const props = defineProps({ controller: Object })

  const controller = props.controller
  const state = controller.state

  const visible = ref()
  const panelEl = shallowRef()

  const { ready, popupStyle, container, doEnter, doExit } = usePopupRunner(visible, panelEl, updatePosition)

  // 仅 vnode 工厂（#tooltip 插槽）走动态组件；字符串走模板静态 span，内容变化只做文本 patch
  const contentComponent = computed(() => {
    const content = state.content

    return isFunction(content) ? { render: () => content() } : null
  })

  function isPositionAssignable () {
    return visible.value && popupStyle.value && state.anchor
  }

  function clamp (value, min, max) {
    return value < min ? min : value > max ? max : value
  }

  const MARGIN = 4 // MARGIN = --mu-half-spacing
  const ARROW = 8 // 箭头中心距面板边缘的最小留白
  const PANEL_GAP = 4 // 无箭头时面板与锚点的间距（--mu-half-spacing，同 dropdown-panel）
  const ARROW_PROTRUSION = 7 // 箭头（含边线层）尖端突出面板边缘的长度（10px 方块旋转 45°，半对角 ≈ 7.07px，取整）
  const ARROW_TIP_GAP = 2 // 有箭头时尖端与锚点的间距

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

  // 垂直、水平两向的主轴/交叉轴度量互为镜像，取同一份度量消去分支复制
  function getAxisMetrics (vertical, anchorRect, panelRect, viewport) {
    const { top, bottom, left, right } = anchorRect

    return vertical
      ? {
        startSide: 'top',
        mainPanelSize: panelRect.height,
        mainViewportSize: viewport.height,
        mainStartSpace: top, // 锚点起始侧（上/左）可用空间
        mainEndSpace: viewport.height - bottom, // 锚点结束侧（下/右）可用空间
        crossProp: 'left',
        crossSize: panelRect.width,
        crossViewportSize: viewport.width,
        crossStart: left,
        crossEnd: right
      }
      : {
        startSide: 'left',
        mainPanelSize: panelRect.width,
        mainViewportSize: viewport.width,
        mainStartSpace: left,
        mainEndSpace: viewport.width - right,
        crossProp: 'top',
        crossSize: panelRect.height,
        crossViewportSize: viewport.height,
        crossStart: top,
        crossEnd: bottom
      }
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const anchorRect = state.anchor.getBoundingClientRect()
    const panelRect = el.getBoundingClientRect()

    const { innerWidth, innerHeight } = window
    const [side = 'top', align] = String(state.placement).split('-')

    const vertical = side === 'top' || side === 'bottom'
    const axis = getAxisMetrics(vertical, anchorRect, panelRect, { width: innerWidth, height: innerHeight })

    // fits/space 参数按请求侧取向：top/left 取上/左空间，bottom/right 取下/右空间
    const requestedAtStart = side === axis.startSide
    const spaceSide = requestedAtStart ? axis.mainStartSpace : axis.mainEndSpace
    const spaceOpposite = requestedAtStart ? axis.mainEndSpace : axis.mainStartSpace

    // 有箭头时面板退到尖端间距 + 箭头突出量处，无箭头时面板与锚点间距为 PANEL_GAP
    const gap = state.arrow
      ? ARROW_TIP_GAP + ARROW_PROTRUSION
      : PANEL_GAP

    const position = resolveMainAxis(
      side,
      spaceSide - gap >= axis.mainPanelSize,
      spaceOpposite - gap >= axis.mainPanelSize,
      spaceSide,
      spaceOpposite
    )

    // 贴起始侧（上/左）时由视口另一端定位，避免显式尺寸；贴结束侧时直接取锚点外侧坐标
    const positionedAtStart = position === axis.startSide
    const placedSpace = positionedAtStart ? axis.mainStartSpace : axis.mainEndSpace
    const mainOffset = axis.mainViewportSize - placedSpace + gap
    const mainProp = positionedAtStart ? OPPOSITE[axis.startSide] : axis.startSide

    const crossPos = resolveCrossAxis(
      align,
      axis.crossStart,
      axis.crossEnd,
      axis.crossSize,
      axis.crossViewportSize
    )

    // 箭头始终指向锚点中心
    const arrowCenter = (axis.crossStart + axis.crossEnd) / 2 - (crossPos + axis.crossSize / 2)
    const limit = Math.max(axis.crossSize / 2 - ARROW, 0)

    const style = {
      [mainProp]: `${mainOffset}px`,
      [axis.crossProp]: `${crossPos}px`,
      '--mu-tooltip-arrow-offset': `${clamp(arrowCenter, -limit, limit)}px`
    }

    el.setAttribute('position', position)
    popupStyle.value = style
  }

  watch(() => state.visible, v => {
    // 同步置位满足编舞的调用前提（各守卫据此中止）
    visible.value = v

    if (v) {
      state.onShow?.()
      doEnter()
    } else {
      state.onHide?.()
      doExit()
    }
  })

  // 显示中的热更新（锚点切换 / placement 调整）：直接重定位，不重播动画
  watch(
    () => [state.anchor, state.placement, state.arrow],
    () => isPositionAssignable() && updatePosition()
  )

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
