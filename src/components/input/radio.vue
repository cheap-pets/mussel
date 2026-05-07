<template>
  <label class="mu-radio" :disabled="disabled || null">
    <input v-model="model" type="radio" :value="value">
    <span v-if="label">{{ label }}</span>
  </label>
</template>

<script setup>
  import { inject } from 'vue'

  defineOptions({ name: 'MusselRadio' })

  const ownModel = defineModel()
  const groupModel = inject('radioGroup', null)?.model
  const model = groupModel ?? ownModel

  defineProps({
    value: { required: true },
    label: String,
    disabled: Boolean
  })
</script>
