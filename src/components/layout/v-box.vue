<template>
  <div :class="cls">
    <slot />
  </div>
</template>

<script>
  import FlexBox from './flex-box.js'

  export default {
    name: 'MusselVBox',
    extends: FlexBox,
    direction: 'col'
  }
</script>
