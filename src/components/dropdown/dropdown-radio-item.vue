<template>
  <label class="mu-radio mu-list-item mu-dropdown-item" @click="onClick">
    <input v-model="model" type="radio" :value="value" @click.stop>
    <span>{{ label ?? value }}</span>
  </label>
</template>

<script setup>
  import {
    dropdownItemProps,
    useDropdownItem
  } from './dropdown-item'

  defineOptions({ name: 'MusselDropdownRadioItem' })

  const model = defineModel()
  const props = defineProps({ ...dropdownItemProps, value: { required: true } })

  const { onClick } = useDropdownItem(props)
</script>
