<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-show="popupStyle"
      ref="menu"
      v-bind="$attrs"
      class="mu-context-menu mu-dropdown-panel"
      :style="popupStyle"
      @click="onClick"
      @contextmenu.prevent>
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
  import { ref, shallowRef, toRef, provide } from 'vue'
  import { usePopupManager, usePopupRunner } from '@/components/common/popup'
  import { useDropdownItems } from './dropdown-items'

  import { findUp } from '@/utils/dom'

  defineOptions({ name: 'MusselContextMenu', inheritAttrs: false })

  const emit = defineEmits(['show', 'hide', 'action', 'itemclick'])
  const props = defineProps({ menus: Array })

  const menu = shallowRef()
  const visible = ref()

  // 最近一次 show 的触发坐标，供 runner 的 updatePosition 注入使用
  let point

  const { ready, popupStyle, container, doEnter, doExit } = usePopupRunner(
    visible,
    menu,
    () => updatePosition(point)
  )

  const { items } = useDropdownItems(toRef(props, 'menus'))

  function updatePosition ({ pageX, pageY }) {
    if (!popupStyle.value) return

    const { width: mw, height: mh } = menu.value.getBoundingClientRect()
    const { innerWidth: tw, innerHeight: th } = window

    const style = {}

    if ((tw - pageX > mw) || (tw - pageX > pageX)) {
      style.left = `${pageX}px`
    } else {
      style.right = `${tw - pageX}px`
    }

    if (mh >= th) {
      style.top = 0
    } else if (th - pageY > mh) {
      style.top = `${pageY}px`
    } else if (pageY > mh) {
      style.bottom = `${th - pageY}px`
    } else {
      style.bottom = 0
    }

    popupStyle.value = style
  }

  async function show (event) {
    const { pageX, pageY } = event

    visible.value = true
    point = { pageX, pageY }

    emit('show')
    event.preventDefault?.()

    await doEnter()
  }

  function hide () {
    if (!visible.value) return

    visible.value = false

    emit('hide')

    doExit()
  }

  function onClick (event) {
    if (
      event.target.classList.contains('mu-popup-mask') ||
      findUp(event.target, el => {
        if (el.classList.contains('mu-popup-off')) return true
        if (el === menu.value) return false
      })
    ) {
      hide()
    }
  }

  function emitAction (action) {
    emit('action', action)
  }

  function emitItemClick (item) {
    emit('itemclick', item)
  }

  function onCaptureEscKeyDown (event) {
    if (visible.value) hide()
  }

  function hideOnEvent (event) {
    if (
      visible.value &&
      (!event || !menu.value.contains(event.target))
    ) hide()
  }

  usePopupManager(visible, {
    hide,
    onCaptureEscKeyDown,
    onCaptureScroll: hideOnEvent,
    onCaptureMouseDown: hideOnEvent,
    onCaptureWindowResize: hideOnEvent,
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
    hide
  })
</script>
