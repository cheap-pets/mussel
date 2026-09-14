# 常用布局模式

基于原子类的典型页面结构示例。类名详见[布局与层级](/guide/styles-layout)、[间距与尺寸](/guide/styles-spacing)、[颜色](/guide/styles-colors)。

## 页面框架（Header + Sidebar + Content）

```html
<div class="flex flex-col" style="height: 100vh">
  <header class="flex-none flex items-center px-2x bg-strong">
    页头
  </header>
  <div class="flex flex-1 overflow-hidden">
    <aside class="flex-none overflow-auto bg-strong" style="width: 240px">
      侧边栏
    </aside>
    <main class="flex-1 overflow-auto p-2x">
      内容区
    </main>
  </div>
</div>
```

## 工具栏（左内容 + 右操作）

```html
<div class="flex items-center gap-1x px-2x py-1x border-b border-soft">
  <span class="text-normal">数据列表</span>
  <span class="text-soft ml-2x">共 128 条</span>
  <div class="ml-auto flex items-center gap-1x">
    <button>筛选</button>
    <button>导出</button>
  </div>
</div>
```

## 居中表单区域

```html
<div class="flex flex-1 items-center justify-center p-4x">
  <div class="flex flex-col gap-2x" style="width: 400px">
    <!-- 表单内容 -->
  </div>
</div>
```
