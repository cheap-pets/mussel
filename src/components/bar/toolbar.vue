<template>
  <div class="mu-toolbar" :class="extraClass">
    <slot />
  </div>
</template>

<script setup>

  import { toolbarProps, useToolbar } from './toolbar.js'

  defineOptions({ name: 'MusselToolbar' })

  const props = defineProps({ ...toolbarProps })
  const extraClass = useToolbar(props).toolbarClass
</script>
