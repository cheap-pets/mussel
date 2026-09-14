<template>
  <!-- v-html 必须落在静态元素上：<component :is> 上的 v-html 在 SSR 渲染时会丢失 -->
  <a
    v-if="tag === 'a'"
    :class="['mu-icon', data.cls]"
    :icon="icon"
    :animation="animation || data.animation"
    v-html="data.svg" />
  <span
    v-else
    :class="['mu-icon', data.cls]"
    :icon="icon"
    :animation="animation || data.animation"
    v-html="data.svg" />
</template>

<script setup>
  import './icon.scss'

  import { useIcon } from './icon'

  defineOptions({ name: 'MusselIcon' })

  const props = defineProps({ tag: String, icon: String, animation: String })
  const data = useIcon(props).data
</script>
