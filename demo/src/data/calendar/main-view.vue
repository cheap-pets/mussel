<template>
  <demo-page path="data/calendar">
    <demo-section
      title="基础用法"
      note="mu-calendar 为独立日历面板（区别于 date-input 的下拉形态）；点标题打开月份选择，chevron 切换月份，「今日」回到当月并选中"
      :code="basicCode">
      <mu-calendar
        v-model="date"
        :week-starts-on="1"
        style="width: 420px" />
      <span class="demo-log">值：{{ formatDate(date) }}</span>
    </demo-section>

    <demo-section
      title="宽面板"
      note="wide 模式：面板随容器拉伸，日期单元格显示事件标记等附加内容形态"
      wide>
      <mu-calendar
        v-model="wideDate"
        :week-starts-on="1"
        class="demo-calendar-wide" />
    </demo-section>

    <demo-section
      title="字符串值"
      note="value-type 为 string 时 v-model 绑定字符串，格式由 value-format 决定">
      <mu-calendar
        v-model="dateStr"
        value-type="string"
        value-format="yyyy-MM-dd"
        style="width: 420px" />
      <span class="demo-log">值：{{ dateStr ?? 'null' }}</span>
    </demo-section>

    <demo-section
      title="可选范围"
      note="min/max 限制可选日期，范围外单元格置灰不可选">
      <mu-calendar
        v-model="limited"
        :min="minDate"
        :max="maxDate"
        style="width: 420px" />
    </demo-section>

    <demo-section
      title="周起始日"
      note="week-starts-on 为 0（周日）~ 6（周六），影响列头顺序与周选">
      <mu-calendar
        v-model="date"
        :week-starts-on="0"
        style="width: 420px" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="清空值后面板无选中态、切换月份不丢选中、跨月日期显示"
      regression
      vertical>
      <div class="demo-row">
        <mu-button caption="清空值" @click="date = null" />
        <span>清空后重新选日期应正常回填</span>
      </div>
      <div class="demo-row">
        <span>当前值：{{ formatDate(date) }}</span>
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = '<mu-calendar v-model="date" :week-starts-on="1" />'

  const date = ref(null)
  const wideDate = ref(null)
  const dateStr = ref(null)
  const limited = ref(new Date(2026, 9, 15))

  const minDate = new Date(2026, 9, 1)
  const maxDate = new Date(2026, 9, 31)

  function formatDate (value) {
    if (!value) return 'null'

    return value instanceof Date ? value.toDateString() : String(value)
  }
</script>

<style>
  .demo-calendar-wide {
    width: 800px;
    max-width: 100%;
    height: 600px;
  }

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
