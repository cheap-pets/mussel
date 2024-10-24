<template>
  <div class="mu-list-item mu-dropdown-item mu-option" @click="onClick">
    <mu-icon v-if="isMultiple" :icon="checkIcon" />
    <slot>
      <mu-icon v-if="icon != null" class="mu-list-item_icon" :icon="icon" />
      <label class="mu-list-item_label">{{ label ?? value }}</label>
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

  const { hide: collapse } = inject('dropdown')
  const { isMultiple, mountOption, unmountOption, onOptionClick } = inject('select')

  const checkIcon = computed(() => '')

  function onClick (event) {
    onOptionClick(props)

    if (!isMultiple.value) collapse()
  }

  onMounted(() => mountOption(props))
  onUnmounted(() => unmountOption(props))
</script>
