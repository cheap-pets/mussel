<template>
  <div class="mu-flex-splitter" :class="cls" @pointerdown="onPointerDown" />
</template>

<script setup>
  import './splitter.scss'

  import { computed, onBeforeUnmount } from 'vue'

  import { clamp } from '@/utils/math.js'
  import { resolvePixel } from '@/utils/size.js'

  const emit = defineEmits(['resizing'])

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
      default: 'none',
      validator: v => ['none', 'slim', 'normal'].includes(v)
    },
    shape: {
      type: String,
      default: 'line',
      validator: v => ['line', 'pill'].includes(v)
    },
    collapsible: Boolean
  })

  const COLLAPSE_THRESHOLD = 200

  function prefixClass (className) {
    return `mu-flex-splitter--${className}`
  }

  const cls = computed(() =>
    [
      prefixClass(props.direction === 'column' ? 'col' : 'row'),
      props.size !== 'normal' && prefixClass(props.size),
      props.shape === 'pill' && prefixClass(props.shape)
    ].filter(Boolean)
  )

  function calculateSizeRange (splitterEl) {
    const {
      parentElement: parentEl,
      previousElementSibling: prevEl,
      nextElementSibling: nextEl
    } = splitterEl

    const [targetEl, centerEl, sign] =
      props.target === 'prev' ? [prevEl, nextEl, 1] : [nextEl, prevEl, -1]

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
      sign,
      startSize: targetEl[offsetSizeProp],
      collapseSize: Math.min(tMin / 2 || COLLAPSE_THRESHOLD, COLLAPSE_THRESHOLD),
      min: Math.max(tMin, totalSize - cMax),
      max: Math.min(tMax, totalSize - Math.max(cMin, cBas))
    }
  }

  let activeDrag = null

  function stopDrag () {
    if (!activeDrag) return

    const { splitterEl, abort } = activeDrag

    splitterEl.removeAttribute('active')
    document.body.classList.remove('mu-resizing')

    abort()
    activeDrag = null
  }

  function onPointerDown (event) {
    const { target: splitterEl, pageX: startX, pageY: startY } = event
    const { sign, startSize, collapseSize, min, max } = calculateSizeRange(splitterEl)

    const isRow = props.direction === 'row'

    function onPointerMove (e) {
      const delta = (isRow ? e.pageX - startX : e.pageY - startY) * sign

      let size = startSize + delta

      size = props.collapsible && size < collapseSize
        ? 0
        : clamp(size, min, max)

      emit('resizing', size ? `${size}px` : '')
    }

    const controller = new AbortController()
    const options = { signal: controller.signal }

    splitterEl.setPointerCapture(event.pointerId)
    splitterEl.setAttribute('active', true)

    document.body.classList.add('mu-resizing')

    activeDrag = { splitterEl, abort: () => controller.abort() }

    window.addEventListener('pointermove', onPointerMove, options)
    window.addEventListener('pointerup', stopDrag, options)
    window.addEventListener('pointercancel', stopDrag, options)
  }

  onBeforeUnmount(stopDrag)
</script>
