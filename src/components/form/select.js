import { provide, ref, toRef, computed } from 'vue'
import { useListItems } from '../list/list-items'

const selectProps = {
  options: Array,
  optionKey: { type: String, default: 'value' },
  valueMode: { type: String, default: 'normal', validator: v => ['normal', 'composite'].includes(v) },
  dropdownClass: null,
  dropdownWidth: { type: String, default: '$same' },
  dropdownScrollbar: { type: [Boolean, String], default: true }
}

function useOptions (props) {
  const mountedOptions = ref(new Set())

  const isOptionIndexRequired = computed(() =>
    !props.editable && props.valueMode !== 'composite'
  )

  const optionLabels = computed(() => {
    if (!isOptionIndexRequired.value) return

    const result = {}
    const items = props.options || Array.from(mountedOptions.value)

    items.forEach(el => {
      if (el.value != null) {
        result[el.value] = el.label ?? el.value
      }
    })

    return result
  })

  const { items: optionComponents } = useListItems(
    toRef(props, 'options'),
    {
      key: props.optionKey,
      defaultComponent: 'mu-option'
    }
  )

  function mountOption (option) {
    if (isOptionIndexRequired.value && !props.options && option.value != null) {
      mountedOptions.value.add(option)
    }
  }

  function unmountOption (option) {
    if (isOptionIndexRequired.value && !props.options) {
      mountedOptions.value.delete(option)
    }
  }

  return {
    optionLabels,
    optionComponents,
    mountOption,
    unmountOption
  }
}

function useSelect (model, props) {
  const {
    optionLabels,
    optionComponents,
    mountOption,
    unmountOption
  } = useOptions(props)

  const comboValue = computed({
    get () {
      const v = model.value

      return props.editable || v == null
        ? v
        : props.valueMode === 'composite'
          ? v.label ?? v.value
          : v in optionLabels.value
            ? optionLabels.value[v]
            : v
    },
    set (v) {
      model.value = v
    }
  })

  function toggleOption ({ value, label }) {
    model.value = props.valueMode === 'composite'
      ? { value, label }
      : value
  }

  provide('select', {
    mountOption,
    unmountOption,
    toggleOption
  })

  return {
    comboValue,
    optionComponents
  }
}

export {
  selectProps,
  useOptions,
  useSelect
}
