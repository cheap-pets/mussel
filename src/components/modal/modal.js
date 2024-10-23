import './modal-mask.scss'

import { ref, shallowRef, inject, watch, onMounted } from 'vue'
import { useModalManager } from '@/hooks/popup'
import { delay } from '@/utils/timer'

export const modalProps = {
  maskClass: null,
  maskAttrs: Object,
  visible: Boolean,
  easyHide: Boolean,
  disposeOnHide: Boolean,
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

  function hide (action, trigger) {
    emit('update:visible', false, action, trigger)
  }

  function onMaskClick (event) {
    if (props.easyHide && isMouseDownInMask && isMouseUpInMask) {
      isMouseDownInMask = undefined
      hide('mask-click', '$MASK')
    }
  }

  function onCaptureEscKeyDown (event) {
    if (props.visible && props.easyHide) hide('esc-key', '$ESC')
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
