# 中性色按用途分离设计方案

> 日期：2026-03-30
> 状态：待实现

## 背景

Mussel 4 当前的灰色系统由单一色板（neutral0 ~ neutral9，10 级）生成，文本、边框、背景的语义变量均映射到同一套色板。存在以下问题：

1. 级数不灵活 — 文本可能需要 7 级但边框只需 4 级，无法独立控制
2. 色温无法差异化 — text/border/bg 共享相同色相和饱和度参数
3. bg-strong/bg-disabled 使用纯黑 rgba，与蓝色调灰色色板存在色温割裂
4. border-color-strong 被引用但未定义（BUG）
5. text-soft/text-muted 在白底上对比度偏低

## 方案

扩展 `generateNeutralPalette`，增加 `purpose` 配置参数（`text` / `border` / `bg`），为三种用途独立生成灰度色板。保持单一生成函数，通过参数化实现差异化。

## 1. 生成函数改造

### PURPOSE_CONFIG

```js
const PURPOSE_CONFIG = {
  text: {
    count: 10,            // text-gray-0 ~ text-gray-9
    densityFactor: 1.0,   // 线性分布，完全均匀
    saturationRatio: 0.35, // 略高，偏冷保证对比度
    hueShift: 0           // 跟随主色色相
  },
  border: {
    count: 5,             // border-gray-0 ~ border-gray-4
    densityFactor: 1.5,   // 均匀分布
    saturationRatio: 0.2, // 低饱和，不喧宾夺主
    hueShift: 0           // 色相居中
  },
  bg: {
    count: 5,             // bg-gray-0 ~ bg-gray-4
    densityFactor: 1.5,
    saturationRatio: 0.15, // 最低饱和，最中性
    hueShift: 5           // 微偏暖（逆时针旋转色相），视觉舒适
  }
}
```

色板（raw）与语义映射关系：文本 10 级 → 语义 5 级，边框 5 级 → 语义 3 级，背景 5 级 → 语义 3 级。多余级别留作备用，组件可直接引用原始色板变量。

### generateNeutralPalette 签名变更

```js
// 当前
generateNeutralPalette(baseColor, count = 10, densityFactor = 1.8)

// 改后（向后兼容）
generateNeutralPalette(baseColor, count = 10, densityFactor = 1.8, { saturationRatio = 0.3, hueShift = 0 } = {})
```

算法中 `hsv.s * 0.3 * normalizedIndex` 改为 `hsv.s * saturationRatio * normalizedIndex`，`hsv.h` 加上 `hueShift`。

### complementColors 改造

```js
// 保留原 neutral 色板生成（向后兼容 --mu-gray-*）
const neutralColors = generateNeutralPalette(neutral || primary, 10, 1)
appendColors('neutral', neutral || neutralColors[10], neutralColors)

// 新增三组用途色板
Object.entries(PURPOSE_CONFIG).forEach(([purpose, config]) => {
  const palette = generateNeutralPalette(
    neutral || primary,
    config.count,
    config.densityFactor,
    config
  )
  const name = purpose + 'Gray'
  appendColors(name, palette[Math.floor(config.count / 2)], palette)
})
```

输出键名：`textGray0` ~ `textGray9`、`textGray`、`borderGray0` ~ `borderGray4`、`borderGray`、`bgGray0` ~ `bgGray4`、`bgGray`。

CSS 变量映射规则（在 `setupColors` 的 kebabCase 替换中处理）：`textGray` → `--mu-text-gray`、`textGray0` → `--mu-text-gray-0`，以此类推。

## 2. CSS 变量体系

### 新增原始灰度色板

```scss
// 保留原有 10 级，向后兼容
--mu-gray: var(--mu-gray-5);
--mu-gray-0 ~ --mu-gray-9;

// 文本灰（10 级，0=最浅, 9=最深）
--mu-text-gray: var(--mu-text-gray-5);
--mu-text-gray-0 ~ --mu-text-gray-9;

// 边框灰（5 级，0=最浅, 4=最深）
--mu-border-gray: var(--mu-border-gray-2);
--mu-border-gray-0 ~ --mu-border-gray-4;

// 背景灰（5 级，0=最浅, 4=最深）
--mu-bg-gray: var(--mu-bg-gray-2);
--mu-bg-gray-0 ~ --mu-bg-gray-4;
```

### 亮色模式语义变量映射

```scss
// 文本（名称全部保留，指向 text-gray）
--mu-text-color-clear:    var(--mu-text-gray-9);   // 最深，输入框文字
--mu-text-color-normal:   var(--mu-text-gray-7);   // 正常正文
--mu-text-color-subtle:   var(--mu-text-gray-5);   // 新增，次级正文
--mu-text-color-soft:     var(--mu-text-gray-4);   // 标签、辅助文字
--mu-text-color-muted:    var(--mu-text-gray-3);   // 次要信息 + placeholder

// 边框（指向 border-gray）
--mu-border-color-normal: var(--mu-border-gray-2);  // 新增，默认边框
--mu-border-color:        var(--mu-border-color-normal);  // 别名，向后兼容
--mu-border-color-strong: var(--mu-border-gray-3);  // 新增，修复未定义 BUG
--mu-border-color-muted:  var(--mu-border-gray-1);  // 弱化边框

// 背景（统一使用 bg-gray-4，透明度区分层级）
--mu-bg-normal:           #fff;
--mu-bg-strong:           rgb(from var(--mu-bg-gray-4) r g b / 0.08);
--mu-bg-marked:           rgb(from var(--mu-bg-gray-4) r g b / 0.14);
--mu-bg-disabled:         rgb(from var(--mu-bg-gray-4) r g b / 0.11);
--mu-bg-overlay:          var(--mu-bg-normal);
--mu-bg-mask:             rgba(0, 0, 0, .5);          // 不变，遮罩层用纯黑半透明
```

语义变量从色板中间区域跳选（而非连续取），留出更多中间级别供组件按需使用。

bg-strong/bg-marked/bg-disabled 统一使用 bg-gray 色板的一个级别（亮色用 bg-gray-4，暗色用 bg-gray-0），纯靠透明度区分层级：strong(8%) < disabled(11%) < marked(14%)。消除与纯黑 rgba 的色温割裂，同时简化配置。

### 暗色模式映射

```scss
.mu-dark {
  // 文本：索引反转，间距拉开展开层次
  --mu-text-color-clear:    var(--mu-text-gray-0);
  --mu-text-color-normal:   var(--mu-text-gray-2);
  --mu-text-color-subtle:   var(--mu-text-gray-4);
  --mu-text-color-soft:     var(--mu-text-gray-5);
  --mu-text-color-muted:    var(--mu-text-gray-6);

  // 边框：索引反转（深色背景上 strong 最浅最醒目，faint 最深最隐蔽）
  --mu-border-color-normal: var(--mu-border-gray-2);
  --mu-border-color:        var(--mu-border-color-normal);  // 别名
  --mu-border-color-strong: var(--mu-border-gray-0);
  --mu-border-color-muted:  var(--mu-border-gray-3);

  // 背景（统一使用 bg-gray-0，透明度与亮色模式一致）
  --mu-bg-normal:     #000;
  --mu-bg-strong:     rgb(from var(--mu-bg-gray-0) r g b / 0.08);
  --mu-bg-marked:     rgb(from var(--mu-bg-gray-0) r g b / 0.14);
  --mu-bg-disabled:   rgb(from var(--mu-bg-gray-0) r g b / 0.11);
  --mu-bg-overlay:    var(--mu-bg-gray-4);
}
```

映射逻辑与当前一致：文本/边框索引反转，text-soft 不变；背景透明度亮暗模式相同。

## 3. 向后兼容

- `--mu-text-color-weak` 移除，placeholder 改用 `text-color-muted`
- 原有 `--mu-gray-0` ~ `--mu-gray-9` 继续生成（Switch 等组件直接引用）
- 现有语义变量值映射关系不变
- bg-strong/bg-marked/bg-disabled 色值有微妙变化（从纯黑 rgba 改为 bg-gray 基色 rgba，且统一使用单一 palette 级别），视觉差异极小
- generateNeutralPalette 新参数均有默认值，不影响现有调用

## 4. 改动范围

| 文件 | 改动 |
|------|------|
| `src/utils/color.js` | `generateNeutralPalette` 增加 `saturationRatio`、`hueShift` 参数；新增 `PURPOSE_CONFIG` 常量 |
| `src/colors.js` | `complementColors` 中为 text/border/bg 三组用途分别生成色板；`setupColors` 的变量名映射规则扩展 |
| `src/styles/root.scss` | 添加三组新 CSS 变量，更新语义变量指向，移除 `--mu-text-color-weak` |
| `src/styles/dark.scss` | 暗色模式映射更新 |
| 组件 SCSS | input.scss 中 placeholder 改用 `text-color-muted`；typography.scss 移除 `.mu-text-color-weak` |

## 5. 新增语义变量使用场景

| 变量 | 场景 |
|------|------|
| `--mu-text-color-subtle` | 表格列次要文字、描述性文字（介于 normal 和 muted 之间） |
| `--mu-border-color-strong` | 表格列分隔线（修复现有 BUG）、强调边框 |
