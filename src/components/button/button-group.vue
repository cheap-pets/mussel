<template>
  <div class="mu-button-group">
    <slot />
  </div>
</template>

<script setup>
  import './button-group.scss'

  import { provide } from 'vue'

  const props = defineProps({
    disabled: Boolean,
    primary: Boolean,
    secondary: Boolean,
    danger: Boolean,
    pill: Boolean,
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

  provide('buttonGroup', props)
</script>
