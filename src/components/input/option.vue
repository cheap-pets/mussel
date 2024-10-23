<template>
  <div class="mu-list-item mu-dropdown-item mu-option" @click="onClick">
    <slot>
      <mu-icon v-if="isMultiple" :icon="checkIcon" />
      <mu-icon v-if="icon != null" class="mu-list-item_icon" :icon="icon" />
      <label class="mu-list-item_label">{{ optionLabel }}</label>
    </slot>
  </div>
</template>

<script setup>
  import { inject, computed, onMounted, onUnmounted } from 'vue'
  import { dropdownItemProps } from '../dropdown/dropdown-item'

  defineOptions({ name: 'MusselOption' })

  const props = defineProps({
    ...dropdownItemProps,
    value: { required: true }
  })

  const {
    isMultiple,
    mountOption,
    unmountOption,
    onOptionClick
  } = inject('select')

  const dropdown = inject('dropdown')

  const optionLabel = computed(() => props.label ?? props.value)
  const checkIcon = computed(() => '')

  function onClick (event) {
    onOptionClick(props)

    if (!isMultiple) {
      dropdown.hide()
    }
  }

  onMounted(() => {
    mountOption(props)
  })

  onUnmounted(() => {
    unmountOption(props)
  })
</script>
