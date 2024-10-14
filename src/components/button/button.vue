<template>
  <button ref="thisEl" class="mu-button" :type="type" v-bind="attrs">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />{{ caption }}
    </slot>
  </button>
</template>

<script setup>
  import './button.scss'

  import { ref, isRef, inject, computed } from 'vue'
  import { getComputedXColor } from '@/theme'

  import { resolveAttrs } from '@/utils/vue'
  import { pickBy, defaults } from '@/utils/object'
  import { generateAdjacentColors } from '@/utils/color'

  defineOptions({ name: 'MusselButton' })

  const props = defineProps({
    icon: String,
    caption: String,
    active: Boolean,
    small: Boolean,
    large: Boolean,
    round: Boolean,
    disabled: Boolean,
    primary: Boolean,
    danger: Boolean,
    accent: Boolean,
    xColor: [Boolean, String],
    type: { type: String, default: 'button' },
    buttonStyle: {
      type: String,
      validator: v => ['normal', 'outline', 'text', 'link'].includes(v)
    }
  })

  const thisEl = ref()

  const forcedButtonOptions = inject('forcedButtonOptions', {})
  const defaultButtonOptions = inject('defaultButtonOptions', {})

  const attrs = computed(() => {
    if (!thisEl.value) return

    const values = defaults(
      {
        active: props.active,
        ...(
          isRef(forcedButtonOptions)
            ? forcedButtonOptions.value
            : forcedButtonOptions
        )
      },
      pickBy(props, (key, value) =>
        !['type', 'icon', 'caption', 'active'].includes(key) &&
        value !== false
      ),
      (
        isRef(defaultButtonOptions)
          ? defaultButtonOptions.value
          : defaultButtonOptions
      )
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

    return resolveAttrs(values)
  })
</script>
