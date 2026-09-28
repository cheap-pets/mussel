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
      <div class="flex gap-1x">
        <mu-button caption="Open Dialog" @click="openDialog" />
        <mu-button caption="Open Resizable Dialog" @click="resizableVisible = true" />
      </div>
      <h3 class="flex items-center gap-1x mt-2x">
        Drawer
        <mu-switch v-model="maskVisible" label="Mask Visible" />
        <mu-switch v-model="rounded" label="Rounded Border" />
      </h3>
      <div class="flex gap-1x mt-1x">
        <mu-button caption="Top" @click="openDrawer('top')" />
        <mu-button caption="Bottom" @click="openDrawer('bottom')" />
        <mu-button caption="Left" @click="openDrawer('left')" />
        <mu-button caption="Right" @click="openDrawer('right')" />
        <mu-button caption="Left(Case)" @click="openDrawer('Left')" />
      </div>
      <div ref="drawerContainerEl" class="mt-2x border border-soft" style="position: relative; height: 300px">
        <mu-button class="m-1x" caption="Open In Container" @click="containerDrawerVisible = true" />
        <mu-drawer
          v-model:visible="containerDrawerVisible"
          position="right"
          width="60%"
          resizable
          dismissible
          :container="drawerContainerEl">
          <div class="flex flex-col" style="height: 100%">
            <div class="flex-none px-2x py-1x border-b border-soft text-normal">Container drawer</div>
            <mu-scroll-box class="flex-1 p-2x">
              <p v-for="i in 30" :key="i">
                line {{ i }}
              </p>
            </mu-scroll-box>
          </div>
        </mu-drawer>
      </div>
    </div>

    <!-- Dialog -->
    <my-dialog ref="myDialogRef" container="#div1" />

    <!-- Resizable dialog：视口级遮罩，50% 宽 + class 最大化（非全屏） -->
    <mu-dialog
      v-model:visible="resizableVisible"
      title="Resizable Dialog"
      width="50%"
      height="360px"
      resizable
      dismissible
      maximize-button>
      <template #body>
        <p>拖动四边或四角可调整大小；拖动标题栏可移动。</p>
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
      resizable
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

  const drawerContainerEl = ref()
  const containerDrawerVisible = ref(false)

  const myDialogRef = ref()
  const resizableVisible = ref(false)

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
