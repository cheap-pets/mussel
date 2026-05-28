import './modal-mask.scss'

import { ref, shallowRef, inject, watch, onMounted } from 'vue'
import { useModalManager } from '@/components/common-hooks/popup'
import { useCompatible } from '../common-hooks/compatible'
import { delay } from '@/utils/timer'

export const modalProps = {
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
  useCompatible('modal')

  const rootEl = inject('$mussel').rootElement
  const container = shallowRef(rootEl)

  const ready = ref()
  const modalVisible = ref()

  useModalManager(modalVisible, {
    hide,
    onCaptureEscKeyDown,
    onCaptureMouseDown,
    onCaptureMouseUp
  })

  let isMouseDownInMask
  let isMouseUpInMask

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
      container.value = document.fullscreenElement || rootEl

      if (!ready.value) {
        ready.value = true
        await delay()
      }
    }

    modalVisible.value = props.visible

    delay().then(() =>
      (value === modalVisible.value) &&
      emit(modalVisible.value ? 'show' : 'hide')
    )
  }

  watch(() => props.visible, setModalVisible)

  onMounted(() => {
    ready.value = !props.lazy

    if (props.visible) {
      setModalVisible(props.visible)
    }
  })

  return {
    ready,
    container,
    modalVisible,
    hide,
    onMaskClick
  }
}
