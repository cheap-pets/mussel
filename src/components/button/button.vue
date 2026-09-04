<template>
  <button
    type="button"
    :class="['mu-button', colorClass, extraClass]"
    :active="active || null"
    :disabled="isDisabled"
    @keydown="onKeydown"
    @click="onClick">
    <slot>
      <mu-icon v-if="icon" :icon="icon" />
      <span v-if="caption">{{ caption }}</span>
    </slot>
  </button>
</template>

<script setup>
  import { buttonProps, useButton } from './button'

  defineOptions({ name: 'MusselButton' })

  const active = defineModel('active', { type: Boolean })

  const props = defineProps({
    ...buttonProps,
    icon: String,
    caption: String
  })

  const {
    isDisabled,
    colorClass,
    extraClass
  } = useButton(props)

  function onKeydown (event) {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
    }
  }

  function onClick () {
    if (props.toggle) active.value = !active.value
  }
</script>
