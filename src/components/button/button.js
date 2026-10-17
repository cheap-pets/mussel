import './button.scss'

import { inject, computed } from 'vue'
import { warn } from '../../utils/warn'

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
  const toolSize = !group && inject('toolSize', {})
  const defaultButtonStyle = !group && inject('defaultButtonStyle', {})

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
        warn({
          component,
          message: 'props primary/secondary/danger are deprecated and will be removed in future versions. Use color="primary/secondary/danger" instead.'
        })
      }

      return color
    }

    return resolveClassName(
      resolve(props, 'Button') || resolve(group, 'ButtonGroup')
    )
  })

  const extraClass = computed(() => {
    let { size, buttonStyle, pill } = group || props

    size ||= toolSize.value
    buttonStyle ||= defaultButtonStyle.value

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
