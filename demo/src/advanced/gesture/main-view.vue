<template>
  <demo-page path="advanced/gesture">
    <demo-section
      title="tap / press / panmove"
      note="EventInterceptor 注册手势事件后在元素上监听 @tap（轻点）、@press（长按 500ms）、@panmove（拖动）；touch 事件类型需在触屏环境或浏览器设备模拟（DevTools Toggle device toolbar）下触发"
      :code="basicCode"
      vertical>
      <div class="demo-row">
        <div
          class="mu-bordered gesture-box"
          @tap="onTap"
          @press="onPress"
          @panmove="onPanMove">
          <div class="gesture-box__gradient" />
        </div>
        <div class="gesture-log">
          <div v-for="(log, i) in logs" :key="i" class="gesture-log__entry">{{ log }}</div>
        </div>
      </div>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="手势元素内含超高内容：panmove 拖动与容器内部滚动共存；日志最多保留 20 条，超出后丢弃最旧记录"
      regression
      vertical>
      <div class="demo-log">
        手势事件由 EventInterceptor 接管 addEventListener 实现，仅注册了 touch 拦截器的环境生效；
        桌面环境可用 Chrome DevTools 的设备模拟（Has touch）触发。
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `// mussel 的 events 模块在触屏环境自动注册手势拦截器
// （'ontouchstart' in window 时生效）
<div @tap="onTap" @press="onPress" @panmove="onPanMove">
  gesture area
</div>

// 事件对象携带手势状态
function onTap (event) {
  console.log(event.detail.gestureState)
}`

  const logs = ref([])

  function addLog (message) {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.unshift(`[${timestamp}] ${message}`)
    if (logs.value.length > 20) logs.value.pop()
  }

  function onTap (event) {
    addLog(`tap: ${JSON.stringify(event.detail.gestureState)}`)
  }

  function onPress (event) {
    addLog(`press: ${JSON.stringify(event.detail.gestureState)}`)
  }

  function onPanMove (event) {
    addLog(`panmove: totalX = ${event.detail.gestureState.totalX}`)
  }
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }

  .gesture-box {
    width: 200px;
    height: 200px;
    padding: 0;
    overflow: auto;
    cursor: pointer;
  }

  .gesture-box__gradient {
    height: 1000px;
    background-image: linear-gradient(var(--mu-danger-color, #e66465), var(--mu-primary-color, #9198e5));
  }

  .gesture-log {
    flex: 1;
    min-width: 240px;
    max-width: 480px;
    max-height: 200px;
    padding: 10px;
    overflow-y: auto;
    border: 1px solid var(--mu-border-color);
    border-radius: 4px;
    background: var(--mu-bg-strong);
    font-family: monospace;
    font-size: 12px;
  }

  .gesture-log__entry {
    padding: 4px 0;
    border-bottom: 1px solid var(--mu-border-color);
  }

  .gesture-log__entry:last-child {
    border-bottom: none;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
