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
    round: Boolean,
    disabled: Boolean,
    primary: Boolean,
    danger: Boolean,
    secondary: Boolean,
    xColor: [Boolean, String],
    size: {
      type: String,
      default: null,
      validator: v => ['small', 'normal', 'large'].includes(v)
    },
    buttonStyle: {
      type: String,
      default: null,
      validator: v => ['normal', 'outline'].includes(v)
    }
  })

  const forcedButtonOptions = computed(() =>
    pickBy(props, (key, value) =>
      ['size', 'round', 'disabled', 'buttonStyle'].includes(key) &&
      (key !== 'disabled' || value)
    )
  )

  const defaultButtonOptions = computed(() =>
    pickBy(props, (key, value) =>
      ['primary', 'danger', 'secondary', 'xColor'].includes(key) &&
      value !== false
    )
  )

  provide('buttonGroup', props)
  provide('forcedButtonOptions', forcedButtonOptions)
  provide('defaultButtonOptions', defaultButtonOptions)
</script>
