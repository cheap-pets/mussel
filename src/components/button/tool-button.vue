<template>
  <a
    :class="['mu-tool-button', iconData.cls]"
    :icon="icon"
    :active="active || null"
    @click="onClick"
    v-html="iconData.svg" />
</template>

<script setup>
  import './tool-button.scss'

  import { useIcon } from '../icon/icon'

  defineOptions({ name: 'MusselToolButton' })

  const active = defineModel('active', { type: Boolean })
  const props = defineProps({ icon: String, toggle: Boolean })

  const iconData = useIcon(props).data

  function onClick () {
    if (props.toggle) active.value = !active.value
  }
</script>
