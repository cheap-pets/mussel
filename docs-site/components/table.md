<script setup>
  import { ref } from 'vue'

  const selectedKey = ref(null)
  const headerChecked = ref({ checked: false })
  const orderBy = ref('name')

  const records = [
    { id: 1, checked: true, name: 'Ada Lovelace', city: 'London', amount: 1280.5, status: 'active', createdAt: '2026-01-12T08:30:00' },
    { id: 2, checked: false, name: 'Alan Turing', city: 'Wilmslow', amount: 6400, status: 'inactive', createdAt: '2026-02-03T14:20:00' },
    { id: 3, checked: false, name: 'Grace Hopper', city: 'New York', amount: 920.75, status: 'active', createdAt: '2026-03-21T09:00:00' },
    { id: 4, checked: false, name: 'Linus Torvalds', city: 'Portland', amount: 15800, status: 'active', createdAt: '2026-04-18T16:45:00' },
    { id: 5, checked: false, name: 'Margaret Hamilton', city: 'Boston', amount: 23300.1, status: 'inactive', createdAt: '2026-05-30T11:15:00' }
  ]

  const baseColumns = [
    { field: 'name', caption: '姓名', type: 'text', sortable: true, width: 160 },
    { field: 'city', caption: '城市', type: 'text', width: 100 },
    { field: 'amount', caption: '金额', type: 'currency', width: 120 }
  ]

  const columns = [
    { type: 'rec_no' },
    { type: 'check', field: 'checked', width: '50px', headerCheckbox: true },
    ...baseColumns,
    {
      field: 'status',
      caption: '状态',
      type: 'enum',
      mappings: {
        active: { text: '启用', class: 'mu-tag--success' },
        inactive: { text: '停用', class: 'mu-tag--danger' }
      }
    },
    { field: 'createdAt', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
    {
      field: 'actions',
      caption: '操作',
      type: 'link',
      linkOption: { max: 3 },
      links: (record) => [
        { caption: '编辑', action: 'edit' },
        { caption: '删除', action: 'delete', danger: true }
      ]
    }
  ]

  function onHeaderCheckedChange (column, checked) {
    headerChecked.value.checked = checked
    records.forEach((el) => { el.checked = checked })
  }

  function onHeaderClick (column) {
    if (!column.sortable) return
    orderBy.value = orderBy.value === column.field
      ? `${column.field}:desc`
      : `${column.field}:asc`
  }

  function onCellItemClick ({ link, tag }) {
    console.log('cell-item-click', (link || tag)?.caption)
  }
</script>

# 表格 MuTable

数据驱动的表格组件：通过 `columns` 配置列（12 种列类型）、`records` 传入数据，内置单选、勾选、排序、斑马纹、hover 高亮、固定列等能力。

## 基础用法

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-table
    :records="records"
    :columns="baseColumns"
    key-field="id"
    striped
    hover-mode="row"
    v-model:selected-record-key="selectedKey" />
  <span class="text-subtle">选中行 key：{{ selectedKey ?? '（无）' }}</span>
</div>

```html
<mu-table
  :records="records"
  :columns="columns"
  key-field="id"
  striped
  hover-mode="row"
  v-model:selected-record-key="selectedKey" />
```

## 列类型（type）

| 类型 | 说明 | 默认对齐 |
|------|------|---------|
| `text` | 文本（支持 `multiline` / `lineClamp`） | left |
| `rec_no` | 自动行号（配合 `records-offset` 计算分页行号） | center |
| `check` | 复选勾选 | center |
| `bool` | 布尔（是/否），配合 `mappings` | center |
| `enum` | 枚举值映射，配合 `mappings` | center |
| `date` / `datetime` | 日期（时间）格式化，配合 `format` / `formatter` | right |
| `number` / `currency` | 数字 / 货币格式化，配合 `formatOption` / `locale` | right |
| `link` | 链接，配合 `links` 函数或字段值 | left |
| `tag` | 标签，配合 `tags` 函数或字段值 | left |
| `img` / `image` | 图片缩略图 | left |

### 完整列配置示例

```javascript
const columns = [
  { type: 'rec_no' },                                              // 行号
  { type: 'check', field: 'checked', headerCheckbox: true },       // 勾选列 + 表头全选
  { field: 'name', caption: '姓名', type: 'text', sortable: true },
  { field: 'amount', caption: '金额', type: 'currency' },
  { field: 'status', caption: '状态', type: 'enum',
    mappings: {
      active:   { text: '启用', class: 'mu-tag--success' },
      inactive: { text: '停用', class: 'mu-tag--danger' }
    }
  },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'actions', caption: '操作', type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
```

## 勾选与表头全选

`check` 列配合表格级 `header-checked` prop（双向绑定）显示表头全选框；勾选值变化经 `update:cell-value` / `update:header-checked` 事件同步回数据：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    :header-checked="headerChecked"
    @update:header-checked="onHeaderCheckedChange"
    @cell-item-click="onCellItemClick" />
</div>

```html
<mu-table
  :records="records"
  :columns="columns"
  key-field="id"
  :header-checked="headerChecked"
  @update:header-checked="onHeaderCheckedChange"
  @update:cell-value="onCellValueChange"
  @cell-item-click="onItemClick" />
```

```javascript
const headerChecked = ref({ checked: false })

// 表头全选切换 → 同步所有行
function onHeaderCheckedChange (column, checked) {
  headerChecked.value.checked = checked
  records.value.forEach(el => { el.checked = checked })
}
```

## 排序

列设置 `sortable: true` 后表头显示排序图标，点击触发 `header-click`，排序状态由 `order-by` prop 控制（格式 `field:asc` / `field:desc`，排序逻辑由外部实现）：

```html
<mu-table
  :records="sortedRecords"
  :columns="columns"
  :order-by="orderBy"
  @header-click="onHeaderClick" />
```

```javascript
function onHeaderClick (column) {
  if (!column.sortable) return
  orderBy.value = orderBy.value === column.field
    ? `${column.field}:desc`
    : `${column.field}:asc`
}
```

## 外观 `hover-mode` / `gridlines` / `striped`

- `hover-mode`：`none` / `row`（默认）/ `column` / `cross` / `cell`
- `gridlines`：`none` / `all`（默认）/ `row` / `column`
- `striped`：斑马纹

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-table :records="records" :columns="baseColumns" key-field="id" hover-mode="cross" gridlines="none" striped />
</div>

```html
<mu-table :records="records" :columns="columns" hover-mode="cross" gridlines="none" striped />
```

## 固定列 `fixed-left-columns`

横向滚动时固定左侧 N 列（需配合较宽的表格内容）：

```html
<mu-table
  :records="records"
  :columns="columns"
  :fixed-left-columns="2"
  table-min-width="1200px" />
```

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | `column` | 表头点击 |
| `cell-click` | `{ record, recordIndex, column }` | 单元格点击 |
| `cell-item-click` | `{ record, column, link/tag }` | 单元格内链接/标签点击 |
| `update:selected-record` | `record` | 选中记录变更 |
| `update:selected-record-key` | `key` | 选中 key 变更 |
| `update:header-checked` | `column, value` | 表头全选框切换 |
| `update:cell-value` | `{ record, column, value }` | 单元格值变更（check 列）|

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `records` | Array | — | 数据列表 |
| `columns` | Array | — | 列配置 |
| `key-field` | String | — | 唯一标识字段名 |
| `striped` | Boolean | — | 斑马纹 |
| `hover-mode` | String | `row` | `none` \| `row` \| `column` \| `cross` \| `cell` |
| `gridlines` | String | `all` | `none` \| `all` \| `row` \| `column` |
| `selected-record` | Object | — | 当前选中记录（双向绑定）|
| `selected-record-key` | String\|Number | — | 当前选中记录 key（双向绑定）|
| `header-checked` | Object | — | 表头全选框状态（`{ 字段名: Boolean }`），需与列的 `headerCheckbox` 配合才显示表头全选框（双向绑定） |
| `order-by` | String | — | 排序字段，格式 `field:asc` / `field:desc` |
| `records-offset` | Number | `0` | 记录偏移量（影响行号显示）|
| `fixed-left-columns` | Number | — | 固定左侧列数 |
| `placeholder` | String | — | 空单元格占位文本 |

### Column 配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `field` | String | 数据字段名 |
| `key` | String | 列标识（缺省自动生成） |
| `caption` | String | 列标题 |
| `type` | String | 列类型（见上表）|
| `width` / `minWidth` / `maxWidth` | String\|Number | 列宽 |
| `align` | String | `left` \| `center` \| `right` |
| `sortable` | Boolean | 是否可排序 |
| `text` | String\|Function | 单元格显示文本（可覆盖默认值）|
| `value` | String\|Function | 单元格值（可覆盖 field）|
| `title` | String\|Function | 单元格 title（`true` 时为 link/tag 类型开启省略项的 title 提示）|
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String\|Function | 表头 class / 样式 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `mappings` | Object | 值映射（`enum` / `bool` 类型）；未命中时回退 `default` 键的映射 |
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatter` | Function | 日期格式化函数 `(value, format) => text` |
| `formatOption` | Object | `Intl.NumberFormat` 选项（`number` / `currency` 类型）|
| `locale` / `locales` | String | 数字 / 货币格式化 locale（默认 `'zh-CN'`）|
| `links` | Function | 链接生成函数 `(record, value) => 链接数组`（`link` 类型）|
| `linkOption` | Object | `{ max, class, style, danger, disabled }` |
| `tags` | Function | 标签生成函数 `(record, value) => 标签数组`（`tag` 类型）|
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示表头全选框（`check` 类型）；需同时传表格级 `header-checked` prop |
