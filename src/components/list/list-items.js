import { computed } from 'vue'
import { autoIncrementKeyBuilder } from '@/utils/key-builder'

import { isObject } from '@/utils/type'
import { reverse } from '@/utils/object'

const DEFAULT_SHORTCUTS = {
  '-': { is: 'mu-list-divider' }
}

const DEFAULT_KEY_PROP = 'id'

export function useListItems (itemsRef, options = {}) {
  const getItemKey = autoIncrementKeyBuilder()

  const {
    defaultComponent = 'mu-list-item',
    nonObjectSetToProp = 'label',
    props = {}
  } = options

  const shortcuts = { ...DEFAULT_SHORTCUTS, ...options.shortcuts }

  const keyProp = computed(() => props.key || DEFAULT_KEY_PROP)
  const propsMapping = computed(() => reverse(props))

  function resolveItemProps (item) {
    const { is = defaultComponent, ...values } = item

    const result = {
      is,
      key: values[keyProp.value],
      bindings: {}
    }

    Object
      .entries(values)
      .forEach(([key, value]) => {
        key = propsMapping.value[key] ?? key
        result.bindings[key] = value
      })

    return result
  }

  const items = computed(() => {
    if (!Array.isArray(itemsRef.value)) return

    const result = []

    itemsRef.value.forEach(el => {
      if (el == null || el === '') return

      const isObj = isObject(el)

      const item = resolveItemProps(
        isObj
          ? el
          : shortcuts[el]
            ? { is: el }
            : { [nonObjectSetToProp]: el }
      )

      item.key ??= getItemKey(el)

      result.push(
        Object.assign(item, shortcuts[item.is])
      )
    })

    return result
  })

  return {
    items
  }
}
