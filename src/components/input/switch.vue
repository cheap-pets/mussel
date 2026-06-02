<template>
  <div class="mu-switch" :active="isActive" @click="toggle">
    <span v-if="innerLabel" class="mu-switch__label">{{ innerLabel }}</span>
    <mu-icon v-else-if="innerIcon" :icon="innerIcon" />
  </div>
</template>

<script setup>
  import './switch.scss'

  import { computed } from 'vue'

  defineOptions({ name: 'MusselSwitch' })

  const model = defineModel()

  const props = defineProps({
    icon: String,
    activeIcon: String,
    inactiveIcon: String,
    label: String,
    activeLabel: String,
    inactiveLabel: String,
    activeValue: { default: true },
    inactiveValue: { default: false }
  })

  const isActive = computed(() =>
    props.activeValue === model.value || null
  )

  const innerIcon = computed(() =>
    (isActive.value ? props.activeIcon : props.inactiveIcon) || props.icon
  )

  const innerLabel = computed(() =>
    (isActive.value ? props.activeLabel : props.inactiveLabel) || props.label
  )

  function toggle () {
    model.value = isActive.value ? props.inactiveValue : props.activeValue
  }
</script>
