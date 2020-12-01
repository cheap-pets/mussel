<template>
  <mu-editor-wrapper class="mu-button-editor" />
</template>

<script>
  import BaseEditor from './base-editor'

  export default {
    name: 'MusselButtonEditor',
    extends: BaseEditor,
    props: {
      icon: {
        type: String,
        default: 'ellipsis'
      }
    }
  }
</script>
