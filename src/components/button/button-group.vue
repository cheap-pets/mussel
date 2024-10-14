<template>
  <div class="mu-button-group">
    <slot />
  </div>
</template>

<script setup>
  import './button-group.scss'

  import { computed, provide } from 'vue'
  import { pickBy } from '@/utils/object'

  const props = defineProps({
    small: Boolean,
    large: Boolean,
    round: Boolean,
    disabled: Boolean,
    primary: Boolean,
    danger: Boolean,
    accent: Boolean,
    xColor: [Boolean, String],
    buttonStyle: {
      type: String,
      default: 'normal',
      validator: v => ['normal', 'outline'].includes(v)
    }
  })

  const forcedButtonOptions = computed(() =>
    pickBy(props, (key, value) =>
      ['small', 'large', 'round', 'disabled', 'buttonStyle'].includes(key) &&
      (key !== 'disabled' || value)
    )
  )

  const defaultButtonOptions = computed(() =>
    pickBy(props, (key, value) =>
      ['primary', 'danger', 'accent', 'xColor'].includes(key) &&
      value !== false
    )
  )

  provide('buttonGroup', props)
  provide('forcedButtonOptions', forcedButtonOptions)
  provide('defaultButtonOptions', defaultButtonOptions)
</script>
