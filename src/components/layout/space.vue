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
