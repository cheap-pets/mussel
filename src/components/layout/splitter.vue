<template>
  <div :class="cls" :direction="direction" @mousedown="onMouseDown" />
</template>

<script setup>
  import './splitter.scss'

  import { computed } from 'vue'

  const emit = defineEmits(['resize-target'])

  const props = defineProps({
    direction: {
      type: String,
      validator: v => ['row', 'column'].includes(v)
    },
    target: {
      type: String,
      validator: v => ['prev', 'next'].includes(v)
    },
    shape: {
      type: String,
      default: 'hidden',
      validator: v => ['hidden', 'normal', 'slim', 'bubble', 'slim-pill'].includes(v)
    }
  })

  function prefixClass (className) {
    return `mu-flex-splitter--${className}`
  }

  const cls = computed(() =>
    [
      'mu-flex-splitter',
      prefixClass(props.direction === 'column' ? 'col' : 'row'),
      ['hidden', 'slim', 'pill', 'slim-pill'].includes(props.shape) && prefixClass(props.shape)
    ].filter(Boolean)
  )

  function calcSiblingSizeLimit (el) {
    const {
      previousElementSibling: prevEl,
      nextElementSibling: nextEl
    } = el

    const targetEl =
      props.target === 'prev' ? prevEl : nextEl

    const isRow = props.direction === 'row'
    const sizeProp = isRow ? 'Width' : 'Height'
    const minProp = `min${sizeProp}`
    const maxProp = `max${sizeProp}`

    const targetCs = getComputedStyle(targetEl)

    const min = parseFloat(targetCs[minProp]) || 0
    const max = parseFloat(targetCs[maxProp]) || Infinity

    const totalSize = prevEl[`client${sizeProp}`] + nextEl[`client${sizeProp}`]
    const otherMin = parseFloat(
      getComputedStyle(props.target === 'prev' ? nextEl : prevEl)[minProp]
    ) || 0

    return { targetEl, min, max: Math.min(max, totalSize - otherMin) }
  }

  function onMouseDown (event) {
    const el = event.target

    const {
      previousElementSibling: prevEl,
      nextElementSibling: nextEl
    } = el

    const [targetEl, sign] =
      props.target === 'prev' ? [prevEl, 1] : [nextEl, -1]

    const { pageX: startX, pageY: startY } = event
    const { width: startW, height: startH } = targetEl.getBoundingClientRect()

    function onMouseMoveX (e) {
      emit('resize-target', startW + (e.pageX - startX) * sign)
    }

    function onMouseMoveY (e) {
      emit('resize-target', startH + (e.pageY - startY) * sign)
    }

    const onMouseMove =
      props.direction === 'row' ? onMouseMoveX : onMouseMoveY

    function onMouseUp () {
      el.removeAttribute('active')
      document.body.classList.remove('mu-resizing')

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    el.setAttribute('active', true)
    document.body.classList.add('mu-resizing')

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
</script>
