<template>
  <demo-page path="form/date-input">
    <demo-section
      title="基础用法"
      note="v-model 绑定 Date 或字符串；点击输入框打开日期面板，选日期后自动收起"
      :code="basicCode">
      <mu-date-input
        v-model="date"
        placeholder="选择日期"
        style="width: 240px" />
      <span class="demo-log">值：{{ formatDate(date) }}</span>
    </demo-section>

    <demo-section
      title="选择类型"
      note="type 为 date / week / month / quarter / year，面板与「今 X」按钮随类型变化">
      <mu-date-input
        v-model="week"
        type="week"
        format="yyyy-MM-Ww"
        placeholder="周"
        style="width: 240px" />
      <mu-date-input
        v-model="month"
        type="month"
        placeholder="月"
        style="width: 240px" />
      <mu-date-input
        v-model="quarter"
        type="quarter"
        placeholder="季度"
        style="width: 240px" />
      <mu-date-input
        v-model="year"
        type="year"
        placeholder="年"
        style="width: 240px" />
    </demo-section>

    <demo-section
      title="显示格式"
      note="format 自定义显示格式（如 yyyy/MM/dd）；week 类型用 yyyy-MM-Ww 显示周序号"
      vertical>
      <div class="demo-row">
        <mu-date-input
          v-model="date"
          format="yyyy/MM/dd"
          placeholder="yyyy/MM/dd"
          style="width: 240px" />
        <span class="demo-log">显示格式 yyyy/MM/dd</span>
      </div>
      <div class="demo-row">
        <mu-date-input
          v-model="week"
          type="week"
          format="yyyy-MM-Ww"
          placeholder="yyyy-MM-Ww"
          style="width: 240px" />
        <span class="demo-log">周类型默认格式 yyyy-MM-Ww</span>
      </div>
    </demo-section>

    <demo-section
      title="字符串值"
      note="value-type 为 string 时 v-model 绑定字符串，value-format 决定字符串格式">
      <mu-date-input
        v-model="dateStr"
        value-type="string"
        value-format="yyyy-MM-dd"
        placeholder="字符串值"
        style="width: 240px" />
      <span class="demo-log">值：{{ dateStr ?? 'null' }}</span>
    </demo-section>

    <demo-section
      title="可选范围"
      note="min/max 限制面板可选日期，范围外日期置灰不可选">
      <mu-date-input
        v-model="limited"
        :min="minDate"
        :max="maxDate"
        placeholder="2026-10-01 ~ 2026-10-31"
        style="width: 260px" />
    </demo-section>

    <demo-section
      title="周起始日"
      note="week-starts-on 为 0（周日）~ 6（周六），默认 0（周日）；面板列头与周选随其变化">
      <mu-date-input
        v-model="date"
        :week-starts-on="1"
        placeholder="周一为一周开始"
        style="width: 240px" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="清空输入、手输文本回车解析、切换类型后旧值显示"
      regression
      vertical>
      <div class="demo-row">
        <span>clearable 清空：</span>
        <mu-date-input
          v-model="cleared"
          clearable
          placeholder="选择后点 X"
          style="width: 240px" />
        <span>值：{{ formatDate(cleared) }}</span>
      </div>
      <div class="demo-row">
        <span>手输文本回车解析：</span>
        <mu-date-input
          v-model="typed"
          placeholder="输入 2026-01-15 回车"
          style="width: 240px" />
        <span>值：{{ formatDate(typed) }}</span>
      </div>
      <div class="demo-row">
        <span>禁用：</span>
        <mu-date-input
          v-model="date"
          disabled
          style="width: 240px" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-date-input v-model="date" placeholder="选择日期" />`

  const date = ref(null)
  const week = ref(null)
  const month = ref(null)
  const quarter = ref(null)
  const year = ref(null)
  const dateStr = ref(null)
  const limited = ref(null)
  const cleared = ref(null)
  const typed = ref(null)

  const minDate = new Date(2026, 9, 1)
  const maxDate = new Date(2026, 9, 31)

  function formatDate (value) {
    if (!value) return 'null'

    return value instanceof Date ? value.toDateString() : String(value)
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
</style>
