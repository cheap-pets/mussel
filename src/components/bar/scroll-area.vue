<template>
  <div :class="['mu-scroll-area', vertical && 'mu-scroll-area--vertical']">
    <div
      ref="containerRef"
      class="mu-scroll-area__container"
      @scroll="refreshOverflow"
      @sizechange="refreshOverflow">
      <div class="mu-scroll-area__content" @sizechange="refreshOverflow">
        <slot />
      </div>
    </div>
    <div v-if="overflowed" class="mu-scroll-area__buttons">
      <mu-icon-button
        button-style="text"
        size="small"
        :icon="vertical ? 'chevronUp' : 'chevronLeft'"
        :disabled="!hasPrev"
        @pointerdown="startScroll(-1, $event)" />
      <mu-icon-button
        button-style="text"
        size="small"
        :icon="vertical ? 'chevronDown' : 'chevronRight'"
        :disabled="!hasNext"
        @pointerdown="startScroll(1, $event)" />
      <slot name="overflow-buttons" />
    </div>
  </div>
</template>

<script setup>
  import './scroll-area.scss'

  import { shallowRef, ref, onMounted, onBeforeUnmount } from 'vue'

  defineOptions({ name: 'MusselScrollArea' })

  const props = defineProps({
    vertical: Boolean
  })

  // 轻点位移一步后停顿该时长，继续按住则进入连续滚动
  const HOLD_DELAY = 300
  const SCROLL_SPEED = 0.5
  const PIXEL_EPSILON = 1
  const MAX_FRAME_INTERVAL = 100

  const containerRef = shallowRef()
  const overflowed = ref(false)
  const hasPrev = ref(false)
  const hasNext = ref(false)

  let scrollDirection = 0
  let holdTimer = 0
  let lastTime = 0
  let rafId = 0

  function scrollBy (distance) {
    const el = containerRef.value
    if (!el) return false

    const key = props.vertical ? 'scrollTop' : 'scrollLeft'
    const before = el[key]

    el[key] += distance

    refreshOverflow()

    return el[key] !== before
  }

  function refreshOverflow () {
    const el = containerRef.value
    if (!el) return

    const [position, maxPosition] = props.vertical
      ? [el.scrollTop, el.scrollHeight - el.clientHeight]
      : [el.scrollLeft, el.scrollWidth - el.clientWidth]

    overflowed.value = maxPosition > PIXEL_EPSILON
    hasPrev.value = position > PIXEL_EPSILON
    hasNext.value = position < maxPosition - PIXEL_EPSILON
  }

  function isAtEdge (direction) {
    const el = containerRef.value
    if (!el) return true

    const [position, maxPosition] = props.vertical
      ? [el.scrollTop, el.scrollHeight - el.clientHeight]
      : [el.scrollLeft, el.scrollWidth - el.clientWidth]

    return direction < 0
      ? position <= PIXEL_EPSILON
      : position >= maxPosition - PIXEL_EPSILON
  }

  // 将子元素滚入可视区：滚出近端对齐近端，滚出远端对齐远端，已在区内则不动
  function scrollIntoView (el) {
    const container = containerRef.value
    if (!el || !container?.contains(el)) return

    const [startKey, endKey, positionKey] = props.vertical
      ? ['top', 'bottom', 'scrollTop']
      : ['left', 'right', 'scrollLeft']

    const view = container.getBoundingClientRect()
    const rect = el.getBoundingClientRect()

    let position = container[positionKey]

    if (rect[startKey] < view[startKey]) {
      position -= view[startKey] - rect[startKey]
    } else if (rect[endKey] > view[endKey]) {
      position += rect[endKey] - view[endKey]
    } else return

    const maxPosition = props.vertical
      ? container.scrollHeight - container.clientHeight
      : container.scrollWidth - container.clientWidth

    container[positionKey] = Math.min(Math.max(position, 0), maxPosition)
    refreshOverflow()
  }

  // 纵向取 top/bottom、横向取 left/right，映射成统一的 start→end 主轴区间
  function getMainAxisRanges () {
    const el = containerRef.value
    if (!el) return null

    const [startKey, endKey] = props.vertical
      ? ['top', 'bottom']
      : ['left', 'right']

    const view = el.getBoundingClientRect()
    const items = []

    for (const child of el.firstElementChild?.children ?? []) {
      const rect = child.getBoundingClientRect()
      items.push({ start: rect[startKey], end: rect[endKey] })
    }

    return {
      viewStart: view[startKey],
      viewEnd: view[endKey],
      items
    }
  }

  // 前进对齐目标：滚动方向上第一个被裁切的子元素，尾部与其后元素的间距一并保留
  function getForwardDistance ({ viewEnd, items }) {
    for (let i = 0; i < items.length; i++) {
      const { end } = items[i]
      if (end <= viewEnd + PIXEL_EPSILON) continue

      const gap = items[i + 1] ? items[i + 1].start - end : 0
      return end + gap - viewEnd
    }

    return null
  }

  // 后退对齐目标：前缘已滚出可视区边界的最后一个子元素，连同它前面的间距一起露出
  function getBackwardDistance ({ viewStart, items }) {
    for (let i = items.length - 1; i >= 0; i--) {
      const { start } = items[i]
      if (start >= viewStart - PIXEL_EPSILON) continue

      const gap = i > 0 ? start - items[i - 1].end : 0
      return viewStart - start + gap
    }

    return null
  }

  function getStepDistance (direction) {
    const el = containerRef.value
    if (!el) return 0

    const rects = getMainAxisRanges()
    const distance = direction > 0 ? getForwardDistance(rects) : getBackwardDistance(rects)

    if (distance !== null) return distance

    // 无可对齐子元素时按容器尺寸回退
    const size = props.vertical ? el.clientHeight : el.clientWidth
    return Math.max(40, size * 0.6)
  }

  function startScroll (direction, event) {
    event.preventDefault()
    stopScroll()

    // 已在边界时轻点无位移，不进入按住流程
    if (!scrollBy(direction * getStepDistance(direction))) return

    scrollDirection = direction

    // 释放可能落在页面任意位置（按钮被禁用 / 位移），在 window 上统一捕获
    window.addEventListener('pointerup', stopScroll)
    window.addEventListener('pointercancel', stopScroll)

    holdTimer = window.setTimeout(() => {
      lastTime = performance.now()
      rafId = window.requestAnimationFrame(continueScroll)
    }, HOLD_DELAY)
  }

  function continueScroll () {
    if (!scrollDirection) return

    const now = performance.now()
    const interval = Math.min(now - lastTime, MAX_FRAME_INTERVAL)

    lastTime = now

    scrollBy(scrollDirection * SCROLL_SPEED * interval)

    // 直接按位置判断边界：单帧小位移可能被像素舍入吞掉，不能作为边界依据
    if (isAtEdge(scrollDirection)) {
      stopScroll()
      return
    }

    rafId = window.requestAnimationFrame(continueScroll)
  }

  function stopScroll () {
    window.clearTimeout(holdTimer)
    window.cancelAnimationFrame(rafId)
    window.removeEventListener('pointerup', stopScroll)
    window.removeEventListener('pointercancel', stopScroll)

    scrollDirection = 0
  }

  onMounted(refreshOverflow)
  onBeforeUnmount(stopScroll)

  defineExpose({ scrollIntoView })
</script>
