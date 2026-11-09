<template>
  <a
    :class="[
      'mu-tab-button',
      size === 'small' && 'mu-tab-button--small',
      active && 'mu-tab-button--active',
      disabled && 'mu-tab-button--disabled'
    ]"
    :title="title">
    <mu-icon v-if="icon" :icon="icon" />
    <span v-if="buttonCaption">{{ buttonCaption }}</span>
  </a>
</template>

<script setup>
  import { inject, computed } from 'vue'

  defineOptions({ name: 'MusselTabButton' })

  const props = defineProps({
    name: String,
    icon: String,
    caption: String,
    title: String,
    active: Boolean,
    disabled: Boolean
  })

  const size = inject('toolSize', null)
  const buttonCaption = computed(() => props.caption || props.name)
</script>
