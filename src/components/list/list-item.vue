<template>
  <component :is="componentTag" class="mu-list-item">
    <slot>
      <mu-icon v-if="icon != null" class="mu-list-item_icon" :icon="icon" />
      <label v-if="label" class="mu-list-item_label">{{ label }}</label>
    </slot>
  </component>
</template>

<script setup>
  import './list-item.scss'

  import { computed } from 'vue'

  defineOptions({
    name: 'MusselListItem'
  })

  const props = defineProps({
    tag: String,
    icon: String,
    label: String
  })

  const componentTag = computed(() => props.tag === 'a' ? 'a' : 'div')
</script>
