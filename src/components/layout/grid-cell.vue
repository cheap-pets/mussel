<template>
  <div :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'MusselGridCell' })

  const props = defineProps({
    colStart: Number,
    colSpan: Number,
    colEnd: Number,
    rowStart: Number,
    rowSpan: Number,
    rowEnd: Number
  })

  // colEnd/rowEnd 为末轨道号（含端点），转为网格线需 +1；span 与 end 同时设置时 span 优先
  function toGridLine (start, end, span) {
    const tail = span ? `span ${span}` : (end == null ? null : end + 1)

    if (start != null && tail != null) return `${start} / ${tail}`
    if (start != null) return `${start}`
    if (span) return tail
    return end == null ? null : `auto / ${tail}`
  }

  const style = computed(() => ({
    gridColumn: toGridLine(props.colStart, props.colEnd, props.colSpan),
    gridRow: toGridLine(props.rowStart, props.rowEnd, props.rowSpan)
  }))
</script>
