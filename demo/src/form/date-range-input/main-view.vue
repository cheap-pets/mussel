<template>
  <demo-page path="form/date-range-input">
    <demo-section
      title="基础用法"
      note="v-model 绑定 { startDate, endDate }（Date 对象）；面板中点第一次选开始、第二次选结束"
      :code="basicCode">
      <mu-date-range-input
        v-model="range"
        placeholder="选择日期范围"
        style="width: 300px" />
      <span class="demo-log">值：{{ formatRange(range) }}</span>
    </demo-section>

    <demo-section
      title="清空"
      note="clearable 时点击 X 将值重置为 null">
      <mu-date-range-input
        v-model="clearableRange"
        clearable
        placeholder="可清空"
        style="width: 300px" />
      <span class="demo-log">值：{{ formatRange(clearableRange) }}</span>
    </demo-section>

    <demo-section
      title="字符串值"
      note="value-type 为 string 时 startDate/endDate 为字符串，格式由 value-format 决定">
      <mu-date-range-input
        v-model="rangeStr"
        value-type="string"
        value-format="yyyy-MM-dd"
        placeholder="字符串值"
        style="width: 300px" />
      <span class="demo-log">值：{{ rangeStr ? `${rangeStr.startDate} ~ ${rangeStr.endDate}` : 'null' }}</span>
    </demo-section>

    <demo-section
      title="显示格式"
      note="format 自定义输入框显示格式，不影响 v-model 值">
      <mu-date-range-input
        v-model="range"
        format="yyyy/MM/dd"
        placeholder="yyyy/MM/dd"
        style="width: 300px" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="只选开始日期（endDate 为 null）、空值显示、禁用"
      regression
      vertical>
      <div class="demo-row">
        <span>仅有开始日期：</span>
        <mu-date-range-input
          v-model="halfRange"
          style="width: 300px" />
        <span>endDate：{{ halfRange?.endDate ? '有值' : 'null' }}</span>
      </div>
      <div class="demo-row">
        <span>空值：</span>
        <mu-date-range-input
          v-model="emptyRange"
          placeholder="未选择"
          style="width: 300px" />
        <span>值：{{ formatRange(emptyRange) }}</span>
      </div>
      <div class="demo-row">
        <span>禁用：</span>
        <mu-date-range-input
          v-model="range"
          disabled
          style="width: 300px" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-date-range-input v-model="range" clearable />

const range = ref({ startDate: new Date(), endDate: null })`

  const range = ref({ startDate: new Date(2026, 0, 8), endDate: new Date(2026, 0, 20) })
  const clearableRange = ref({ startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 10) })
  const rangeStr = ref({ startDate: '2026-02-01', endDate: '2026-02-10' })
  const halfRange = ref({ startDate: new Date(2026, 2, 5), endDate: null })
  const emptyRange = ref(null)

  function formatRange (value) {
    if (!value) return 'null'

    const start = value.startDate instanceof Date
      ? value.startDate?.toDateString()
      : value.startDate
    const end = value.endDate instanceof Date
      ? value.endDate?.toDateString()
      : value.endDate

    return `${start ?? 'null'} ~ ${end ?? 'null'}`
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
