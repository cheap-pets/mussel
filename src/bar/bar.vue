<template>
  <h-box class="mu-bar" align-items="center">
    <slot />
  </h-box>
</template>

<script>
  import HBox from '../layout/flex-h-box'
  export default {
    name: 'MusselBar',
    components: {
      HBox
    }
  }
</script>

<style lang="postcss">
  .mu-bar {
    & > * {
      margin-right: $(unitSpacingSizePx)px;

      &:last-child {
        margin-right: 0;
      }
    }
  }
  .mu-bar-collapse {

  }
</style>
