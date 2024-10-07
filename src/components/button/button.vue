<template>
  <button ref="thisEl" class="mu-button" :type="type" v-bind="attrs">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />{{ caption }}
    </slot>
  </button>
</template>

<script setup>
  import './button.scss'

  import { ref, inject, computed } from 'vue'
  import { kebabCase } from '@/utils/case'
  import { getComputedXColor } from '@/theme'
  import { generateAdjacentColors } from '@/utils/color'

  defineOptions({ name: 'MusselButton' })

  const props = defineProps({
    icon: String,
    caption: String,
    active: Boolean,
    primary: Boolean,
    danger: Boolean,
    accent: Boolean,
    xColor: [Boolean, String],
    small: Boolean,
    large: Boolean,
    round: Boolean,
    disabled: Boolean,
    type: {
      type: String,
      default: 'button'
    },
    buttonStyle: {
      type: String,
      validator: v => ['normal', 'outline', 'text', 'link'].includes(v)
    }
  })

  const thisEl = ref()
  const inheritedProps = inject('buttonGroup', {})

  const attrs = computed(() => {
    if (!thisEl.value) return

    const { type, icon, caption, disabled, ...values } = props

    Object.assign(
      values,
      inheritedProps,
      { disabled: disabled || inheritedProps.disabled }
    )

    if (values.xColor) {
      const xColors = generateAdjacentColors(
        getComputedXColor(values.xColor, thisEl.value)
      )

      if (xColors) {
        values.style = {
          '--mu-x-color': xColors.color,
          '--mu-x-color-dark': xColors.dark,
          '--mu-x-color-light': xColors.light
        }
      }

      values.xColor = true
    }

    Object
      .keys(values)
      .forEach(key => {
        const kebabKey = kebabCase(key)
        const value = values[key]

        delete values[key]

        if (value) {
          values[kebabKey] = value === true ? '' : value
        }
      })

    return values
  })
</script>
