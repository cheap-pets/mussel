<template>
  <demo-page path="overlay/dialog">
    <demo-section
      title="基础用法"
      note="点击按钮打开对话框；dismissible 开启后 ESC 或点击遮罩关闭，不传时只能通过关闭按钮或程序化关闭"
      :code="basicCode"
      vertical>
      <mu-button caption="Open Dialog" color="primary" @click="basicVisible = true" />
    </demo-section>

    <demo-section
      title="按钮与回调"
      note="打开后点击按钮区：buttons 数组配置按钮（#CANCEL / #OK 为预设），button-click 事件返回所点按钮，OK 通过程序化 hide 关闭"
      vertical>
      <div class="demo-row">
        <mu-button caption="Buttons Dialog" @click="buttonsVisible = true" />
        <span class="demo-log">最近点击：{{ lastButton }}</span>
      </div>
    </demo-section>

    <demo-section
      title="表单嵌套与插槽"
      note="打开后查看：#header 放搜索框与下拉按钮，#footer 放输入框，body 超高时 body-scrollbar 内部滚动"
      vertical>
      <mu-button caption="Slots Dialog" @click="slotsVisible = true" />
    </demo-section>

    <demo-section
      title="可调整尺寸与最大化"
      note="打开后拖动四边或四角调整大小、拖动标题栏移动位置；标题栏按钮最大化（maximize-to-fullscreen 时进入浏览器全屏）"
      vertical>
      <div class="demo-row">
        <mu-button caption="Resizable Dialog" @click="resizableVisible = true" />
        <mu-button caption="Fullscreen Maximize" @click="fullscreenVisible = true" />
      </div>
    </demo-section>

    <demo-section
      title="容器内对话框"
      note="点击按钮打开；container 指定宿主元素，遮罩与对话框只覆盖容器区域"
      vertical>
      <div class="demo-container-area">
        <mu-button caption="Open In Container" @click="containerVisible = true" />
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="逐个打开对比：dismissible 限定的关闭途径（仅 ESC / 仅遮罩 / 均不可）；dispose-on-hide 关闭即销毁重建；hide 事件触发记入日志"
      regression
      vertical>
      <div class="demo-row">
        <mu-button caption="仅 ESC 关闭" @click="escOnlyVisible = true" />
        <mu-button caption="仅遮罩关闭" @click="maskOnlyVisible = true" />
        <mu-button caption="不可 Dismiss" @click="lockedVisible = true" />
        <mu-button caption="Dispose On Hide" @click="disposeVisible = true" />
      </div>
      <div class="demo-log demo-log--block">{{ eventLog || '（暂无事件）' }}</div>
    </demo-section>

    <!-- 基础 -->
    <mu-dialog
      v-model:visible="basicVisible"
      title="Basic Dialog"
      width="480px"
      dismissible>
      <template #body>
        <p>最简对话框：标题 + 内容 + 关闭按钮。ESC 或点击遮罩关闭。</p>
      </template>
    </mu-dialog>

    <!-- 按钮与回调 -->
    <mu-dialog
      ref="buttonsDialogRef"
      v-model:visible="buttonsVisible"
      title="Confirm Action"
      width="480px"
      :buttons="['Find', '#CANCEL', '#OK']"
      @button-click="onButtonClick">
      <template #body>
        <p>确认执行该操作吗？点击 OK 由回调关闭对话框。</p>
      </template>
    </mu-dialog>

    <!-- 表单嵌套与插槽 -->
    <mu-dialog
      v-model:visible="slotsVisible"
      title="Slots Dialog"
      width="720px"
      height="480px"
      dismissible
      keep-position
      body-scrollbar
      body-class="mu-bg-strong p-3x"
      :buttons="['#CANCEL', '#OK']">
      <template #header>
        <mu-search-input
          input-style="solid"
          round
          placeholder="find your money"
          @update:model-value="logEvent(`header 搜索：${$event}`)" />
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
      <template #body>
        <div style="height: 800px;">
          <p>body 内容超高时由 body-scrollbar 内部滚动。</p>
          <p>footer 插槽放了输入框，可正常聚焦输入。</p>
        </div>
      </template>
      <template #footer>
        <mu-input placeholder="where's your money?" />
      </template>
    </mu-dialog>

    <!-- 可调整尺寸 -->
    <mu-dialog
      v-model:visible="resizableVisible"
      title="Resizable Dialog"
      width="50%"
      height="360px"
      resizable
      dismissible
      maximize-button
      keep-position>
      <template #body>
        <p>拖动四边或四角可调整大小；拖动标题栏可移动。</p>
      </template>
    </mu-dialog>

    <!-- 全屏最大化 -->
    <mu-dialog
      v-model:visible="fullscreenVisible"
      title="Fullscreen Maximize Dialog"
      width="50%"
      height="360px"
      resizable
      dismissible
      maximize-button
      maximize-to-fullscreen>
      <template #body>
        <p>点击标题栏最大化按钮将进入浏览器全屏。</p>
      </template>
    </mu-dialog>

    <!-- 容器内 -->
    <mu-dialog
      v-model:visible="containerVisible"
      title="Container Dialog"
      width="60%"
      height="60%"
      container=".demo-container-area"
      dismissible>
      <template #body>
        <p>遮罩只覆盖下方容器区域。</p>
      </template>
    </mu-dialog>

    <!-- 回归 -->
    <mu-dialog
      v-model:visible="escOnlyVisible"
      title="ESC Only"
      width="480px"
      dismissible="esc">
      <template #body>
        <p>dismissible=&quot;esc&quot;：点击遮罩不关闭，按 ESC 关闭。</p>
      </template>
    </mu-dialog>
    <mu-dialog
      v-model:visible="maskOnlyVisible"
      title="Mask Only"
      width="480px"
      dismissible="mask">
      <template #body>
        <p>dismissible=&quot;mask&quot;：按 ESC 不关闭，点击遮罩关闭。</p>
      </template>
    </mu-dialog>
    <mu-dialog
      v-model:visible="lockedVisible"
      title="Locked Dialog"
      width="480px"
      :dismissible="false"
      :buttons="['#OK']"
      @button-click="lockedVisible = false">
      <template #body>
        <p>dismissible 为 false：只能通过按钮关闭。</p>
      </template>
    </mu-dialog>
    <mu-dialog
      v-model:visible="disposeVisible"
      title="Dispose On Hide"
      width="480px"
      dismissible
      dispose-on-hide
      @show="logEvent('dispose dialog: show（重新挂载）')"
      @hide="logEvent('dispose dialog: hide（已销毁）')">
      <template #body>
        <p>dispose-on-hide：关闭后销毁 DOM，再次打开重新挂载。</p>
      </template>
    </mu-dialog>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-dialog
  v-model:visible="visible"
  title="Basic Dialog"
  width="480px"
  dismissible>
  <template #body>
    <p>对话框内容</p>
  </template>
</mu-dialog>`

  const buttonsDialogRef = ref()
  const basicVisible = ref(false)
  const buttonsVisible = ref(false)
  const slotsVisible = ref(false)
  const resizableVisible = ref(false)
  const fullscreenVisible = ref(false)
  const containerVisible = ref(false)
  const escOnlyVisible = ref(false)
  const maskOnlyVisible = ref(false)
  const lockedVisible = ref(false)
  const disposeVisible = ref(false)

  const lastButton = ref('无')
  const eventLog = ref('')

  function onButtonClick (button) {
    lastButton.value = button.name
    logEvent(`button-click: ${button.name}`)

    if (button.name === 'Find') {
      logEvent('Find 按钮不关闭，做业务处理')
    } else if (button.name === 'OK') {
      buttonsDialogRef.value?.hide()
    }
  }

  function logEvent (text) {
    eventLog.value = `[${new Date().toLocaleTimeString()}] ${text}`
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
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--mu-border-color);
    border-radius: 4px;
    height: 260px;
  }
</style>
