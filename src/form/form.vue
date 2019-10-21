<template>
  <div
    class="mu-flex-box mu-form"
    :flex-wrap="flexWrap"
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
      cellpadding: {
        type: Boolean,
        default: true
      },
      labelWidth: {
        type: String,
        default: '75px'
      },
      labelAlign: String
    },
    computed: {
      flexWrap () {
        return this.layout === 'flow'
      },
      flexDirection () {
        return this.layout === 'column' ? 'column' : 'row'
      }
    }
  }
</script>

<style lang="postcss">

</style>
