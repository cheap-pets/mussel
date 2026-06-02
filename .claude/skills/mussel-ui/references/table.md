# table.md — 表格组件 API

---

## MuTable

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `records` | Array | — | 数据列表 |
| `columns` | Array | — | 列配置，结构见下方 |
| `key-field` | String | — | 唯一标识字段名 |
| `striped` | Boolean | — | 斑马纹 |
| `hover-mode` | String | — | `none` \| `row` \| `column` \| `cross` \| `cell` |
| `gridlines` | String | — | `none` \| `all` \| `row` \| `column` |
| `selected-record` | Object | — | 当前选中记录（双向绑定）|
| `selected-record-key` | String\|Number | — | 当前选中记录 key（双向绑定）|
| `order-by` | String | — | 排序字段，格式 `field:asc` / `field:desc` |
| `records-offset` | Number | — | 记录偏移量（影响行号显示）|
| `fixed-left-columns` | Number | — | 固定左侧列数 |
| `virtual-scroll` | Boolean | — | 虚拟滚动（大数据量时使用） |
| `placeholder` | String | — | 空单元格占位文本 |
| `table-width` | String | `fit-content` | 表格宽度 |
| `table-min-width` | String | `100%` | 表格最小宽度 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `header-click` | `column` | 表头点击 |
| `cell-click` | `{ record, recordIndex, column }` | 单元格点击 |
| `cell-item-click` | `{ record, column, link/tag }` | 单元格内链接/标签点击 |
| `update:selected-record` | `record` | 选中记录变更 |
| `update:selected-record-key` | `key` | 选中 key 变更 |
| `update:cell-value` | `{ record, column, value }` | 单元格值变更（check 列）|

### Column 配置

| 属性 | 类型 | 说明 |
|------|------|------|
| `field` | String | 数据字段名 |
| `caption` | String | 列标题 |
| `type` | String | 列类型（见下表）|
| `width` / `minWidth` / `maxWidth` | String\|Number | 列宽 |
| `align` | String | `left` \| `center` \| `right` |
| `sortable` | Boolean | 是否可排序 |
| `text` | String\|Function | 单元格显示文本（可覆盖默认值）|
| `value` | String\|Function | 单元格值（可覆盖 field）|
| `title` | String\|Function | 单元格 title |
| `class` / `style` | String\|Function | 单元格 class / 样式 |
| `headerClass` / `headerStyle` | String\|Function | 表头 class / 样式 |
| `multiline` | Boolean | 多行文本（`text` 类型）|
| `lineClamp` | Number\|Function | 行数限制（`text` 类型）|
| `mappings` | Object | 值映射（`enum` / `bool` 类型）|
| `format` | String | 日期格式（`date` / `datetime` 类型）|
| `formatOption` | Object | 格式化选项（`number` / `currency` 类型）|
| `links` | Function | 链接生成函数（`link` 类型），返回链接数组 |
| `linkOption` | Object | `{ max, class, style, danger, disabled }` |
| `tags` | Function | 标签生成函数（`tag` 类型），返回标签数组 |
| `tagOption` | Object | `{ max, class, style, pill, flat, color }` |
| `disabled` | Function | 禁用函数（`check` 类型）|
| `headerCheckbox` | Boolean | 显示头部全选框（`check` 类型）|

### 列类型（type）

| 类型 | 说明 | 默认对齐 | 默认宽度 |
|------|------|---------|---------|
| `text` | 文本 | left | — |
| `rec_no` | 自动行号 | center | 50px |
| `check` | 复选勾选 | center | 50px |
| `bool` | 布尔（是/否），配合 `mappings` | center | — |
| `enum` | 枚举值映射，配合 `mappings` | center | — |
| `date` | 日期格式化 | right | — |
| `datetime` | 日期时间格式化 | right | — |
| `number` | 数字格式化 | right | — |
| `currency` | 货币格式化 | right | — |
| `link` | 链接，配合 `links` 函数 | left | — |
| `tag` | 标签，配合 `tags` 函数 | left | — |
| `img` / `image` | 图片缩略图 | left | — |

### 完整示例

```vue
<template>
  <mu-table
    :records="records"
    :columns="columns"
    key-field="id"
    striped
    hover-mode="row"
    v-model:selected-record-key="selectedKey"
    @cell-item-click="onItemClick"
  />
</template>

<script setup>
const selectedKey = ref(null)
const columns = [
  { type: 'rec_no' },
  { type: 'check', field: 'checked', headerCheckbox: true },
  { field: 'name',    caption: '姓名',   type: 'text', sortable: true },
  { field: 'amount',  caption: '金额',   type: 'currency' },
  { field: 'status',  caption: '状态',   type: 'enum',
    mappings: {
      active:   { text: '启用', class: 'mu-tag--success' },
      inactive: { text: '停用', class: 'mu-tag--danger' }
    }
  },
  { field: 'created', caption: '创建时间', type: 'date', format: 'yyyy-MM-dd' },
  { field: 'actions', caption: '操作',   type: 'link',
    linkOption: { max: 3 },
    links: (record) => [
      { caption: '编辑', action: 'edit' },
      { caption: '删除', action: 'delete', danger: true }
    ]
  }
]
</script>
```
