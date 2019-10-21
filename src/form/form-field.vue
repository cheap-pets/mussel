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
        const layout = this.form?.layout || 'flow'
        const direction = this.parentDirection
        return this.size ||
          this.$el?.getAttribute('size') ||
          (
            layout === 'flow'
              ? '100%'
              : ((direction === 'row') ? 'auto' : undefined)
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

<style lang="postcss">
  .mu-form-field {
    min-width: 80px;

    & > label {
      display: inline-block;
      line-height: $(inputHeightPx)px;
      padding-right: 12px;
      font-size: $formLabelSize;

      &:before {
        position: absolute;
        right: 0;
        top: -3px;
        display: inline-block;
        visibility: hidden;
        width: 10px;
        text-align: left;
        font-weight: 500;
        color: $dangerColor;
        content: "*";
      }
    }

    &[required] > label:before {
      visibility: visible;
    }

    &[invalid] > label {
      color: $dangerColor;
    }

    & > .mu-editor,
    & > .mu-input {
      flex: 1 1 10px;
      width: 10px;
    }
  }
</style>
