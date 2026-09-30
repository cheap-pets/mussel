<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      :class="['mu-side-menu-popup', { 'mu-side-menu-popup--favorites': favoritesEnabled }]"
      :style="popupStyle"
      @mouseenter="clearHideTimer"
      @mouseleave="delayHide">
      <div
        class="mu-side-menu-popup__header"
        :disabled="anchorDisabled || null"
        @click="onHeaderClick">
        <mu-icon
          v-if="anchorData.icon"
          class="mu-side-menu__item-icon"
          :icon="anchorData.icon" />
        <span class="mu-side-menu__item-label">{{ anchorData.label }}</span>
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
  const groupKeyPath = shallowRef([])

  const { ready, popupStyle, container, doEnter, doExit } = usePopupRunner(
    visible,
    panelEl,
    updatePosition
  )

  const childNodes = computed(() => group.value?.[childProp.value] || [])
  const groupKey = computed(() => group.value?.[keyProp.value])

  // 标题栏：锚点组（上级分组）的图标 + 标题，为浮层内容提供分组上下文与点击入口
  const anchorData = computed(() => ({
    icon: group.value?.[nodeProps.value.icon],
    label: group.value?.[nodeProps.value.label]
  }))

  const anchorDisabled = computed(() => !!group.value?.[nodeProps.value.disabled])

  // 标题栏点击：触发锚点组的 itemClick 旁路事件（与组头点击一致），不切换展开、不关闭面板
  function onHeaderClick () {
    if (!anchorDisabled.value) menu.onItemClick(group.value, groupKeyPath.value)
  }

  const MARGIN = 8 // 面板与视口上下边的最小留白，与 max-height: calc(100vh - 16px) 对应

  // 与 CSS 变量 --mu-side-menu_popup-gap 同源，首次定位时读取并缓存
  let popupGap

  function isPositionAssignable () {
    return visible.value && popupStyle.value && anchor.value
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const anchorRect = anchor.value.getBoundingClientRect()
    const { width: pw, height: ph } = el.getBoundingClientRect()
    const { innerWidth: vw, innerHeight: vh } = window

    popupGap ??= parseFloat(
      getComputedStyle(el).getPropertyValue('--mu-side-menu_popup-gap')
    ) || 4

    // 主轴（水平）：右侧放得下优先右侧，否则左侧；两侧都不足放空间更大一侧
    const rightSpace = vw - anchorRect.right - popupGap
    const leftSpace = anchorRect.left - popupGap

    const position = rightSpace >= pw
      ? 'right'
      : leftSpace >= pw
        ? 'left'
        : (rightSpace >= leftSpace ? 'right' : 'left')

    const style = {
      [position === 'right' ? 'left' : 'right']:
        `${(position === 'right' ? anchorRect.right : vw - anchorRect.left) + popupGap}px`
    }

    // 交叉轴（垂直）：默认与锚点顶对齐；下方不足且上方更充裕时向上翻转（底对齐），最终夹紧
    let top = anchorRect.top

    if (top + ph > vh - MARGIN) {
      top = (anchorRect.top - MARGIN > vh - MARGIN - anchorRect.top)
        ? anchorRect.bottom - ph
        : vh - MARGIN - ph
    }

    style.top = `${Math.max(MARGIN, top)}px`

    el.setAttribute('position', position)
    popupStyle.value = style
  }

  let hideTimer

  function clearHideTimer () {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }

  async function show (anchorEl, groupNode, keyPath = []) {
    clearHideTimer()

    const anchorChanged = anchor.value !== anchorEl

    anchor.value = anchorEl
    group.value = groupNode
    groupKeyPath.value = keyPath

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
