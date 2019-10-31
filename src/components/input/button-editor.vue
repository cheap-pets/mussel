<template>
  <mu-button-editor-wrapper />
</template>

<script>
  import BaseButtonEditor from './base-button-editor'

  export default {
    name: 'MusselButtonEditor',
    extends: BaseButtonEditor,
    props: {
      icon: {
        type: String,
        default: 'ellipsis'
      }
    }
  }
</script>
