<template>
  <div class="mu-grid-cell mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { sizeProps, useSize } from '@/components/common-hooks/size'

  defineOptions({ name: 'MusselGridCell' })

  const props = defineProps({
    ...sizeProps,
    colStart: null,
    colSpan: null,
    colEnd: null,
    rowStart: null,
    rowSpan: null,
    rowEnd: null
  })

  const size = useSize(props).resolved

  const style = computed(() => ({
    ...size.value,
    gridColumnStart: props.colStart,
    gridColumnSpan: props.colSpan,
    gridColumnEnd: props.colEnd,
    gridRowStart: props.rowStart,
    gridRowSpan: props.rowSpan,
    gridRowEnd: props.rowEnd
  }))
</script>
