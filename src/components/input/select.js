import { ref, computed, watch } from 'vue'
import { useVForComponents } from '@/hooks/v-for-components'

export const selectProps = {
  displayValue: String,
  options: Array,
  optionKey: { type: String, default: 'value' }
}

export function useSelect (model, props) {
  const { computedItems: selectOptions } = useVForComponents(
    props,
    {
      itemsProp: 'options',
      itemsKeyProp: 'optionKey',
      defaultComponent: 'mu-option'
    }
  )

  const optionLabels = ref({})

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

  return {
    value,
    mountOption,
    unmountOption,
    selectOptions
  }
}
