<template>
  <div class="mu-radio-group" :disabled="disabled || null">
    <slot>
      <mu-radio
        v-for="option in options"
        :key="option.value ?? option.label"
        :value="option.value"
        :label="option.label"
        :disabled="option.disabled" />
    </slot>
  </div>
</template>

<script setup>
  import { provide } from 'vue'

  import MuRadio from './radio.vue'

  defineOptions({ name: 'MusselRadioGroup' })

  const model = defineModel()

  defineProps({
    options: Array,
    disabled: Boolean
  })

  provide('radioGroup', { model })
</script>
