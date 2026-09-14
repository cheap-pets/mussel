# 单轴滚动区 MuScrollArea

单轴滚动容器，**不渲染滚动条**：内容溢出时，横向布局在右侧显示左右位移按钮，`vertical` 纵向布局在底部显示上下位移按钮。位移按钮轻点位移一步，按住连续滚动，到达边界后对应按钮自动禁用。

`MuTabBar` 的按钮区即由它实现——适合工具栏、页签栏等单轴排布、内容可能溢出的场景。

## 基础用法

缩窄容器宽度使内容溢出，观察右侧位移按钮：

<div class="mu-demo mu-demo-col" style="align-items: stretch;">
  <mu-scroll-area style="width: 320px; padding: 4px; background: var(--mu-bg-fill);">
    <mu-button v-for="i in 12" :key="i" size="small" :caption="`标签 ${i}`" />
  </mu-scroll-area>
  <mu-scroll-area vertical style="width: 320px; height: 140px; padding: 4px; background: var(--mu-bg-fill);">
    <div v-for="i in 20" :key="i" class="text-normal" style="padding: 4px 8px;">列表项 {{ i }}</div>
  </mu-scroll-area>
</div>

```html
<!-- 横向（默认）：溢出时右侧显示位移按钮 -->
<mu-scroll-area>
  <mu-button v-for="i in 12" :key="i" size="small" :caption="`标签 ${i}`" />
</mu-scroll-area>

<!-- 纵向：溢出时底部显示上下位移按钮 -->
<mu-scroll-area vertical>
  <div v-for="i in 20" :key="i">列表项 {{ i }}</div>
</mu-scroll-area>
```

## 滚动到指定子元素

`scrollIntoView(el)` 常用于「活动项自动滚入可视区」：

```html
<mu-scroll-area ref="areaRef">
  <div
    v-for="(item, i) in items"
    :key="i"
    :ref="el => setItemRef(el, i)">
    {{ item }}
  </div>
</mu-scroll-area>
```

```javascript
// 活动项变化时滚动到可视区
watch(activeIndex, (i) => areaRef.value?.scrollIntoView(itemEls[i]))
```

## API

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `vertical` | Boolean | `false` | 纵向布局（子项竖排，溢出时底部显示上下位移按钮） |

| 插槽 | 说明 |
|------|------|
| `default` | 滚动内容 |
| `overflow-buttons` | 追加到位移按钮区的额外按钮（仅溢出时渲染） |

**方法（通过 ref 调用）：** `scrollIntoView(el)` — 将指定子元素滚动到可视区（已在区内不滚动）。

## 与 MuScrollBox 的选择

| | MuScrollBox | MuScrollArea |
|---|---|---|
| 滚动方式 | 自定义滚动条，任意方向 | 位移按钮，单轴 |
| 适用场景 | 内容区（列表、面板、弹层内容） | 工具栏、页签栏等单轴排布 |
