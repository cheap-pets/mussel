import { provide, ref, toRef, computed, watchEffect } from 'vue'
import { useListItems } from '../list/list-items'

export const selectProps = {
  displayValue: String,
  options: Array,
  optionKey: { type: String, default: 'value' }
}

export function useSelect (comboBox, model, props) {
  const { items: optionItems } = useListItems(
    toRef(props, 'options'),
    { defaultComponent: 'mu-option', key: props.optionKey }
  )

  const displayValues = ref({})

  const isMultiple = computed(() => Array.isArray(model.value))

  const value = computed({
    get () {
      const v = model.value
      const values = displayValues.value

      return props.editable
        ? v
        : props.displayValue === undefined
          ? v in values
            ? values[v]
            : v
          : props.displayValue
    },
    set (v) {
      model.value = v
    }
  })

  watchEffect(() => {
    const result = {}

    if (!props.editable) {
      props.options?.forEach(el => {
        if (el.value != null) {
          result[el.value] = el.label ?? el.value
        }
      })
    }

    displayValues.value = result
  })

  function mountOption (option) {
    if (!props.options && !props.editable && option.value != null) {
      displayValues.value[option.value] = option.label ?? option.value
    }
  }

  function unmountOption (option) {
    if (!props.options && !props.editable) {
      delete displayValues.value[option.value]
    }
  }

  function onOptionClick (option) {
    model.value = option.value
    comboBox.value.hideDropdown()
  }

  provide('select', {
    isMultiple,
    mountOption,
    unmountOption,
    onOptionClick
  })

  return {
    value,
    isMultiple,
    optionItems
  }
}
