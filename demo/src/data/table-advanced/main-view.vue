<template>
  <demo-page path="data/table-advanced">
    <demo-section
      title="复选列"
      note="check 列 + headerCheckbox 表头全选；headerChecked 绑定表头状态，update:cell-value 接收单元格勾选回写"
      :code="checkCode"
      wide>
      <mu-table
        :columns="checkColumns"
        :records="checkRecords"
        :header-checked="headerChecked"
        key-field="id"
        @update:header-checked="onHeaderChecked"
        @update:cell-value="onCellValueChange" />
    </demo-section>

    <demo-section
      title="固定列"
      note="fixed-left-columns 固定左侧 N 列，横向滚动时固定列跟随（需列声明像素宽）"
      wide>
      <mu-table
        :columns="wideColumns"
        :records="records"
        :fixed-left-columns="2"
        key-field="id"
        gridlines="column"
        table-width="fit-content"
        style="max-height: 360px" />
    </demo-section>

    <demo-section
      title="操作列与自定义标签"
      note="link 列的 links 为函数返回操作项；tag 列的 tags 声明固定标签组；text/value/title 支持函数"
      wide>
      <mu-table
        :columns="actionColumns"
        :records="records"
        key-field="id"
        @cell-item-click="onCellItemClick" />
      <span class="demo-log">最近点击项：{{ lastClicked }}</span>
    </demo-section>

    <demo-section
      title="分页偏移"
      note="records-offset 传当前页起始偏移，rec_no 序号列在分页时连续计数（与 mu-pagination 配合）"
      vertical>
      <mu-table
        :columns="offsetColumns"
        :records="pagedRecords"
        :records-offset="pageIndex * pageSize"
        key-field="id"
        style="max-height: 320px" />
      <mu-pagination
        v-model:page-index="pageIndex"
        class="mt-1x"
        :total="records.length"
        :page-size="pageSize" />
    </demo-section>

    <demo-section
      title="行选中取值"
      note="selected-record 传完整对象（代替 selected-record-key），内部按 keyField 取键比较">
      <mu-table
        :columns="basicColumns"
        :records="records"
        :selected-record="selectedRecord"
        key-field="id"
        style="max-height: 320px"
        @update:selected-record-key="onSelectByKey" />
      <span class="demo-log">选中：{{ selectedRecord?.name ?? '无' }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="表头全选后逐行取消、check 列 disabled、行数据缺字段"
      regression
      vertical>
      <div class="demo-row">
        <span>勾选数：{{ checkedCount }} / {{ checkRecords.length }}</span>
      </div>
      <mu-table
        :columns="checkColumns"
        :records="checkRecords"
        :header-checked="headerChecked"
        key-field="id"
        style="max-height: 260px"
        @update:header-checked="onHeaderChecked"
        @update:cell-value="onCellValueChange" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const checkCode = `<mu-table
  :columns="columns"
  :records="records"
  :header-checked="headerChecked"
  key-field="id"
  @update:header-checked="..."
  @update:cell-value="..." />

const columns = [
  { field: 'checked', type: 'check', headerCheckbox: true, width: '80px' }
]`

  const pageIndex = ref(0)
  const pageSize = 3
  const lastClicked = ref('无')
  const selectedRecord = ref(null)

  const records = [
    { id: 1, name: 'Alice', count: 30, email: 'alice@example.com', region: '华东' },
    { id: 2, name: 'Bob', count: 12, email: 'bob@example.com', region: '华北' },
    { id: 3, name: 'Carol', count: 88, email: 'carol@example.com', region: '华南' },
    { id: 4, name: 'Dave', count: 5, email: 'dave@example.com', region: '西南' },
    { id: 5, name: 'Erin', count: 47, email: 'erin@example.com', region: '华东' },
    { id: 6, name: 'Frank', count: 23, email: 'frank@example.com', region: '东北' },
    { id: 7, name: 'Grace', count: 66, email: 'grace@example.com', region: '西北' },
    { id: 8, name: 'Henry', count: 9, email: 'henry@example.com', region: '华北' }
  ]

  const basicColumns = [
    { caption: '#', type: 'rec_no', width: '56px' },
    { caption: '名称', field: 'name', width: '160px' },
    { caption: '数量', field: 'count', width: '100px' }
  ]

  const checkRecords = ref(records.map(r => ({ ...r, checked: false })))

  const checkColumns = [
    { field: 'checked', type: 'check', width: '80px', headerCheckbox: true },
    { caption: '名称', field: 'name', width: '160px' },
    { caption: '数量', field: 'count', width: '100px' }
  ]

  const headerChecked = ref({ checked: false })

  const wideColumns = [
    { caption: 'ID', field: 'id', width: '80px' },
    { caption: '名称', field: 'name', width: '140px' },
    { caption: '邮箱', field: 'email', width: '220px' },
    { caption: '地区', field: 'region', width: '120px' },
    { caption: '数量', field: 'count', width: '120px' },
    { caption: '备注一', field: 'memo1', width: '200px' },
    { caption: '备注二', field: 'memo2', width: '200px' },
    { caption: '备注三', field: 'memo3', width: '200px' }
  ]

  const actionColumns = [
    { caption: '名称', field: 'name', width: '140px', text: rec => `${rec.name}（${rec.count}）` },
    { caption: '数量', field: 'count', width: '100px', type: 'number' },
    {
      caption: '等级',
      width: '160px',
      type: 'tag',
      align: 'center',
      tags: [
        { caption: 'VIP', color: 'primary' },
        { caption: 'SVIP', color: 'violet' }
      ],
      tagOption: { pill: true, flat: true }
    },
    {
      caption: '操作',
      width: '160px',
      type: 'link',
      align: 'center',
      links: rec => [
        { caption: 'MODIFY', disabled: rec.id % 3 === 0 },
        { caption: 'REMOVE' }
      ]
    }
  ]

  const offsetColumns = [
    { caption: '#', type: 'rec_no', width: '56px' },
    { caption: '名称', field: 'name', width: '160px' },
    { caption: '数量', field: 'count', width: '100px' }
  ]

  const pagedRecords = computed(() =>
    records.slice(pageIndex.value * pageSize, pageIndex.value * pageSize + pageSize))

  const checkedCount = computed(() =>
    checkRecords.value.filter(r => r.checked).length)

  function onHeaderChecked (column, checked) {
    headerChecked.value.checked = checked
    checkRecords.value.forEach(r => { r.checked = checked })
  }

  function onCellValueChange ({ record, column, value }) {
    if (column.type !== 'check') return

    record[column.field] = value

    if (!value) headerChecked.value.checked = false
  }

  function onCellItemClick ({ link, tag }) {
    lastClicked.value = (link || tag)?.caption ?? '未知'
  }

  function onSelectByKey (key) {
    selectedRecord.value = records.find(r => r.id === key) ?? null
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
