<template>
  <div>
    <h2>
      MODAL DIALOG & DRAWER
      <mu-switch
        v-model="darkMode"
        active-label="Dark"
        inactive-label="Light"
        @update:model-value="onUIModeChange" />
    </h2>

    <!-- Basic Dialogs -->
    <div class="group">
      <h3>Basic Dialogs</h3>
      <mu-button caption="Open Dialog" @click="dialogVisible = true" />
      <mu-button primary caption="Confirm Dialog" @click="confirmDialogVisible = true" />
    </div>

    <!-- Advanced Dialog -->
    <div id="div1" class="group">
      <h3>Advanced Dialog</h3>
      <mu-button caption="Open Advanced Dialog" @click="openAdvancedDialog" />
      <mu-button caption="Request Fullscreen" accent button-style="outline" @click="requestFullscreen('#div1')" />
    </div>

    <!-- Drawer Controls -->
    <div id="div2" class="group">
      <h3>Drawer</h3>
      <mu-button caption="Top" @click="openDrawer('top')" />
      <mu-button caption="Bottom" @click="openDrawer('bottom')" />
      <mu-button caption="Left" @click="openDrawer('left')" />
      <mu-button caption="Right" @click="openDrawer('right')" />
      <mu-button caption="Request Fullscreen" accent button-style="outline" @click="requestFullscreen('#div2')" />
      <mu-switch v-model="maskVisible" label="Mask Visible" />
      <mu-switch v-model="borderRadius" label="Border Radius" />
    </div>

    <!-- Basic Dialog -->
    <mu-dialog
      v-model:visible="dialogVisible"
      title="Dialog"
      width="400px">
      <p>This is a dialog content.</p>
      <template #footer>
        <mu-button caption="Close" @click="dialogVisible = false" />
      </template>
    </mu-dialog>

    <!-- Confirm Dialog -->
    <mu-dialog
      v-model:visible="confirmDialogVisible"
      title="Confirm"
      width="400px">
      <p>Are you sure to continue?</p>
      <template #footer>
        <mu-button caption="Cancel" @click="confirmDialogVisible = false" />
        <mu-button primary caption="OK" @click="confirmDialogVisible = false" />
      </template>
    </mu-dialog>

    <!-- Advanced Dialog -->
    <mu-dialog
      id="advancedDialog"
      v-model:visible="advancedDialogVisible"
      maximize-button
      maximize-to-fullscreen
      title="Advanced Modal Dialog"
      width="800"
      height="600"
      easy-hide
      moveable
      keep-position
      :lazy="false"
      :icon="{ icon: 'box', style: 'color: var(--mu-accent-color)' }"
      :buttons="['-', 'Find', ' ', '#CANCEL', '#OK']"
      @update:visible="(...args) => onDialogVisibleChange('advancedDialog', ...args)"
      @button-click="onButtonClick">
      <template #header-append>
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
      <div v-mu-scrollbar class="mu-dialog_body mu-bg-strong" style="padding: 24px;">
        <div style="height: 1000px; font-style: italic; font-size: 16px;">
          A long time ago in a galaxy far, far away…
        </div>
      </div>
      <template #footer-prepend>
        <mu-input placeholder="where's your money?" />
      </template>
    </mu-dialog>

    <!-- Drawer -->
    <mu-drawer
      v-model:visible="drawerVisible"
      :position="drawerPosition"
      :mask="maskVisible"
      :border-radius="borderRadius"
      style="padding: 16px;"
      width="50%"
      easy-hide>
      <label>I am a {{ drawerPosition }} drawer.</label>
      <p>Drawer content goes here.</p>
    </mu-drawer>
  </div>
</template>

<script setup>
  import { ref, getCurrentInstance } from 'vue'

  const darkMode = ref(false)
  const dialogVisible = ref(false)
  const confirmDialogVisible = ref(false)
  const advancedDialogVisible = ref(false)
  const drawerVisible = ref(false)
  const drawerPosition = ref('left')
  const maskVisible = ref(true)
  const borderRadius = ref(true)

  const { proxy } = getCurrentInstance()

  function openAdvancedDialog () {
    advancedDialogVisible.value = true
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
    }
  }

  function onUIModeChange (v) {
    document.querySelector('.mu-root').classList.toggle('mu-dark')
  }
</script>
