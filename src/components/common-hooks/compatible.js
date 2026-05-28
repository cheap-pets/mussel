import { useAttrs, useSlots, onMounted, getCurrentInstance } from 'vue'
import { isDev } from '../../env'

const DEPRECATED_PROPS = {
  input: {
    label: 'prefix|suffix',
    solid: 'input-style="solid"',
    underline: 'input-style="underline"'
  },
  modal: {
    moveable: false,
    'mask-action': 'dismissible'
  },
  dropdown: {
    'trigger-action': 'dropdown-trigger'
  },
  tabs: {
    onTabClick: '@button-click',
    onTabChange: '@update:active-tab'
  }
}

const DEPRECATED_SLOTS = {
  input: {
    left: 'prop:prefix',
    right: 'prop:suffix'
  },
  tabs: {
    'tab-bar': 'tab-bar-prepend|tab-bar-append'
  }
}

export function useCompatible (componentName) {
  if (!isDev) return

  const deprecatedProps = DEPRECATED_PROPS[componentName]
  const deprecatedSlots = DEPRECATED_SLOTS[componentName]

  if (deprecatedProps || deprecatedSlots) {
    const attrs = useAttrs()
    const slots = useSlots()

    onMounted(() => {
      const name = getCurrentInstance().type.name

      if (deprecatedProps) {
        Object
          .entries(deprecatedProps)
          .forEach(([key, value]) => {
            if (attrs[key] !== undefined) {
              console.warn(
                `[MUSSEL:${name}]`,
                `Property "${key}" is deprecated` + (value ? `, use "${value}" instead.` : '.'))
            }
          })
      }

      if (deprecatedSlots) {
        Object
          .entries(deprecatedSlots)
          .forEach(([key, value]) => {
            if (slots[key] !== undefined) {
              console.warn(
                `[MUSSEL:${name}]`,
                `Slot "${key}" is deprecated` + (value ? `, use "${value}" instead.` : '.'))
            }
          })
      }
    })
  }
}
