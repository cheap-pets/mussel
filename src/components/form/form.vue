<template>
  <div
    class="mu-flex-box mu-form"
    :form-style="formStyle"
    :cellpadding="cellpadding">
    <slot />
  </div>
</template>

<script>
  import FlexBox from '../layout/flex-box.vue'

  export default {
    name: 'MusselForm',
    extends: FlexBox,
    provide () {
      return {
        form: this
      }
    },
    props: {
      layout: {
        type: String,
        default: 'flow',
        validator (value) {
          return ['flow', 'column', 'row'].indexOf(value) !== -1
        }
      },
      formStyle: {
        type: String,
        default: 'normal',
        validator (value) {
          return ['normal', 'table'].indexOf(value) !== -1
        }
      },
      cellpadding: {
        type: Boolean,
        default () {
          return this.formStyle !== 'table'
        }
      },
      labelWidth: {
        type: String,
        default: '75px'
      },
      labelAlign: String
    }
  }
</script>
