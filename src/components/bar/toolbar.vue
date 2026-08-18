<template>
  <div class="mu-toolbar">
    <slot />
  </div>
</template>

<script setup>
  import './toolbar.scss'

  import { toRef, provide } from 'vue'

  defineOptions({ name: 'MusselToolbar' })

  const props = defineProps({
    size: {
      type: String,
      validator: v => ['small', 'normal'].includes(v)
    },
    defaultButtonStyle: String
  })

  provide('toolSize', toRef(props, 'toolSize'))
  provide('defaultButtonStyle', toRef(props, 'defaultButtonStyle'))
</script>
