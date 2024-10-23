<template>
  <div class="mu-list-item mu-dropdown-item" @click="onClick">
    <slot>
      <mu-icon v-if="icon != null" class="mu-list-item_icon" :icon="icon" />
      <label v-if="label" class="mu-list-item_label">{{ label }}</label>
    </slot>
  </div>
</template>

<script setup>
  import { dropdownItemProps, useDropdownItem } from './dropdown-item'

  defineOptions({ name: 'MusselDropdownItem' })

  const props = defineProps({ ...dropdownItemProps })

  const { onClick } = useDropdownItem(props)
</script>
