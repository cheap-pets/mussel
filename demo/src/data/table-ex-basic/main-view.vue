<template>
  <demo-page
    path="data/table-ex-basic"
    wide>
    <demo-section
      title="基础用法"
      note="columns 定义列、records 提供行数据、key-field 指定行键；canvas 渲染 + 虚拟滚动，大数据量（十万行）首屏即用"
      wide>
      <mu-table-ex
        :columns="basicColumns"
        :records="records"
        :selected-record-key="selectedKey"
        key-field="id"
        style="height: 500px;"
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
        key-field="id"
        @cell-click="onTypeCellClick"
        @cell-item-click="onTypeItemClick" />
      <p class="ex-basic__tip">
        类型清单：text / number / currency / date / datetime / bool / link / tag / img / check / rec_no / progress / button
      </p>
      <p class="ex-basic__tip">
        {{ typeLog }}
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
        style="height: 500px"
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
          :options="[
            { value: 'all', label: 'all' },
            { value: 'row', label: 'row' },
            { value: 'column', label: 'column' },
            { value: 'none', label: 'none' }
          ]" />
        <span>hover 模式</span>
        <mu-radio-group
          v-model="hoverMode"
          :options="[
            { value: 'row', label: 'row' },
            { value: 'column', label: 'column' },
            { value: 'cross', label: 'cross' },
            { value: 'cell', label: 'cell' },
            { value: 'none', label: 'none' }
          ]" />
        <mu-switch v-model="striped" label="striped" />
      </div>
      <mu-table-ex
        :columns="basicColumns"
        :records="records"
        :gridlines="gridlines"
        :hover-mode="hoverMode"
        :striped="striped"
        style="height: 500px"
        key-field="id" />
    </demo-section>

    <demo-section
      title="格线截断（行少 / 列少）"
      note="行高之和小于容器高度时垂直格线止于末行底部；列宽之和小于容器宽度时水平格线（含表头底边框）与表头背景止于末列右侧；行 / 列 hover 高亮与选中高亮同口径，不越末列右缘、末行底部"
      wide>
      <mu-table-ex
        :columns="sparseColumns"
        :records="sparseRecords"
        :hover-mode="hoverMode"
        v-model:selected-record-key="sparseSelectedKey"
        key-field="id"
        style="height: 320px" />
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

  // site / actions / actionObjs：text.link 列与仅配 field 的按钮列夹具
  // （20261106-column-link-hover-button-value）；actions 行3 为 null 落占位
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
      site: 'mussel.site',
      actions: ['编辑', '删除', '复制'],
      actionObjs: [{ caption: '保存', color: 'green' }, { icon: 'clock' }, { caption: '锁定', disabled: true }],
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
      site: 'mussel.site',
      actions: '查看',
      img: null
    },
    {
      id: 3,
      name: '第三行',
      status: 'archived',
      count: 0,
      amount: 0,
      date: '2026-11-06',
      datetime: '2026-11-06 12:00:00',
      active: true,
      checked: false,
      links: null,
      tags: null,
      progress: 0,
      buttons: null,
      actions: null,
      img: null
    }
  ]

  const typeColumns = [
    { caption: '#', type: 'rec_no', width: 48 },
    { caption: '文本', field: 'name', width: 110 },
    { caption: '链接文本', field: 'site', link: true, width: 120 },
    // color + link：链色与悬停色沿用 colors 谱系（linkTextColorOf/linkHoverColorOf 口径）
    { caption: '链接文本(色)', field: 'site', link: true, color: 'teal', width: 130 },
    { caption: '映射', field: 'status', type: 'text', width: 90, mappings: STATUS_MAPPINGS },
    { caption: '数字', field: 'count', type: 'number', width: 80 },
    { caption: '货币', field: 'amount', type: 'currency', width: 110 },
    { caption: '日期', field: 'date', type: 'date', width: 110 },
    { caption: '日期时间', field: 'datetime', type: 'datetime', width: 160 },
    { caption: '布尔', field: 'active', type: 'bool', width: 80 },
    { caption: '勾选', field: 'checked', type: 'check', width: 48 },
    { caption: '链接', field: 'links', type: 'list', link: true, width: 130 },
    { caption: '标签', field: 'tags', type: 'tag', width: 160 },
    { caption: '进度', field: 'progress', type: 'progress', width: 120 },
    // 仅配 field：字段值按 tag 同口径包装为按钮条目（valueToButtons 缺省包装）；
    // 空值/null 落占位（placeholder）
    { caption: '按钮(field)', field: 'actions', type: 'button', width: 160, placeholder: '--' },
    { caption: '按钮(field 对象)', field: 'actionObjs', type: 'button', width: 180 },
    // 已配置 buttons 的列回归：函数签名扩展为 (record, value)，以 value 渲染
    { caption: '按钮', field: 'buttons', type: 'button', width: 150, buttons: (record, value) => value },
    { caption: '图片', field: 'img', type: 'img', width: 80 }
  ]

  // 列类型表事件日志（cell-click / cell-item-click 演示与验证）
  const typeLog = ref('点击单元格查看 cell-click / cell-item-click 日志')

  function onTypeCellClick ({ record, recordIndex, column }) {
    typeLog.value = `cell-click：recordIndex=${recordIndex}，field=${column?.field}，name=${record?.name}`
  }

  function onTypeItemClick (payload) {
    typeLog.value = `cell-item-click：field=${payload.column?.field}，button=${JSON.stringify(payload.button ?? null)}`
  }

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

  // 格线截断夹具（20261106-column-link-hover-button-value 需求 3）：
  // 3 行 × 320px 容器高（行少）、3 定宽窄列 Σwidth = 290 < 容器宽（列少）——
  // 垂直格线止于末行底部、水平格线止于末列右侧
  const sparseColumns = [
    { caption: '#', type: 'rec_no', width: 90 },
    { caption: '名称', field: 'name', width: 110 },
    { caption: '数量', field: 'count', type: 'number', width: 90 }
  ]

  const sparseRecords = [
    { id: 1, name: '行一', count: 10 },
    { id: 2, name: '行二', count: 20 },
    { id: 3, name: '行三', count: 30 }
  ]

  // sparse 表受控行选中（追加轮 2 需求 C：点击行验证选中高亮止于末列右缘）
  const sparseSelectedKey = ref(null)
</script>

<style>
  .ex-basic__tip {
    margin: 8px 0 0;
    font-size: var(--mu-font-size-small);
    color: var(--mu-text-color-muted);
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
