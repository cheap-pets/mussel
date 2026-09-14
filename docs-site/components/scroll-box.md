<script setup>
  import { ref } from 'vue'

  const boxRef = ref()
</script>

# 滚动容器 MuScrollBox

带 Mussel 风格自定义滚动条的滚动容器，替代原生滚动条，默认自带 `overflow: auto`，由 overflow 样式控制滚动方向。适合任意方向的内容区滚动。

也可以用 `v-mu-scrollbar` 指令为**任意已有容器**添加同款滚动条（不改变 DOM 结构，零包裹）。

## 组件形式

<div class="mu-demo">
  <mu-scroll-box style="height: 140px; width: 45%;">
    <div style="height: 600px; background: linear-gradient(var(--mu-primary-faint), var(--mu-success-faint)); padding: 12px;">
      纵向滚动内容
    </div>
  </mu-scroll-box>
  <mu-scroll-box style="height: 140px; width: 45%;">
    <div style="width: 800px; height: 400px; background: linear-gradient(var(--mu-warning-faint), var(--mu-danger-faint)); padding: 12px;">
      横向 + 纵向滚动内容
    </div>
  </mu-scroll-box>
</div>

```html
<!-- 组件形式，默认自带 overflow: auto -->
<mu-scroll-box style="height: 400px">内容</mu-scroll-box>
```

## 指令形式 `v-mu-scrollbar`

为任意容器添加同款滚动条；指令值为 `false`（或历史兼容值 `'none'`）时不渲染滚动条。

<client-only>
  <div class="mu-demo">
    <div v-mu-scrollbar style="overflow: auto; height: 140px; width: 45%;">
      <div style="width: 800px; height: 600px; background: linear-gradient(var(--mu-warning-faint), var(--mu-danger-faint)); padding: 12px;">
        指令形式（横向 + 纵向）
      </div>
    </div>
    <div v-mu-scrollbar="false" style="overflow: auto; height: 140px; width: 45%; border: 1px dashed var(--mu-border-color-normal); padding: 12px;">
      指令值 false → 原生滚动条
      <div style="height: 300px;" />
    </div>
  </div>
</client-only>

```html
<!-- 为任意容器添加同款滚动条 -->
<div v-mu-scrollbar style="overflow: auto; height: 400px">内容</div>

<!-- 指令值为 false 时不渲染滚动条 -->
<div v-mu-scrollbar="false" style="overflow: auto">内容</div>
```

## 配合粘性定位

滚动容器内支持 `position: sticky` 子元素（表头吸顶、工具条吸附等）：

```html
<mu-scroll-box style="height: 400px">
  <div style="position: sticky; top: 0;">吸附在顶部的表头</div>
  <div style="height: 2000px">长内容</div>
</mu-scroll-box>
```

## API

无 props，仅默认插槽。滚动方向由内容的溢出方式决定（配合 `overflow-*` 原子类或内联样式控制）。

> 与 [MuScrollArea](/components/scroll-area) 的区别：`MuScrollBox` 渲染 Mussel 风格自定义滚动条，适合任意方向的内容区；`MuScrollArea` 以位移按钮代替滚动条，适合工具栏、页签栏等单轴排布场景。
