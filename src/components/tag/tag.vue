<template>
  <div class="mu-tag" :class="extraClass">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { colorProp } from '../common/props'

  import './tag.scss'

  defineOptions({ name: 'MusselTag' })

  const props = defineProps({
    color: colorProp,
    flat: Boolean,
    pill: Boolean
  })

  const extraClass = computed(() => [
    props.color && `mu-tag--${props.color}`,
    props.flat && 'mu-tag--flat',
    props.pill && 'mu-tag--pill'
  ])
</script>
