<template>
  <div class="mu-scroll-box mu-scrollbar">
    <div class="mu-scrollbar_tracks" />
    <slot />
  </div>
</template>

<script>
  import { attach, detach } from 'mussel-scrollbar'

  export default {
    name: 'MusselScrollBox',

    mounted () {
      attach(this.$el)
    },
    beforeUnmount () {
      detach(this.$el)
    }
  }
</script>
