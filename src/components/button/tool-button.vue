<template>
  <a
    :class="['mu-tool-button', danger && 'mu-tool-button--danger', iconData.cls]"
    :icon="icon"
    :size="size"
    :active="active || null"
    :animation="animation || iconData.animation"
    @click="onClick"
    v-html="iconData.svg" />
</template>

<script setup>
  import './tool-button.scss'

  import { useIcon } from '../icon/icon'

  defineOptions({ name: 'MusselToolButton' })

  const active = defineModel('active', { type: Boolean })

  const props = defineProps({
    icon: String,
    danger: Boolean,
    toggle: Boolean,
    animation: String,
    size: {
      type: String,
      validator: v => ['small', 'normal', 'large'].includes(v)
    }
  })

  const iconData = useIcon(props).data

  function onClick () {
    if (props.toggle) active.value = !active.value
  }
</script>
