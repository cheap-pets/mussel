import { ref, shallowRef, readonly, computed, toRef } from 'vue'

import { useDropdownItems } from './dropdown-items'

export const dropdownEvents = [
  'action',
  'dropdown:show',
  'dropdown:hide',
  'dropdown:itemclick'
]

export const dropdownProps = {
  dropdownPanel: Object,
  dropdownClass: null,
  dropdownStyle: null,
  dropdownAnchor: null,
  dropdownAttrs: Object,
  dropdownWidth: String,
  dropdownHeight: String,
  dropdownDisabled: Boolean,
  dropdownScrollbar: Boolean,
  dropdownIcon: { type: [Boolean, String], default: true }
}

export const optionalProps = {
  dropdownItems: Array,
  dropdownTrigger: {
    type: String,
    default: 'click',
    validator: v => ['hover', 'click'].includes(v)
  }
  // dropdownPosition: {
  //   type: String,
  //   default: 'auto',
  //   validator: v => ['auto', 'fixed', 'top', 'bottom'].includes(v)
  // }
}

export function useDropdown (props, emit, options = {}) {
  const {
    wrapperRef = shallowRef(),
    dropdownPanelRef = shallowRef()
  } = options

  const expanded = ref()

  const wrapperEvents = {
    click: onTriggerClick,
    mouseover: onTriggerMouseOver,
    mouseleave: onTriggerMouseLeave
  }

  const dropdownPanel = computed(() => props.dropdownPanel || dropdownPanelRef.value)

  const { items: dropdownItems } = useDropdownItems(
    toRef(props, 'dropdownItems')
  )

  const dropdownIconAttrs = computed(() => (
    props.dropdownIcon &&
    {
      icon: props.dropdownIcon === true ? 'dropdownExpand' : props.dropdownIcon,
      class: 'mu-dropdown-arrow',
      expanded: expanded.value || null
    }
  )
  )

  const dropdownPanelAttrs = computed(() => ({
    style: props.dropdownStyle,
    class: props.dropdownClass,
    trigger: props.dropdownTrigger,
    // position: props.dropdownPosition,
    scrollbar: props.dropdownScrollbar,
    dropdownItems: dropdownItems.value
  }))

  const dropdownPanelEvents = {
    show: onDropdownShow,
    hide: onDropdownHide,
    action: emitAction,
    itemclick: emitItemClick
  }

  const dropdownVisible = readonly(expanded)

  const anchor = computed(() => {
    const hostEl = wrapperRef.value?.$el || wrapperRef.value
    const target = props.dropdownAnchor

    return target
      ? target === '$parent'
        ? hostEl?.parentNode
        : target.$el || target
      : hostEl
  })

  function onDropdownShow () {
    expanded.value = true
    emit('dropdown:show')
  }

  function onDropdownHide () {
    expanded.value = false
    emit('dropdown:hide')
  }

  function expand () {
    if (props.dropdownDisabled) return

    dropdownPanel.value.show({
      anchor: anchor.value,
      width: props.dropdownWidth,
      height: props.dropdownHeight,
      trigger: props.dropdownTrigger
    })
  }

  function collapse () {
    dropdownPanel.value.hide()
  }

  function toggle () {
    if (expanded.value) collapse()
    else expand()
  }

  function onTriggerClick (event) {
    if (props.dropdownTrigger === 'click') {
      toggle()
      event.stopPropagation()
    }
  }

  function updateDropdownPosition () {
    dropdownPanel.value?.updatePosition()
  }

  function onTriggerMouseOver () {
    if (props.dropdownTrigger === 'hover') expand()
  }

  function onTriggerMouseLeave () {
    dropdownPanel.value.delayHide()
  }

  function emitAction (action) {
    emit('action', action)
  }

  function emitItemClick (item) {
    emit('dropdown:itemclick', item)
  }

  return {
    wrapperRef,
    wrapperEvents,
    dropdownVisible,
    dropdownPanelRef,
    dropdownPanelAttrs,
    dropdownPanelEvents,
    dropdownIconAttrs,
    anchor,
    toggle,
    expand,
    collapse,
    updateDropdownPosition
  }
}
