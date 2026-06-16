<template>
  <div>
    <h2>
      MODAL DIALOG & DRAWER
      <theme-switch />
    </h2>

    <mu-button class="m-2x" caption="Fullscreen" @click="requestFullscreen('#div1')" />

    <div id="div1" class="px-2x">
      <h3 class="my-2x">
        Dialog
      </h3>
      <mu-button caption="Open Dialog" @click="openDialog" />
      <h3 class="flex items-center gap-1x mt-2x">
        Drawer
        <mu-switch v-model="maskVisible" label="Mask Visible" />
        <mu-switch v-model="rounded" label="Rounded Border" />
      </h3>
      <div class="flex gap-1x mt-2x">
        <mu-button caption="Top" @click="openDrawer('top')" />
        <mu-button caption="Bottom" @click="openDrawer('bottom')" />
        <mu-button caption="Left" @click="openDrawer('left')" />
        <mu-button caption="Right" @click="openDrawer('right')" />
      </div>
    </div>

    <!-- Dialog -->
    <my-dialog ref="myDialogRef" />

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
  import { ref } from 'vue'

  import ThemeSwitch from '../common/theme-switch.vue'
  import MyDialog from './my-dialog.vue'

  const drawerVisible = ref(false)
  const drawerPosition = ref('left')
  const maskVisible = ref(true)
  const rounded = ref(true)

  const myDialogRef = ref()

  function openDialog () {
    myDialogRef.value?.show('A long time ago in a galaxy far, far away…')
  }

  function openDrawer (position) {
    drawerPosition.value = position
    drawerVisible.value = true
  }

  function requestFullscreen (selector) {
    document.querySelector(selector).requestFullscreen()
  }

</script>
