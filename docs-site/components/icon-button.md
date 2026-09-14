<script setup>
  import { ref } from 'vue'

  const filterActive = ref(true)
</script>

# 图标按钮 MuIconButton

仅图标的按钮，**不支持文字标题**，常用于工具栏或列表项中的快捷操作。继承 [MuButton](/components/button) 的全部属性（`size` / `color` / `button-style` / `toggle` / `disabled` 等）。

根元素渲染为 `<a class="mu-button mu-icon mu-icon-button">` 而非 `<button>`：无 `href` 时不可通过 Tab 聚焦。

## 基础用法

<div class="mu-demo">
  <mu-icon-button icon="refresh" />
  <mu-icon-button icon="filter" />
  <mu-icon-button icon="search" />
  <mu-icon-button icon="plus" />
  <mu-icon-button icon="settings" />
</div>

```html
<mu-icon-button icon="refresh" @click="reload" />
```

## 颜色 / 风格 / 尺寸

继承 MuButton 的 `color` / `button-style` / `size` 组合：

<div class="mu-demo">
  <mu-icon-button icon="chevronUp" color="danger" />
  <mu-icon-button icon="chevronDown" disabled />
  <mu-icon-button icon="more" button-style="text" />
  <mu-icon-button icon="plus" button-style="outline" />
  <mu-icon-button icon="chevronUp" size="small" />
  <mu-icon-button icon="chevronUp" size="large" />
</div>

```html
<mu-icon-button icon="chevronUp" color="danger" />
<mu-icon-button icon="more" button-style="text" />
<mu-icon-button icon="chevronUp" size="large" />
```

## 开关模式 `toggle`

与 MuButton 相同的开关模式，适合「按下高亮」的筛选类工具按钮：

<div class="mu-demo">
  <mu-icon-button toggle v-model:active="filterActive" icon="filter" />
  <span class="text-subtle">active = {{ filterActive }}</span>
</div>

```html
<mu-icon-button icon="filter" toggle v-model:active="filterVisible" />
```

## API

| 属性 | 类型 | 说明 |
|------|------|------|
| `icon` | String | 按钮图标，需为已注册图标名（icon-font class 需以 `.` 开头） |
| `animation` | String | 动画效果 |
| (其他) | — | 继承 MuButton 属性（`toggle` / `active` / `size` / `color` / `button-style` / `disabled` 等） |

> 根元素为 `<a>` 标签：无 `href` 时不可通过 Tab 聚焦。
