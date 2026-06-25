<template>
  <div class="mu-list-item mu-dropdown-item" @click="onClick">
    <slot>
      <mu-icon v-if="icon != null" :icon="icon" />
      <label v-if="label">{{ label }}</label>
    </slot>
  </div>
</template>

<script setup>
  import { dropdownItemProps, useDropdownItem } from './dropdown-item'

  defineOptions({ name: 'MusselDropdownItem' })

  const props = defineProps({ ...dropdownItemProps })

  const { onClick } = useDropdownItem(props)
</script>
