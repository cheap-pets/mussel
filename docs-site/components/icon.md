# 图标 MuIcon

图标组件，渲染通过 `installIcons`（或 `install` 的 `icons` 选项）注册的图标。Mussel 内置了一套常用图标（如 `check`、`info`、`alert`、`file`、`folder`、`search`、`loading` 等），业务图标在应用入口统一注册后即可在任意组件的 `icon` 类属性中按名称引用。

图标数据支持两种形式：

- **SVG 源码字符串**：通过文本导入插件（或 `?raw`）导入的 svg 内容
- **icon-font class**：以 `.` 开头的 class 字符串（如 `'.icon icon-bolt'`）

## 基础用法

```javascript
import { install as installMussel, installIcons } from 'mussel'
import EditIcon from '@/assets/icons/edit.svg?raw'

// 安装时注册
installMussel(app, {
  icons: {
    edit: EditIcon,           // SVG 源码字符串
    bolt: 'icon icon-bolt'    // icon-font class
  }
})

// 或后续补充注册
installIcons({ refresh: RefreshIcon })
```

::: warning
使用 vite 打包且未使用文本导入插件时，SVG 需以 `?raw` 导入源码字符串——直接 `import` 得到的是 URL，无法使用。
:::

注册后通过 `icon` 属性渲染：

<div class="mu-demo">
  <mu-icon icon="info" />
  <mu-icon icon="question" />
  <mu-icon icon="alert" />
  <mu-icon icon="ok" />
  <mu-icon icon="file" />
  <mu-icon icon="folder" />
  <mu-icon icon="folderOpen" />
  <mu-icon icon="search" />
  <mu-icon icon="calendar" />
  <mu-icon icon="sun" />
  <mu-icon icon="moon" />
</div>

```html
<mu-icon icon="info" />
<mu-icon icon="folder" />
```

## 动画 `icon:animation`

`icon` 值支持 `名称:动画` 后缀，为图标附加 CSS 动画（如 `spin`、`expand-rotate-90`、`hover-rotate-180` 等）。内置 `loading` 图标即默认携带 `spin` 动画。

<div class="mu-demo">
  <mu-icon icon="refresh:spin" />
  <mu-icon icon="loading" />
  <mu-icon icon="info:spin" />
</div>

```html
<mu-icon icon="refresh:spin" />
<mu-icon icon="loading" />   <!-- 内置 loading 默认 spin -->
```

`animation` 属性单独设置时优先于 `icon` 值中的后缀：

```html
<mu-icon icon="refresh" animation="spin" />
```

## 颜色与尺寸

图标继承文字颜色与字号，直接用样式控制：

<div class="mu-demo">
  <mu-icon icon="info" style="font-size: 20px;" />
  <mu-icon icon="info" style="color: var(--mu-primary-color); font-size: 20px;" />
  <mu-icon icon="ok" style="color: var(--mu-success-color); font-size: 20px;" />
  <mu-icon icon="alert" style="color: var(--mu-warning-color); font-size: 20px;" />
  <mu-icon icon="x" style="color: var(--mu-danger-color); font-size: 20px;" />
</div>

```html
<mu-icon icon="info" style="color: var(--mu-primary-color); font-size: 20px" />
```

## 渲染标签 `tag`

默认渲染为 `span`；传 `'a'` 渲染为链接（常配合 `.mu-link` 使用），其余值回退 `span`。

<div class="mu-demo">
  <a href="javascript:;" class="mu-link">
    <mu-icon icon="arrowUpRight" tag="a" /> 外部链接
  </a>
</div>

```html
<a href="..." class="mu-link"><mu-icon icon="arrowUpRight" tag="a" /></a>
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 已注册图标名，或以 `.` 开头的 icon-font class；可带动画后缀 `name:animation`（如 `loading` 图标默认 `spin`） |
| `animation` | String | 动画效果；单独设置时优先于 `icon` 值中的 `:animation` 后缀 |
| `tag` | String | 渲染的 DOM 标签，默认 `span`（仅 `'a'` 渲染链接，其余值回退 `span`） |

> 运行时可通过 `import { icons } from 'mussel'` 读取已注册图标集合（`key → { svg?, cls?, animation? }`），`Object.keys(icons)` 可列出全部可用图标名。
