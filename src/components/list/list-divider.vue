<template>
  <div class="mu-list-divider">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      <label v-if="label">{{ label }}</label>
    </slot>
  </div>
</template>

<script setup>
  import './list-divider.scss'

  defineOptions({
    name: 'MusselListDivider'
  })

  defineProps({
    icon: String,
    label: String
  })
</script>
