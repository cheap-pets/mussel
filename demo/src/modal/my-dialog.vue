<template>
  <mu-dialog
    ref="dialogRef"
    v-model:visible="visible"
    class="my-dialog"
    title="Modal Dialog"
    dismissible
    dispose-on-hide
    keep-position
    maximize-button
    maximize-to-fullscreen
    body-scrollbar
    body-class="mu-bg-strong p-3x"
    :lazy="false"
    :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
    @update:visible="onVisibleChange"
    @button-click="onButtonClick">
    <template #header>
      <mu-search-input
        input-style="solid" round placeholder="find your money"
        @update:model-value="console.log($event)" />
      <mu-dropdown-button
        class="mu-icon-button"
        button-style="text"
        dropdown-icon="dots"
        :dropdown-items="[
          { label: 'Open Recent Files' },
          { label: 'New File' },
          '-',
          { label: 'Exit' }
        ]" />
    </template>
    <div style="height: 1000px; font-size: 16px; font-style: italic;">
      {{ content }}
    </div>
    <template #footer>
      <mu-input placeholder="where's your money?" />
    </template>
  </mu-dialog>
</template>

<script setup>
  import { ref, inject } from 'vue'

  const dialogRef = ref()
  const content = ref('')
  const visible = ref(false)

  const { messageBox } = inject('$mussel')

  function show (data) {
    content.value = data
    visible.value = true
  }

  function onVisibleChange (value, trigger) {
    console.log('dialog visible change：', value, trigger)
  }

  function onButtonClick (button) {
    console.log(button.name)

    if (button.name === 'Find') {
      messageBox.alert('Cannot find any !')
    } else if (button.name === 'OK') {
      visible.value = false
    }
  }

  defineExpose({ show })
</script>

<style>
  .my-dialog {
    width: 800px;
    min-width: 640px;
    max-width: 90%;
    height: 600px;
    min-height: 480px;
    max-height: 90%;
  }
</style>
