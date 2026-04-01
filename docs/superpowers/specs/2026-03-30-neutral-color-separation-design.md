# 中性色按用途分离设计方案

> 日期：2026-03-30
> 状态：已实现

## 背景

Mussel 4 当前的灰色系统由单一色板（neutral0 ~ neutral9，10 级）生成，文本、边框、背景的语义变量均映射到同一套色板。存在以下问题：

1. 级数不灵活 — 文本可能需要 7 级但边框只需 4 级，无法独立控制
2. 色温无法差异化 — text/border/bg 共享相同色相和饱和度参数
3. bg-strong/bg-disabled 使用纯黑 rgba，与蓝色调灰色色板存在色温割裂
4. border-color-strong 被引用但未定义（BUG）
5. text-soft/text-muted 在白底上对比度偏低

## 方案

生成 **20 级完整灰度色板**，通过**偶数/奇数索引分离**为前景色和背景色两组，实现用途差异化。

## 1. 生成函数改造

### 单一 20 级色板

```js
const fullGray = generateNeutralPalette(neutral || primary, {
  count: 20,            // 完整灰度，0=最浅, 19=最深
  densityFactor: 1.2,   // 略偏向浅色密集
  saturationRatio: 0.2, // 中等饱和度
  hueShift: 0           // 跟随主色色相
})
```

### 偶数/奇数分离

```js
// 偶数索引 → gray-0~9（前景色：text + border）
fullGray.forEach((color, i) => {
  if (i % 2 === 0) result[`gray${i / 2}`] = color
})

// 奇数索引 → bg-gray-0~9（背景色）
fullGray.forEach((color, i) => {
  if (i % 2 === 1) result[`bgGray${Math.floor(i / 2)}`] = color
})
```

**色板映射关系：**

| 索引 | 前景变量 | 背景变量 |
|------|----------|----------|
| 0,1 | gray-0 | bg-gray-0 |
| 2,3 | gray-1 | bg-gray-1 |
| 4,5 | gray-2 | bg-gray-2 |
| 6,7 | gray-3 | bg-gray-3 |
| 8,9 | gray-4 | bg-gray-4 |
| 10,11 | gray-5 | bg-gray-5 |
| 12,13 | gray-6 | bg-gray-6 |
| 14,15 | gray-7 | bg-gray-7 |
| 16,17 | gray-8 | bg-gray-8 |
| 18,19 | gray-9 | bg-gray-9 |

## 2. CSS 变量体系

### 新增灰度色板

```scss
// 前景色（10 级，来自 20 级色板的偶数索引）
--mu-gray: var(--mu-gray-5);
--mu-gray-0 ~ --mu-gray-9;

// 背景色（10 级，来自 20 级色板的奇数索引）
--mu-bg-gray: var(--mu-bg-gray-4);
--mu-bg-gray-0 ~ --mu-bg-gray-9;
```

### 亮色模式语义变量映射

```scss
// 文本（指向 gray）
--mu-text-color-strong:  var(--mu-gray-9);   // 最深，输入框文字
--mu-text-color-normal:  var(--mu-gray-7);   // 正常正文
--mu-text-color-subtle:  var(--mu-gray-5);   // 次级正文
--mu-text-color-soft:    var(--mu-gray-4);   // 标签、辅助文字
--mu-text-color-muted:   var(--mu-gray-3);   // 次要信息 + placeholder

// 边框（指向 gray）
--mu-border-color-soft:  var(--mu-gray-1);   // 弱化边框
--mu-border-color-normal: var(--mu-gray-2);  // 默认边框
--mu-border-color-strong: var(--mu-gray-3);  // 强调边框

// 背景（统一使用 bg-gray-1，透明度区分层级）
--mu-bg-normal:    #fff;
--mu-bg-strong:    rgb(from var(--mu-bg-gray-1) r g b / 0.08);
--mu-bg-disabled:  rgb(from var(--mu-bg-gray-1) r g b / 0.12);
--mu-bg-overlay:   var(--mu-bg-normal);
--mu-bg-mask:      rgba(0, 0, 0, .5);

// 页面结构背景
--mu-bg-header:    var(--mu-bg-gray-0);
--mu-bg-footer:    var(--mu-bg-gray-0);
--mu-bg-stripe:    var(--mu-bg-gray-0);
```

### 暗色模式映射

```scss
.mu-dark {
  // 文本：索引反转，间距拉开展开层次
  --mu-text-color-strong:  var(--mu-gray-0);
  --mu-text-color-normal:  var(--mu-gray-2);
  --mu-text-color-subtle:  var(--mu-gray-4);
  --mu-text-color-soft:    var(--mu-gray-5);
  --mu-text-color-muted:   var(--mu-gray-6);

  // 边框：索引反转（深色背景上 strong 最浅最醒目，soft 最深最隐蔽）
  --mu-border-color-soft:  var(--mu-gray-3);
  --mu-border-color-normal: var(--mu-gray-2);
  --mu-border-color-strong: var(--mu-gray-1);

  // 背景（统一使用 bg-gray-9，透明度与亮色模式一致）
  --mu-bg-normal:    var(--mu-bg-gray-9);
  --mu-bg-strong:    rgb(from var(--mu-bg-gray-0) r g b / 0.08);
  --mu-bg-overlay:   var(--mu-gray-8);
  --mu-bg-header:    var(--mu-bg-gray-9);
  --mu-bg-footer:    var(--mu-bg-gray-9);
  --mu-bg-stripe:    var(--mu-bg-gray-9);
  --mu-bg-disabled:  rgb(from var(--mu-bg-gray-0) r g b / 0.12);
}
```

映射逻辑：文本/边框索引反转；背景透明度亮暗模式相同；bg-overlay 指向 gray-8 营造层级感。

## 3. 向后兼容

- 原有 `--mu-gray-0` ~ `--mu-gray-9` 继续生成（Switch 等组件直接引用）
- 现有语义变量值映射关系不变
- bg-strong/bg-disabled 色值有微妙变化（从纯黑 rgba 改为 bg-gray 基色 rgba），视觉差异极小
- generateNeutralPalette 的 options 参数均为可选，有默认值

## 4. 改动范围

| 文件 | 改动 |
|------|------|
| `src/utils/color.js` | `generateNeutralPalette` 参数改为 options 对象，增加 `saturationRatio`、`hueShift` |
| `src/colors.js` | 生成 20 级色板，按偶奇分离为 gray/bg-gray 两组 |
| `src/styles/root.scss` | 移除 text-gray/border-gray，统一使用 gray；bg-gray 扩展为 10 级 |
| `src/styles/dark.scss` | 暗色模式映射更新 |

## 5. 新增语义变量使用场景

| 变量 | 场景 |
|------|------|
| `--mu-text-color-subtle` | 表格列次要文字、描述性文字（介于 normal 和 muted 之间） |
| `--mu-border-color-normal` | 默认边框颜色 |
| `--mu-border-color-strong` | 表格列分隔线、强调边框 |
| `--mu-bg-header` | 页眉背景 |
| `--mu-bg-footer` | 页脚背景 |
| `--mu-bg-stripe` | 斑马纹行背景 |
