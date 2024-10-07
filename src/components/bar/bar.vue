<template>
  <div class="mu-bar">
    <slot />
  </div>
</template>

<script setup>
  import './bar.scss'

  defineOptions({ name: 'MusselBar' })
</script>
