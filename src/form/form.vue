<template>
  <div class="mu-flex-box mu-form" :cellpadding="cellpadding">
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
      cellpadding: {
        type: Boolean,
        default: true
      },
      labelWidth: {
        type: String,
        default: '65px'
      },
      labelAlign: String
    },
    computed: {
      flexDirection () {
        return 'column'
      }
    }
  }
</script>
