<template>
  <label class="mu-radio">
    <input v-model="model" type="radio" :value="value">
    <span v-if="label">{{ label }}</span>
  </label>
</template>

<script setup>
  defineOptions({ name: 'MusselRadio' })

  const model = defineModel()

  defineProps({
    value: { required: true },
    label: String
  })
</script>
