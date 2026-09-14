# 列表项 MuListItem / MuListDivider

列表项与分隔项，用于构建简单的导航列表、菜单列表（常与 [MuDropdown](/components/dropdown)、`MuScrollBox` 等容器组合）。

## 基础用法

<div class="mu-demo">
  <div style="width: 240px; border: 1px solid var(--mu-border-color-soft); border-radius: 4px;">
    <mu-list-item icon="file" label="列表项 A" />
    <mu-list-item icon="folder" label="列表项 B" />
    <mu-list-divider label="分组" />
    <mu-list-item icon="calendar" label="列表项 C" />
  </div>
</div>

```html
<mu-list-item icon="file" label="列表项 A" />
<mu-list-item icon="folder" label="列表项 B" />
<mu-list-divider label="分组" />
<mu-list-item icon="calendar" label="列表项 C" />
```

## 链接形式 `tag`

`tag="a"` 渲染为链接：

```html
<mu-list-item icon="arrowUpRight" label="外部链接" tag="a" />
```

## 自定义内容

default 插槽覆盖缺省的 icon + label 渲染：

```html
<mu-list-item>
  <mu-icon icon="file" />
  <span class="text-normal">自定义内容</span>
  <mu-badge success>已读</mu-badge>
</mu-list-item>
```

## API

### MuListItem

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 图标 |
| `label` | String | 标题文字 |
| `tag` | String | 渲染标签：默认渲染 `span`，`'a'` 时渲染链接 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（缺省渲染 icon + label） |

### MuListDivider

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 分隔项图标 |
| `label` | String | 分隔项文字 |

| 插槽 | 说明 |
|------|------|
| `default` | 自定义内容（缺省渲染 icon + label） |
