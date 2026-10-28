<template>
  <div class="mu-tag" :class="extraClass">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { colorProp } from '../common/props'

  defineOptions({ name: 'MusselTag' })

  const props = defineProps({
    color: colorProp,
    faint: Boolean,
    pill: Boolean,
    flat: Boolean
  })

  const extraClass = computed(() => [
    props.color && (props.faint ? `mu-faint-${props.color}` : `mu-solid-${props.color}`),
    props.pill && 'mu-tag--pill',
    props.flat && 'mu-tag--flat'
  ])
</script>
