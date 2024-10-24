import { provide, ref, toRef, computed } from 'vue'
import { useListItems } from '../list/list-items'

export const selectProps = {
  displayValue: String,
  options: Array,
  optionKey: { type: String, default: 'value' }
}

export function useSelect (model, props) {
  const mountedOptions = ref(new Set())

  const isMultiple = computed(() => Array.isArray(model.value))

  const optionsLabels = computed(() => {
    const result = {}

    if (!props.editable) {
      Array
        .from(props.options || mountedOptions.value || [])
        .forEach(el => {
          if (el.value != null) {
            result[el.value] = el.label ?? el.value
          }
        })
    }

    return {}
  })

  const comboValue = computed({
    get () {
      const v = model.value
      const labels = optionsLabels.value

      return props.editable
        ? v
        : props.displayValue === undefined
          ? v in labels
            ? labels[v]
            : v
          : props.displayValue
    },
    set (v) {
      model.value = v
    }
  })

  const { items: optionItems } = useListItems(
    toRef(props, 'options'),
    {
      key: props.optionKey,
      defaultComponent: 'mu-option'
    }
  )

  function mountOption (option) {
    if (!props.options && !props.editable && option.value != null) {
      mountedOptions.value.add(option)
    }
  }

  function unmountOption (option) {
    if (!props.options && !props.editable) {
      mountedOptions.value.delete(option)
    }
  }

  function onOptionClick (option) {
    model.value = option.value
  }

  provide('select', {
    isMultiple,
    mountOption,
    unmountOption,
    onOptionClick
  })

  return {
    isMultiple,
    comboValue,
    optionItems
  }
}
