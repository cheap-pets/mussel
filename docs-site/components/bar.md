# 条形容器 MuBar

固定高 40px 的条形容器，与 [MuToolbar](/components/toolbar) 共享基础条形样式（flex + 垂直居中 + gap）。无 props，仅默认插槽。

与 MuToolbar 的区别：MuBar 有**固定 40px 高度**，适合页头、页脚、面板标题栏等高度固定的区域；MuToolbar 无固定高度，适合操作区。

`MuDateInput` 下拉面板的工具栏即基于它实现。

## 基础用法

常配合 `.bg-strong`、`.flex-space`、`.flex-divider` 等原子类/辅助元素使用：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-bar class="px-2x bg-strong">
    <span class="text-normal">面板标题</span>
    <span class="text-soft">共 32 条</span>
    <div class="flex-space" />
    <mu-icon-button icon="refresh" button-style="text" />
    <mu-flex-divider />
    <mu-icon-button icon="more" button-style="text" />
  </mu-bar>
</div>

```html
<mu-bar class="px-2x bg-strong">
  <span>标题</span>
  <div class="flex-space" />
  <mu-icon-button icon="X" button-style="text" />
</mu-bar>
```

## 页面框架中的应用

```html
<div class="flex flex-col" style="height: 100vh">
  <mu-bar class="px-2x bg-strong">页头</mu-bar>
  <main class="flex-1 overflow-auto">内容区</main>
  <mu-bar class="px-2x bg-strong">状态栏</mu-bar>
</div>
```

## API

无 props，仅默认插槽。固定高 40px。
