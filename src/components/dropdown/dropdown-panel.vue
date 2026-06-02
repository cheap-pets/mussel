<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="thisEl"
      v-bind="$attrs"
      v-mu-scrollbar="scrollbar"
      class="mu-dropdown-panel"
      :style="[sizeStyle, popupStyle]"
      @click="onClick"
      @mouseover.stop="clearHideTimer"
      @mouseleave.stop="delayHide">
      <div v-if="scrollbar" class="mu-scrollbar__tracks" />
      <slot>
        <component
          :is="el.is"
          v-for="el in items"
          :key="el.key"
          v-bind="el.bindings" />
      </slot>
    </div>
  </Teleport>
</template>

<script setup>
  import './dropdown-panel.scss'

  import { ref, toRef, shallowRef, shallowReactive, computed, provide, inject } from 'vue'
  import { usePopupManager } from '@/components/common-hooks/popup'
  import { useListItems } from '../list/list-items'

  import { findUp, isElementInViewport } from '@/utils/dom'
  import { getTransitionDuration } from '@/utils/style'
  import { delay } from '@/utils/timer'

  defineOptions({ name: 'MusselDropdownPanel', inheritAttrs: false })

  const emit = defineEmits([
    'show',
    'hide',
    'action',
    'itemclick'
  ])

  const props = defineProps({
    width: String,
    height: String,
    scrollbar: Boolean,
    dropdownItems: Array,
    trigger: {
      type: String,
      default: 'click',
      validator: v => ['hover', 'click'].includes(v)
    },
    position: {
      type: String,
      default: 'auto',
      validator: v => ['auto', 'fixed', 'top', 'bottom'].includes(v)
    }
  })

  const rootEl = inject('$mussel').rootElement

  const ready = ref()
  const visible = ref()
  const popupStyle = ref()

  const thisEl = shallowRef()
  const container = shallowRef(rootEl)
  const ctx = shallowReactive({})

  const sizeStyle = computed(() => ({
    width: ctx.width === '$same' ? undefined : ctx.width,
    height: ctx.height
  }))

  const { items } = useListItems(
    toRef(props, 'dropdownItems'),
    { defaultComponent: 'mu-dropdown-item' }
  )

  function clearHideTimer () {
    if (ctx.delayHideTimer) {
      clearTimeout(ctx.delayHideTimer)
      delete ctx.delayHideTimer
    }
  }

  function isPositionAssignable () {
    return visible.value && popupStyle.value && props.position === 'auto'
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = thisEl.value
    const style = {}

    const { width: sw, top: st, right: sr, bottom: sb, left: sl } = ctx.snapTo.getBoundingClientRect()
    const { width: _dw, height: dh } = el.getBoundingClientRect()
    const { innerWidth: tw, innerHeight: th } = window

    let dw = _dw

    if ((ctx.width === '$same') || (!ctx.width && dw <= sw)) {
      dw = sw
      style.width = `${dw}px`
    }

    if ((dw > sw) && ((tw - sl >= dw) || (sr < dw))) {
      style.left = `${sl}px`
    } else {
      style.right = `${tw - sr}px`
    }

    if (th - sb > dh || st < dh) {
      el.setAttribute('position', 'bottom')
      style.top = `${sb}px`
    } else {
      el.setAttribute('position', 'top')
      style.bottom = `${th - st}px`
    }

    popupStyle.value = style

    return true
  }

  function show (snapOptions = {}) {
    clearHideTimer()

    const {
      snapTo,
      width = props.width,
      height = props.height,
      trigger = props.trigger,
      onHideCallback
    } = snapOptions

    if (ctx.snapTo !== snapTo) {
      ctx.onHide?.()
      ctx.snapTo = snapTo
    }

    ctx.width = width
    ctx.height = height
    ctx.trigger = trigger
    ctx.onHide = onHideCallback

    if (!visible.value) {
      visible.value = true
      container.value = document.fullscreenElement || rootEl

      emit('show')

      Promise
        .resolve((!ready.value) && (ready.value = true) && delay())
        .then(() => {
          const el = thisEl.value

          el.removeAttribute('pop-up')
          el.style.transition = 'none'

          popupStyle.value = props.position === 'auto'
            ? { transform: 'none', visibility: 'hidden' }
            : {}

          delay()
            .then(() => updatePosition() && delay())
            .then(() => { el.style.transition = null })
            .then(() => visible.value && el.setAttribute('pop-up', ''))
        })
    }
  }

  function hide () {
    clearHideTimer()
    ctx.onHide?.()

    Object
      .keys(ctx)
      .forEach(key => delete ctx[key])

    if (visible.value) {
      visible.value = false

      emit('hide')

      const el = thisEl.value
      const duration = getTransitionDuration(el)

      el.removeAttribute('pop-up')

      delay(duration).then(() => {
        if (!visible.value) popupStyle.value = null
      })
    }
  }

  function delayHide () {
    if (ctx.trigger === 'hover') {
      clearTimeout(ctx.delayHideTimer)
      ctx.delayHideTimer = setTimeout(hide, 300)
    }
  }

  function onClick (event) {
    if (
      event.target.classList.contains('mu-popup--mask') ||
      findUp(event.target, el => {
        if (el.classList.contains('mu-popup--off')) return true
        if (el === thisEl.value) return false
      })
    ) {
      hide()
    }
  }

  function onCaptureEscKeyDown (event) {
    if (visible.value && ctx.trigger !== 'hover') hide()
  }

  function onCaptureMouseDown (event) {
    if (
      visible.value &&
      !ctx.snapTo?.contains(event.target) &&
      !thisEl.value?.contains(event.target)
    ) hide()
  }

  function onCaptureWindowResize () {
    if (visible.value) updatePosition()

    if (!isElementInViewport(ctx.snapTo)) {
      hide()
    } else {
      updatePosition()
    }
  }

  function onCaptureScroll (event) {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(ctx.snapTo)) {
      hide()
    } else if (event.target.contains(ctx.snapTo)) {
      updatePosition()
    }
  }

  function emitAction (action) {
    emit('action', action)
  }

  function emitItemClick (item) {
    emit('itemclick', item)
  }

  usePopupManager(visible, {
    hide,
    onCaptureWindowResize,
    onCaptureEscKeyDown,
    onCaptureMouseDown,
    onCaptureScroll
  })

  provide('popup', {
    hide,
    emitAction,
    emitItemClick
  })

  defineExpose({
    visible,
    show,
    hide,
    delayHide,
    updatePosition
  })
</script>
