<template>
  <div class="grid" :style="style">
    <slot />
  </div>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'MusselGridBox' })

  const props = defineProps({
    rows: {
      type: [String, Number],
      validator: v => v == null || /^(auto|\d+)$/i.test(String(v))
    },
    columns: {
      type: [String, Number],
      validator: v => v == null || /^(auto|\d+)$/i.test(String(v))
    }
  })

  function getGridTemplateValues (v) {
    return isNaN(v) ? undefined : `repeat(${v}, 1fr)`
  }

  const style = computed(() => {
    const result = {}

    if (props.rows === 'auto') {
      result.gridAutoRows = '1fr'
    } else if (props.rows) {
      result.gridTemplateRows = getGridTemplateValues(props.rows)
    }

    if (props.columns === 'auto') {
      result.gridAutoColumns = '1fr'
    } else if (props.columns) {
      result.gridTemplateColumns = getGridTemplateValues(props.columns)
    }

    return result
  })
</script>
