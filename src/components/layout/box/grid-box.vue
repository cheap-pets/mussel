<template>
  <div class="mu-grid-box mu-box" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { sizeProps, useSize } from '@/hooks/size'

  defineOptions({ name: 'MusselGridBox' })

  const props = defineProps({ ...sizeProps, rows: null, columns: null })
  const sizeStyle = useSize(props).sizeStyle

  function getGridTemplateValues (v) {
    return isNaN(v) ? undefined : `repeat(${v}, 1fr)`
  }

  const style = computed(() => ({
    ...sizeStyle.value,
    gridTemplateRows: getGridTemplateValues(props.rows),
    gridTemplateColumns: getGridTemplateValues(props.columns)
  }))
</script>
