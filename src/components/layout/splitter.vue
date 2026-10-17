<template>
  <div class="mu-flex-splitter" :class="cls" @pointerdown="onPointerDown">
    <div
      v-if="hasCollapseHandle"
      class="mu-flex-splitter__collapse-handle"
      @pointerdown.stop
      @dblclick.stop
      @click="emit('toggle')" />
  </div>
</template>

<script setup>
  import './splitter.scss'

  import { computed, onBeforeUnmount } from 'vue'

  import { clamp } from '@/utils/math.js'
  import { resolvePixel } from '@/utils/size.js'

  const emit = defineEmits(['resizing', 'toggle', 'preview'])

  const props = defineProps({
    direction: {
      type: String,
      validator: v => ['row', 'column'].includes(v)
    },
    target: {
      type: String,
      validator: v => ['prev', 'next'].includes(v)
    },
    size: {
      type: String,
      default: 'normal',
      validator: v => ['zero', 'slim', 'normal'].includes(v)
    },
    shape: {
      type: String,
      default: 'line',
      validator: v => ['line', 'pill'].includes(v)
    },
    visibility: {
      type: String,
      default: 'always',
      validator: v => ['always', 'hover'].includes(v)
    },
    resizable: {
      type: Boolean,
      default: false
    },
    collapsible: Boolean,
    collapseHandle: Boolean,
    collapsed: Boolean
  })

  const DEFAULT_COLLAPSE_SIZE = 200
  const PREVIEW_THRESHOLD = 20
  const COLLAPSE_TOGGLE_THRESHOLD = 40

  function prefixClass (className) {
    return `mu-flex-splitter--${className}`
  }

  const cls = computed(() =>
    [
      prefixClass(props.direction === 'column' ? 'col' : 'row'),
      props.size !== 'normal' && prefixClass(props.size),
      props.shape !== 'line' && prefixClass(props.shape),
      props.visibility === 'hover' && prefixClass('reveal'),
      !props.resizable && prefixClass(props.collapsible ? 'collapse-only' : 'inert'),
      props.target && prefixClass(props.target),
      props.collapsed && prefixClass('collapsed')
    ].filter(Boolean)
  )

  const hasCollapseHandle = computed(() =>
    props.collapseHandle && props.collapsible && props.shape === 'line'
  )

  function calculateSizeRange (splitterEl) {
    const {
      parentElement: parentEl,
      previousElementSibling: prevEl,
      nextElementSibling: nextEl
    } = splitterEl

    const [targetEl, centerEl] =
      props.target === 'prev' ? [prevEl, nextEl] : [nextEl, prevEl]

    const propSuffix = props.direction === 'row' ? 'Width' : 'Height'
    const minProp = `min${propSuffix}`
    const maxProp = `max${propSuffix}`
    const clientSizeProp = `client${propSuffix}`
    const offsetSizeProp = `offset${propSuffix}`

    const clientSize = parentEl[clientSizeProp]
    const totalSize = prevEl[offsetSizeProp] + nextEl[offsetSizeProp]

    let { [minProp]: tMin, [maxProp]: tMax } = getComputedStyle(targetEl)
    let { [minProp]: cMin, [maxProp]: cMax, flexBasis: cBas } = getComputedStyle(centerEl)

    ;[tMin = 0, tMax = totalSize, cMin = 0, cMax = totalSize, cBas = 0] =
      [tMin, tMax, cMin, cMax, cBas].map(v => resolvePixel(v, clientSize))

    return {
      startSize: targetEl[offsetSizeProp],
      collapseSize: Math.min(
        tMin ? tMin / 2 : DEFAULT_COLLAPSE_SIZE,
        DEFAULT_COLLAPSE_SIZE
      ),
      min: Math.max(tMin, totalSize - cMax),
      max: Math.min(tMax, totalSize - Math.max(cMin, cBas))
    }
  }

  let activeDrag = null

  function stopDrag () {
    if (!activeDrag) return

    const { splitterEl, abort, previewed } = activeDrag

    splitterEl.removeAttribute('active')
    document.body.classList.remove('mu-resizing')

    if (previewed) emit('preview', false)
    abort()
    activeDrag = null
  }

  function onPointerDown (event) {
    if (!props.resizable && !props.collapsible) return

    // 第二指针防重入：避免覆盖句柄导致旧监听泄漏
    if (activeDrag) return

    const { target: splitterEl, pageX: startX, pageY: startY } = event

    const isRow = props.direction === 'row'
    const sign = props.target === 'prev' ? 1 : -1

    // collapse-only 拖拽只看位移方向，不需要尺寸范围
    const sizeRange = props.resizable ? calculateSizeRange(splitterEl) : null

    let toggled = false

    function onPointerMove (e) {
      const delta = (isRow ? e.pageX - startX : e.pageY - startY) * sign

      if (sizeRange) {
        let size = sizeRange.startSize + delta

        size = props.collapsible && size < sizeRange.collapseSize
          ? 0
          : clamp(size, sizeRange.min, sizeRange.max)

        emit('resizing', size ? `${size}px` : '')
        return
      }

      if (toggled) return

      const progress = props.collapsed ? delta : -delta
      const shouldPreview = progress >= PREVIEW_THRESHOLD

      if (shouldPreview !== activeDrag.previewed) {
        activeDrag.previewed = shouldPreview
        emit('preview', shouldPreview)
      }

      if (progress >= COLLAPSE_TOGGLE_THRESHOLD) {
        toggled = true

        // progress ≥ 40 时上方同步块已保证 previewed 为 true，此处必清预览，
        // 释放时 stopDrag 不再重复 emit
        activeDrag.previewed = false
        emit('preview', false)
        emit('toggle')
      }
    }

    const controller = new AbortController()
    const options = { signal: controller.signal }

    splitterEl.setPointerCapture(event.pointerId)
    splitterEl.setAttribute('active', true)

    document.body.classList.add('mu-resizing')

    activeDrag = { splitterEl, previewed: false, abort: () => controller.abort() }

    window.addEventListener('pointermove', onPointerMove, options)
    window.addEventListener('pointerup', stopDrag, options)
    window.addEventListener('pointercancel', stopDrag, options)
  }

  onBeforeUnmount(stopDrag)
</script>
