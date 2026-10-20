<template>
  <demo-page path="form/time-input">
    <demo-section
      title="基础用法"
      note="v-model 绑定时间字符串；下拉选时分秒后点「确定」生效，second-step 控制秒列步进"
      :code="basicCode">
      <mu-time-input
        v-model="time"
        placeholder="时分秒"
        :second-step="15"
        style="width: 200px" />
      <span class="demo-log">值：{{ time || '空' }}</span>
    </demo-section>

    <demo-section
      title="显示格式"
      note="format 控制输入框显示格式；second-step 为 0 隐藏秒列，只显示时与分">
      <mu-time-input
        v-model="time"
        :second-step="0"
        format="HH:mm"
        placeholder="时分"
        style="width: 200px" />
      <span class="demo-log">值：{{ time || '空' }}</span>
    </demo-section>

    <demo-section
      title="仅小时"
      note="minute-step 与 second-step 均为 0 时只显示小时列">
      <mu-time-input
        v-model="hour"
        :minute-step="0"
        :second-step="0"
        format="HH:mm"
        placeholder="小时"
        style="width: 200px" />
      <span class="demo-log">值：{{ hour || '空' }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="clearable 清空、手输文本回车、禁用"
      regression
      vertical>
      <div class="demo-row">
        <span>clearable 清空：</span>
        <mu-time-input
          v-model="cleared"
          clearable
          placeholder="选择后点 X"
          style="width: 200px" />
        <span>值：{{ cleared || '空' }}</span>
      </div>
      <div class="demo-row">
        <span>手输文本回车：</span>
        <mu-time-input
          v-model="typed"
          placeholder="输入 14:30:00 回车"
          style="width: 200px" />
        <span>值：{{ typed || '空' }}</span>
      </div>
      <div class="demo-row">
        <span>禁用：</span>
        <mu-time-input
          v-model="time"
          disabled
          style="width: 200px" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-time-input v-model="time" :second-step="15" />

const time = ref('09:30:00')`

  const time = ref('09:30')
  const hour = ref(null)
  const cleared = ref(null)
  const typed = ref(null)
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
</style>
