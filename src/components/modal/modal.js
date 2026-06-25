import './modal-mask.scss'

import { ref, shallowRef, inject, watch, onMounted } from 'vue'
import { useModalManager } from '@/components/common/popup'
import { isString, isHtmlElement } from '@/utils/type'
import { delay } from '@/utils/timer'

export const modalProps = {
  container: null,
  maskClass: null,
  maskAttrs: Object,
  visible: Boolean,
  disposeOnHide: Boolean,
  dismissible: {
    type: [Boolean, String],
    validator: v => [true, false, 'esc', 'mask'].includes(v)
  },
  lazy: { type: Boolean, default: true }
}

export const modalEvents = [
  'update:visible',
  'show',
  'hide'
]

function targetIsMask (event) {
  return event.target.classList?.contains('mu-modal-mask')
}

export function useModal (props, emit) {
  const rootEl = inject('$mussel').rootElement

  const ready = ref()
  const modalVisible = ref()
  const teleportTo = shallowRef(rootEl)
  const isAbsolutePosition = ref(false)

  useModalManager(modalVisible, {
    hide,
    onCaptureEscKeyDown,
    onCaptureMouseDown,
    onCaptureMouseUp
  })

  let isMouseDownInMask
  let isMouseUpInMask

  function setTeleportTo () {
    const ctr = props.container

    let target = document.fullscreenElement

    if (target) {
      const element = isString(ctr)
        ? document.querySelector(ctr)
        : ctr

      if (isHtmlElement(element) && target.contains(element)) {
        target = ctr
      }
    } else {
      target = ctr || rootEl
    }

    teleportTo.value = target
    isAbsolutePosition.value = target === ctr
  }

  function hide (trigger) {
    emit('update:visible', false, trigger)
  }

  function onMaskClick (event) {
    if (
      [true, 'mask'].includes(props.dismissible) &&
      isMouseDownInMask &&
      isMouseUpInMask
    ) {
      isMouseDownInMask = undefined
      hide('$MASK')
    }
  }

  function onCaptureEscKeyDown (event) {
    if (
      props.visible &&
      [true, 'esc'].includes(props.dismissible)
    ) {
      hide('$ESC')
    }
  }

  function onCaptureMouseDown (event) {
    isMouseUpInMask = undefined
    isMouseDownInMask = targetIsMask(event)
  }

  function onCaptureMouseUp (event) {
    isMouseUpInMask = targetIsMask(event)
  }

  async function setModalVisible (value) {
    if (value) {
      setTeleportTo()

      if (!ready.value) {
        ready.value = true
        await delay()
      }
    }

    modalVisible.value = value

    const shouldDispose = props.disposeOnHide
    const ms = !value && shouldDispose ? 200 : undefined

    delay(ms).then(() => {
      const mv = modalVisible.value

      if (value !== mv) return
      if (!mv && shouldDispose) ready.value = false

      emit(mv ? 'show' : 'hide')
    })
  }

  watch(() => props.visible, setModalVisible)

  onMounted(() => {
    setTeleportTo()
    ready.value = !props.lazy

    if (props.visible) {
      setModalVisible(props.visible)
    }
  })

  return {
    ready,
    teleportTo,
    modalVisible,
    isAbsolutePosition,
    hide,
    onMaskClick
  }
}
