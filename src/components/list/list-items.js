import { computed } from 'vue'
import { autoIncrementKeyBuilder } from '@/utils/key-builder'

import { isObject, isString } from '@/utils/type'
import { reverse } from '@/utils/object'

const DEFAULT_SHORTCUTS = {
  '-': 'mu-list-divider'
}

const DEFAULT_KEY_PROP = 'id'

// shortcut 值允许字符串简写，统一归一化为 { is } 对象
function normalizeShortcuts (shortcuts) {
  const result = {}

  Object
    .entries(shortcuts)
    .forEach(([key, value]) => {
      result[key] = isString(value) ? { is: value } : value
    })

  return result
}

export function useListItems (itemsRef, options = {}) {
  const getItemKey = autoIncrementKeyBuilder()

  const {
    defaultComponent = 'mu-list-item',
    nonObjectSetToProp = 'label',
    props = {}
  } = options

  const shortcuts = normalizeShortcuts({ ...DEFAULT_SHORTCUTS, ...options.shortcuts })

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

    // 已解析的数组直接透传，保证重复调用幂等
    if (itemsRef.value._resolved) return itemsRef.value

    const result = []

    itemsRef.value.forEach(el => {
      if (el == null || el === '') return

      const item = resolveItemProps(
        isObject(el)
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

    result._resolved = true

    return result
  })

  return {
    items
  }
}
