<template>
  <div class="flex" :class="cls">
    <slot />
  </div>
</template>

<script>
  import FlexBox from './flex-box.vue'

  export default {
    extends: FlexBox,
    props: {
      direction: {
        type: String,
        default: 'col',
        validator: v => ['col', 'col-reverse'].includes(v)
      }
    }
  }
</script>
