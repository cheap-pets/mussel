<template>
  <div class="mu-splitter" :draggable="draggable">
    <div @mousedown="onDragStart" />
  </div>
</template>

<script>
  function getOnlyResizableElement (prevEl, nextEl) {
    return prevEl && !prevEl.getAttribute('size')
      ? prevEl
      : (
        nextEl && !nextEl.getAttribute('size')
          ? nextEl
          : null
      )
  }

  function getMaxSize (prevEl, nextEl) {
    const { offsetWidth: pw = 0, offsetHeight: ph = 0 } = Object(prevEl)
    const { offsetWidth: nw = 0, offsetHeight: nh = 0 } = Object(nextEl)

    return {
      maxWidth: pw + nw,
      maxHeight: ph + nh
    }
  }

  function getInitialState (prevEl, nextEl) {
    const el = getOnlyResizableElement(prevEl, nextEl)
    return el
      ? {
        el,
        reverse: el === nextEl,
        startWidth: el.offsetWidth,
        startHeight: el.offsetHeight,
        ...getMaxSize(prevEl, nextEl)
      }
      : null
  }

  function resizeElement ({
    el,
    direction,
    reverse,
    startWidth,
    startHeight,
    maxWidth,
    maxHeight,
    startX,
    startY,
    x,
    y
  }) {
    if (direction === 'row') {
      const w = startWidth + (reverse ? startX - x : x - startX)
      if (w >= 50 && w < maxWidth - 100) {
        el.style.width = w + 'px'
        return true
      }
    } else {
      const h = startHeight + (reverse ? startY - y : y - startY)
      if (h >= 50 && h < maxHeight - 100) {
        el.style.height = h + 'px'
        return true
      }
    }
  }

  export default {
    name: 'MusselSplitter',
    props: {
      draggable: {
        type: Boolean,
        default: true
      }
    },
    computed: {
      parentDirection () {
        return this.$parent.flexDirection || 'row'
      }
    },
    methods: {
      onDragStart (event) {
        if (!this.draggable) return
        const state = getInitialState(
          this.$el.previousElementSibling,
          this.$el.nextElementSibling
        )
        if (!state) return
        this.initialState = {
          direction: this.parentDirection,
          startX: event.pageX,
          startY: event.pageY,
          ...state
        }
        window.addEventListener('mousemove', this.onDragMove)
        window.addEventListener('mouseup', this.onDragEnd)
        if (this.initialState.resized) this.$emit('resizestart')
      },
      onDragMove (event) {
        if (!this.draggable) return
        if (resizeElement({
          ...this.initialState,
          x: event.pageX,
          y: event.pageY
        })) {
          this.initialState.resized = true
          this.$emit('resize')
        }
      },
      onDragEnd (event) {
        if (!this.draggable) return
        window.removeEventListener('mousemove', this.onDragMove)
        window.removeEventListener('mouseup', this.onDragEnd)
        if (this.initialState.resized) this.$emit('resizeend')
      }
    }
  }
</script>
