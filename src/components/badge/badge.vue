<template>
  <div class="mu-badge" :class="extraClass">
    <slot>
      {{ value }}
    </slot>
  </div>
</template>

<script setup>
  import './badge.scss'

  import { computed, useSlots } from 'vue'

  import { warn } from '../../utils/warn'
  import { specColorNames } from '@/colors'

  defineOptions({ name: 'MusselBadge' })

  const props = defineProps({
    primary: Boolean,
    secondary: Boolean,
    success: Boolean,
    warning: Boolean,
    danger: Boolean,
    color: {
      type: String,
      validator: v => specColorNames.includes(v)
    },
    value: [String, Number]
  })

  const slots = useSlots()

  const extraClass = computed(() => {
    function deprecatedColorProp () {
      const color = specColorNames.find(key => props[key])

      if (color) {
        warn({
          component: 'Badge',
          message: `props "${color}" are deprecated and will be removed in future versions. Use color="${color}" instead.`
        })
      }

      return color
    }

    const bg = props.color || deprecatedColorProp()

    return [
      bg && `bg-${bg}`,
      !slots.default && /^\d$/.test(String(props.value)) && 'mu-badge--circle'
    ].filter(Boolean)
  })
</script>
