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
  import { useFieldModel } from '../form/validation'

  import MuRadio from './radio.vue'

  defineOptions({ name: 'MusselRadioGroup' })
  defineProps({ options: Array, disabled: Boolean })

  const rawModel = defineModel()
  const model = useFieldModel(rawModel).modelProxy

  provide('radioGroup', { model })
</script>
