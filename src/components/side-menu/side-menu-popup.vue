<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      :class="['mu-side-menu-popup', { 'mu-side-menu-popup--favorites': favoritesEnabled }]"
      :style="popupStyle"
      @mouseenter="clearHideTimer"
      @mouseleave="delayHide">
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
  const localExpanded = shallowReactive({})

  provide('sideMenu', {
    ...menu,
    popup: true,
    isExpanded: key => localExpanded[key] ?? true,
    setExpanded: (key, value) => { localExpanded[key] = value }
  })

  const { keyProp, childProp, favoritesEnabled } = menu

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

  const MARGIN = 8 // 面板与视口上下边的最小留白，与 max-height: calc(100vh - 16px) 对应

  function isPositionAssignable () {
    return visible.value && popupStyle.value && anchor.value
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const anchorRect = anchor.value.getBoundingClientRect()
    const { width: pw, height: ph } = el.getBoundingClientRect()
    const { innerWidth: vw, innerHeight: vh } = window

    const gap = parseFloat(
      getComputedStyle(el).getPropertyValue('--mu-side-menu_popup-gap')
    ) || 4

    // 主轴（水平）：右侧放得下优先右侧，否则左侧；两侧都不足放空间更大一侧
    const rightSpace = vw - anchorRect.right - gap
    const leftSpace = anchorRect.left - gap

    const position = rightSpace >= pw
      ? 'right'
      : leftSpace >= pw
        ? 'left'
        : (rightSpace >= leftSpace ? 'right' : 'left')

    const style = {
      [position === 'right' ? 'left' : 'right']:
        `${(position === 'right' ? anchorRect.right : vw - anchorRect.left) + gap}px`
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

  async function show (anchorEl, groupNode) {
    clearHideTimer()

    const anchorChanged = anchor.value !== anchorEl

    anchor.value = anchorEl
    group.value = groupNode

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

  function hideOrReposition () {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(anchor.value)) hide()
    else updatePosition()
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
    onCaptureWindowResize: hideOrReposition,
    onCaptureScroll (event) {
      if (!isPositionAssignable()) return

      if (!isElementInViewport(anchor.value)) hide()
      else if (event.target.contains(anchor.value)) updatePosition()
    },
    onCaptureWindowBlur: hide,
    onCaptureFullscreenChange: hide
  })

  defineExpose({ show, hide, delayHide, updatePosition })
</script>
