<template>
  <a
    class="mu-tab-button"
    :active="active || null"
    :disabled="disabled || null">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      <span v-if="buttonCaption">{{ buttonCaption }}</span>
    </slot>
  </a>
</template>

<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'MusselTabButton' })

  const props = defineProps({
    name: String,
    icon: String,
    caption: String,
    active: Boolean,
    disabled: Boolean
  })

  const buttonCaption = computed(() => props.caption || props.name)
</script>
