<template>
  <Teleport v-if="visible || ready" :to="teleportTo">
    <Transition name="mu-dialog-">
      <div
        v-show="modalVisible"
        ref="maskEl"
        v-bind="maskAttrs"
        class="mu-modal-mask flex flex-center"
        :class="[maskClass, isAbsolutePosition && 'absolute']"
        :style="{ zIndex }"
        @click="onMaskClick"
        @sizechange="debounceCorrectPosition">
        <div
          ref="dialogEl"
          class="mu-dialog"
          v-bind="$attrs"
          :class="{ 'mu-dialog--dragging': dragging }"
          :style="{ ...size, ...position }"
          @mousedown="onDragStart">
          <div v-if="headerVisible" class="mu-dialog__header" :class="headerClass">
            <div class="mu-dialog__header-content">
              <mu-icon v-if="icon" class="mu-dialog__icon" v-bind="dlgIconAttrs" />
              <span v-if="title" class="mu-dialog__title text-ellipsis">{{ title }}</span>
              <slot name="header" />
            </div>
            <div v-if="maximizeButton || closeButton" class="mu-dialog__sys-buttons">
              <mu-icon
                v-if="maximizeButton"
                class="mu-dialog__sys-button"
                :icon="dlgStateIcon + ':hover-shrink'"
                @click="toggleWindowState" />
              <mu-icon
                v-if="closeButton"
                class="mu-dialog__sys-button"
                icon="windowClose"
                danger
                @click="hide('$X')" />
            </div>
          </div>
          <div v-mu-scrollbar="bodyScrollbar" class="mu-dialog__body" :class="bodyClass" :style="bodyStyle">
            <div v-if="bodyScrollbar" class="mu-scrollbar__tracks" />
            <slot name="body" />
            <slot v-if="!$slots.body" />
          </div>
          <div v-if="footerVisible" class="mu-dialog__footer" :class="footerClass">
            <slot name="footer" />
            <component
              :is="el.is"
              v-for="el in footerButtons"
              :key="el.key"
              v-bind="el.attrs"
              @click="el.is === 'mu-button' && onButtonClick(el)" />
          </div>
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
  import { autoOrBool } from '../common/props'

  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
  import { resolveSize } from '@/utils/size'
  import { isString } from '@/utils/type'
  import { pick } from '@/utils/object'
  import { warnDeprecated } from '@/utils/compatible'

  defineOptions({ name: 'MusselDialog', inheritAttrs: false })

  const emit = defineEmits([...modalEvents, 'buttonClick'])

  const props = defineProps({
    ...modalProps,
    width: [String, Number],
    height: [String, Number],
    zIndex: String,
    header: { ...autoOrBool },
    footer: { ...autoOrBool },
    headerClass: null,
    footerClass: null,
    bodyClass: null,
    bodyStyle: null,
    bodyScrollbar: Boolean,
    buttons: Array,
    icon: [String, Object],
    title: [String, Object],
    keepPosition: Boolean,
    maximizeButton: Boolean,
    maximizeToFullscreen: Boolean,
    closeButton: { type: Boolean, default: true }
  })

  const slots = useSlots()

  if (slots.default && !slots.body) {
    warnDeprecated({
      component: 'Dialog',
      deprecated: 'default slot',
      alternative: 'body slot'
    })
  }

  const {
    ready,
    teleportTo,
    modalVisible,
    isAbsolutePosition,
    hide,
    onMaskClick
  } = useModal(props, emit)

  const maximized = ref(false)
  const btnKeyGen = autoIncrementKeyBuilder()

  const headerVisible = computed(() =>
    props.header === 'auto'
      ? props.title || props.closeButton || props.maximizeButton || slots.header
      : props.header
  )

  const footerVisible = computed(() =>
    props.footer === 'auto'
      ? props.buttons?.length || slots.footer
      : props.footer
  )

  const size = computed(() => ({
    width: resolveSize(props.width),
    height: resolveSize(props.height)
  }))

  const dlgIconAttrs = computed(() => isString(props.icon) ? { icon: props.icon } : props.icon)
  const dlgStateIcon = computed(() => maximized.value ? 'arrowDownLeft' : 'arrowUpRight')

  const footerButtons = computed(() =>
    props.buttons?.map(el => {
      const { _el, is = 'mu-button', key = btnKeyGen(), ...attrs } = isString(el)
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

    const { offsetTop: top, offsetLeft: left, offsetHeight: height, offsetWidth: width } = dialogEl.value
    const { clientHeight: maxHeight, clientWidth: maxWidth } = maskEl.value

    const maxTop = maxHeight - (height <= maxHeight ? height : maxHeight)
    const maxLeft = maxWidth - (width <= maxWidth ? width : maxWidth)

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

  const debounceCorrectPosition = debounce(300, correctPosition)

  function onDragStart (event) {
    if (
      maximized.value ||
      !['mu-dialog__header', 'mu-dialog__header-content'].find(cls => event.target.classList.contains(cls))
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
        dialogEl.value.classList.add('mu-dialog--maximized')
      }
    } else {
      if (props.maximizeToFullscreen) {
        document.exitFullscreen()
      } else {
        dialogEl.value.classList.remove('mu-dialog--maximized')
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
    v => !v && maximized.value && props.maximizeToFullscreen && toggleWindowState()
  )

  watchEffect(() => {
    if (props.visible && !props.keepPosition) {
      Object.assign(position, { top: undefined, left: undefined })
    }
  })

  defineExpose({
    maskEl,
    dialogEl,
    hide
  })
</script>
