<template>
  <div class="mu-list-item mu-dropdown-item mu-option" @click="onClick">
    <slot :selected="selected">
      <mu-icon v-if="isMultiple" :icon="selected ? 'check' : ''" />
      <mu-icon v-if="icon != null" :icon="icon" />
      <label>{{ label ?? value }}</label>
    </slot>
  </div>
</template>

<script setup>
  import { inject, computed, onMounted, onUnmounted } from 'vue'
  import { dropdownItemProps } from '../dropdown/dropdown-item'

  defineOptions({ name: 'MusselOption' })

  const props = defineProps({ ...dropdownItemProps, value: { required: true } })

  const { hide: collapse } = inject('popup')
  const { selectedValues, mountOption, unmountOption, toggleOption } = inject('select')

  const isMultiple = computed(() => Boolean(selectedValues))
  const selected = computed(() => selectedValues?.value.has(props.value))

  function onClick (event) {
    toggleOption(props)

    if (!isMultiple.value) collapse()
  }

  onMounted(() => mountOption(props))
  onUnmounted(() => unmountOption(props))
</script>
