<template>
  <label class="mu-check" :disabled="disabled || null">
    <input v-model="model" type="checkbox" :value="value">
    <span v-if="label">{{ label }}</span>
  </label>
</template>

<script setup>
  import './check.scss'

  import { inject } from 'vue'

  defineOptions({ name: 'MusselCheck' })

  const ownModel = defineModel({ type: [Boolean, Array] })
  const groupModel = inject('checkGroup', null)?.model
  const model = groupModel ?? ownModel

  defineProps({
    value: null,
    label: String,
    disabled: Boolean
  })
</script>
