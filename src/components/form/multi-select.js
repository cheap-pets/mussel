import { provide, computed } from 'vue'
import { selectProps, useOptions } from './select'
import { isEmpty } from '@/utils/type'

const multiSelectProps = {
  ...selectProps,
  maxTags: { type: Number, default: 2 },
  tagShrink: { type: Boolean, default: true },
  tagTooltip: { type: Boolean, default: true }
}

function useMultiSelect (model, props) {
  const {
    optionLabels,
    optionComponents,
    mountOption,
    unmountOption
  } = useOptions(props)

  const comboValue = computed({
    get () {
      return isEmpty(model.value) ? null : 'any'
    },
    set (v) {
      model.value = v == null ? [] : v
    }
  })

  const selectedItems = computed(() => {
    const result = []

    model.value?.forEach(value => {
      const item = props.valueMode === 'composite'
        ? { ...value }
        : { value, label: value != null && optionLabels.value[value] }

      if (item.value == null) return
      if (item.label == null) item.label = item.value

      result.push(item)
    })

    return result
  })

  const selectedValues = computed(() =>
    new Set(selectedItems.value.map(el => el.value))
  )

  function toggleOption (option, checked) {
    const modelValue = model.value || []
    const isComposite = props.valueMode === 'composite'

    const idx = isComposite
      ? modelValue.findIndex(el => el.value === option.value)
      : modelValue.findIndex(el => el === option.value)

    if ((checked && idx >= 0) || (checked === false && idx < 0)) return

    model.value = idx < 0
      ? [...modelValue, isComposite ? { ...option } : option.value]
      : modelValue.filter((el, index) => idx !== index)
  }

  provide('select', {
    selectedValues,
    mountOption,
    unmountOption,
    toggleOption
  })

  return {
    comboValue,
    selectedItems,
    optionComponents,
    toggleOption
  }
}

export {
  multiSelectProps,
  useMultiSelect
}
