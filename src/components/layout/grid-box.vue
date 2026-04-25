<template>
  <div class="grid" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'MusselGridBox' })

  const props = defineProps({ rows: null, columns: null })

  function getGridTemplateValues (v) {
    return isNaN(v) ? undefined : `repeat(${v}, 1fr)`
  }

  const style = computed(() => ({
    gridTemplateRows: getGridTemplateValues(props.rows),
    gridTemplateColumns: getGridTemplateValues(props.columns)
  }))
</script>
