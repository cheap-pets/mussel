<template>
  <div
    class="mu-flex-box mu-form"
    :cellpadding="cellpadding">
    <slot />
  </div>
</template>

<script>
  import './form.pcss'
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
      cellpadding: {
        type: Boolean,
        default: true
      },
      labelWidth: {
        type: String,
        default: '75px'
      },
      labelAlign: String
    }
  }
</script>
