<template>
  <mu-dialog
    ref="dialog"
    v-model:visible="visible"
    class="mu-message-box"
    mask-class="mu-message-mask"
    body-class="py-1x px-2x"
    body-scrollbar
    :icon="icon && { icon, class: iconClass }"
    :title="title"
    :buttons="buttons"
    :dismissible="dismissible"
    @button-click="onButtonClick"
    @update:visible="onVisibleChange">
    <template #body>
      <div class="mu-message-box__message px-4x" v-html="html" />
    </template>
  </mu-dialog>
</template>

<script setup>
  import './message-box.scss'

  import { shallowRef, computed, inject } from 'vue'
  import { sanitizeHTML } from '@/utils/dom'

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

  const iconClass = computed(() => ['WARN', 'ERROR'].includes(props.type) ? 'text-danger' : 'text-primary')
  const html = computed(() => sanitizeHTML(props.message))

  function onButtonClick (btn) {
    dialog.value.hide(btn.name)
  }

  function onVisibleChange (v, trigger) {
    if (!v) props.callback?.(trigger)
  }
</script>
