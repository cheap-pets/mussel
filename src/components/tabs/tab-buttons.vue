<template>
  <div :class="['mu-tab-buttons', vertical && 'mu-tab-buttons--vertical']">
    <div
      ref="containerRef"
      class="mu-tab-buttons__container"
      @scroll="refreshOverflow"
      @sizechange="refreshOverflow">
      <div class="mu-tab-buttons__content" @sizechange="refreshOverflow">
        <slot />
      </div>
    </div>
    <div v-if="overflowed" class="mu-tab-buttons__shift">
      <mu-icon-button
        button-style="text"
        size="small"
        :icon="vertical ? 'chevronUp' : 'chevronLeft'"
        :disabled="!canScrollPrev"
        @pointerdown="startScroll(-1, $event)" />
      <mu-icon-button
        button-style="text"
        size="small"
        :icon="vertical ? 'chevronDown' : 'chevronRight'"
        :disabled="!canScrollNext"
        @pointerdown="startScroll(1, $event)" />
    </div>
  </div>
</template>

<script setup>
  import './tab-buttons.scss'

  import { shallowRef, ref, onMounted, onBeforeUnmount } from 'vue'

  defineOptions({ name: 'MusselTabButtons' })

  const props = defineProps({
    vertical: Boolean
  })

  // 轻点位移一步后停顿该时长，继续按住则进入连续滚动
  const HOLD_DELAY = 300
  const SCROLL_SPEED = 0.5
  const MAX_FRAME_INTERVAL = 100
  const POSITION_EPSILON = 1

  const containerRef = shallowRef()
  const overflowed = ref(false)
  const canScrollPrev = ref(false)
  const canScrollNext = ref(false)

  let scrollDirection = 0
  let holdTimer = 0
  let rafId = 0
  let lastTime = 0

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

    const position = props.vertical ? el.scrollTop : el.scrollLeft
    const maxPosition = props.vertical
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth

    overflowed.value = maxPosition > POSITION_EPSILON
    canScrollPrev.value = position > POSITION_EPSILON
    canScrollNext.value = position < maxPosition - POSITION_EPSILON
  }

  function isAtEdge (direction) {
    const el = containerRef.value
    if (!el) return true

    const position = props.vertical ? el.scrollTop : el.scrollLeft
    const maxPosition = props.vertical
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth

    return direction < 0
      ? position <= POSITION_EPSILON
      : position >= maxPosition - POSITION_EPSILON
  }

  function getStepDistance (direction) {
    const el = containerRef.value
    if (!el) return 0

    const children = el.firstElementChild?.children

    if (children?.length) {
      const forward = direction > 0
      const containerRect = el.getBoundingClientRect()
      const viewLeading = props.vertical ? containerRect.top : containerRect.left
      const viewTrailing = props.vertical ? containerRect.bottom : containerRect.right
      const leadingKey = props.vertical ? 'top' : 'left'
      const trailingKey = props.vertical ? 'bottom' : 'right'

      // 后退对齐目标：前边缘已滚过可视区边缘的最后一个子元素，连同它前面的间距一起露出
      let alignLeading = null
      let prevTrailing = null

      for (const child of Array.from(children)) {
        const rect = child.getBoundingClientRect()
        const leading = rect[leadingKey]
        const trailing = rect[trailingKey]
        const gapBefore = prevTrailing === null ? 0 : leading - prevTrailing

        if (forward) {
          // 前进：正好露出滚动方向上第一个被裁切的子元素，尾部与其后元素的间距一并保留
          if (trailing > viewTrailing + POSITION_EPSILON) {
            const next = child.nextElementSibling?.getBoundingClientRect()
            const gapAfter = next ? next[leadingKey] - trailing : 0
            return trailing + gapAfter - viewTrailing
          }
        } else if (leading < viewLeading - POSITION_EPSILON) {
          alignLeading = leading - gapBefore
        }

        prevTrailing = trailing
      }

      if (!forward && alignLeading !== null) {
        return viewLeading - alignLeading
      }
    }

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
</script>
