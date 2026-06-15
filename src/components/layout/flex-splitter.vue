<template>
  <div
    ref="thisEl"
    :class="cls"
    @dblclick="onDblClick"
    @mousedown="onMouseDown">
    <slot v-if="isStriped" name="stripe">
      <svg-stripe
        class="mu-flex-splitter__stripe"
        :direction="StripeDirectionMap[direction]" />
    </slot>
  </div>
</template>

<script setup>
  import './flex-splitter.scss'

  import { ref, computed, inject, provide, onMounted } from 'vue'

  import SvgStripe from '../svg/svg-stripe.vue'

  const thisEl = ref()
  const direction = ref()

  const props = defineProps({
    resizable: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: () => inject('$mussel').options.splitter?.size || 'hidden',
      validate: v => ['normal', 'slim', 'hidden'].includes(v)
    },
    shape: {
      type: String,
      default: () => inject('$mussel').options.splitter?.shape || 'line',
      validate: v => ['line', 'bubble'].includes(v)
    },
    stripe: {
      type: Boolean,
      default: () => inject('$mussel').options.splitter?.stripe ?? false,
      validate: v => [true, false].includes(v)
    },
    spaceFree: Boolean,
    collapseButton: Boolean,
    collapseThreshold: {
      type: Number,
      default: () => inject('$mussel').options.splitter?.collapseThreshold || 200
    }
  })

  const StripeDirectionMap = {
    row: 'vertical',
    column: 'horizontal'
  }

  const isStriped = computed(() =>
    props.resizable && props.shape === 'line' && props.stripe
  )

  const cls = computed(() => [
    'mu-flex-splitter',
    direction.value && `mu-flex-splitter--${direction.value}`,
    ['slim', 'hidden'].includes(props.size) && `mu-flex-splitter--${props.size}`,
    props.shape === 'bubble' && 'mu-flex-splitter--bubble',
    !props.resizable && 'mu-flex-splitter--no-resize',
    props.spaceFree && 'mu-flex-splitter--space-free'
  ])

  function isResizableElement (element) {
    const { position, display } = window.getComputedStyle(element)

    return (
      (display !== 'none' || element.classList.contains('mu-flex-collapsed')) &&
      !['fixed', 'absolute', 'sticky'].includes(position) &&
      !element.classList.contains('mu-flex-splitter')
    )
  }

  function updateSiblingsFlexSize () {
    Array
      .from(thisEl.value.parentNode.children)
      .reduce((result, child) => {
        if (isResizableElement(child)) {
          const style = direction.value === 'row'
            ? { flexBasis: `${child.offsetWidth}px`, width: null }
            : { flexBasis: `${child.offsetHeight}px`, height: null }

          const { flexGrow, flexShrink } = window.getComputedStyle(child)

          if (parseInt(flexGrow) > 1) style.flexGrow = '1'
          if (parseInt(flexShrink) > 1) style.flexShrink = '1'

          result.push({ child, style })
        }

        return result
      }, [])
      .forEach(item => {
        Object.assign(item.child.style, item.style)
      })
  }

  function getResizeSiblings () {
    let prevSibling = thisEl.value.previousElementSibling

    while (prevSibling) {
      if (isResizableElement(prevSibling)) break

      prevSibling = prevSibling.previousElementSibling
    }

    if (!prevSibling) return

    let nextSibling = thisEl.value.nextElementSibling

    while (nextSibling) {
      if (isResizableElement(nextSibling)) break

      nextSibling = nextSibling.nextElementSibling
    }

    return nextSibling && { prevSibling, nextSibling }
  }

  function getResizeRange (prevSibling, nextSibling) {
    const isRowDirection = direction.value === 'row'

    const parentNode = thisEl.value.parentNode
    const parentSize = isRowDirection ? parentNode.clientWidth : parentNode.clientHeight

    function calcPixelValue (value) {
      return !value
        ? 0
        : /^\d+(\.\d+)?%$/.test(value)
          ? Math.round(parseFloat(value) * parentSize / 100)
          : /^(\d*\.?\d+)(px)?$/.test(value)
            ? parseInt(value)
            : 0
    }

    function getRecoverSize (element) {
      const attr = element.getAttribute('recover-size')

      return attr === 'auto'
        ? isRowDirection
          ? element.offsetWidth - element.clientWidth + element.scrollWidth
          : element.offsetHeight - element.clientHeight + element.scrollHeight
        : calcPixelValue(attr)
    }

    function getComputedStyle (element) {
      const style = window.getComputedStyle(element)
      const gap = calcPixelValue(window.getComputedStyle(parentNode).gap)

      return isRowDirection
        ? {
          size: element.offsetWidth,
          min: Math.max(
            calcPixelValue(style.minWidth),
            (
              calcPixelValue(style.paddingLeft) +
              calcPixelValue(style.paddingRight) +
              calcPixelValue(style.borderLeftWidth) +
              calcPixelValue(style.borderRightWidth)
            )
          ),
          max: calcPixelValue(style.maxWidth),
          margin: calcPixelValue(style.marginLeft) + calcPixelValue(style.marginRight) + gap
        }
        : {
          size: element.offsetHeight,
          min: Math.max(
            calcPixelValue(style.minHeight),
            (
              calcPixelValue(style.paddingTop) +
              calcPixelValue(style.paddingBottom) +
              calcPixelValue(style.borderTopWidth) +
              calcPixelValue(style.borderBottomWidth)
            )
          ),
          max: calcPixelValue(style.maxHeight),
          margin: calcPixelValue(style.marginTop) + calcPixelValue(style.marginBottom) + gap
        }
    }

    const {
      size: prevStartSize,
      min: prevMinSize,
      max: prevMaxSize,
      margin: prevMargin
    } = getComputedStyle(prevSibling)

    const {
      size: nextStartSize,
      min: nextMinSize,
      max: nextMaxSize,
      margin: nextMargin
    } = getComputedStyle(nextSibling)

    const gap = calcPixelValue(window.getComputedStyle(parentNode).gap)
    const totalSize = prevStartSize + nextStartSize

    return {
      gap,
      totalSize,
      minOffset: Math.max(prevMinSize, nextMaxSize ? totalSize - nextMaxSize : 0) - prevStartSize,
      maxOffset: Math.min(prevMaxSize || totalSize, totalSize - nextMinSize) - prevStartSize,
      prevMargin,
      nextMargin,
      prevMinSize,
      nextMinSize,
      prevStartSize,
      nextStartSize,
      prevRecoverSize: getRecoverSize(prevSibling),
      nextRecoverSize: getRecoverSize(nextSibling)
    }
  }

  function isCollapsible (element) {
    return ![null, 'false'].includes(element.getAttribute('collapsible'))
  }

  function isCollapsed (element) {
    return element.classList.contains('mu-flex-collapsed')
  }

  let paramsCache
  let paramsCacheTimer

  function resetParamsCacheTimer () {
    if (paramsCacheTimer) clearTimeout(paramsCacheTimer)

    paramsCacheTimer = setTimeout(() => {
      paramsCache = null
      paramsCacheTimer = null
    }, 500)
  }

  function getResizeParams () {
    if (paramsCache) return paramsCache

    const siblings = getResizeSiblings()

    if (!siblings) return

    updateSiblingsFlexSize()

    const { prevSibling, nextSibling } = siblings

    const ct = props.collapseThreshold
    const params = getResizeRange(prevSibling, nextSibling)

    paramsCache = {
      ...params,
      prevSibling,
      nextSibling,
      prevCollapseOffset:
        isCollapsible(prevSibling) &&
        Math.min(params.prevMinSize / 2 || ct, ct) - params.prevStartSize,
      nextCollapseOffset:
        isCollapsible(nextSibling) &&
        params.nextStartSize - Math.min(params.nextMinSize / 2 || ct, ct)
    }

    resetParamsCacheTimer()

    return paramsCache
  }

  function onDblClick (event) {
    const params = getResizeParams()

    if (!params) return

    const {
      totalSize, minOffset, maxOffset,
      prevSibling, prevStartSize, prevRecoverSize,
      nextSibling, nextStartSize, nextRecoverSize
    } = params

    if (isCollapsed(prevSibling) || isCollapsed(nextSibling)) return

    const offset = prevRecoverSize
      ? prevRecoverSize - prevStartSize
      : nextRecoverSize
        ? nextStartSize - nextRecoverSize
        : Math.trunc(totalSize / 2) - prevStartSize

    if (offset >= minOffset && offset <= maxOffset) {
      prevSibling.style.flexBasis = `${prevStartSize + offset}px`
      nextSibling.style.flexBasis = `${nextStartSize - offset}px`
    }
  }

  function onMouseDown (event) {
    const params = getResizeParams()

    if (!params) return

    const {
      totalSize, minOffset, maxOffset,
      prevSibling, prevStartSize, prevMargin, prevCollapseOffset,
      nextSibling, nextStartSize, nextMargin, nextCollapseOffset
    } = params

    const { pageX: startX, pageY: startY } = event

    function calcAndCollapse (offset) {
      const collapseTarget =
        prevCollapseOffset && (offset < prevCollapseOffset)
          ? prevSibling
          : nextCollapseOffset && (offset > nextCollapseOffset)
            ? nextSibling
            : null

      if (!collapseTarget) {
        thisEl.value.removeAttribute('collapsed')

        prevSibling.classList.remove('mu-flex-collapsed')
        nextSibling.classList.remove('mu-flex-collapsed')

        return
      }

      const [expandTarget, compensation] = collapseTarget === prevSibling
        ? [nextSibling, prevMargin]
        : [prevSibling, nextMargin]

      thisEl.value.setAttribute('collapsed', '')

      collapseTarget.classList.add('mu-flex-collapsed')
      collapseTarget.style.flexBasis = 0

      expandTarget.classList.remove('mu-flex-collapsed')
      expandTarget.style.flexBasis = `${totalSize + compensation}px`

      return true
    }

    function onMouseMove (e) {
      let offset = direction.value === 'row'
        ? e.pageX - startX
        : e.pageY - startY

      if (!calcAndCollapse(offset)) {
        offset = Math.max(minOffset, Math.min(offset, maxOffset))
        prevSibling.style.flexBasis = `${prevStartSize + offset}px`
        nextSibling.style.flexBasis = `${nextStartSize - offset}px`
      }
    }

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

  onMounted(() => {
    const parent = thisEl.value.parentNode
    const value = window.getComputedStyle(parent).flexDirection

    direction.value = value && (value.startsWith('column') ? 'column' : 'row')
  })

  provide('direction', direction)
</script>
