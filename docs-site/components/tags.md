<script setup>
  import { ref } from 'vue'

  const tags = ref([
    { label: '重要', color: 'danger' },
    { label: '进行中', color: 'primary' },
    { label: '已排期' },
    { label: '前端' },
    { label: '后端' },
    { label: '测试' }
  ])

  function removeTag (tag) {
    tags.value = tags.value.filter(t => t !== tag)
  }
</script>

# 标签组 MuTags

标签组组件，批量展示标签。支持删除、超出合并省略与下拉展开全部，常用于记录的标签字段展示、筛选条件回显等场景。

标签颜色使用语义色名（`primary` / `success` / `warning` / `danger` 等）。

## 基础用法

<div class="mu-demo">
  <mu-tags :tags="tags" />
</div>

```html
<mu-tags :tags="tags" />
```

## 可删除 `removable`

显示删除按钮，`tag-remove` 事件回调中同步数据：

<div class="mu-demo">
  <mu-tags :tags="tags" removable @tag-remove="removeTag" />
</div>

```html
<mu-tags :tags="tags" removable @tag-remove="onRemove" />
```

```javascript
function onRemove (tag) {
  tags.value = tags.value.filter(t => t !== tag)
}
```

## 超出省略与展开 `max` / `expandable`

`max` 限制最大显示数量，超出合并为「+N」；`expandable` 允许通过下拉面板查看全部标签：

<div class="mu-demo">
  <mu-tags :tags="tags" :max="3" expandable />
</div>

```html
<mu-tags :tags="tags" :max="3" expandable />
```

> `tooltip` 属性默认开启——标签文字超长省略时悬停显示完整内容。
> 组件将外部传入的 `dropdown-*` 前缀 attrs（如 `dropdown-class`、`dropdown-trigger` 等）透传给内部 `MuDropdown`，可用于定制溢出标签的下拉面板。

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `tags` | Array | — | 标签数据 |
| `max` | Number | — | 最大显示数量，超出合并省略 |
| `removable` | Boolean | — | 是否可删除 |
| `expandable` | Boolean | — | 是否可下拉展开所有标签 |
| `tooltip` | Boolean | `true` | 标签是否显示 tooltip |
| `dropdown-anchor` | — | `'$parent'` | 下拉面板锚点目标 |

| 事件 | 参数 | 说明 |
|------|------|------|
| `tag-remove` | `tag` | 点击删除按钮 |
