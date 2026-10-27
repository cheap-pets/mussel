<template>
  <div class="mu-badge" :class="extraClass">
    <slot />
  </div>
</template>

<script setup>
  import './badge.scss'

  import { computed } from 'vue'
  import { colorProp } from '../common/props'

  defineOptions({ name: 'MusselBadge' })

  const props = defineProps({
    color: colorProp,
    faint: Boolean
  })

  const extraClass = computed(() =>
    props.color &&
    (props.faint ? `mu-faint-${props.color}` : `mu-solid-${props.color}`)
  )
</script>
