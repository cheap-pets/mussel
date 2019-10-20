<template>
  <div :style="style" />
</template>

<script>
  export default {
    name: 'MusselSpace',
    inject: {
      parentDirection: {
        default: 'row'
      }
    },
    computed: {
      style () {
        return this.parentDirection === 'row'
          ? { marginRight: 'auto' }
          : { marginBottom: 'auto' }
      }
    }
  }
</script>