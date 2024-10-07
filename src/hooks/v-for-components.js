import { computed } from 'vue'
import { useKeyGen } from './key-gen'
import { isString } from '@/utils/type'

const SHORTCUTS = {
  '-': { is: 'mu-list-divider' }
}

export function useVForComponents (props, options = {}) {
  const { genKey, getObjectKey } = useKeyGen()

  const {
    itemsProp = 'items',
    itemsKeyProp = 'id',
    defaultComponent = 'div'
  } = options

  const shortcuts = {
    ...SHORTCUTS,
    ...options.shortcuts
  }

  const computedItems = computed(() => {
    const { [itemsProp]: arr, [itemsKeyProp]: keyProp } = props

    return arr?.map(el => {
      if (isString(el)) {
        const shortcut = shortcuts[el]

        return shortcut
          ? { key: genKey(), ...shortcut }
          : { is: el }
      } else {
        const { is = defaultComponent, ...bindings } = el
        const shortcut = shortcuts[is]

        return {
          key: el[keyProp] ?? getObjectKey(el),
          is,
          ...shortcut,
          bindings
        }
      }
    }).filter(Boolean)
  })

  return {
    computedItems
  }
}
