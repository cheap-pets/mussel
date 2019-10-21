<template>
  <div class="mu-form-field mu-flex-box" :cellpadding="cellpadding">
    <label v-if="label" class="mu-text-ellipsis" :style="labelStyle">
      {{ label }}
    </label>
    <slot />
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
        default: true
      }
    },
    computed: {
      sizeValue () {
        console.log(this.size)
        return this.size ||
          this.$el?.getAttribute('size') ||
          ((this.parentDirection === 'row') ? 'auto' : undefined)
      },
      labelStyle () {
        return {
          width: this.labelWidth || this.form.labelWidth,
          textAlign: this.labelAlign || this.form.labelAlign || 'right'
        }
      }
    }
  }
</script>

<style lang="postcss">
  .mu-form-field {
    min-width: 80px;

    & label {
      display: inline-block;
      line-height: $(inputHeightPx)px;
      margin-right: $(unitSpacingSizePx)px;
      font-size: $formLabelSize;
    }
    & > .mu-editor,
    & > .mu-input {
      flex: 1 1 auto;
      width: 10px;
    }
  }
</style>
