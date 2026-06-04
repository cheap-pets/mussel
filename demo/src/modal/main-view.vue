<template>
  <div>
    <h2>
      MODAL DIALOG & DRAWER
      <theme-switch />
    </h2>

    <!-- Dialog -->
    <div id="div1" class="group">
      <h3>Dialog</h3>
      <mu-button caption="Open Dialog" @click="openDialog" />
      <mu-button caption="Request Fullscreen" secondary button-style="outline" @click="requestFullscreen('#div1')" />
    </div>

    <!-- Drawer -->
    <div id="div2" class="group">
      <h3 class="flex items-center gap-1x">
        Drawer
        <mu-switch v-model="maskVisible" label="Mask Visible" />
        <mu-switch v-model="rounded" label="Rounded Border" />
      </h3>

      <mu-button caption="Top" @click="openDrawer('top')" />
      <mu-button caption="Bottom" @click="openDrawer('bottom')" />
      <mu-button caption="Left" @click="openDrawer('left')" />
      <mu-button caption="Right" @click="openDrawer('right')" />
      <mu-button caption="Request Fullscreen" secondary button-style="outline" @click="requestFullscreen('#div2')" />
    </div>

    <!-- Dialog -->
    <mu-dialog
      ref="myDialog"
      v-model:visible="dialogVisible"
      width="800"
      height="600"
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
      @update:visible="(...args) => onDialogVisibleChange('myDialog', ...args)"
      @button-click="onButtonClick">
      <template #header>
        <mu-input placeholder="find your money" prefix=":icon=search" input-style="solid" round />
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
        A long time ago in a galaxy far, far away…
      </div>
      <template #footer>
        <mu-input placeholder="where's your money?" />
      </template>
    </mu-dialog>

    <!-- Drawer -->
    <mu-drawer
      v-model:visible="drawerVisible"
      :position="drawerPosition"
      :mask="maskVisible"
      :rounded="rounded"
      style="padding: 16px;"
      width="50%"
      dismissible>
      <label>I am a {{ drawerPosition }} drawer.</label>
      <p>Drawer content goes here.</p>
    </mu-drawer>
  </div>
</template>

<script setup>
  import { ref, getCurrentInstance } from 'vue'
  import ThemeSwitch from '../common/theme-switch.vue'

  const dialogVisible = ref(false)
  const drawerVisible = ref(false)
  const drawerPosition = ref('left')
  const maskVisible = ref(true)
  const rounded = ref(true)

  const myDialog = ref()

  const { proxy } = getCurrentInstance()

  function openDialog () {
    dialogVisible.value = true
  }

  function openDrawer (position) {
    drawerPosition.value = position
    drawerVisible.value = true
  }

  function requestFullscreen (selector) {
    const element = document.querySelector(selector)
    if (element) {
      element.requestFullscreen()
    }
  }

  function onDialogVisibleChange (dialogName, value, trigger) {
    console.log(dialogName, value, trigger)
  }

  function onButtonClick (button) {
    if (button.name === 'Find') {
      proxy.$mussel.messageBox.alert('Cannot find any !')
    } else {
      console.log(button.name)

      if (button.name === 'OK') {
        dialogVisible.value = false
      }
    }
  }

</script>
