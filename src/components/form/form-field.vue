<template>
  <div class="mu-form-field mu-flex-box" :cellpadding="cellpadding">
    <label v-if="label" class="mu-text-ellipsis" :style="labelStyle">
      {{ label }}
    </label>
    <slot>
      <span v-if="value || value === 0">{{ value }}</span>
    </slot>
  </div>
</template>

<script>
  import FlexItem from '../layout/flex-item.vue'

  export default {
    name: 'MusselFormField',
    extends: FlexItem,
    inject: {
      form: {
        default: null
      }
    },
    props: {
      label: String,
      labelWidth: String,
      labelAlign: {
        type: String,
        validator (value) {
          return ['right', 'left'].indexOf(value) !== -1
        }
      },
      cellpadding: {
        type: Boolean,
        default () {
          return this.form.formStyle !== 'table'
        }
      },
      value: null
    },
    computed: {
      sizeValue () {
        const layout = this.parentLayout || 'flow'
        return this.size ||
          this.$el?.getAttribute('size') ||
          (
            layout === 'flow'
              ? '100%'
              : undefined
          )
      },
      labelStyle () {
        const w = this.labelWidth || this.form.labelWidth
        return {
          width: w,
          minWidth: w,
          textAlign: this.labelAlign || this.form.labelAlign || 'right'
        }
      }
    }
  }
</script>
