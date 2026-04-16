<template>
  <Teleport v-if="visible || ready" :to="container">
    <Transition name="mu-dialog">
      <div
        v-show="modalVisible"
        ref="maskEl"
        class="mu-modal-mask mu-dialog-mask"
        :class="maskClass" :style="{ zIndex }" v-bind="maskAttrs"
        @sizechange="onMaskResize" @click="onMaskClick">
        <div
          ref="dialogEl"
          class="mu-dialog" :style="[dialogSize, position]"
          v-bind="$attrs" :dragging="dragging"
          @mousedown="onDragStart">
          <slot name="client">
            <div v-if="headerVisible" class="mu-dialog_header">
              <slot name="header">
                <slot name="header-prepend" />
                <mu-icon v-if="icon" class="mu-dialog_icon" v-bind="iconBindings" />
                <label class="mu-dialog_title" draggable="false">{{ title }}</label>
                <slot name="header-append" />
                <div class="mu-dialog_sys-buttons">
                  <mu-tool-button
                    v-if="maximizeButton"
                    class="mu-dialog_sys-button"
                    :icon="stateIcon + ':hover-shrink'"
                    @click="toggleWindowState" />
                  <mu-tool-button
                    v-if="closeButton"
                    class="mu-dialog_sys-button"
                    icon="windowClose" danger
                    @click="hide('$X')" />
                </div>
              </slot>
            </div>
            <slot />
            <div v-if="footerVisible" class="mu-dialog_footer">
              <slot name="footer">
                <slot name="footer-prepend" />
                <component
                  :is="el.is"
                  v-for="el in footerButtons"
                  :key="el.key"
                  v-bind="el.attrs"
                  @click="el.is === 'mu-button' && onButtonClick(el)" />
                <slot name="footer-append" />
              </slot>
            </div>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import './dialog.scss'

  import { useSlots, ref, shallowRef, reactive, computed, watch, watchEffect } from 'vue'
  import { debounce } from 'throttle-debounce'

  import { modalProps, modalEvents, useModal } from './modal'
  import { ButtonPresets } from './button-presets'

  import { sizeProps, useSize } from '../common-hooks/size'
  import { useKeyGen } from '../common-hooks/key-gen'

  import { isString } from '@/utils/type'
  import { pick } from '@/utils/object'

  defineOptions({ name: 'MusselDialog', inheritAttrs: false })

  const emit = defineEmits([...modalEvents, 'buttonClick'])

  const props = defineProps({
    ...sizeProps,
    ...modalProps,
    zIndex: String,
    buttons: Array,
    icon: [String, Object],
    title: [String, Object],
    keepPosition: Boolean,
    maximizeButton: Boolean,
    maximizeToFullscreen: Boolean,
    closeButton: { type: Boolean, default: true }
  })

  const slots = useSlots()

  const { ready, container, modalVisible, hide, onMaskClick } = useModal(props, emit)
  const { resolved: dialogSize } = useSize(props)
  const { genKey } = useKeyGen()

  const maximized = ref(false)

  const stateIcon = computed(() => maximized.value ? 'windowNormalize' : 'windowMaximize')
  const headerVisible = computed(() => props.title || props.closeButton || props.maximizeButton || slots.header)
  const footerVisible = computed(() => props.buttons?.length || slots.footer)

  const iconBindings = computed(() =>
    isString(props.icon) ? { icon: props.icon } : props.icon
  )

  const footerButtons = computed(() =>
    props.buttons?.map(el => {
      const { _el, is = 'mu-button', key = genKey(), ...attrs } = isString(el)
        ? { _el: el, ...ButtonPresets[el] }
        : el

      if (is === 'mu-button') {
        const { name = _el, action } = attrs

        if (!attrs.icon) attrs.caption ??= name

        delete attrs.name
        delete attrs.action

        return { is, key, name, action, attrs }
      } else {
        return { is, key, attrs }
      }
    })
  )

  const maskEl = shallowRef()
  const dialogEl = shallowRef()

  const dragging = ref()
  const position = reactive({})

  function correctPosition () {
    if (!modalVisible.value) return

    const {
      offsetTop: top,
      offsetLeft: left,
      offsetHeight: height,
      offsetWidth: width
    } = dialogEl.value

    const { clientHeight, clientWidth } = maskEl.value

    const maxTop = clientHeight - (height <= clientHeight ? height : clientHeight)
    const maxLeft = clientWidth - (width <= clientWidth ? width : clientWidth)

    if (top < 0) {
      position.top = 0
    } else if (top > maxTop) {
      position.top = `${maxTop}px`
    }

    if (left < 0) {
      position.left = 0
    } else if (left > maxLeft) {
      position.left = `${maxLeft}px`
    }
  }

  const onMaskResize = debounce(300, correctPosition)

  function onDragStart (event) {
    if (
      maximized.value ||
      !['mu-dialog_header', 'mu-dialog_title']
        .find(cls => event.target.classList.contains(cls))
    ) return

    const { pageY, pageX } = event
    const { offsetTop: startY, offsetLeft: startX } = dialogEl.value

    dragging.value = true

    function onMouseMove (e) {
      position.top = `${parseInt(startY + e.pageY - pageY)}px`
      position.left = `${parseInt(startX + e.pageX - pageX)}px`
    }

    function onMouseUp () {
      dragging.value = null

      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      correctPosition()
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onButtonClick (btn) {
    emit('buttonClick', {
      ...btn.attrs,
      ...pick(btn, ['key', 'name', 'action'])
    })

    if (['close', 'hide'].includes(btn.action)) {
      hide(btn.name)
    }
  }

  function toggleWindowState () {
    maximized.value = !maximized.value

    if (maximized.value) {
      if (props.maximizeToFullscreen) {
        dialogEl.value.requestFullscreen()
      } else {
        dialogEl.value.classList.add('mu-dialog-maximized')
      }
    } else {
      if (props.maximizeToFullscreen) {
        document.exitFullscreen()
      } else {
        dialogEl.value.classList.remove('mu-dialog-maximized')
      }
    }
  }

  window.addEventListener('fullscreenchange', () => {
    if (
      maximized.value &&
      props.maximizeToFullscreen &&
      document.fullscreenElement !== dialogEl.value
    ) {
      maximized.value = false
    }
  })

  watch(
    () => props.visible,
    v => {
      if (!v && maximized.value && props.maximizeToFullscreen) toggleWindowState()
    }
  )

  watchEffect(() => {
    if (props.visible && !props.keepPosition) {
      Object.assign(position, { top: undefined, left: undefined })
    }
  })

  defineExpose({
    hide
  })
</script>
