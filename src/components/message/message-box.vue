<template>
  <mu-dialog
    ref="dialog"
    v-model:visible="visible"
    :buttons="buttons" :easy-hide="easyHide"
    class="mu-message-box" mask-class="mu-message-mask"
    @button-click="onButtonClick" @update:visible="onVisibleChange">
    <mu-message v-bind="{ icon, title, message, type }" />
  </mu-dialog>
</template>

<script setup>
  import './message-box.scss'

  import MuMessage from './message.vue'

  import { ref, inject } from 'vue'

  const props = defineProps({
    icon: null,
    type: String,
    title: String,
    message: String,
    buttons: Array,
    callback: null
  })

  const { messageBox: options = {} } = inject('$mussel').options
  const { easyHide = true } = options

  const dialog = ref()
  const visible = ref(true)

  function onButtonClick (btn) {
    dialog.value.hide('button-click', btn)
  }

  function onVisibleChange (v, action, trigger) {
    if (!v) props.callback?.(trigger)
  }
</script>
