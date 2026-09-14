# 颜色

颜色 token 分三层使用：**基本色**是原始色板，**语义扩展色**是日常开发的首选，文本/背景等**场景专用变量**进一步收敛用法。

## CSS 变量

### 基本色

用于图标着色、装饰性元素，**不直接用于文本或背景**，应优先使用语义扩展色。

| 变量 | 含义 |
|------|------|
| `--mu-red` | 红色 |
| `--mu-pink` | 粉色 |
| `--mu-grape` | 葡萄紫 |
| `--mu-violet` | 紫罗兰 |
| `--mu-indigo` | 靛蓝 |
| `--mu-blue` | 蓝色 |
| `--mu-cyan` | 青绿色 |
| `--mu-teal` | 蓝绿色 |
| `--mu-green` | 绿色 |
| `--mu-lime` | 青柠色 |
| `--mu-yellow` | 黄色 |
| `--mu-orange` | 橙色 |
| `--mu-gray` | 中性灰（灰阶基准色） |
| `--mu-gray-0` ~ `--mu-gray-19` | 由浅到深的 20 级灰阶 |

### 语义扩展色（优先使用）

日常开发中最常用的颜色变量。带数字后缀的变量为色阶（0 最浅，9 最深）。

| 变量 | 默认映射 | 用途 |
|------|---------|------|
| `--mu-primary-color` | blue | 主操作色，按钮、链接、选中态 |
| `--mu-primary-color-0` ~ `-9` | — | 主色色阶 |
| `--mu-secondary-color` | — | 次要操作色 |
| `--mu-secondary-color-0` ~ `-9` | — | 次要色色阶 |
| `--mu-success-color` | green | 成功、完成状态 |
| `--mu-success-color-0` ~ `-9` | — | 成功色色阶 |
| `--mu-warning-color` | orange | 警告、待确认状态 |
| `--mu-warning-color-0` ~ `-9` | — | 警告色色阶 |
| `--mu-danger-color` | red | 错误、危险、删除操作 |
| `--mu-danger-color-0` ~ `-9` | — | 危险色色阶 |

### 透明色变体（`-translucent`）

所有基本色和语义色均有 `-translucent` 变体，适用于 hover 背景、标签底色等场景。亮色主题透明度 10%；暗色主题（`.mu-dark`）下**语义色与 gray** 升至 20%，12 个基本色仍为 10%。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-translucent` | 主色按钮 hover 背景 |
| `--mu-danger-translucent` | 危险操作行高亮背景 |
| `--mu-success-translucent` | 成功状态标签底色 |
| `--mu-warning-translucent` | 警告提示背景 |
| `--mu-gray-translucent` | 通用 hover 背景 |
| `--mu-red-translucent` ~ `--mu-orange-translucent` | 各基本色透明变体 |

### 极浅色变体（`-faint`）

扩展语义色的极浅版本，适用于状态 Badge、Tag 等需要低饱和度底色的场景。暗色主题（`.mu-dark`）下改用**最深色阶 `-9`**（如 `--mu-primary-faint: var(--mu-primary-color-9)`）。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-faint` | 主色标签底色 |
| `--mu-secondary-faint` | 次色标签底色 |
| `--mu-success-faint` | 成功状态背景块 |
| `--mu-warning-faint` | 警告状态背景块 |
| `--mu-danger-faint` | 错误状态背景块 |

### 文本颜色

文本色由 20 级灰阶映射而来，`normal` 与 `subtle` 层级明确拉开。

| 变量 | 原子类 | 适用场景 |
|------|--------|---------|
| `--mu-text-color-strong` | `.text-strong` | 用户输入内容、文章正文、强调标题 |
| `--mu-text-color-normal` | `.text-normal` | 默认正文、常规名称、普通标签（页面主文本） |
| `--mu-text-color-subtle` | `.text-subtle` | 次要信息、描述文字 |
| `--mu-text-color-soft` | `.text-soft` | 副标题、提示文字 |
| `--mu-text-color-muted` | `.text-muted` | 禁用状态文字 |

### 背景颜色

| 变量 | 用途 |
|------|------|
| `--mu-bg-normal` | 页面默认背景 |
| `--mu-bg-strong` | 强调区域：导航栏、头部工具栏、底部工具栏 |
| `--mu-bg-fill` | 填充背景：分段控件底色、区块内嵌容器、表头 |
| `--mu-bg-stripe` | 表格斑马纹交替行 |
| `--mu-bg-disabled` | 禁用状态控件背景 |
| `--mu-bg-mask` | 遮罩层背景（全屏覆盖） |
| `--mu-bg-overlay` | 弹出层、浮出面板背景 |

## 原子类

### 文本颜色

| 类名 | 变量名 | 说明 |
|------|--------|------|
| `.text-strong` | `--mu-text-color-strong` | 清晰，常用于用户输入或文章正文 |
| `.text-normal` | `--mu-text-color-normal` | 常规，常用于各类名称显示 |
| `.text-subtle` | `--mu-text-color-subtle` | 次要，用于次级文字信息显示 |
| `.text-soft` | `--mu-text-color-soft` | 柔和，常用于副标题或提示文字 |
| `.text-muted` | `--mu-text-color-muted` | 淡雅，常用于禁用组件文字 |
| `.text-primary` / `.text-secondary` / `.text-success` / `.text-warning` / `.text-danger` | 语义色变量 | 功能色文本 |

### 背景颜色

| 类名 | 说明 |
|------|------|
| `.bg-none` | 清除背景 |
| `.bg-normal` | 默认背景色 |
| `.bg-strong` | 强调区域背景色 |
| `.bg-fill` | 填充背景色 |
| `.bg-disabled` | 禁用状态背景色 |
| `.bg-overlay` | 弹出层背景色 |
| `.bg-mask` | 遮罩层背景色 |

### 边框颜色

4 色 × 7 方向，后缀 `-soft` / `-strong` / `-primary` / `-danger`，如 `.border-b-soft`。需配合边框宽度类使用，见[边框、圆角与阴影](/guide/styles-surface)。
