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
  import { ref, shallowRef, toRef, provide, inject } from 'vue'
  import { usePopupManager, runPopupSequence } from '@/components/common/popup'
  import { useDropdownItems } from './dropdown-items'

  import { getTransitionDuration } from '@/utils/style'
  import { findUp } from '@/utils/dom'
  import { delay } from '@/utils/timer'

  defineOptions({ name: 'MusselContextMenu', inheritAttrs: false })

  const emit = defineEmits(['show', 'hide', 'action', 'itemclick'])
  const props = defineProps({ menus: Array })

  const menu = shallowRef()
  const rootEl = inject('$mussel').rootElement

  const ready = ref()
  const visible = ref()
  const container = ref()
  const popupStyle = ref()

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

    return true
  }

  async function show (event) {
    const { pageX, pageY } = event

    visible.value = true
    container.value = document.fullscreenElement || rootEl

    emit('show')
    event.preventDefault?.()

    await runPopupSequence({
      visible,
      ready,
      popupStyle,
      panelEl: menu,
      updatePosition: () => updatePosition({ pageX, pageY })
    })
  }

  function hide () {
    if (!visible.value) return

    visible.value = false

    emit('hide')

    // 首次 show 的 emit('show') 同步窗口内面板未挂载，无 DOM 可收尾；
    // 编舞（runPopupSequence）在 nextTick 后的守卫处自然中止
    const menuEl = menu.value
    if (!menuEl) return

    const duration = getTransitionDuration(menuEl)

    menuEl.removeAttribute('pop-up')

    delay(duration).then(() => {
      if (!visible.value) popupStyle.value = null
    })
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
