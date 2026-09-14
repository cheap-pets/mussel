<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="panelEl"
      v-bind="$attrs"
      v-mu-scrollbar="scrollbar && !!$slots.default"
      class="mu-dropdown-panel"
      :style="[sizeStyle, popupStyle, $attrs.style]"
      @click="onClick"
      @mouseover.stop="clearHideTimer"
      @mouseleave.stop="delayHide">
      <div v-if="scrollbar && !!$slots.default" class="mu-scrollbar__tracks" />
      <slot>
        <slot name="header" />
        <mu-scroll-box v-if="$slots.items || items" class="mu-dropdown-panel__items">
          <slot name="items">
            <component :is="item.is" v-for="item in items" :key="item.key" v-bind="item.bindings" />
          </slot>
        </mu-scroll-box>
        <slot name="footer" />
      </slot>
    </div>
  </Teleport>
</template>

<script setup>
  import './dropdown-panel.scss'

  import { ref, toRef, shallowRef, shallowReactive, computed, provide } from 'vue'
  import { usePopupManager, usePopupRunner, HIDE_DELAY } from '@/components/common/popup'
  import { useListItems } from '../list/list-items'

  import { findUp, isElementInViewport } from '@/utils/dom'

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
    }
  })

  const visible = ref()
  const panelEl = shallowRef()
  const ctx = shallowReactive({})

  const { ready, popupStyle, container, doEnter, doExit } = usePopupRunner(visible, panelEl, updatePosition)

  const sizeStyle = computed(() => ({
    width: ctx.width === 'anchor' ? undefined : ctx.width,
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
    return visible.value && popupStyle.value
  }

  function updatePosition () {
    if (!isPositionAssignable()) return

    const el = panelEl.value
    const style = {}

    const { width: aw, top: at, right: ar, bottom: ab, left: al } = ctx.anchor.getBoundingClientRect()
    const { width: _dw, height: dh } = el.getBoundingClientRect()
    const { innerWidth: tw, innerHeight: th } = window

    let dw = _dw

    if (ctx.width === 'anchor') {
      dw = aw
      style.width = `${dw}px`
    }

    if (tw - al < dw && ar > tw - al) {
      style.right = `${tw - ar}px`
    } else {
      style.left = `${al}px`
    }

    if (th - ab > dh || at < dh) {
      el.setAttribute('position', 'bottom')
      style.top = `${ab}px`
    } else {
      el.setAttribute('position', 'top')
      style.bottom = `${th - at}px`
    }

    popupStyle.value = style
  }

  async function show (options = {}) {
    clearHideTimer()

    const {
      anchor,
      width = props.width,
      height = props.height,
      trigger = props.trigger,
      onHideCallback
    } = options

    let anchorChanged = false

    if (ctx.anchor !== anchor) {
      ctx.onHide?.()
      ctx.anchor = anchor
      anchorChanged = true
    }

    ctx.width = width
    ctx.height = height
    ctx.trigger = trigger
    ctx.onHide = onHideCallback

    if (!visible.value) {
      visible.value = true

      emit('show')

      await doEnter()
    } else if (anchorChanged) {
      // 面板已开时切换锚点（动态 dropdown-anchor）：直接重定位，left/top 无过渡
      updatePosition()
    }
  }

  function hide () {
    clearHideTimer()
    ctx.onHide?.()

    Object
      .keys(ctx)
      .forEach(key => delete ctx[key])

    if (!visible.value) return

    visible.value = false

    emit('hide')

    doExit()
  }

  function delayHide () {
    if (ctx.trigger === 'hover') {
      clearTimeout(ctx.delayHideTimer)
      ctx.delayHideTimer = setTimeout(hide, HIDE_DELAY)
    }
  }

  function onClick (event) {
    if (
      event.target.classList.contains('mu-popup-mask') ||
      findUp(event.target, el => {
        if (el.classList.contains('mu-popup-off')) return true
        if (el === panelEl.value) return false
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
      !ctx.anchor?.contains(event.target) &&
      !panelEl.value?.contains(event.target)
    ) hide()
  }

  function onCaptureWindowResize () {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(ctx.anchor)) {
      hide()
    } else {
      updatePosition()
    }
  }

  function onCaptureScroll (event) {
    if (!isPositionAssignable()) return

    if (!isElementInViewport(ctx.anchor)) {
      hide()
    } else if (event.target.contains(ctx.anchor)) {
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
    onCaptureScroll,
    onCaptureWindowBlur: hide,
    onCaptureFullscreenChange: hide
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
