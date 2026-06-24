<template>
  <div :class="cls">
    <slot />
  </div>
</template>

<script>
  import FlexBox from './flex-box.js'

  export default {
    name: 'MusselHBox',
    extends: FlexBox,
    direction: 'row'
  }
</script>
