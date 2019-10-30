<template>
  <h-box class="mu-bar" align-items="center">
    <slot />
  </h-box>
</template>

<script>
  import './bar.pcss'
  import HBox from '../layout/flex-h-box'

  export default {
    name: 'MusselBar',
    components: {
      HBox
    }
  }
</script>
