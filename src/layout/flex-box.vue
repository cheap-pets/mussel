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

<style lang="postcss">
  .mu-flex-box {
    position: relative;
    display: flex;
    align-items: stretch;

    &[direction="column"] {
      flex-direction: column;
    }

    &[direction="row-reverse"] {
      flex-direction: row-reverse;
    }

    &[direction="column-reverse"] {
      flex-direction: column-reverse;
    }

    &[inline] {
      display: inline-flex;
    }

    &[flex-wrap] {
      flex-wrap: wrap;
      align-content: flex-start;
    }

    &[justify-content="center"] {
      justify-content: center;
    }

    &[align-items="flex-start"] {
      align-items: flex-start;
    }

    &[align-items="center"] {
      align-items: center;
    }

    &[align-items="stretch"] {
      align-items: stretch;
    }

    &[flex-center] {
      align-items: center;
      justify-content: center;
    }

    &[bordered], & > [bordered] {
      border: 1px solid #ddd;
    }

    &[itemspacing],
    &[cellpadding] {
      padding: $(unitSpacingSizePx)px;
    }

    &[itemspacing] > *,
    & [cellspacing] {
      margin: $(unitSpacingSizePx)px;
    }

    & > * {
      position: relative;
      box-sizing: border-box;
    }

    & > [flex-auto] {
      flex: 1 1 auto !important;
    }

    & > [flex-none] {
      flex: 0 0 none !important;
    }
    /*
    &[direction="column"] > [size] {
      height: 1px;
    }
    &:not([direction="column"]) > [size] {
      width: 1px;
    }
    */
    & > [size="auto"] {
      flex: 1 1 auto;
    }
    @for $i from 1 to 8 {
      & > [size="$i"] {
        flex: $i $i $(i)px;
      }
    }
  }
</style>
