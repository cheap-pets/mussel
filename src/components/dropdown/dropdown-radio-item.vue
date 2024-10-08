<template>
  <label class="mu-radio mu-list-item mu-dropdown-item" @click="onClick">
    <input v-model="model" type="radio" :value="value" @click.stop>
    <span>{{ label ?? value }}</span>
  </label>
</template>

<script setup>
  import { dropdownItemProps, dropdownItemEvents, useDropdownItem } from './dropdown-item'

  defineOptions({ name: 'MusselDropdownRadioItem' })

  const model = defineModel()
  const emit = defineEmits([...dropdownItemEvents])

  const props = defineProps({
    value: { required: true },
    label: String,
    ...dropdownItemProps
  })

  const { onClick } = useDropdownItem(props, emit)
</script>
