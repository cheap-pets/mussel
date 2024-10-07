<template>
  <label class="mu-check mu-list-item mu-dropdown-item" @click="onClick">
    <input v-model="model" type="checkbox" :value="value" @click.stop>
    <span>{{ label ?? value }}</span>
  </label>
</template>

<script setup>
  import { dropdownItemProps, dropdownItemEvents, useDropdownItem } from './hooks/dropdown-item'

  defineOptions({ name: 'MusselDropdownCheckItem' })

  const model = defineModel({ type: [Boolean, Array] })

  const props = defineProps({
    ...dropdownItemProps,
    value: null,
    label: String
  })

  const emit = defineEmits([...dropdownItemEvents])

  const { onClick } = useDropdownItem(props, emit)
</script>
