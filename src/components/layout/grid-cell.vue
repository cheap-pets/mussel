<template>
  <div :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'

  defineOptions({ name: 'MusselGridCell' })

  const props = defineProps({
    colStart: Number,
    colSpan: Number,
    colEnd: Number,
    rowStart: Number,
    rowSpan: Number,
    rowEnd: Number,
    endOffset: {
      type: Number,
      validator: v => [0, 1].includes(v),
      default: () => inject('$mussel').options.gridCell?.endOffset || 0
    }
  })

  const style = computed(() => ({
    gridColumnStart: props.colStart,
    gridColumnSpan: props.colSpan,
    gridColumnEnd: isNaN(props.colEnd) ? null : parseInt(props.colEnd) + props.endOffset,
    gridRowStart: props.rowStart,
    gridRowSpan: props.rowSpan,
    gridRowEnd: isNaN(props.rowEnd) ? null : parseInt(props.rowEnd) + props.endOffset
  }))
</script>
