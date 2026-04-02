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

生成 **20 级完整灰度色板**，语义变量从色板中间跳选，文本/边框/背景共享同一色板，通过索引间距拉开层次差异。

## 1. 生成函数改造

### 20 级灰度色板

```js
const grayPalette = generateNeutralPalette(neutral || primary, {
  count: 20,            // 完整灰度，0=最浅, 19=最深
  densityFactor: 1.2,   // 略偏向浅色密集
  saturationRatio: 0.2, // 中等饱和度
  hueShift: 0           // 跟随主色色相
})
```

### 色板输出

```js
// 全部输出为 gray0 ~ gray19（20 级单色板）
grayPalette.forEach((color, i) => {
  result[`gray${i}`] = color
})

// 基色取色板中间值
result.gray = palette[10]
```

**完整色板值（基于主色 #1c7ed6）：**

| 索引 | 变量 | 色值 |
|------|------|------|
| 0 | gray-0 | #f6f6f6 |
| 1 | gray-1 | #eceeef |
| 2 | gray-2 | #e1e4e6 |
| 3 | gray-3 | #d6d9dc |
| 4 | gray-4 | #c9cdd1 |
| 5 | gray-5 | #bdc2c6 |
| 6 | gray-6 | #b0b5ba |
| 7 | gray-7 | #a3a9ae |
| 8 | gray-8 | #969ca2 |
| 9 | gray-9 | #898f95 |
| 10 | gray-10 | #7b8288 |
| 11 | gray-11 | #6e757a |
| 12 | gray-12 | #61676d |
| 13 | gray-13 | #545a5f |
| 14 | gray-14 | #474c51 |
| 15 | gray-15 | #3a3f43 |
| 16 | gray-16 | #2d3135 |
| 17 | gray-17 | #202326 |
| 18 | gray-18 | #131517 |
| 19 | gray-19 | #070808 |

## 2. CSS 变量体系

### 灰度色板

```scss
// 前景/背景共享 20 级色板
--mu-gray: var(--mu-gray-10);
--mu-gray-0 ~ --mu-gray-19;
```

### 亮色模式语义变量映射

```scss
// 文本（指向 gray 深色区域）
--mu-text-color-strong:  var(--mu-gray-18);   // 最深，输入框文字
--mu-text-color-normal:  var(--mu-gray-14);   // 正常正文
--mu-text-color-subtle:  var(--mu-gray-10);   // 次级正文
--mu-text-color-soft:    var(--mu-gray-8);    // 标签、辅助文字
--mu-text-color-muted:   var(--mu-gray-6);    // 次要信息 + placeholder

// 边框（指向 gray 浅/中区域）
--mu-border-color-soft:  var(--mu-gray-4);    // 弱化边框
--mu-border-color-normal: var(--mu-gray-8);   // 默认边框
--mu-border-color-strong: var(--mu-gray-12);  // 强调边框

// 背景（使用色板两端，透明度区分层级）
--mu-bg-normal:    #fff;
--mu-bg-strong:    rgb(from var(--mu-gray-19) r g b / 0.08);
--mu-bg-disabled:  rgb(from var(--mu-gray-19) r g b / 0.12);
--mu-bg-overlay:   var(--mu-bg-normal);
--mu-bg-mask:      rgba(0, 0, 0, .5);

// 页面结构背景
--mu-bg-header:    var(--mu-gray-1);
--mu-bg-footer:    var(--mu-gray-1);
--mu-bg-stripe:    var(--mu-gray-0);
```

### 暗色模式映射

```scss
.mu-dark {
  // 文本：索引反转，间距拉开展开层次
  --mu-text-color-strong:  var(--mu-gray-1);
  --mu-text-color-normal:  var(--mu-gray-4);
  --mu-text-color-subtle:  var(--mu-gray-8);
  --mu-text-color-soft:    var(--mu-gray-10);
  --mu-text-color-muted:   var(--mu-gray-12);

  // 边框：索引反转（深色背景上 strong 最浅最醒目，soft 最深最隐蔽）
  --mu-border-color-soft:  var(--mu-gray-14);
  --mu-border-color-normal: var(--mu-gray-10);
  --mu-border-color-strong: var(--mu-gray-6);

  // 背景（使用色板两端，透明度与亮色模式一致）
  --mu-bg-normal:    var(--mu-gray-19);
  --mu-bg-strong:    rgb(from var(--mu-gray-0) r g b / 0.08);
  --mu-bg-disabled:  rgb(from var(--mu-gray-0) r g b / 0.12);
  --mu-bg-overlay:   var(--mu-gray-17);
  --mu-bg-header:    var(--mu-gray-16);
  --mu-bg-footer:    var(--mu-gray-16);
  --mu-bg-stripe:    var(--mu-gray-18);
}
```

映射逻辑：文本/边框索引反转；背景透明度亮暗模式相同；bg-overlay 指向 gray-17 营造层级感。

## 3. 向后兼容

- 原有 `--mu-gray-0` ~ `--mu-gray-9` 继续生成（Switch 等组件直接引用）
- 现有语义变量值映射关系不变
- bg-strong/bg-disabled 色值有微妙变化（从纯黑 rgba 改为色板端点 rgba），视觉差异极小
- generateNeutralPalette 的 options 参数均为可选，有默认值

## 4. 改动范围

| 文件 | 改动 |
|------|------|
| `src/utils/color.js` | `generateNeutralPalette` 参数改为 options 对象，增加 `saturationRatio`、`hueShift` |
| `src/colors.js` | 生成 20 级色板，全部输出为 gray0 ~ gray19 |
| `src/styles/root.scss` | 灰度扩展为 20 级，语义变量映射更新 |

## 5. 新增语义变量使用场景

| 变量 | 场景 |
|------|------|
| `--mu-text-color-subtle` | 表格列次要文字、描述性文字（介于 normal 和 muted 之间） |
| `--mu-border-color-normal` | 默认边框颜色 |
| `--mu-border-color-strong` | 表格列分隔线、强调边框 |
| `--mu-bg-header` | 页眉背景 |
| `--mu-bg-footer` | 页脚背景 |
| `--mu-bg-stripe` | 斑马纹行背景 |
