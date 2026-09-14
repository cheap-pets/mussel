# 排序图标 MuSortIcon

排序方向指示图标，常置于表格/列表表头，配合 `MuTable` 的 `sortable` 列或自定义排序逻辑使用。未设置方向时上下三角均不填充，仅显示轮廓；设置 `direction` 后对应方向的三角填充高亮。

## 基础用法

<div class="mu-demo">
  <span class="text-subtle">未设置 <mu-sort-icon /></span>
  <span class="text-subtle">升序 <mu-sort-icon direction="up" /></span>
  <span class="text-subtle">降序 <mu-sort-icon direction="down" /></span>
</div>

```html
<mu-sort-icon />
<mu-sort-icon direction="up" />
<mu-sort-icon direction="down" />
```

## 表头中的用法

```html
<th class="cursor-pointer" @click="onSort('name')">
  姓名 <mu-sort-icon :direction="sortField === 'name' ? sortDirection : ''" />
</th>
```

```javascript
function onSort (field) {
  sortDirection.value =
    sortField.value === field && sortDirection.value === 'up' ? 'down' : 'up'
  sortField.value = field
}
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `direction` | String | 高亮方向：`up`（升序）\| `down`（降序），不设置时上下三角均不填充 |
