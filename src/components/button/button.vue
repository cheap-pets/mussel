<template>
  <button type="button" class="mu-button" :class="[colorClass, appearanceClass, activeClass]">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      <span>{{ caption }}</span>
    </slot>
  </button>
</template>

<script setup>
  import './button.scss'

  import { inject, computed } from 'vue'

  defineOptions({ name: 'MusselButton' })

  const props = defineProps({
    icon: String,
    caption: String,
    active: Boolean,
    round: Boolean,
    disabled: Boolean,
    primary: Boolean,
    danger: Boolean,
    secondary: Boolean,
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

  function resolveClassName (value) {
    return value && value !== 'normal' && `mu-button--${value}`
  }

  const colorClass = computed(() => {
    function resolve (source) {
      return source
        ? source.color || ['primary', 'secondary', 'danger'].find(key => source[key])
        : null
    }

    return resolveClassName(resolve(props) || resolve(group))
  })

  const appearanceClass = computed(() => {
    function resolve (source) {
      return source && [
        resolveClassName(source.size),
        resolveClassName(source.buttonStyle),
        resolveClassName(source.buttonStyle !== 'link' && source.round && 'round'),
        resolveClassName(source.disabled && 'disabled')
      ].filter(Boolean)
    }

    return resolve(group) || resolve(props)
  })

  const activeClass = computed(() =>
    resolveClassName(props.active && 'active')
  )
</script>
