<template>
  <div :class="cls">
    <slot />
  </div>
</template>

<script>
  export default {
    props: {
      inline: Boolean,
      direction: {
        type: String,
        default: 'row',
        validator: v => ['row', 'row-reverse', 'col', 'col-reverse'].includes(v)
      },
      gap: {
        type: String,
        validator: v => !v || ['none', '1x', '2x', '3x', '4x'].includes(v)
      },
      alignItems: {
        type: String,
        validator: v => !v || ['center', 'start', 'end', 'baseline', 'stretch', 'flex-start', 'flex-end'].includes(v)
      },
      justifyContent: {
        type: String,
        validator: v => !v || ['start', 'end', 'left', 'right', 'baseline', 'center', 'stretch', 'flex-start', 'flex-end', 'space-around', 'space-between', 'space-evenly'].includes(v)
      },
      flexWrap: {
        type: [Boolean, String],
        validator: v => !v || [true, 'nowrap', 'wrap', 'wrap-reverse'].includes(v)
      },
      flexCenter: Boolean,
      flexReverse: Boolean
    },
    computed: {
      cls () {
        const result = [this.inline ? 'inline-flex' : 'flex']

        result.push(
          this.flexReverse && ['row', 'col'].includes(this.direction)
            ? `flex-${this.direction}-reverse`
            : `flex-${this.direction}`
        )

        if (this.gap) {
          result.push(`gap-${this.gap}`)
        }

        if (this.flexCenter) {
          result.push('flex-center')
        } else {
          if (this.alignItems) result.push(`items-${this.alignItems}`)
          if (this.justifyContent) result.push(`justify-${this.justifyContent}`)
        }

        if (this.flexWrap) {
          result.push(
            this.flexWrap === true
              ? 'flex-wrap'
              : `flex-${this.flexWrap}`
          )
        }

        return result
      }
    }
  }
</script>
