import { isRef, computed } from 'vue'
import { isString } from '@/utils/type'
import { useKeyGen } from '../hooks/key-gen'

const DEFAULT_SHORTCUTS = {
  '-': { is: 'mu-list-divider' }
}

const DEFAULT_ITEM_PROPS = {
  key: 'id',
  icon: 'icon',
  label: 'label',
  value: 'value',
  disabled: 'disabled',
  checked: undefined
}

export function useListItems (itemsRef, options = {}) {
  const { props, defaultComponent = 'mu-list-item' } = options
  const { genKey, getObjectKey } = useKeyGen()

  const shortcuts = {
    ...DEFAULT_SHORTCUTS,
    ...options.shortcuts
  }

  const itemProps = computed(() => ({
    ...DEFAULT_ITEM_PROPS,
    ...(isRef(props) ? props.value : props)
  }))

  const items = computed(() => {
    if (!Array.isArray(itemsRef.value)) return

    const result = []



    return itemsRef.value.map(el => {
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
    items
  }
}
