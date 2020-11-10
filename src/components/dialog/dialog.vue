<template>
  <mu-dialog-wrapper v-if="rendered">
    <slot />
    <template #header>
      <slot name="header" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </mu-dialog-wrapper>
</template>

<script>
  import BaseDialog from './base-dialog.vue'

  export default {
    name: 'MusselDialog',
    extends: BaseDialog
  }
</script>
