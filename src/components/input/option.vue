<template>
  <div class="mu-list-item mu-dropdown-item mu-option" @click="onClick">
    <slot>
      <mu-icon v-if="icon" class="mu-list-item_icon" :icon="icon" />
      <label class="mu-list-item_label">{{ optionLabel }}</label>
    </slot>
  </div>
</template>

<script setup>
  import { inject, computed, onMounted, onUnmounted } from 'vue'
  import { dropdownItemProps, dropdownItemEvents } from '../dropdown/dropdown-item'

  defineOptions({ name: 'MusselOption' })

  const props = defineProps({ ...dropdownItemProps, value: { required: true } })
  const emit = defineEmits([...dropdownItemEvents])

  const select = inject('select', {})
  const optionLabel = computed(() => props.label ?? props.value)

  function onClick (event) {
    emit('click', event)
    select.onOptionClick?.(props)
  }

  onMounted(() => {
    select.mountOption?.(props)
  })

  onUnmounted(() => {
    select.unmountOption?.(props)
  })
</script>
