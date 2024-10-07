<!-- eslint-disable vue/no-v-text-v-html-on-component -->

<template>
  <component
    :is="componentTag"
    :class="['mu-icon', data.cls]"
    :icon="icon"
    v-html="data.svg" />
</template>

<script setup>
  import './icon.scss'

  import { computed } from 'vue'
  import { useIcon } from './icon'

  defineOptions({ name: 'MusselIcon' })

  const props = defineProps({ icon: String, tag: String })
  const data = useIcon(props).data

  const componentTag = computed(() => props.tag === 'a' ? 'a' : 'span')
</script>
