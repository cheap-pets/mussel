<template>
  <div class="mu-form">
    <slot />
  </div>
</template>

<script setup>
  import './form.scss'

  import { provide } from 'vue'

  defineOptions({ name: 'MusselForm' })

  const props = defineProps({
    labelWidth: String,
    labelAlign: String
  })

  provide('form', props)

</script>
