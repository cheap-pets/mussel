<template>
  <div
    class="mu-flex-box"
    :direction="flexDirection"
    :size="sizeAttr"
    :style="style">
    <slot />
  </div>
</template>

<script>
  import FlexItem from './flex-item.vue'

  export default {
    mixins: [FlexItem],
    props: {
      direction: {
        type: String,
        default: 'row',
        validator (value) {
          return ['row', 'column'].indexOf(value) !== -1
        }
      }
    },
    computed: {
      flexDirection () {
        return this.direction
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

    &[bordered] {
      border: 1px solid #ddd;
    }

    &[itemspacing],
    &[cellpadding] {
      padding: 8px;
    }

    &[itemspacing] > *,
    & [cellspacing] {
      margin: 8px;
    }

    & > * {
      position: relative;
    }

    & > [flex-auto] {
      flex: 1 1 auto !important;
    }

    & > [flex-none] {
      flex: 0 0 none !important;
    }

    &[direction="column"] > [size] {
      height: 10px;
    }
    &:not(direction="column") > [size] {
      width: 10px;
    }
    & > [size="auto"] {
      flex-grow: 1;
    }
    @for $i from 1 to 8 {
      & > [size="$i"] {
        flex-grow: $i;
      }
    }
  }
</style>
