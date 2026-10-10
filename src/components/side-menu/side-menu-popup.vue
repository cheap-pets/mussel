<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      class="mu-side-menu-popup"
      :style="popupStyle"
      @mouseenter="clearHideTimer"
      @mouseleave="delayHide(true)">
      <div v-if="showHeader" class="mu-side-menu-popup__header text-ellipsis">
        {{ groupLabel }}
      </div>
      <mu-scroll-box class="mu-side-menu-popup__body">
        <div class="mu-side-menu__list">
          <side-menu-node
            v-for="(child, index) in childNodes"
            :key="child.id ?? index"
            :node="child"
            :level="0"
            :in-favorites="groupKey === FAVORITES_KEY"
            @item-enter="onNodeItemEnter"
            @item-leave="onNodeItemLeave" />
        </div>
      </mu-scroll-box>
    </div>
  </Teleport>
</template>

<script setup>
  import { computed, inject, nextTick, onUnmounted, provide, ref, shallowRef } from 'vue'
  import { HIDE_DELAY, usePopupManager, usePopupRunner } from '@/components/common/popup'
  import { isElementInViewport } from '@/utils/dom'

  import { FAVORITES_KEY } from './side-menu'

  import SideMenuNode from './side-menu-node.vue'

  defineOptions({ name: 'MusselSideMenuPopup' })

  // 层序：0 为链头（主树行触发），子层随父层面板内组行 hover 由 side-menu 逐层生成。
  // 全部层实例统一挂在 side-menu 下（chain 持有实例表），弹层自身不再递归自引用
  const props = defineProps({
    layer: { type: Number, default: 0 }
  })

  const MARGIN = 8 // 面板与视口上下边的最小留白，与 max-height: calc(100vh - 16px) 对应
  const GAP = 8 // 面板与锚点的水平间距

  const menu = inject('sideMenu')
  const chain = inject('popupChain')

  // 父层实例：链头为空（向协调器注册），子弹层不注册、生命周期由本层驱动。
  // 实例先生成父层后生成子层，子层 setup 期父层引用已就位
  const parentPopup = props.layer ? chain.getLayer(props.layer - 1) : null

  // 面板内行与主树行共用同一 menu 上下文，仅补 popup 态标记；
  // 组行 hover 的下钻浮出经 itemEnter/itemLeave 事件直报本层处理
  provide('sideMenu', { ...menu, popup: true })

  const visible = ref()
  const position = ref('right')

  const panelEl = shallowRef()
  const anchor = shallowRef()
  const group = shallowRef()

  let hideTimer

  const { ready, popupStyle, container, doEnter, doExit } =
    usePopupRunner(visible, panelEl, updatePosition)

  const childNodes = computed(() => group.value?.items || [])
  const groupKey = computed(() => group.value?.id)

  // 标题栏：锚点组（上级分组）标题。仅收拢态主树一级组的弹层显示——rail 锚点行
  // 只有图标，标题提供分组上下文；其余层锚点行标签本身可见，不重复
  const showHeader = computed(() => !props.layer && menu.collapsed.value)
  const groupLabel = computed(() => group.value?.label)

  // 子层实例：未生成（本层面板内组行未被 hover 过）时为空
  function subPopup () {
    return chain.getLayer(props.layer + 1)
  }

  // 面板内组行 hover：沿链浮出下一层（node 随事件携带，锚点行取
  // event.currentTarget）；离开组行：只臂下一层（鼠标可能仍在父面板内
  // 换行，臂祖先会误收整链）
  function onNodeItemEnter (node, event) {
    chain.showLayer(props.layer + 1, event.currentTarget, node)
  }

  function onNodeItemLeave () {
    subPopup()?.delayHide()
  }

  // 锚点可见性：在视口内，且未被最近滚动裁剪容器（菜单 body / 父面板 body）滚出
  // 可见区。裁剪容器内的行滚出后 rect 仍可能落在视口范围内，仅查视口会误报可见
  function isAnchorVisible (el) {
    if (!isElementInViewport(el)) return false

    const clipper = el.closest('.mu-scroll-box')

    if (!clipper) return true

    const rect = el.getBoundingClientRect()
    const clip = clipper.getBoundingClientRect()

    return rect.top < clip.bottom && rect.bottom > clip.top &&
      rect.left < clip.right && rect.right > clip.left
  }

  function isPositionAssignable () {
    return visible.value && popupStyle.value && anchor.value
  }

  // 定位纯函数：仅做几何计算，DOM 读写由 updatePosition 承担。
  // base 为本层默认侧：链头 'right'，子层继承父层弹出方向；仅默认侧放不下且
  // 另一侧放得下才翻转，两侧都不足保持默认侧延伸（不做取大侧兜底，防方向锯齿）
  function calculatePosition (anchorRect, panelSize, base) {
    const { innerWidth: vw, innerHeight: vh } = window
    const { width: pw, height: ph } = panelSize

    // 主轴（水平）
    const rightSpace = vw - anchorRect.right - GAP
    const leftSpace = anchorRect.left - GAP

    const fits = { right: rightSpace >= pw, left: leftSpace >= pw }
    const other = base === 'right' ? 'left' : 'right'

    const pos = fits[base] || !fits[other] ? base : other

    // 交叉轴（垂直）：默认与锚点顶对齐；下方溢出且锚点在上半屏时底对齐翻转，最终双向夹紧
    let top = anchorRect.top

    if (top + ph > vh - MARGIN && anchorRect.top > vh / 2) {
      top = anchorRect.bottom - ph
    }

    top = Math.max(MARGIN, Math.min(top, vh - MARGIN - ph))

    // 左侧悬挂须用 right 定位：右缘锚定锚点左缘，max-content 宽度变化时面板不漂移
    const style = pos === 'right'
      ? { left: `${anchorRect.right + GAP}px` }
      : { right: `${vw - anchorRect.left + GAP}px` }

    style.top = `${top}px`

    return { position: pos, style }
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const anchorRect = anchor.value.getBoundingClientRect()

    const { position: pos, style } = calculatePosition(
      anchorRect,
      el.getBoundingClientRect(),
      parentPopup?.position ?? 'right'
    )

    // 先写回本层方向再递归子层，子层取到的继承方向时序正确
    position.value = pos
    el.setAttribute('position', pos)
    // 样式须同步写入 DOM 再递归：popupStyle 经响应式 patch 是异步的，
    // 子层重定位读父面板内锚点 rect 时会拿到父面板旧位置
    el.style.left = el.style.right = el.style.top = ''
    Object.assign(el.style, style)
    popupStyle.value = style

    subPopup()?.updatePosition()
  }

  // 进入面板：清本层与全部祖先的待关计时器（整链保活）；
  // 不含后代——从深层回到上层面板时，更深层按自身计时收起
  function clearHideTimer () {
    clearTimeout(hideTimer)
    hideTimer = undefined
    parentPopup?.clearHideTimer()
  }

  // 臂定待关计时器：面板 mouseleave 传 withAncestors 整链同收（防深层直出
  // 空白时祖先计时器已被清、链滞留的孤儿问题）；锚点行 mouseleave 事件上报
  // 只臂本层（鼠标可能仍在父面板内换行，臂祖先会误收整链）
  function delayHide (withAncestors) {
    clearHideTimer()
    hideTimer = setTimeout(hide, HIDE_DELAY)
    if (withAncestors) parentPopup?.delayHide(true)
  }

  // 卸载只清自身计时器，不走 clearHideTimer：向上清是链上 hover 保活语义，
  // 不属于生命周期清理；臂定中卸载可免已卸载实例滞留至计时触发
  onUnmounted(() => clearTimeout(hideTimer))

  async function show (anchorEl, groupNode) {
    // 锚点不可见（不在视口或被滚动区裁剪）时不弹出
    if (!isAnchorVisible(anchorEl)) return

    clearHideTimer()

    const anchorChanged = anchor.value !== anchorEl

    if (anchorChanged) {
      // 换锚点先收起更深层：旧锚点行的 DOM 随内容切换消失，其下级面板无所依
      subPopup()?.hide()
      anchor.value?.removeAttribute('popup-open')
    }

    anchor.value = anchorEl
    group.value = groupNode
    // 已浮出下级弹层的锚点行保持 hover 态（scss [popup-open]）
    anchorEl.setAttribute('popup-open', '')

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
    subPopup()?.hide()
    // 只清自身计时器，不可向上清：链收起时各层计时器先后触发，
    // 先触发的层若清掉祖先尚未触发的计时器，链会滞留成孤儿
    clearTimeout(hideTimer)
    hideTimer = undefined
    anchor.value?.removeAttribute('popup-open')
    if (!visible.value) return

    visible.value = false
    doExit()
  }

  // 链内命中判断：本层锚点 / 面板或任一后代弹层内（子弹层锚点在父面板内，已覆盖）
  function isInsideChain (target) {
    return !!(
      anchor.value?.contains(target) ||
      panelEl.value?.contains(target) ||
      subPopup()?.isInsideChain(target)
    )
  }

  // 锚点滚出/缩出视口（或被滚动区裁剪）即关闭；否则跟随重定位。
  // event 存在（scroll）时仅滚动容器包含锚点才重定位，无关滚动不触发
  function handleAnchorMove (event) {
    if (!isPositionAssignable()) return

    if (!isAnchorVisible(anchor.value)) hide()
    else if (!event || event.target.contains(anchor.value)) updatePosition()

    subPopup()?.handleAnchorMove(event)
  }

  // 协调器仅链头注册：子弹层注册会被后激活弹层的单例互斥关掉链头
  if (!props.layer) {
    usePopupManager(visible, {
      hide,
      onCaptureEscKeyDown: hide,
      onCaptureMouseDown (event) {
        if (visible.value && !isInsideChain(event.target)) hide()
      },
      onCaptureWindowResize: () => handleAnchorMove(),
      onCaptureScroll: handleAnchorMove,
      onCaptureWindowBlur: hide,
      onCaptureFullscreenChange: hide
    })
  }

  defineExpose({
    position,
    show,
    hide,
    delayHide,
    clearHideTimer,
    updatePosition,
    isInsideChain,
    handleAnchorMove
  })
</script>
