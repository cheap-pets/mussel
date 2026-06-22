import './button.scss'

import { inject, computed } from 'vue'
import { warnDeprecated } from '../../utils/compatible.js'

export const buttonProps = {
  disabled: Boolean,
  primary: Boolean,
  secondary: Boolean,
  danger: Boolean,
  pill: Boolean,
  toggle: Boolean,
  size: {
    type: String,
    validator: v => ['small', 'normal', 'large'].includes(v)
  },
  color: {
    type: String,
    validator: v => ['normal', 'primary', 'secondary', 'danger'].includes(v)
  },
  buttonStyle: {
    type: String,
    validator: v => ['normal', 'outline', 'text', 'link'].includes(v)
  }
}

export function useButton (props) {
  const group = inject('buttonGroup', null)
  const toolbar = !group && inject('toolbar', {})

  const isDisabled = computed(() =>
    props.disabled || group?.disabled || null
  )

  function resolveClassName (value) {
    return value && value !== 'normal' && `mu-button--${value}`
  }

  const colorClass = computed(() => {
    function resolve (source, component) {
      if (!source) return null
      if (source.color) return source.color

      const color =
        ['primary', 'secondary', 'danger'].find(key => source[key])

      if (color) {
        warnDeprecated({
          component,
          deprecated: 'props primary|secondary|danger',
          alternative: 'color="primary|secondary|danger"'
        })
      }

      return color
    }

    return resolveClassName(
      resolve(props, 'Button') || resolve(group, 'ButtonGroup')
    )
  })

  const extraClass = computed(() => {
    const {
      size = toolbar.small ? 'small' : 'normal',
      buttonStyle = toolbar.buttonStyle,
      pill
    } = group || props

    return [
      resolveClassName(size),
      resolveClassName(buttonStyle),
      resolveClassName(pill && buttonStyle !== 'link' && 'pill')
    ].filter(Boolean)
  })

  return {
    isDisabled,
    colorClass,
    extraClass
  }
}
