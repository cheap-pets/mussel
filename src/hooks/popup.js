import { watch, onUnmounted } from 'vue'
import { isEditableElement } from '@/utils/dom'

let activeModal
let activePopup

const previousModals = new WeakMap()

window.addEventListener('mousedown', event => {
  if (activePopup) {
    activePopup.onCaptureMouseDown?.(event)
  } else if (activeModal) {
    activeModal.onCaptureMouseDown?.(event)
  }
}, true)

window.addEventListener('mouseup', event => {
  if (activePopup) {
    activePopup.onCaptureMouseUp?.(event)
  } else if (activeModal) {
    activeModal.onCaptureMouseUp?.(event)
  }
}, true)

window.addEventListener('keydown', event => {
  if (event.keyCode === 27 && !isEditableElement(event.target)) {
    if (activePopup) {
      activePopup.onCaptureEscKeyDown?.(event)
    } else if (activeModal) {
      activeModal.onCaptureEscKeyDown?.(event)
    }
  }
})

window.addEventListener('scroll', event => {
  activePopup?.onCaptureScroll?.(event)
}, true)

window.addEventListener('blur', () => activePopup?.hide?.())
window.addEventListener('fullscreenchange', () => activePopup?.hide?.())

export function usePopupManager (watchableVisible, options = {}) {
  const instance = { ...options }

  function setActivePopup () {
    if (activePopup !== instance) {
      activePopup?.hide?.()
      activePopup = instance
    }
  }

  function unsetActivePopup () {
    if (activePopup === instance) {
      activePopup = undefined
    }
  }

  watch(watchableVisible, v => {
    if (v) {
      setActivePopup()
    } else {
      unsetActivePopup()
    }
  })

  onUnmounted(unsetActivePopup)
}

export function useModalManager (watchableVisible, options = {}) {
  const instance = { ...options }

  function pushModal () {
    if (!previousModals.has(instance)) {
      previousModals.set(instance, activeModal)
    }

    activeModal = instance
  }

  function popModal () {
    if (activeModal === instance) {
      const prev = previousModals.get(instance)

      previousModals.delete(instance)
      activeModal = prev
    }
  }

  watch(watchableVisible, v => {
    if (v) {
      pushModal()
    } else {
      popModal()
    }
  }, { immediate: true })

  onUnmounted(popModal)
}
