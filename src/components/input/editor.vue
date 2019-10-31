<template>
  <mu-button-editor-wrapper />
</template>

<script>
  import BaseButtonEditor from './base-button-editor'

  export default {
    name: 'MusselEditor',
    extends: BaseButtonEditor,
    props: {
      iconClickable: {
        type: Boolean,
        default: false
      }
    }
  }
</script>
