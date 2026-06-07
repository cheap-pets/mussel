<template>
  <button
    type="button"
    :class="['mu-button', colorClass, extraClass]"
    :active="active || null"
    :disabled="isDisabled">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      <span>{{ caption }}</span>
    </slot>
  </button>
</template>

<script setup>
  import './button.scss'

  import { inject, computed } from 'vue'
  import { warnDeprecated } from '../../utils/compatible.js'

  defineOptions({ name: 'MusselButton' })

  const props = defineProps({
    icon: String,
    caption: String,
    active: Boolean,
    disabled: Boolean,
    primary: Boolean,
    secondary: Boolean,
    danger: Boolean,
    pill: Boolean,
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
  })

  const group = inject('buttonGroup', null)

  const isDisabled = computed(() =>
    group?.disabled || props.disabled || null
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
    function resolve (source) {
      return source && [
        resolveClassName(source.size),
        resolveClassName(source.buttonStyle),
        resolveClassName(source.pill && source.buttonStyle !== 'link' && 'pill')
      ].filter(Boolean)
    }

    return resolve(group) || resolve(props)
  })
</script>
