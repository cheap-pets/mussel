<template>
  <div class="mu-space" :style="{ flex: flexStyle }" />
</template>

<script>
  import FlexItem from './flex-item.vue'

  export default {
    name: 'MusselSpace',
    extends: FlexItem,
    computed: {
      flexStyle () {
        return this.size ? 'none' : undefined
      }
    }
  }
</script>

<style lang="postcss">
  .mu-space {
    flex: 1 1 0%;
  }
  [direction="row"][flex-wrap] > .mu-space {
    flex: none;
    width: 100%;
  }
</style>
