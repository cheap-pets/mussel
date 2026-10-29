<template>
  <demo-page path="navigation/pagination">
    <demo-section
      title="基础用法"
      note="v-model:page-index 从 0 开始；total 为总记录数，pageSize 默认 20"
      :code="basicCode">
      <mu-pagination
        v-model:page-index="page"
        :total="200" />
      <span class="demo-log">当前页（0 起）：{{ page }}</span>
    </demo-section>

    <demo-section
      title="每页条数"
      note="page-size 绑定每页条数，page-size-options 提供下拉选项">
      <mu-pagination
        v-model:page-index="page2"
        v-model:page-size="size2"
        :total="1000"
        :page-size-options="[20, 50, 100]" />
      <span class="demo-log">页码：{{ page2 }}；每页：{{ size2 }}</span>
    </demo-section>

    <demo-section
      title="快速跳转"
      note="quick-jumper 显示页码输入框，输入后回车跳转">
      <mu-pagination
        v-model:page-index="page3"
        :quick-jumper="true"
        :total="1000" />
      <span class="demo-log">当前页（0 起）：{{ page3 }}</span>
    </demo-section>

    <demo-section
      title="尺寸"
      note="size 为 small / normal">
      <mu-pagination
        v-model:page-index="page4"
        size="small"
        :total="200" />
    </demo-section>

    <demo-section
      title="与表格联动"
      note="page-index 变化时按 page-size 切片，配合 records-offset 保持序号连续"
      vertical>
      <mu-table
        :columns="columns"
        :records="pagedRecords"
        :records-offset="page5 * pageSize5"
        key-field="id"
        style="max-height: 320px" />
      <mu-pagination
        v-model:page-index="page5"
        v-model:page-size="pageSize5"
        class="mt-1x"
        :total="rows.length"
        :page-size-options="[3, 5, 10]" />
    </demo-section>

    <demo-section
      title="边界与回归"
      note="total 为 0、首页上一页禁用、末页下一页禁用、总页数减少后页码收敛"
      regression
      vertical>
      <div class="demo-row">
        <span>total=0：</span>
        <mu-pagination :total="0" />
      </div>
      <div class="demo-row">
        <span>末页禁用下一页：</span>
        <mu-pagination v-model:page-index="lastPage" :total="30" :page-size="10" />
        <span>页码：{{ lastPage }}（应为 2，下一页置灰）</span>
      </div>
      <div class="demo-row">
        <span>首页禁用上一页：</span>
        <mu-pagination v-model:page-index="firstPage" :total="30" :page-size="10" />
      </div>
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = '<mu-pagination v-model:page-index="page" :total="200" />'

  const page = ref(0)
  const page2 = ref(0)
  const size2 = ref(20)
  const page3 = ref(0)
  const page4 = ref(0)
  const page5 = ref(0)
  const pageSize5 = ref(5)
  const lastPage = ref(2)
  const firstPage = ref(0)

  const rows = Array.from({ length: 23 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    count: (i + 1) * 7
  }))

  const columns = [
    { caption: '#', type: 'rec_no', width: '56px' },
    { caption: '名称', field: 'name', width: '160px' },
    { caption: '数量', field: 'count', width: '100px' }
  ]

  const pagedRecords = computed(() =>
    rows.slice(page5.value * pageSize5.value, page5.value * pageSize5.value + pageSize5.value))
</script>

<style>
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .demo-row .mu-pagination {
    width: 480px;
    max-width: 100%;
  }

  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
