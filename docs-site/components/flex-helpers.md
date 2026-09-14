# Flex 辅助组件

flex 辅助元素的组件形式，与同名原子类完全等价，接受透传的 attrs（如 `class`、`space`）：

| 组件 | 等价原子类 | 用途 |
|------|-----------|------|
| `<mu-flex-divider>` | `.flex-divider` | 垂直分隔线（`--stroke-1`~`--stroke-4` / `--pill` 变体用 class 附加） |
| `<mu-flex-space>` | `.flex-space` | 弹性占位；`space="1x"` ~ `"4x"` 为等间距变体 |
| `<mu-flex-break>` | `.flex-break` | 强制换行（`flex: 0 0 100%`） |

## 弹性占位 MuFlexSpace

`flex: 1 1 0`，把两侧内容推到两端。设置 `space` 属性时变为固定宽度等间距（`flex: 0 0 n×8px`）。

<div class="mu-demo" style="align-items: stretch;">
  <mu-h-box align-items="center" style="width: 100%; padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="左侧" />
    <mu-flex-space />
    <mu-button size="small" caption="右侧" />
  </mu-h-box>
</div>

```html
<mu-h-box align-items="center">
  <mu-button caption="左侧" />
  <mu-flex-space />
  <mu-button caption="右侧" />
</mu-h-box>
```

## 垂直分隔线 MuFlexDivider

`flex: 0 0 2px` 的垂直分隔线。通过 class 附加变体：`--stroke-1` ~ `--stroke-4` 控制宽度（1~4px），`--pill` 为胶囊形分隔条。

<div class="mu-demo">
  <mu-button size="small" caption="A" />
  <mu-flex-divider />
  <mu-button size="small" caption="B" />
  <mu-flex-divider class="flex-divider--stroke-4" />
  <mu-button size="small" caption="C" />
</div>

```html
<mu-flex-divider />
<mu-flex-divider class="flex-divider--stroke-4" />
<mu-flex-divider class="flex-divider--pill" />
```

## 强制换行 MuFlexBreak

`flex: 0 0 100%`，强制后续子项换行（用于 flex-wrap 容器内控制换行点）：

<div class="mu-demo">
  <mu-h-box flex-wrap gap="1x" style="width: 280px; padding: 8px; background: var(--mu-bg-fill);">
    <mu-button size="small" caption="A" />
    <mu-button size="small" caption="B" />
    <mu-flex-break />
    <mu-button size="small" caption="换行后的 C" />
  </mu-h-box>
</div>

```html
<mu-h-box flex-wrap>
  <mu-button caption="A" />
  <mu-flex-break />
  <mu-button caption="换行后的 C" />
</mu-h-box>
```

## 原子类等价写法

```html
<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-space" />          <!-- 弹性占位 -->
  <mu-button>B</mu-button>
</div>

<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-divider" />         <!-- 垂直分隔线 -->
  <mu-button>B</mu-button>
</div>
```

## API

三个组件均无业务 props，仅接受透传 attrs；`MuFlexSpace` 额外支持 `space` 属性（`"1x"` ~ `"4x"`，固定宽度等间距变体）。
