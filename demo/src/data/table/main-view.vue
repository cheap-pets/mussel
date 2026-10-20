<template>
  <demo-page path="data/table">
    <demo-section
      title="基础用法"
      note="columns 定义列（field 取值、caption 表头、width 列宽），records 提供行数据，key-field 指定行键"
      :code="basicCode"
      wide>
      <mu-table
        :columns="basicColumns"
        :records="records"
        key-field="id" />
    </demo-section>

    <demo-section
      title="列类型"
      note="type 指定列渲染器：text / rec_no / bool / enum / date / datetime / number / currency / link / tag / img；enum/bool 用 mappings 映射显示"
      wide>
      <mu-table
        :columns="typeColumns"
        :records="records"
        key-field="id" />
    </demo-section>

    <demo-section
      title="样式"
      note="gridlines 为 none / all / row / column，striped 斑马纹，hover-mode 为 none / row / column / cross / cell">
      <mu-table
        :columns="basicColumns"
        :records="records"
        key-field="id"
        gridlines="column"
        striped
        hover-mode="cross"
        style="max-height: 400px" />
    </demo-section>

    <demo-section
      title="排序"
      note="列设 sortable 后点击表头触发 header-click，orderBy 格式为 'field' 或 'field desc'，排序逻辑由外部实现"
      wide>
      <mu-table
        :columns="sortColumns"
        :records="sortedRecords"
        :order-by="orderBy"
        key-field="id"
        @header-click="onHeaderClick" />
    </demo-section>

    <demo-section
      title="行选中"
      note="selected-record-key 绑定选中行键，点击行触发 update:selected-record-key">
      <mu-table
        :columns="basicColumns"
        :records="records"
        :selected-record-key="selectedId"
        key-field="id"
        style="max-height: 320px"
        @update:selected-record-key="selectedId = $event" />
      <span class="demo-log">选中行 id：{{ selectedId ?? '无' }}</span>
    </demo-section>

    <demo-section
      title="边界与回归"
      note="空数据显示占位、placeholder 替换空值、disabled 链接不可点"
      regression
      vertical>
      <mu-table
        :columns="basicColumns"
        :records="[]"
        style="max-height: 200px" />
      <mu-table
        :columns="linkColumns"
        :records="sparseRecords"
        key-field="id"
        placeholder="-"
        style="max-height: 240px" />
    </demo-section>
  </demo-page>
</template>

<script setup>
  import { ref, computed } from 'vue'

  import DemoPage from '../../common/demo-page.vue'
  import DemoSection from '../../common/demo-section.vue'

  const basicCode = `<mu-table :columns="columns" :records="records" key-field="id" />

const columns = [
  { caption: '名称', field: 'name', width: '160px' },
  { caption: '数量', field: 'count', width: '80px' }
]`

  const selectedId = ref(null)
  const orderBy = ref('')

  const records = [
    { id: 1, name: 'Alice', count: 30, active: true, gender: 'female', birthday: '1992-05-14', registeredAt: '2023-03-01 09:30:00', amount: 1234.5, email: 'alice@example.com', tags: ['admin', 'vip'], avatar: 'https://dummyimage.com/48x48/228be6/ffffff&text=A', missing: '' },
    { id: 2, name: 'Bob', count: 12, active: false, gender: 'male', birthday: '1988-11-02', registeredAt: '2022-07-15 14:00:00', amount: 987.65, email: 'bob@example.com', tags: ['editor'], avatar: 'https://dummyimage.com/48x48/40c057/ffffff&text=B', missing: '' },
    { id: 3, name: 'Carol', count: 88, active: true, gender: 'female', birthday: '1995-08-23', registeredAt: '2024-01-20 11:20:00', amount: 22000, email: 'carol@example.com', tags: ['admin', 'editor'], avatar: 'https://dummyimage.com/48x48/fab005/ffffff&text=C', missing: '' },
    { id: 4, name: 'Dave', count: 5, active: false, gender: 'male', birthday: '2001-02-09', registeredAt: '2024-06-08 16:45:00', amount: 45.2, email: 'dave@example.com', tags: [], avatar: 'https://dummyimage.com/48x48/e64980/ffffff&text=D', missing: '' },
    { id: 5, name: 'Erin', count: 47, active: true, gender: 'female', birthday: '1990-12-30', registeredAt: '2021-11-11 08:05:00', amount: 5300.1, email: 'erin@example.com', tags: ['viewer', 'vip'], avatar: 'https://dummyimage.com/48x48/7950f2/ffffff&text=E', missing: '' }
  ]

  const basicColumns = [
    { caption: '#', type: 'rec_no', width: '56px' },
    { caption: '名称', field: 'name', width: '160px', sortable: true },
    { caption: '数量', field: 'count', width: '100px', sortable: true }
  ]

  const typeColumns = [
    { caption: '文本', field: 'name', width: '100px' },
    { caption: '布尔', field: 'active', width: '80px', type: 'bool', mappings: { true: '启用', false: '停用' } },
    { caption: '枚举', field: 'gender', width: '80px', type: 'enum', mappings: { male: { text: '男', style: { color: 'var(--mu-indigo)' } }, female: { text: '女', style: { color: 'var(--mu-pink)' } } } },
    { caption: '日期', field: 'birthday', width: '120px', type: 'date' },
    { caption: '时间', field: 'registeredAt', width: '170px', type: 'datetime' },
    { caption: '数值', field: 'count', width: '90px', type: 'number' },
    { caption: '金额', field: 'amount', width: '120px', type: 'currency' },
    { caption: '链接', field: 'email', width: '180px', type: 'link' },
    { caption: '标签', field: 'tags', width: '160px', type: 'tag', tagOption: { pill: true, flat: true } },
    { caption: '图像', field: 'avatar', width: '64px', type: 'img' },
    { caption: '空值', field: 'missing', width: '90px', placeholder: '-' }
  ]

  const sortColumns = [
    { caption: '名称', field: 'name', width: '200px', sortable: true },
    { caption: '数量', field: 'count', width: '120px', sortable: true },
    { caption: '邮箱', field: 'email', width: '220px' }
  ]

  const linkColumns = [
    { caption: '名称', field: 'name', width: '160px' },
    {
      caption: '操作',
      width: '160px',
      type: 'link',
      align: 'center',
      links: rec => [
        { caption: 'MODIFY', disabled: rec.id === 2 },
        { caption: 'REMOVE' }
      ]
    }
  ]

  const sparseRecords = [
    { id: 1, name: 'Alice' },
    { id: 2, name: '' },
    { id: 3, name: 'Carol' }
  ]

  const sortedRecords = computed(() => {
    if (!orderBy.value) return records

    const [field, direction] = orderBy.value.split(' ')

    return [...records].sort((a, b) => {
      const va = a[field]
      const vb = b[field]

      const cmp = typeof va === 'string' ? va.localeCompare(vb) : (va === vb ? 0 : va > vb ? 1 : -1)

      return direction === 'desc' ? -cmp : cmp
    })
  })

  function onHeaderClick (column) {
    if (!column.sortable) return

    const [oldField, oldDirection] = (orderBy.value || '').split(' ')

    orderBy.value =
      column.field === oldField && oldDirection !== 'desc'
        ? `${column.field} desc`
        : column.field
  }
</script>

<style>
  .demo-log {
    color: var(--mu-text-color-muted);
    font-size: var(--mu-font-size-small);
  }
</style>
