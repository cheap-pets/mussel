<template>
  <div class="mu-badge">
    <slot />
  </div>
</template>

<script setup>
  import './badge.scss'

  defineOptions({
    name: 'MusselBadge'
  })
</script>
