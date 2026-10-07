<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      :class="['mu-side-menu-popup', { 'mu-side-menu-popup--favorites': favoritesEnabled }]"
      :style="popupStyle"
      @mouseenter="clearHideTimer"
      @mouseleave="delayHide">
      <div class="mu-side-menu-popup__header text-ellipsis">
        {{ groupLabel }}
      </div>
      <mu-scroll-box class="mu-side-menu-popup__body">
        <ul class="mu-side-menu__list">
          <side-menu-node
            v-for="(child, index) in childNodes"
            :key="child[keyProp] ?? index"
            :node="child"
            :level="0"
            :parent-keys="[groupKey]" />
        </ul>
      </mu-scroll-box>
    </div>
  </Teleport>
</template>

<script setup>
  import { computed, inject, nextTick, provide, ref, shallowReactive, shallowRef } from 'vue'
  import { HIDE_DELAY, usePopupManager, usePopupRunner } from '@/components/common/popup'
  import { isElementInViewport } from '@/utils/dom'

  import SideMenuNode from './side-menu-node.vue'

  defineOptions({ name: 'MusselSideMenuPopup' })

  const menu = inject('sideMenu')

  // 弹层内子树全部内嵌展开（默认展开），组头可点击、展开态存面板本地
  const localExpanded = shallowReactive(new Map())

  provide('sideMenu', {
    ...menu,
    popup: true,
    isExpanded: key => localExpanded.get(key) ?? true,
    setExpanded: (key, value) => { localExpanded.set(key, value) }
  })

  const { nodeProps, keyProp, childProp, favoritesEnabled } = menu

  const visible = ref()
  const panelEl = shallowRef()
  const anchor = shallowRef()
  const group = shallowRef()

  const { ready, popupStyle, container, doEnter, doExit } = usePopupRunner(
    visible,
    panelEl,
    updatePosition
  )

  const childNodes = computed(() => group.value?.[childProp.value] || [])
  const groupKey = computed(() => group.value?.[keyProp.value])

  // 标题栏：锚点组（上级分组）标题，为浮层内容提供分组上下文
  const groupLabel = computed(() => group.value?.[nodeProps.value.label])

  const MARGIN = 8 // 面板与视口上下边的最小留白，与 max-height: calc(100vh - 16px) 对应
  const GAP = 4 // 面板与锚点的水平间距

  function isPositionAssignable () {
    return visible.value && popupStyle.value && anchor.value
  }

  // 定位纯函数：仅做几何计算，DOM 读写由 updatePosition 承担
  function computePosition (anchorRect, panelSize) {
    const { innerWidth: vw, innerHeight: vh } = window
    const { width: pw, height: ph } = panelSize

    // 主轴（水平）：右侧放得下优先右侧，否则左侧；两侧都不足放空间更大一侧
    const rightSpace = vw - anchorRect.right - GAP
    const leftSpace = anchorRect.left - GAP

    const position = rightSpace >= pw
      ? 'right'
      : leftSpace >= pw
        ? 'left'
        : rightSpace >= leftSpace
          ? 'right'
          : 'left'

    // 交叉轴（垂直）：默认与锚点顶对齐；下方溢出且锚点在上半屏时底对齐翻转，最终双向夹紧
    let top = anchorRect.top

    if (top + ph > vh - MARGIN && anchorRect.top > vh / 2) {
      top = anchorRect.bottom - ph
    }

    top = Math.max(MARGIN, Math.min(top, vh - MARGIN - ph))

    // 左侧悬挂须用 right 定位：右缘锚定锚点左缘，max-content 宽度变化时面板不漂移
    const style = position === 'right'
      ? { left: `${anchorRect.right + GAP}px` }
      : { right: `${vw - anchorRect.left + GAP}px` }

    style.top = `${top}px`

    return { position, style }
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const anchorRect = anchor.value.getBoundingClientRect()
    const { position, style } = computePosition(
      anchorRect,
      el.getBoundingClientRect()
    )

    el.setAttribute('position', position)
    popupStyle.value = style
  }

  let hideTimer

  function clearHideTimer () {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }

  async function show (anchorEl, groupNode) {
    clearHideTimer()

    const anchorChanged = anchor.value !== anchorEl

    anchor.value = anchorEl
    group.value = groupNode

    // 面板重开或换锚点组：子树回到默认全展开
    if (!visible.value || anchorChanged) localExpanded.clear()

    if (!visible.value) {
      visible.value = true
      await doEnter()
    } else if (anchorChanged) {
      // 锚点切换：保留显示，换内容重定位，不重播动画
      await nextTick()
      if (visible.value) updatePosition()
    }
  }

  function hide () {
    clearHideTimer()
    if (!visible.value) return

    visible.value = false
    doExit()
  }

  function delayHide () {
    clearHideTimer()
    hideTimer = setTimeout(hide, HIDE_DELAY)
  }

  // 锚点滚出/缩出视口即关闭；否则跟随重定位。
  // event 存在（scroll）时仅滚动容器包含锚点才重定位，无关滚动不触发
  function handleAnchorMove (event) {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(anchor.value)) hide()
    else if (!event || event.target.contains(anchor.value)) updatePosition()
  }

  usePopupManager(visible, {
    hide,
    onCaptureEscKeyDown: hide,
    onCaptureMouseDown (event) {
      if (
        visible.value &&
        !anchor.value?.contains(event.target) &&
        !panelEl.value?.contains(event.target)
      ) {
        hide()
      }
    },
    onCaptureWindowResize: () => handleAnchorMove(),
    onCaptureScroll: handleAnchorMove,
    onCaptureWindowBlur: hide,
    onCaptureFullscreenChange: hide
  })

  defineExpose({ show, hide, delayHide, updatePosition })
</script>
