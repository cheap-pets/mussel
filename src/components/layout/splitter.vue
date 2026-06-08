<template>
  <div ref="thisEl" :class="cls" :direction="direction" @mousedown="onMouseDown" />
</template>

<script setup>
  import { inject, shallowRef, computed } from 'vue'

  const thisEl = shallowRef()

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
    size: {
      type: String,
      default: 'hidden',
      validator: v => ['normal', 'slim', 'hidden'].includes(v)
    },
    shape: {
      type: String,
      default: () => inject('$mussel').options.splitter?.shape || 'line',
      validate: v => ['line', 'bubble'].includes(v)
    }
  })

  const cls = computed(() => [
    'mu-flex-splitter',
    `mu-flex-splitter--${props.direction}`,
    props.shape === 'bubble' && `mu-flex-splitter--${props.shape}`,
    ['slim', 'hidden'].includes(props.size) && `mu-flex-splitter--${props.size}`
  ])

  function onMouseDown (event) {
    const el = thisEl.value
    const isPrev = props.target === 'prev'
    const targetEl = isPrev ? el.previousElementSibling : el.nextElementSibling
    const sign = isPrev ? 1 : -1

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
      thisEl.value.removeAttribute('active')
      document.body.classList.remove('mu-resizing')

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    thisEl.value.setAttribute('active', true)
    document.body.classList.add('mu-resizing')

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
</script>
