<template>
  <demo-page path="data/table-ex-basic">
    <demo-section
      title="基础用法"
      note="columns 定义列、records 提供行数据、key-field 指定行键；canvas 渲染 + 虚拟滚动，大数据量（十万行）首屏即用"
      wide>
      <mu-table-ex
        :columns="basicColumns"
        :records="records"
        :selected-record-key="selectedKey"
        key-field="id"
        @update:selected-record-key="key => (selectedKey = key)"
        @cell-click="onCellClick" />
      <p class="ex-basic__tip">
        点击行选中（key-field 行键受控）；单击单元格触发 cell-click（载荷含 record / recordIndex / column）
      </p>
    </demo-section>

    <demo-section
      title="列类型"
      note="与 mu-table 同源的类型体系，另含 canvas 专属 progress / button；mappings 显示映射同语义"
      wide>
      <mu-table-ex
        :columns="typeColumns"
        :records="typeRecords"
        key-field="id" />
      <p class="ex-basic__tip">
        类型清单：text / number / currency / date / datetime / bool / link / tag / img / check / rec_no / progress / button
      </p>
    </demo-section>

    <demo-section
      title="排序与固定列"
      note="sortable 列点表头循环 asc → desc → 清空（update:order-by 受控）；fixed-left-columns 固定左侧列，横向滚动不位移；resizable 拖拽表头右缘调宽"
      wide>
      <mu-table-ex
        :columns="sortColumns"
        :records="sortedRecords"
        :order-by="orderBy"
        :fixed-left-columns="2"
        key-field="id"
        resizable
        @update:order-by="value => (orderBy = value)" />
      <p class="ex-basic__tip">
        当前 orderBy：{{ orderBy || '（空）' }}（排序由父级执行后传回，组件不改动数据）
      </p>
    </demo-section>

    <demo-section
      title="样式与 hover 反馈"
      note="gridlines 为 none / all / row / column；striped 斑马纹；hover-mode 为 none / row / column / cross / cell"
      wide>
      <div class="ex-basic__controls">
        <span>gridlines</span>
        <mu-radio-group
          v-model="gridlines"
          :options="['all', 'row', 'column', 'none']" />
        <span>hover 模式</span>
        <mu-radio-group
          v-model="hoverMode"
          :options="['row', 'column', 'cross', 'cell', 'none']" />
        <mu-switch v-model="striped" caption="striped" />
      </div>
      <mu-table-ex
        :columns="basicColumns"
        :records="records"
        :gridlines="gridlines"
        :hover-mode="hoverMode"
        :striped="striped"
        key-field="id" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'
  import { MuTableEx } from '../../../../src/components/table/ex/index.js'

  const records = Array.from({ length: 200 }, (_, i) => {
    const n = i + 1

    return {
      id: n,
      name: `记录 ${String(n).padStart(3, '0')}`,
      status: ['active', 'pending', 'archived'][i % 3],
      count: (i * 7) % 1000,
      amount: Math.round(((i * 13.37) % 10000) * 100) / 100,
      date: `2026-${String((i % 12) + 1).padStart(2, '0')}-15`,
      active: i % 2 === 0
    }
  })

  const selectedKey = ref(null)

  function onCellClick ({ record }) {
    selectedKey.value = record.id
  }

  const basicColumns = [
    { caption: '#', type: 'rec_no', width: 56 },
    { caption: '名称', field: 'name', minWidth: 120 },
    { caption: '数量', field: 'count', type: 'number', width: 100, sortable: true },
    { caption: '启用', field: 'active', type: 'bool', width: 80 }
  ]

  // 列类型一览（与 mu-table 同源 + canvas 专属 progress / button）
  const STATUS_MAPPINGS = { active: '启用', pending: '待处理', archived: '已归档', default: '未知' }

  const typeRecords = [
    {
      id: 1,
      name: '全部类型',
      status: 'active',
      count: 42,
      amount: 1999.5,
      date: '2026-10-01',
      datetime: '2026-10-01 08:30:00',
      active: true,
      checked: false,
      links: ['文档', '仓库'],
      tags: [{ caption: '新品', color: 'green' }, '热门'],
      progress: 72,
      buttons: [{ caption: '编辑' }, { caption: '删除', color: 'red' }],
      img: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24"><rect width="40" height="24" rx="4" fill="#409eff"/></svg>'
      )
    },
    {
      id: 2,
      name: '第二行',
      status: 'pending',
      count: 7,
      amount: 88,
      date: '2026-11-20',
      datetime: '2026-11-20 23:59:59',
      active: false,
      checked: true,
      links: 12345,
      tags: '单标签',
      progress: 30,
      buttons: [{ caption: '详情', color: 'indigo' }],
      img: null
    }
  ]

  const typeColumns = [
    { caption: '#', type: 'rec_no', width: 48 },
    { caption: '文本', field: 'name', width: 110 },
    { caption: '映射', field: 'status', type: 'text', width: 90, mappings: STATUS_MAPPINGS },
    { caption: '数字', field: 'count', type: 'number', width: 80 },
    { caption: '货币', field: 'amount', type: 'currency', width: 110 },
    { caption: '日期', field: 'date', type: 'date', width: 110 },
    { caption: '日期时间', field: 'datetime', type: 'datetime', width: 160 },
    { caption: '布尔', field: 'active', type: 'bool', width: 80 },
    { caption: '勾选', field: 'checked', type: 'check', width: 48 },
    { caption: '链接', field: 'links', type: 'link', width: 130 },
    { caption: '标签', field: 'tags', type: 'tag', width: 160 },
    { caption: '进度', field: 'progress', type: 'progress', width: 120 },
    { caption: '按钮', field: 'buttons', type: 'button', width: 150, buttons: r => r.buttons },
    { caption: '图片', field: 'img', type: 'img', width: 80 }
  ]

  // 排序：父级按 order-by 执行排序后传回（组件不改数据）
  const orderBy = ref('')
  const sortColumns = [
    { field: 'checked', type: 'check', width: 48 },
    { caption: '名称', field: 'name', sortable: true, minWidth: 140 },
    { caption: '数量', field: 'count', type: 'number', sortable: true, width: 110 },
    { caption: '金额', field: 'amount', type: 'currency', sortable: true, width: 130 },
    { caption: '备注', field: 'name', width: 260, text: r => `固定列右缘可拖拽调宽（${r.name}）` }
  ]

  const sortedRecords = computed(() => {
    if (!orderBy.value) return records

    const [field, direction] = orderBy.value.split(':')

    return [...records].sort((a, b) => {
      const cmp = a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0

      return direction === 'desc' ? -cmp : cmp
    })
  })

  // 样式控制
  const gridlines = ref('all')
  const hoverMode = ref('row')
  const striped = ref(true)
</script>

<style>
  .ex-basic__tip {
    margin: 8px 0 0;
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }

  .ex-basic__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    align-items: center;
    margin-bottom: 12px;
    font-size: var(--mu-font-size-small);
  }
</style>
