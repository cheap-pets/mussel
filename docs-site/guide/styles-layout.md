# 布局与层级

定位、显示、溢出、Flex 布局与 Z-index 层级控制。间距类（padding / margin / gap）见[间距与尺寸](/guide/styles-spacing)。

## CSS 变量

### Z-index（层级由低到高）

按"要盖住的目标"选层级：盖兄弟元素用 `above`，盖容器内全部内容用 `layer`，全局浮层才用 `popup`。

| 变量 | 默认值 | 含义 | 适用场景 |
|------|--------|------|---------|
| `--mu-z-index-above` | `1` | 兄弟元素微提升 | 同容器内盖过相邻兄弟：active/focus 态、表格固定列与表头、分割条 |
| `--mu-z-index-float` | `1` | 兼容保留 | 新代码勿用，原场景已由 `above` 取代 |
| `--mu-z-index-layer` | `10` | 容器内覆盖层 | 悬浮滚动条、嵌入式抽屉等盖住容器内全部内容的一层 |
| `--mu-z-index-modal` | `100` | 模态遮罩 | 全屏遮罩及模态对话框 |
| `--mu-z-index-popup` | `1000` | 弹出浮层 | 下拉面板、右键菜单、Tooltip |
| `--mu-z-index-ontop` | `10000` | 全局最顶层 | 全局消息提示、Toast、全屏加载动画 |

> 同层级内细粒度偏移：CSS 用 `calc(var(--mu-z-index-<level>) + N)`（如 hover +1 / active +2）；模板用 `.z-*` 原子类配合局部 `--z-offset`。

## 原子类

### 定位

| 类名 | 说明 |
|------|------|
| `.static` | position: static |
| `.fixed` | position: fixed |
| `.absolute` | position: absolute |
| `.relative` | position: relative |
| `.sticky` | position: sticky |
| `.inset-0` | inset: 0 |

### 显示

| 类名 | 说明 |
|------|------|
| `.inline` / `.block` / `.inline-block` | display |
| `.flex` / `.inline-flex` | flex 容器 |
| `.grid` / `.inline-grid` | grid 容器 |
| `.contents` | display: contents |
| `.hidden` | display: none |

### 溢出

| 类名 | 说明 |
|------|------|
| `.overflow-auto` | overflow: auto |
| `.overflow-hidden` | overflow: hidden |
| `.overflow-visible` | overflow: visible |
| `.overflow-clip` | overflow: clip |

### Flex 方向

| 类名 | 说明 |
|------|------|
| `.flex-row` / `.flex-row-reverse` | flex-direction: row / row-reverse |
| `.flex-col` / `.flex-col-reverse` | flex-direction: column / column-reverse |

### Flex 项目

| 类名 | 说明 |
|------|------|
| `.flex-none` | flex: none |
| `.flex-0` | flex: 0 |
| `.flex-1` | flex: 1 1 0 |
| `.flex-2` ~ `.flex-8` | flex: 2 2 0 ~ flex: 8 8 0 |
| `.flex-auto` | flex: auto |
| `.flex-initial` | flex: 0 auto |
| `.flex-grow` / `.flex-shrink` | flex-grow: 1 / flex-shrink: 1 |

### Flex 快捷类

| 类名 | 说明 |
|------|------|
| `.flex-center` | 同时设置 `align-items: center; justify-content: center` |

### Flex 换行

| 类名 | 说明 |
|------|------|
| `.flex-nowrap` / `.flex-wrap` / `.flex-wrap-reverse` | flex-wrap |

### 对齐

| 类名 | 说明 |
|------|------|
| `.items-{value}` | align-items，可用值：center, start, end, baseline, stretch, flex-start, flex-end |
| `.self-{value}` | align-self，另提供 `.self-auto` |
| `.justify-{value}` | justify-content；分布对齐为 `.justify-around` / `.justify-between` / `.justify-evenly`；另提供 `.justify-center-safe` / `.justify-end-safe` |
| `.content-{value}` | align-content；分布对齐为 `.content-around` / `.content-between` / `.content-evenly` |
| `.justify-items-{value}` / `.justify-self-{value}` | Grid 对齐 |

### 层级（Z-index）

| 类名 | 说明 |
|------|------|
| `.z-float` / `.z-layer` / `.z-modal` / `.z-popup` / `.z-ontop` | z-index: 对应 `--mu-z-index-*` 变量 |

> `.z-*` 类实际值为 `calc(var(--mu-z-index-*) + var(--z-offset, 0))`，可通过局部设置 `--z-offset` 在同一层级内做细粒度叠加。

### Flex 辅助元素

| 类名 | 说明 |
|------|------|
| `.flex-space` | 弹性占位，flex: 1 1 0；`space="1x"` ~ `space="4x"` 为等间距变体 |
| `.flex-divider` | 垂直分隔线；`--stroke-1` ~ `--stroke-4` 变体控制宽度，`--pill` 为胶囊形 |
| `.flex-break` | 强制换行，flex: 0 0 100% |

```html
<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-space" />          <!-- 弹性占位，推到两端 -->
  <mu-button>B</mu-button>
</div>

<div class="flex">
  <mu-button>A</mu-button>
  <div class="flex-divider" />         <!-- 垂直分隔线 -->
  <mu-button>B</mu-button>
</div>
```
