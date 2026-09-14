<script setup>
  import { ref } from 'vue'

  const pageIndex = ref(0)
  const pageSize = ref(20)
</script>

# 分页 MuPagination

分页组件，常与 [MuTable](/components/table) 配合使用（作为表格的平级兄弟节点，置于表格下方）。

## 基础用法

<div class="mu-demo mu-demo-col">
  <mu-pagination
    v-model:page-index="pageIndex"
    v-model:page-size="pageSize"
    :total="1000" />
  <span class="text-subtle">页码：{{ pageIndex }}（从 0 开始），每页 {{ pageSize }} 条</span>
</div>

```html
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total" />
```

> `page-index` 从 **0** 开始；总页数由 `total / page-size` 派生。

## 每页条数切换 `page-size-options`

提供可选每页条数后渲染下拉切换：

<div class="mu-demo mu-demo-col">
  <mu-pagination
    v-model:page-index="pageIndex"
    v-model:page-size="pageSize"
    :total="1000"
    :page-size-options="[20, 50, 100]"
    size="small" />
</div>

```html
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="1000"
  :page-size-options="[20, 50, 100]" />
```

## 快速跳页 `quick-jumper`

显示快速跳页输入框：

<div class="mu-demo mu-demo-col">
  <mu-pagination
    v-model:page-index="pageIndex"
    v-model:page-size="pageSize"
    :total="1000"
    :page-size-options="[20, 50, 100]"
    size="small"
    quick-jumper />
</div>

```html
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total"
  :page-size-options="[20, 50, 100]"
  size="small"
  quick-jumper
  class="mt-1x" />
```

## 与表格配合

```html
<mu-table
  :records="pagedRecords"
  :columns="columns"
  :records-offset="pageIndex * pageSize" />
<mu-pagination
  v-model:page-index="pageIndex"
  v-model:page-size="pageSize"
  :total="total"
  class="mt-1x" />
```

> `records-offset` 传给表格，使行号列在翻页后连续计数。
> 尺寸：`size`（`small` / `normal`）未设置时继承外层 [MuToolbar](/components/toolbar) 的 `tool-size`。

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `page-index` | Number | `0` | 双向绑定，当前页码（从 0 开始） |
| `page-size` | Number | `20` | 双向绑定，每页条数 |
| `total` | Number | `0` | 记录总数（总页数由 `total / page-size` 派生） |
| `page-size-options` | Array | — | 可选每页条数，如 `[20, 50, 100]`；提供后渲染下拉切换 |
| `size` | String | — | 按钮尺寸：`small` \| `normal`；未设置时继承外层 MuToolbar 的 `tool-size` |
| `quick-jumper` | Boolean | — | 是否显示快速跳页输入框 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:page-index` | `pageIndex` | 页码变更 |
| `update:page-size` | `pageSize` | 每页条数变更 |
