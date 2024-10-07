<template>
  <label class="mu-check">
    <input v-model="model" type="checkbox" :value="value">
    <span v-if="label">{{ label }}</span>
  </label>
</template>

<script setup>
  import './check.scss'

  defineOptions({ name: 'MusselCheck' })

  const model = defineModel({ type: [Boolean, Array] })

  defineProps({
    value: null,
    label: String
  })
</script>
