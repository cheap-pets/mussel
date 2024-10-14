<template>
  <div class="mu-toolbar mu-bar">
    <slot />
  </div>
</template>

<script setup>
  import './toolbar.scss'
  import { provide } from 'vue'

  defineOptions({ name: 'MusselToolbar' })

  provide('defaultButtonOptions', {
    buttonStyle: 'text'
  })
</script>
