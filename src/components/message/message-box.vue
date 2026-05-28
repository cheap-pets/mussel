<template>
  <mu-dialog
    ref="dialog"
    v-model:visible="visible"
    class="mu-message-box"
    mask-class="mu-message-mask"
    :buttons="buttons"
    :dismissible="dismissible"
    @button-click="onButtonClick"
    @update:visible="onVisibleChange">
    <mu-message v-bind="{ icon, title, message, type }" />
  </mu-dialog>
</template>

<script setup>
  import './message-box.scss'

  import MuMessage from './message.vue'

  import { shallowRef, inject } from 'vue'

  const props = defineProps({
    icon: null,
    type: String,
    title: String,
    message: String,
    buttons: Array,
    callback: null
  })

  const { messageBox: options = {} } = inject('$mussel').options
  const { dismissible = true } = options

  const dialog = shallowRef()
  const visible = shallowRef(true)

  function onButtonClick (btn) {
    dialog.value.hide(btn.name)
  }

  function onVisibleChange (v, trigger) {
    if (!v) props.callback?.(trigger)
  }
</script>
