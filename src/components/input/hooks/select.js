import { ref, computed, provide, watch } from 'vue'
import { useVForComponents } from '@/hooks/v-for-components'
import { useDropdown, dropdownEvents } from '../../dropdown/hooks/dropdown'

export const selectProps = {
  displayValue: String,
  dropdownHost: null,
  dropdownClass: null,
  dropdownStyle: null,
  dropdownAttrs: Object,
  dropdownScrollbar: [Boolean, String],
  options: Array,
  optionKey: { type: String, default: 'value' }
}

export const selectEvents = [
  ...dropdownEvents
]

export function useSelect (model, props, emit) {
  const {
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownBindings,
    dropdownContainer,
    dropdownArrowBindings,
    show: showDropdown,
    hide: hideDropdown,
    onTriggerClick,
    onDropdownClick
  } = useDropdown(props, emit)

  const { computedItems: selectOptions } = useVForComponents(
    props,
    {
      itemsProp: 'options',
      itemsKeyProp: 'optionKey',
      defaultComponent: 'mu-option'
    }
  )

  const optionLabels = ref({})

  const expandable = computed(() => !props.disabled && !props.readonly)

  const value = computed({
    get () {
      const v = model.value

      return props.displayValue === undefined
        ? v in optionLabels.value
          ? optionLabels.value[v]
          : v
        : props.displayValue
    },
    set (v) {
      model.value = v
    }
  })

  watch(
    () => props.options,
    () => {
      optionLabels.value =
        props.options?.reduce(
          (result, option) => Object.assign(result, {
            [option.value]: option.label ?? option.value
          }),
          {}
        ) || {}
    },
    {
      deep: true,
      immediate: true
    }
  )

  function mountOption (option) {
    if (!props.options) {
      optionLabels.value[option.value] = option.itemLabel
    }
  }

  function unmountOption (option) {
    if (!props.options) {
      delete optionLabels.value[option.value]
    }
  }

  function onOptionClick (option) {
    model.value = option.value
    hideDropdown()
  }

  provide('select', {
    mountOption,
    unmountOption,
    onOptionClick
  })

  return {
    value,
    expandable,
    selectOptions,
    wrapperRef,
    dropdownRef,
    dropdownReady,
    dropdownBindings,
    dropdownContainer,
    dropdownArrowBindings,
    showDropdown,
    hideDropdown,
    onTriggerClick,
    onDropdownClick
  }
}
