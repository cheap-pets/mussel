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
    size: {
      type: String,
      validator: v => ['normal', 'small', 'large'].includes(v)
    },
    color: {
      type: String,
      validator: v => ['normal', 'primary', 'secondary', 'danger'].includes(v)
    },
    buttonStyle: {
      type: String,
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
      ['primary', 'danger', 'secondary'].includes(key) &&
      value !== false
    )
  )

  provide('buttonGroup', props)
  provide('forcedButtonOptions', forcedButtonOptions)
  provide('defaultButtonOptions', defaultButtonOptions)
</script>
