<template>
  <div class="mu-toolbar mu-bar">
    <slot />
  </div>
</template>

<script setup>
  import './toolbar.scss'

  import { toolbarProps, useToolbar } from './toolbar.js'

  defineOptions({ name: 'MusselToolbar' })

  const props = defineProps({ ...toolbarProps })

  useToolbar(props)
</script>
