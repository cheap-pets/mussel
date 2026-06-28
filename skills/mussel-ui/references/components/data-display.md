# 数据展示组件 API

### MuListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 图标 |
| `label` | String | 标题文字 |
| `tag` | String | 渲染标签：`div`（默认）\| `a` |

### MuListDivider

列表分隔项，无属性。

---

### MuTree

| 属性 | 类型 | 说明 |
|------|------|------|
| `data` | Array | 树节点数据 |
| `props` | Object | 节点数据属性映射 |
| `buttons` | Array | 节点工具按钮 |
| `checkbox` | Boolean | 是否显示勾选框 |
| `cascaded-check` | Boolean | 是否级联勾选 |
| `checked-nodes-keys` | Set | 已勾选节点 key 集合 |
| `auto-expand-level` | Number | 自动展开层级数 |
| `active-node` | Object\|Number\|String | 当前选中节点 |
| `node-icons` | Boolean\|Object | 是否显示节点图标及自定义图标 |
| `expand-icons` | Boolean\|Object | 是否显示展开图标及自定义 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-click` | `node` | 节点点击（不含展开按钮） |
| `node-expand` / `node-collapse` | `node` | 展开/收拢（可用于懒加载）|
| `node-button-click` | `node, button` | 节点工具按钮点击 |
| `node-check-change` | `node, checked` | 勾选状态变更 |

| 插槽 | 说明 |
|------|------|
| `default` | 节点内容模板，作用域参数为 `node` |
| `buttons` | 节点工具按钮模板，作用域参数为 `node` |

---

### MuTags

标签组。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `tags` | Array | — | 标签数据 |
| `max` | Number | — | 最大显示数量，超出合并省略 |
| `removable` | Boolean | — | 是否可删除 |
| `expandable` | Boolean | — | 是否可下拉展开所有标签 |
| `tooltip` | Boolean | `true` | 标签是否显示 tooltip |
| `dropdown-anchor` | — | 父节点 | 下拉面板锚点目标 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `tag-remove` | `tag` | 点击删除按钮 |

---

### MuCalendar

月历，用于页面内嵌日期展示与选择。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `model-value` | Date\|String\|Object\|Array | — | 双向绑定日期值 |
| `format` | String | `yyyy-MM-dd` | String 类型下的格式 |
| `value-type` | String | `date` | 返回类型：`date` \| `string` \| `object` |
| `range` | Boolean | — | 范围选择模式 |
| `min` | Date\|String | — | 最小可选日期 |
| `max` | Date\|String | — | 最大可选日期 |

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

---

### MuPagination

分页组件，常与 `MuTable` 配合使用（作为表格的平级兄弟节点，置于表格下方）。

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page-index` | Number | `0` | 双向绑定，当前页码（从 0 开始） |
| `page-size` | Number | `20` | 双向绑定，每页条数 |
| `total` | Number | `0` | 记录总数（总页数由 `total / page-size` 派生） |
| `page-size-options` | Array | — | 可选每页条数，如 `[20, 50, 100]`；提供后渲染下拉切换 |
| `size` | String | `normal` | 工具栏尺寸：`small` \| `normal`（默认）；控制内部按钮尺寸 |
| `button-style` | String | `text` | 内部按钮风格：`normal` \| `outline` \| `text` \| `link` |
| `quick-jumper` | Boolean | — | 是否显示快速跳页输入框 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:page-index` | `pageIndex` | 页码变更 |
| `update:page-size` | `pageSize` | 每页条数变更 |


```html
<mu-table :records="records" :columns="columns" />
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total"
  :page-size-options="[20, 50, 100]"
  size="small"
  quick-jumper
  class="mt-1x" />
```
