<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      class="mu-popup-menu"
      :style="popupStyle"
      @mouseenter="clearHideTimer"
      @mouseleave="delayHide(true)">
      <div v-if="showHeader" class="mu-popup-menu__header text-ellipsis">
        {{ groupLabel }}
      </div>
      <mu-scroll-box class="mu-popup-menu__body">
        <menu-item
          v-for="(child, index) in childNodes"
          :key="child.id ?? index"
          :node="child"
          :group="group"
          popup
          @item-enter="onItemEnter(child, $event)"
          @item-leave="onItemLeave(child)"
          @row-click="emit('rowClick', child)"
          @favorite-toggle="emit('favoriteToggle', child)" />
      </mu-scroll-box>
    </div>
  </Teleport>
</template>

<script setup>
  import './popup-menu.scss'

  import { computed, inject, nextTick, onUnmounted, ref, shallowRef } from 'vue'

  import { HIDE_DELAY, usePopupManager, usePopupRunner } from '@/components/common/popup'
  import { isElementInViewport } from '@/utils/dom'

  import MenuItem from './menu-item.vue'

  defineOptions({ name: 'MusselPopupMenu' })

  const props = defineProps({
    layer: { type: Number, default: 0 }
  })

  // 行点击 / 收藏切换转发宿主分派（链头弹层的启闭与选中均为宿主逻辑）
  const emit = defineEmits(['rowClick', 'favoriteToggle'])

  const MARGIN = 8 // 面板与视口上下边的最小留白，与 max-height: calc(100vh - 16px) 对应
  const GAP = 8 // 面板与锚点的水平间距

  const menu = inject('menu')
  const chain = inject('popupChain')

  const visible = ref()
  const position = ref('right')

  const panelEl = shallowRef()
  const anchor = shallowRef()
  const group = shallowRef()

  // 父层实例：链头为空（向协调器注册），子弹层不注册、生命周期由本层驱动。
  const parentPopup = props.layer ? chain.getLayer(props.layer - 1) : null

  const { ready, popupStyle, container, doEnter, doExit } =
    usePopupRunner(visible, panelEl, updatePosition)

  const childNodes = computed(() => group.value?.items || [])

  // 仅收拢态主树一级组的弹层显示标题：rail 锚点行只有图标，标题补分组上下文；
  // 其余层锚点行标签本身可见，不重复
  const showHeader = computed(() => !props.layer && !!menu.collapsed?.value)
  const groupLabel = computed(() => group.value?.label)

  // 子层实例：未生成（本层面板内组行未被 hover 过）时为空
  function subPopup () {
    return chain.getLayer(props.layer + 1)
  }

  // 组行 hover 沿链浮出下一层；离开只臂下一层待关（鼠标可能仍在父面板内换行，
  // 臂祖先会误收整链）
  function onItemEnter (child, event) {
    if (!child.items?.length) return

    chain.showLayer(props.layer + 1, event.currentTarget, child)
  }

  function onItemLeave (child) {
    if (child.items?.length) subPopup()?.delayHide()
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

  // 本层默认弹出侧：链头按宿主 direction 推导（横向 'down'、纵向 'right'）；
  // 子层继承父层方向，父层纵向（down/up）时回水平 'right'（经典级联向右下钻）
  function resolveBase () {
    const inherited = parentPopup?.position

    if (inherited === 'down' || inherited === 'up') return 'right'

    return inherited ?? (menu.direction === 'horizontal' ? 'down' : 'right')
  }

  // 定位纯函数（DOM 读写归 updatePosition）：base 决定主轴方向（right/left
  // 水平、down/up 垂直）；仅默认侧放不下且另一侧放得下才翻转，两侧不足保持默认侧
  function calculatePosition (anchorRect, panelSize, base) {
    return (base === 'down' || base === 'up')
      ? calculateVerticalPosition(anchorRect, panelSize, base)
      : calculateHorizontalPosition(anchorRect, panelSize, base)
  }

  // 垂直主轴（横向菜单链头）：主轴上下翻转；交叉轴默认左对齐，右溢出改右对齐
  // （右缘锚定锚点右缘，max-content 宽度变化时面板不漂移），两侧按 MARGIN 夹紧
  function calculateVerticalPosition (anchorRect, panelSize, base) {
    const { innerWidth: vw, innerHeight: vh } = window
    const { width: pw, height: ph } = panelSize

    const fits = {
      down: vh - anchorRect.bottom - GAP >= ph,
      up: anchorRect.top - GAP >= ph
    }
    const other = base === 'down' ? 'up' : 'down'
    const pos = fits[base] || !fits[other] ? base : other

    const style = pos === 'down'
      ? { top: `${anchorRect.bottom + GAP}px` }
      // 上缘锚定锚点上缘，宽度变化不漂移
      : { bottom: `${vh - anchorRect.top + GAP}px` }

    if (anchorRect.left + pw <= vw - MARGIN) {
      style.left = `${Math.max(MARGIN, anchorRect.left)}px`
    } else {
      style.right = `${Math.max(MARGIN, vw - anchorRect.right)}px`
    }

    return { position: pos, style }
  }

  // 水平主轴（side-menu 链及向右下钻的子层）
  function calculateHorizontalPosition (anchorRect, panelSize, base) {
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
      resolveBase()
    )

    // 先写回本层方向再递归子层，子层取到的继承方向时序正确
    position.value = pos
    el.setAttribute('position', pos)
    // 样式须同步写入 DOM 再递归：popupStyle 经响应式 patch 是异步的，
    // 子层重定位读父面板内锚点 rect 时会拿到父面板旧位置
    el.style.left = el.style.right = el.style.top = el.style.bottom = ''
    Object.assign(el.style, style)
    popupStyle.value = style

    subPopup()?.updatePosition()
  }

  let hideTimer

  // 进入面板：清本层与全部祖先的待关计时器（整链保活）；
  // 不含后代——从深层回到上层面板时，更深层按自身计时收起
  function clearHideTimer () {
    clearTimeout(hideTimer)
    hideTimer = undefined
    parentPopup?.clearHideTimer()
  }

  // 臂定待关计时器：withAncestors 时整链同收（防深层直出空白致祖先计时器已清、
  // 链滞留孤儿）；锚点行离开只臂本层（臂祖先会误收整链）
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

    if (visible.value) {
      visible.value = false
      doExit()
    }
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

  // 内部 API 对象：层间互访 / 链协调 / 宿主共用，setup 期自注册进链表；
  // 不经 defineExpose 暴露（链表存普通对象，组件实例无消费者）。
  // ref 成员须经 getter 保解包：裸 ref 恒真，宿主判链头已开、子层继承方向会失效
  chain.setLayer(props.layer, {
    get visible () { return visible.value },
    get position () { return position.value },
    show,
    hide,
    delayHide,
    clearHideTimer,
    updatePosition,
    isInsideChain,
    handleAnchorMove
  })
</script>
