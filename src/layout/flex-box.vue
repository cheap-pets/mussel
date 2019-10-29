<template>
  <div class="mu-flex-box">
    <slot />
  </div>
</template>

<script>
  import FlexItem from './flex-item.vue'

  export default {
    name: 'MusselFlexBox',
    extends: FlexItem,
    provide () {
      return {
        parentLayout: this.flexLayout
      }
    },
    props: {
      flexWrap: Boolean,
      layout: {
        type: String,
        validator (value) {
          return ['flow', 'column', 'row'].indexOf(value) !== -1
        }
      },
      direction: {
        type: String,
        default: 'row',
        validator (value) {
          return ['row', 'column'].indexOf(value) !== -1
        }
      }
    },
    computed: {
      flexLayout () {
        const v = this.layout ||
          this.$el?.getAttribute('layout') ||
          this.direction ||
          this.$el?.getAttribute('direction') ||
          'row'
        return ['flow', 'column', 'row'].indexOf(v) !== -1 ? v : 'row'
      },
      flexDirection () {
        return this.flexLayout === 'column' ? 'column' : 'row'
      }
    },
    watch: {
      layout (v) {
        this.setBoxAttributes()
      }
    },
    mounted () {
      this.setBoxAttributes()
    },
    methods: {
      setBoxAttributes () {
        const { $el, flexLayout, flexDirection, flexWrap } = this
        if ($el) {
          $el.setAttribute('direction', flexDirection)
          if (flexLayout === 'flow' || flexWrap) {
            $el.setAttribute('flex-wrap', '')
          }
        }
      }
    }
  }
</script>
