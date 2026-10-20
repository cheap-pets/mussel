<template>
  <demo-page path="overlay/drawer">
    <demo-section
      title="基础用法"
      note="点击按钮分别打开四个方向的抽屉；默认底部弹出、带遮罩，ESC 或点击遮罩关闭"
      :code="basicCode"
      vertical>
      <div class="demo-row">
        <mu-button caption="Top" @click="openDrawer('top')" />
        <mu-button caption="Bottom" @click="openDrawer('bottom')" />
        <mu-button caption="Left" @click="openDrawer('left')" />
        <mu-button caption="Right" @click="openDrawer('right')" />
      </div>
    </demo-section>

    <demo-section
      title="遮罩、圆角与调整尺寸"
      note="开关控制遮罩与圆角后点击「Open」打开；抽屉开启 resizable，拖动内边可调整尺寸，关闭重开恢复属性尺寸"
      vertical>
      <div class="demo-row">
        <mu-switch v-model="maskVisible" label="Mask Visible" />
        <mu-switch v-model="rounded" label="Rounded Border" />
        <mu-button caption="Open" @click="styledVisible = true" />
      </div>
    </demo-section>

    <demo-section
      title="容器内抽屉"
      note="点击按钮打开；container 指定宿主元素，抽屉与遮罩只覆盖容器区域"
      vertical>
      <div ref="containerEl" class="demo-container-area">
        <mu-button caption="Open In Container" @click="containerVisible = true" />
        <mu-drawer
          v-model:visible="containerVisible"
          position="right"
          width="60%"
          resizable
          dismissible
          :container="containerEl">
          <div class="flex flex-col" style="height: 100%">
            <div class="flex-none px-2x py-1x border-b border-soft text-normal">Container drawer</div>
            <mu-scroll-box class="flex-1 p-2x">
              <p v-for="i in 30" :key="i">line {{ i }}</p>
            </mu-scroll-box>
          </div>
        </mu-drawer>
      </div>
    </demo-section>

    <demo-section
      title="嵌套抽屉"
      note="点击按钮打开抽屉，再点击抽屉内的按钮叠加打开第二层抽屉；逐层关闭互不影响"
      vertical>
      <mu-button caption="Open Nested" @click="nestedVisible = true" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="无遮罩抽屉打开后页面仍可交互（点击遮罩区域按钮验证）；无遮罩时仅 ESC 可关闭"
      regression
      vertical>
      <div class="demo-row">
        <mu-button caption="Open No Mask" @click="noMaskVisible = true" />
        <mu-button caption="遮罩区域按钮" @click="logBehindMask" />
      </div>
      <div class="demo-log demo-log--block">{{ eventLog || '（暂无事件）' }}</div>
    </demo-section>

    <!-- 基础 -->
    <mu-drawer
      v-model:visible="drawerVisible"
      :position="drawerPosition"
      width="50%"
      dismissible>
      <div class="p-2x">
        <p>I am a {{ drawerPosition }} drawer.</p>
        <p>Drawer content goes here.</p>
      </div>
    </mu-drawer>

    <!-- 遮罩 / 圆角 / resizable -->
    <mu-drawer
      v-model:visible="styledVisible"
      position="bottom"
      :mask="maskVisible"
      :rounded="rounded"
      width="100%"
      height="50%"
      resizable
      dismissible>
      <div class="p-2x">
        <p>mask: {{ maskVisible }}，rounded: {{ rounded }}。</p>
        <p>拖动抽屉上边缘可调整高度；关闭后重开恢复 50% 高度。</p>
      </div>
    </mu-drawer>

    <!-- 嵌套 -->
    <mu-drawer
      v-model:visible="nestedVisible"
      position="left"
      width="60%"
      dismissible>
      <div class="p-2x flex flex-col gap-1x">
        <p>第一层抽屉。</p>
        <mu-button caption="Open Second Drawer" @click="nestedInnerVisible = true" />
      </div>
    </mu-drawer>
    <mu-drawer
      v-model:visible="nestedInnerVisible"
      position="right"
      width="50%"
      dismissible>
      <div class="p-2x">
        <p>第二层抽屉，独立关闭。</p>
      </div>
    </mu-drawer>

    <!-- 无遮罩 -->
    <mu-drawer
      v-model:visible="noMaskVisible"
      position="right"
      width="320px"
      :mask="false"
      dismissible>
      <div class="p-2x">
        <p>无遮罩抽屉（mask: false）。</p>
        <p>页面仍可交互，仅 ESC 可关闭。</p>
      </div>
    </mu-drawer>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-drawer
  v-model:visible="visible"
  position="right"
  width="50%"
  dismissible>
  <div class="p-2x">抽屉内容</div>
</mu-drawer>`

  const drawerVisible = ref(false)
  const drawerPosition = ref('left')
  const maskVisible = ref(true)
  const rounded = ref(true)

  const containerEl = ref()
  const containerVisible = ref(false)

  const styledVisible = ref(false)
  const nestedVisible = ref(false)
  const nestedInnerVisible = ref(false)
  const noMaskVisible = ref(false)

  const eventLog = ref('')

  function openDrawer (position) {
    drawerPosition.value = position
    drawerVisible.value = true
  }

  function logEvent (text) {
    eventLog.value = `[${new Date().toLocaleTimeString()}] ${text}`
  }

  function logBehindMask () {
    logEvent('抽屉未挡住页面交互')
  }
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .demo-log--block {
    margin-top: 8px;
  }

  .demo-container-area {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    height: 300px;
  }
</style>
