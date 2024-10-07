<template>
  <div class="mu-list-item mu-dropdown-item" @click="onClick">
    <slot>
      <mu-icon v-if="icon" class="mu-list-item_icon" :icon="icon" />
      <label v-if="label" class="mu-list-item_label">{{ label }}</label>
    </slot>
  </div>
</template>

<script setup>
  import './dropdown-item.scss'

  import { dropdownItemProps, dropdownItemEvents, useDropdownItem } from './hooks/dropdown-item'

  defineOptions({ name: 'MusselDropdownItem' })

  const props = defineProps({ ...dropdownItemProps })
  const emit = defineEmits([...dropdownItemEvents])

  const { onClick } = useDropdownItem(props, emit)
</script>
