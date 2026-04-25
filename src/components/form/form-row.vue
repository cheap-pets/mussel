<template>
  <div class="mu-form-row">
    <slot />
  </div>
</template>

<script setup>
  import './form-row.scss'

  defineOptions({ name: 'MusselFormRow' })
</script>
