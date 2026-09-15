<template>
  <Teleport v-if="visible || ready" :to="teleportTo">
    <Transition name="mu-dialog-">
      <div
        v-show="modalVisible"
        ref="maskEl"
        class="mu-modal-mask flex flex-center"
        :class="[maskClass, isAbsolutePosition && 'absolute']"
        :style="{ zIndex }"
        @click="onMaskClick"
        @sizechange="debounceCorrectPosition">
        <div
          ref="dialogEl"
          class="mu-dialog"
          v-bind="$attrs"
          :class="{ 'mu-dialog--dragging': dragging, 'mu-dialog--resizing': resizing }"
          :style="{ ...size, ...position, cursor: resizing || undefined }"
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
          <!-- 边在角之前：角部 6×6 重叠区靠 DOM 顺序让角手柄拿到命中 -->
          <template v-if="resizable && !maximized">
            <div
              v-for="dir in resizeDirs"
              :key="dir"
              class="mu-dialog__resize-handle"
              :class="`mu-dialog__resize-handle--${dir}`"
              @mousedown.stop="onResizeStart($event, dir)" />
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import './dialog.scss'

  import { useSlots, ref, shallowRef, computed, watch, watchEffect, nextTick, onMounted, onUnmounted } from 'vue'

  import { modalProps, modalEvents, useModal } from './modal'
  import { useDialogMoveResize } from './dialog-move-resize'
  import { ButtonPresets } from './button-presets'
  import { autoOrBool } from '../common/props'

  import { autoIncrementKeyBuilder } from '@/utils/key-builder'
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
    resizable: Boolean,
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

  const stashedPosition = { top: undefined, left: undefined }

  const {
    dragging,
    resizing,
    position,
    size,
    resizeDirs,
    reset,
    onDragStart,
    onResizeStart,
    correctPosition,
    debounceCorrectPosition
  } = useDialogMoveResize({ props, dialogEl, maskEl, maximized, modalVisible })

  function onButtonClick (btn) {
    emit('buttonClick', {
      ...btn.attrs,
      ...pick(btn, ['key', 'name', 'action'])
    })

    if (['close', 'hide'].includes(btn.action)) {
      hide(btn.name)
    }
  }

  async function toggleWindowState () {
    maximized.value = !maximized.value

    if (maximized.value) {
      if (props.maximizeToFullscreen) {
        dialogEl.value.requestFullscreen()
      } else {
        Object.assign(stashedPosition, { top: position.top, left: position.left })
        position.top = position.left = undefined
        dialogEl.value.classList.add('mu-dialog--maximized')
      }
    } else {
      if (props.maximizeToFullscreen) {
        document.exitFullscreen()
      } else {
        Object.assign(position, stashedPosition)
        dialogEl.value.classList.remove('mu-dialog--maximized')

        // 仅当最大化前确有显式坐标才校正，否则会把 flex 居中的 dialog 钉成绝对坐标
        if (stashedPosition.top !== undefined || stashedPosition.left !== undefined) {
          await nextTick()
          correctPosition()
        }
      }
    }
  }

  function onFullscreenChange () {
    if (
      maximized.value &&
      props.maximizeToFullscreen &&
      document.fullscreenElement !== dialogEl.value
    ) {
      maximized.value = false
    }
  }

  // SSR 渲染阶段无 window，监听器延后到客户端挂载时再绑定
  onMounted(() => window.addEventListener('fullscreenchange', onFullscreenChange))
  onUnmounted(() => window.removeEventListener('fullscreenchange', onFullscreenChange))

  watch(
    () => props.visible,
    v => !v && maximized.value && props.maximizeToFullscreen && toggleWindowState()
  )

  watchEffect(() => {
    if (props.visible && !props.keepPosition) {
      reset()
      stashedPosition.top = stashedPosition.left = undefined
    }
  })

  defineExpose({
    maskEl,
    dialogEl,
    hide
  })
</script>
