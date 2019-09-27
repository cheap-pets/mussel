<template>
  <div :size="sizeAttr" :style="style">
    <slot />
  </div>
</template>

<script>
  import BaseFlexItem from './base-flex-item'

  export default {
    name: 'MusselFlexItem',
    extends: BaseFlexItem
  }
</script>
