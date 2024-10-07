<template>
  <a :class="['mu-tool-button', data.cls]" :icon="icon" v-html="data.svg" />
</template>

<script setup>
  import './tool-button.scss'

  import { useIcon } from '../icon/icon'

  defineOptions({ name: 'MusselToolButton' })

  const props = defineProps({ icon: String })
  const data = useIcon(props).data
</script>
