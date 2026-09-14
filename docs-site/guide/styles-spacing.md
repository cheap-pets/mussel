# 间距与尺寸

间距体系基于 `--mu-base-spacing`（默认 8px）的倍数，配套 padding / margin / gap 原子类；控件高度提供三档尺寸变量。

## CSS 变量

### 间距

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--mu-base-spacing` | `8px` | 布局间距基准，所有 `{n}x` 类均以此为倍数 |
| `--mu-half-spacing` | `4px` | 半倍间距（base-spacing / 2），组件内紧凑间距 |
| `--mu-inline-spacing` | `6px` | 行内元素间距，图标与文字之间等 |

间距倍数对照（原子类后缀）：

| 后缀 | 像素值 | 典型用途 |
|------|--------|---------|
| `0` | 0 | 清除间距 |
| `half` | 4px | 紧凑组件内部微小间距 |
| `1x` | 8px | 紧凑元素内边距 |
| `2x` | 16px | 常规卡片内边距 |
| `3x` | 24px | 区块间距 |
| `4x` | 32px | 大区域分隔 |

### 控件尺寸

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-control-height-normal` | `32px` | 默认控件高度 |
| `--mu-control-height-small` | `24px` | 小尺寸控件 |
| `--mu-control-height-large` | `40px` | 大尺寸控件 |

## 原子类

### 内外边距

间距基于 `--mu-base-spacing`（默认 8px）的倍数，padding/margin 均支持后缀 `-0` / `-half` / `-{1~4}x` / `-auto`（值为 `auto`）。

| 类名 | 说明 |
|------|------|
| `.p-{s}` / `.px-{s}` / `.py-{s}` | 上下左右 / 水平 / 垂直 padding |
| `.pt-{s}` / `.pr-{s}` / `.pb-{s}` / `.pl-{s}` | 单方向 padding |
| `.m-{s}` / `.mx-{s}` / `.my-{s}` | 上下左右 / 水平 / 垂直 margin |
| `.mt-{s}` / `.mr-{s}` / `.mb-{s}` / `.ml-{s}` | 单方向 margin |

### Gap

适用于 flex / grid 容器。

| 类名 | 说明 |
|------|------|
| `.gap-none` | gap: unset |
| `.gap-half` | gap: 4px |
| `.gap-{n}x` | gap: n × 8px（n: 1 ~ 4） |
