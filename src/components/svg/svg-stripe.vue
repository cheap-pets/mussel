<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="data.viewBox">
    <path :stroke="stroke" :stroke-width="strokeWidth" :d="data.pathD" />
  </svg>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    direction: {
      type: String,
      default: 'horizontal',
      validator: v => ['horizontal', 'vertical'].includes(v)
    },
    count: { type: Number, default: 8 },
    width: { type: Number, default: 4 },
    padding: { type: Number, default: 0 },
    spacing: { type: Number, default: 3 },
    strokeWidth: { type: Number, default: 1 },
    stroke: { type: String, default: 'currentColor' }
  })

  const data = computed(() => {
    const { direction, padding, width, spacing, strokeWidth } = props

    const offsetPadding = Math.max(
      padding,
      Math.ceil(strokeWidth / 2)
    )

    let [x, y] = direction === 'horizontal'
      ? [offsetPadding, padding]
      : [padding, offsetPadding]

    const draw = direction === 'horizontal'
      ? end => {
        const s = `M${x} ${y}v${width}`

        if (end) {
          y += width + padding
          x += offsetPadding
        } else {
          x += spacing + strokeWidth
        }

        return s
      }
      : end => {
        const s = `M${x} ${y}h${width}`

        if (end) {
          x += width + padding
          y += offsetPadding
        } else {
          y += spacing + strokeWidth
        }

        return s
      }

    let pathD = ''

    for (let i = 0; i < props.count; i++) {
      pathD += draw(i === props.count - 1)
    }

    return {
      viewBox: `0 0 ${x} ${y}`,
      pathD
    }
  })
</script>
