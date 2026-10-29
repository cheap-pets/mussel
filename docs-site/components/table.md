<script setup>
  import { ref } from 'vue'

  const selectedKey = ref(null)
  const headerChecked = ref({ checked: false })
  const orderBy = ref('name')

  const records = [
    { id: 1, checked: true, name: 'Ada Lovelace', city: 'London', amount: 1280.5, status: 'active', level: 3, createdAt: '2026-01-12T08:30:00' },
    { id: 2, checked: false, name: 'Alan Turing', city: 'Wilmslow', amount: 6400, status: 'inactive', level: 1, createdAt: '2026-02-03T14:20:00' },
    { id: 3, checked: false, name: 'Grace Hopper', city: 'New York', amount: 920.75, status: 'active', level: 2, createdAt: '2026-03-21T09:00:00' },
    { id: 4, checked: false, name: 'Linus Torvalds', city: 'Portland', amount: 15800, status: 'pending', level: 2, createdAt: '2026-04-18T16:45:00' },
    { id: 5, checked: false, name: 'Margaret Hamilton', city: 'Boston', amount: 23300.1, status: 'inactive', level: 3, createdAt: '2026-05-30T11:15:00' }
  ]

  const baseColumns = [
    { field: 'name', caption: '姓名', type: 'text', sortable: true, width: 160 },
    { field: 'city', caption: '城市', type: 'text', width: 100 },
    { field: 'amount', caption: '金额', type: 'currency', width: 120 }
  ]

  const mappingColumns = [
    {
      field: 'status',
      caption: '状态',
      width: 100,
      mappings: { active: '启用', inactive: '停用', default: '未知' }
    },
    {
      field: 'level',
      caption: '等级',
      type: 'number',
      width: 90,
      options: [
        { value: 1, label: '低' },
        { value: 2, label: '中' },
        { value: 3, label: '高' }
      ]
    }
  ]

  const columns = [
    { type: 'rec_no' },
    { type: 'check', field: 'checked', width: '50px', headerCheckbox: true },
    ...baseColumns,
    ...mappingColumns,
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

大数据量、单元格编辑、树形展示、列宽拖拽场景请使用 [MuTableEx](./table-ex)（canvas 渲染，属性 / 事件 / 列配置与本组件同源）。

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
| `text` | 文本（缺省类型，支持 `multiline` / `lineClamp` / `mappings` / `options`） | left |
| `rec_no` | 自动行号（配合 `records-offset` 计算分页行号） | center |
| `check` | 复选勾选 | center |
| `bool` | 布尔，缺省显示 是 / 否；可配 `mappings: { true: '是', false: '否' }` | center |
| `date` / `datetime` | 日期（时间）格式化，配合 `format` / `formatter` | right |
| `number` / `currency` | 数字 / 货币格式化，配合 `formatOption` / `locale`，亦可配 `mappings` / `options` | right |
| `link` | 链接，配合 `links` 函数或字段值 | left |
| `tag` | 标签，配合 `tags` 函数或字段值 | left |
| `img` / `image` | 图片缩略图 | left |
| `enum` | **已废弃**（使用时控制台告警），改用 `text` + `mappings` / `options` | center |

`type` 也可直接传自定义类型对象 `{ align, width, compile: column => ({ record, value, recordNumber, emit }) => ({ text } | { items }) }`。

## 显示映射 `mappings` / `options`

`text` / `number` / `bool` 列（含未指定 `type` 的列）可配置显示映射，把存储值映射为显示文本：

- `mappings`：`{ 值: 文本 }` 对象，按 `String(value)` 匹配；未命中回退 `default` 键，再回退原值；空值（`null` / `undefined`）显示 `placeholder`。
- `options`：`mu-select` 同格式选项数组（`[{ value, label }]` 或字符串数组），自动转换为映射；与 `mappings` 同时存在时 `mappings` 优先。
- 列配置 `text` 显示优先，不参与映射。

<ClientOnly>
  <div class="mu-demo mu-demo-col" style="align-items: stretch;">
    <mu-table :records="records" :columns="mappingColumns" key-field="id" />
    <span class="text-subtle">状态列 mappings 映射（未命中落 default）；等级列 number + options 映射</span>
  </div>
</ClientOnly>

```javascript
const columns = [
  { field: 'status', caption: '状态', width: 100,
    mappings: { active: '启用', inactive: '停用', default: '未知' } },
  { field: 'enabled', caption: '启用', type: 'bool', width: 80,
    mappings: { true: '是', false: '否' } },
  { field: 'level', caption: '等级', type: 'number', width: 90,
    options: [{ value: 1, label: '低' }, { value: 2, label: '中' }, { value: 3, label: '高' }] }
]
```

## 完整列配置示例

```javascript
const columns = [
  { type: 'rec_no' },                                              // 行号
  { type: 'check', field: 'checked', headerCheckbox: true },       // 勾选列 + 表头全选
  { field: 'name', caption: '姓名', type: 'text', sortable: true },
  { field: 'amount', caption: '金额', type: 'currency' },
  { field: 'status', caption: '状态',
    mappings: { active: '启用', inactive: '停用', default: '未知' } },
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

横向滚动时固定左侧 N 列（需配合较宽的固定列宽）：

```html
<mu-table
  :records="records"
  :columns="columns"
  :fixed-left-columns="2" />
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
| `type` | String\|Object | 列类型（见上表，缺省 `text`）或自定义类型对象 |
| `width` / `minWidth` / `maxWidth` | String\|Number | 列宽 |
| `align` | String | `left` \| `center` \| `right` |
| `sortable` | Boolean | 是否可排序 |
| `text` | String\|Function | 单元格显示文本（可覆盖默认值，优先于 `mappings` / `options`）|
| `value` | String\|Function | 单元格值（可覆盖 field）|
| `title` | String\|Function | 单元格 title（`true` 时为 link/tag 类型开启省略项的 title 提示）|
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String\|Function | 表头 class / 样式 |
| `mappings` | Object | 显示映射（`text` / `number` / `bool` 列及未指定 type 的列），见「显示映射」|
| `options` | Array | 选项数组自动转换为显示映射（格式同 `mu-select`），`mappings` 优先 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatter` | Function | 日期格式化函数 `(value, format) => text` |
| `formatOption` | Object | `Intl.NumberFormat` 选项（`number` / `currency` 类型）|
| `locale` / `locales` | String | 数字 / 货币格式化 locale（默认 `'zh-CN'`）|
| `links` | Function | 链接生成函数 `(record, value) => 链接数组`（`link` 类型），链接项 `{ caption, color, danger, disabled }`；不传时按字段值转换 |
| `linkOption` | Object | `{ max, class, style, color, danger, disabled }`，为全部链接项设置缺省值 |
| `tags` | Function | 标签生成函数 `(record, value) => 标签数组`（`tag` 类型）|
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示表头全选框（`check` 类型）；需同时传表格级 `header-checked` prop |
