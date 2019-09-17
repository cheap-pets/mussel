<template>
  <svg
    class="bue-svg-icon"
    viewBox="0 0 1024 1024"
    :width="size"
    :height="size">
    <path :d="d" />
  </svg>
</template>

<script>
  import d from './d'

  export default {
    props: {
      icon: {
        type: String,
        defalt: 'close'
      },
      size: {
        type: String,
        default: '1em'
      }
    },
    computed: {
      d () {
        return d[this.icon]
      }
    }
  }
</script>

<style lang="postcss">
  .bue-svg-icon {
    vertical-align: -0.15em;
  }
</style>
