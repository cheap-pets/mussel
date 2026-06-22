<template>
  <a
    class="mu-button mu-icon mu-icon-button"
    :class="[colorClass, extraClass]"
    :disabled="isDisabled"
    :active="active || null"
    :animation="animation || iconData.animation"
    @click="onClick"
    v-html="iconData.svg" />
</template>

<script setup>
  import { useIcon } from '../icon/icon'
  import { buttonProps, useButton } from './button'

  defineOptions({ name: 'MusselIconButton' })

  const active = defineModel('active', { type: Boolean })
  const props = defineProps({ ...buttonProps, icon: String, animation: String })

  const { data: iconData } = useIcon(props)
  const { isDisabled, colorClass, extraClass } = useButton(props)

  function onClick () {
    if (props.toggle) active.value = !active.value
  }
</script>
