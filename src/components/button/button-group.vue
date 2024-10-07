<template>
  <div class="mu-button-group">
    <slot />
  </div>
</template>

<script setup>
  import './button-group.scss'

  import { provide } from 'vue'

  const props = defineProps({
    primary: Boolean,
    danger: Boolean,
    accent: Boolean,
    xColor: [Boolean, String],
    small: Boolean,
    large: Boolean,
    round: Boolean,
    disabled: Boolean,
    buttonStyle: {
      type: String,
      validator: v => ['normal', 'outline'].includes(v)
    }
  })

  provide('buttonGroup', props)
</script>
