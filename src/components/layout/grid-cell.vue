<template>
  <div :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'MusselGridCell' })

  const props = defineProps({
    colStart: null,
    colSpan: null,
    colEnd: null,
    rowStart: null,
    rowSpan: null,
    rowEnd: null
  })

  const style = computed(() => ({
    gridColumnStart: props.colStart,
    gridColumnSpan: props.colSpan,
    gridColumnEnd: props.colEnd,
    gridRowStart: props.rowStart,
    gridRowSpan: props.rowSpan,
    gridRowEnd: props.rowEnd
  }))
</script>
