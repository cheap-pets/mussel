<template>
  <demo-page path="form/color-input">
    <demo-section
      title="基础用法"
      note="v-model 绑定 HEX 颜色值；点击色块打开内置色板"
      :code="basicCode">
      <mu-color-input
        v-model="color"
        style="width: 200px" />
      <span
        class="demo-swatch"
        :style="{ background: color }" />
      <span class="demo-value">值：{{ color }}</span>
    </demo-section>

    <demo-section
      title="色板选择"
      note="下拉面板为内置色板（palette），当前值高亮，点击后收起">
      <mu-color-input
        v-model="paletteColor"
        placeholder="点击色块选择"
        style="width: 200px" />
    </demo-section>

    <demo-section
      title="HEX 输入与规范化"
      note="直接输入 hex 回车提交：自动补 # 并转大写；非法值恢复为当前值">
      <mu-color-input
        v-model="normalizedColor"
        placeholder="输入如 09c 或 #0099cc"
        style="width: 240px" />
      <span class="demo-value">值：{{ normalizedColor || '空' }}</span>
    </demo-section>

    <demo-section
      title="状态"
      note="disabled / readonly 与 placeholder">
      <mu-color-input
        v-model="color"
        disabled
        style="width: 200px" />
      <mu-color-input
        v-model="color"
        readonly
        style="width: 200px" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="esc 取消输入、blur 提交、空值"
      regression
      vertical>
      <div class="demo-row">
        <span>esc 取消（输入后按 ESC，值不变并收起面板）：</span>
        <mu-color-input
          v-model="escColor"
          style="width: 240px" />
        <span class="demo-value">值：{{ escColor || '空' }}</span>
      </div>
      <div class="demo-row">
        <span>blur 提交（输入合法 hex 后点击外部）：</span>
        <mu-color-input
          v-model="blurColor"
          style="width: 240px" />
        <span class="demo-value">值：{{ blurColor || '空' }}</span>
      </div>
      <div class="demo-row">
        <span>空值显示占位符：</span>
        <mu-color-input
          v-model="emptyColor"
          placeholder="empty"
          style="width: 240px" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-color-input v-model="color" />`

  const color = ref('#1C7ED6')
  const paletteColor = ref()
  const normalizedColor = ref('09c')
  const escColor = ref('#12B886')
  const blurColor = ref('#F76707')
  const emptyColor = ref('')
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-value {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .demo-swatch {
    display: inline-block;
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: var(--mu-radius-control);
  }
</style>
