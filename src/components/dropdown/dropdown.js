import { ref, shallowRef, computed, provide, inject } from 'vue'
import { findUp, isElementInViewport } from '@/utils/dom'
import { getTransitionDuration } from '@/utils/style'
import { usePopupManager } from '@/hooks/popup'
import { isString } from '@/utils/type'
import { delay } from '@/utils/timer'

export const dropdownProps = {
  dropdownHost: null,
  dropdownClass: null,
  dropdownStyle: null,
  dropdownAttrs: Object,
  dropdownIcon: {
    type: String,
    default: 'chevronDown'
  },
  dropdownTrigger: {
    type: String,
    default: 'click',
    validator: v => ['hover', 'click'].includes(v)
  },
  dropdownScrollbar: [Boolean, String],
  dropdownPositioned: {
    type: [Boolean, String],
    validator: v => [true, false, 'top', 'bottom'].includes(v)
  }
}

export const dropdownEvents = [
  'dropdown:show',
  'dropdown:hide',
  'dropdown:itemclick'
]

export function useDropdown (props, emit, options = {}) {
  const {
    wrapper = shallowRef(),
    dropdownPanel = shallowRef()
  } = options

  const rootEl = inject('$mussel').rootElement

  const expanded = ref()
  const activityStyle = ref()
  const dropdownReady = ref()
  const dropdownContainer = shallowRef(rootEl)

  const dropdownPanelAttrs = computed(() => ({
    class: ['mu-dropdown-panel', props.dropdownClass],
    style: [
      props.dropdownStyle,
      activityStyle.value || { display: 'none' }
    ],
    ...props.dropdownAttrs
  }))

  const dropdownIconAttrs = computed(() => ({
    icon: props.dropdownIcon,
    class: props.dropdownIcon === 'chevronDown' ? 'mu-dropdown-arrow' : null,
    expanded: expanded.value || null
  }))

  const hostElement = computed(() => {
    const componentEl = wrapper.value?.$el || wrapper.value
    const host = props.dropdownHost

    return host
      ? host === '$parent'
        ? componentEl?.parentNode
        : host.$el || host
      : componentEl
  })

  const dropdownElement = computed(() => dropdownPanel.value?.$el || dropdownPanel.value)
  const dropdownVisible = computed(() => expanded.value || null)

  const isHoverTrigger = computed(() => props.dropdownTrigger === 'hover')

  usePopupManager(dropdownVisible, {
    hide,
    onCaptureEscKeyDown,
    onCaptureMouseDown,
    onCaptureScroll
  })

  let delayHideTimer

  function resetHideTimer () {
    if (delayHideTimer) {
      clearTimeout(delayHideTimer)
      delayHideTimer = null
    }
  }

  function updatePosition () {
    if (!activityStyle.value) return

    const positioned = props.dropdownPositioned
    const element = dropdownElement.value
    const style = {}

    if (isString(positioned)) {
      element.setAttribute('position', positioned)
    } else if (!positioned) {
      const { width: hw, top: ht, right: hr, bottom: hb, left: hl } = hostElement.value.getBoundingClientRect()
      const { width: dw, height: dh } = element.getBoundingClientRect()
      const { innerWidth: tw, innerHeight: th } = window

      if (dw < hw) {
        style.width = `${hw}px`
      }

      if ((dw > hw) && ((tw - hl >= dw) || (hr < dw))) {
        style.left = `${hl}px`
      } else {
        style.right = `${tw - hr}px`
      }

      if (th - hb > dh || ht < dh) {
        element.setAttribute('position', 'bottom')
        style.top = `${hb}px`
      } else {
        element.setAttribute('position', 'top')
        style.bottom = `${th - ht}px`
      }
    }

    activityStyle.value = style
  }

  function show () {
    resetHideTimer()

    if (!expanded.value) {
      dropdownContainer.value = document.fullscreenElement || rootEl
      expanded.value = true

      emit('dropdown:show')

      Promise
        .resolve(
          (!dropdownReady.value) &&
          (dropdownReady.value = true) &&
          delay()
        )
        .then(() => {
          const ddEl = dropdownElement.value

          ddEl.removeAttribute('expanded')
          ddEl.style.transition = 'none'

          activityStyle.value = {
            transform: 'none',
            visibility: 'hidden'
          }

          delay()
            .then(updatePosition)
            .then(delay)
            .then(() => { ddEl.style.transition = null })
            .then(() => expanded.value && ddEl.setAttribute('expanded', ''))
        })
    }
  }

  function hide () {
    resetHideTimer()

    if (expanded.value) {
      expanded.value = false

      emit('dropdown:hide')

      const ddEl = dropdownElement.value
      const duration = getTransitionDuration(ddEl)

      ddEl.removeAttribute('expanded')

      delay(duration).then(() => {
        if (!expanded.value) activityStyle.value = null
      })
    }
  }

  function delayHide () {
    if (isHoverTrigger.value) {
      clearTimeout(delayHideTimer)
      delayHideTimer = setTimeout(hide, 300)
    }
  }

  function toggle () {
    if (expanded.value) hide()
    else show()
  }

  function onTriggerClick () {
    if (!isHoverTrigger.value) toggle()
  }

  function onTriggerMouseOver () {
    if (isHoverTrigger.value) show()
  }

  function onTriggerMouseLeave () {
    if (isHoverTrigger.value) delayHide()
  }

  function onDropdownClick (event) {
    const trigger = findUp(event.target, parent => {
      if (parent.hasAttribute('dropdown-hide-trigger')) return true
      if (parent === dropdownElement.value) return false
    })

    if (trigger) hide()
  }

  function onDropdownMouseOver () {
    resetHideTimer()
  }

  function onDropdownMouseLeave () {
    onTriggerMouseLeave()
  }

  function onDropdownItemClick (item) {
    emit('dropdown:itemclick', item)
    hide()
  }

  function onCaptureEscKeyDown (event) {
    if (expanded.value && !isHoverTrigger.value) {
      hide()
    }
  }

  function onCaptureMouseDown (event) {
    if (
      expanded.value &&
      !hostElement.value?.contains(event.target) &&
      !dropdownElement.value?.contains(event.target)
    ) hide()
  }

  function onCaptureScroll (event) {
    if (!isElementInViewport(hostElement.value)) {
      hide()
    } else if (
      expanded.value &&
      event.target.contains(hostElement.value)
      // && !dropdownElement.value.contains(event.target)
    ) updatePosition()
  }

  provide('dropdown', {
    hide,
    dropdownVisible,
    onDropdownItemClick
  })

  return {
    wrapper,
    dropdownPanel,
    dropdownReady,
    dropdownVisible,
    dropdownContainer,
    dropdownIconAttrs,
    dropdownPanelAttrs,
    show,
    hide,
    toggle,
    onTriggerClick,
    onTriggerMouseOver,
    onTriggerMouseLeave,
    onDropdownClick,
    onDropdownMouseOver,
    onDropdownMouseLeave,
    onDropdownItemClick
  }
}
