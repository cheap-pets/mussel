<template>
  <div
    class="mu-switch"
    :active="isActive"
    :label="innerLabel"
    @click="toggle" />
</template>

<script setup>
  import './switch.scss'

  import { computed } from 'vue'

  defineOptions({ name: 'MusselSwitch' })

  const model = defineModel()

  const props = defineProps({
    label: String,
    activeLabel: String,
    inactiveLabel: String,
    activeValue: { default: true },
    inactiveValue: { default: false }
  })

  const isActive = computed(() =>
    props.activeValue === model.value || null
  )

  const innerLabel = computed(() =>
    (isActive.value ? props.activeLabel : props.inactiveLabel) || props.label
  )

  function toggle () {
    model.value = isActive.value ? props.inactiveValue : props.activeValue
  }
</script>
