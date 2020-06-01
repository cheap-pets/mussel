<template>
  <div class="mu-flex-box mu-form-row">
    <slot />
  </div>
</template>

<script>
  import FlexBox from '../layout/flex-box.vue'

  export default {
    name: 'MusselFormRow',
    extends: FlexBox
  }
</script>
