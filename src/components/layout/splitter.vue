<template>
  <div
    class="mu-flex-splitter"
    :class="cls"
    :direction="direction"
    @mousedown="onMouseDown" />
</template>

<script setup>
  import './splitter.scss'

  import { computed } from 'vue'

  import { clamp } from '@/utils/math.js'
  import { resolvePixel } from '@/utils/size.js'

  const emit = defineEmits(['resizing'])

  const props = defineProps({
    target: {
      type: String,
      validator: v => ['prev', 'next'].includes(v)
    },
    direction: {
      type: String,
      validator: v => ['row', 'column'].includes(v)
    },
    shape: {
      type: String,
      default: 'hidden',
      validator: v => ['hidden', 'normal', 'slim', 'pill'].includes(v)
    },
    collapsible: Boolean
  })

  function prefixClass (className) {
    return `mu-flex-splitter--${className}`
  }

  const cls = computed(() =>
    [
      prefixClass(props.direction === 'column' ? 'col' : 'row'),
      ['hidden', 'slim', 'pill'].includes(props.shape) && prefixClass(props.shape)
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
      targetEl,
      sign,
      tMin,
      min: Math.max(tMin, totalSize - cMax),
      max: Math.min(tMax, totalSize - Math.max(cMin, cBas))
    }
  }

  function onMouseDown (event) {
    const { target: splitterEl, pageX: startX, pageY: startY } = event
    const { targetEl, sign, tMin, min, max } = calculateSizeRange(splitterEl)
    const { width: startW, height: startH } = targetEl.getBoundingClientRect()

    function onMouseMoveX (e) {
      let size = startW + (e.pageX - startX) * sign

      size = props.collapsible && size < tMin / 2
        ? 0
        : clamp(size, min, max)

      emit('resizing', size && `${size}px`)
    }

    function onMouseMoveY (e) {
      let size = startH + (e.pageY - startY) * sign

      size = props.collapsible && size < tMin / 2
        ? 0
        : clamp(size, min, max)

      emit('resizing', size && `${size}px`)
    }

    const onMouseMove =
      props.direction === 'row' ? onMouseMoveX : onMouseMoveY

    function onMouseUp () {
      splitterEl.removeAttribute('active')
      document.body.classList.remove('mu-resizing')

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    splitterEl.setAttribute('active', true)
    document.body.classList.add('mu-resizing')

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
</script>
