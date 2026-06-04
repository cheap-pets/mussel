<template>
  <Teleport v-if="ready" :to="container">
    <div
      v-if="ready"
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
  import { ref, shallowRef, toRef, computed, provide, inject } from 'vue'
  import { usePopupManager } from '@/components/common/popup'
  import { useListItems } from '../list/list-items'

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

  const popupVisible = computed(() => visible.value)

  const { items } = useListItems(
    toRef(props, 'menus'),
    { defaultComponent: 'mu-dropdown-item' }
  )

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

  function show (event) {
    const { pageX, pageY } = event

    visible.value = true
    container.value = document.fullscreenElement || rootEl

    emit('show')
    event.preventDefault?.()

    Promise
      .resolve(!ready.value && (ready.value = true) && delay())
      .then(() => {
        const el = menu.value

        el.removeAttribute('pop-up')
        el.style.transition = 'none'

        popupStyle.value = { transform: 'none', visibility: 'hidden' }

        delay()
          .then(() => updatePosition({ pageX, pageY }) && delay())
          .then(() => { el.style.transition = null })
          .then(() => visible.value && el.setAttribute('pop-up', ''))
      })
  }

  function hide () {
    visible.value = false

    emit('hide')

    const menuEl = menu.value
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
    if (popupVisible.value) hide()
  }

  function hideOnEvent (event) {
    if (
      popupVisible.value &&
      (!event || !menu.value.contains(event.target))
    ) hide()
  }

  usePopupManager(popupVisible, {
    hide,
    onCaptureEscKeyDown,
    onCaptureScroll: hideOnEvent,
    onCaptureMouseDown: hideOnEvent,
    onCaptureWindowResize: hideOnEvent
  })

  provide('popup', {
    hide,
    emitAction,
    emitItemClick
  })

  defineExpose({
    visible: popupVisible,
    show,
    hide
  })
</script>
