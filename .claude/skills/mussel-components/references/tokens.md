# tokens.md — MUSSEL 4 样式变量速查

> **使用原则**
> - 禁止硬编码颜色值（如 `#fff`、`rgb(0,0,0)`），一律使用下列 CSS 变量
> - 禁止使用 `--mu-gray-0` 到 `--mu-gray-19` 等原始灰阶作为文字颜色，应使用 1.5 节文本颜色变量
> - 阴影、层级同理，直接使用语义变量，不手写数值

---

## 1. 颜色 Tokens

### 1.1 基本色（原色调）

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
| `--mu-gray` | 中性灰（由主色计算） |
| `--mu-gray-0` ~ `--mu-gray-19` | 由浅到深的 20 级灰阶 |

---

### 1.2 语义扩展色（优先使用）

这是日常开发中最常用的颜色变量。带数字后缀的变量为色阶（0 最浅，9 最深）。

| 变量 | 默认映射 | 用途 |
|------|---------|------|
| `--mu-primary-color` | blue | 主操作色，按钮、链接、选中态 |
| `--mu-primary-color-0` ~ `--mu-primary-color-9` | — | 主色色阶（0最浅，9最深） |
| `--mu-secondary-color` | — | 次要操作色 |
| `--mu-secondary-color-0` ~ `--mu-secondary-color-9` | — | 次要色色阶 |
| `--mu-success-color` | green | 成功、完成状态 |
| `--mu-success-color-0` ~ `--mu-success-color-9` | — | 成功色色阶 |
| `--mu-warning-color` | orange | 警告、待确认状态 |
| `--mu-warning-color-0` ~ `--mu-warning-color-9` | — | 警告色色阶 |
| `--mu-danger-color` | red | 错误、危险、删除操作 |
| `--mu-danger-color-0` ~ `--mu-danger-color-9` | — | 危险色色阶 |

**示例：**
```css
/* ✅ 正确 */
color: var(--mu-primary-color);
background: var(--mu-danger-color-1);   /* 极浅危险色背景 */

/* ❌ 禁止 */
color: #1677ff;
background: #fff1f0;
```

---

### 1.3 透明色变体（`-translucent`）

所有基本色和语义色均有 10% 透明度的 `-translucent` 变体，适用于 hover 背景、标签底色等场景。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-translucent` | 主色按钮 hover 背景 |
| `--mu-danger-translucent` | 危险操作行高亮背景 |
| `--mu-success-translucent` | 成功状态标签底色 |
| `--mu-warning-translucent` | 警告提示背景 |
| `--mu-gray-translucent` | 通用 hover 背景 |
| `--mu-red-translucent` ~ `--mu-orange-translucent` | 各基本色透明变体 |

---

### 1.4 极浅色变体（`-faint`）

扩展语义色的极浅版本，适用于状态 Badge、Tag 等需要低饱和度底色的场景。

| 变量 | 用途示例 |
|------|---------|
| `--mu-primary-faint` | 主色标签底色 |
| `--mu-secondary-faint` | 次要标签底色 |
| `--mu-success-faint` | 成功状态背景块 |
| `--mu-warning-faint` | 警告状态背景块 |
| `--mu-danger-faint` | 错误状态背景块 |

---

### 1.5 文本颜色（由深到浅）

| 变量 | 原子类 | 适用场景 |
|------|--------|---------|
| `--mu-text-color-strong` | `.text-strong` | 用户输入内容、文章正文 |
| `--mu-text-color-normal` | `.text-normal` | 常规名称、普通标签 |
| `--mu-text-color-subtle` | `.text-subtle` | 次要信息、描述文字 |
| `--mu-text-color-soft` | `.text-soft` | 副标题、提示文字 |
| `--mu-text-color-muted` | `.text-muted` | 禁用状态文字 |

功能色文本：`.text-primary` / `.text-secondary` / `.text-success` / `.text-warning` / `.text-danger`

**示例：**
```html
<!-- ✅ 正确 -->
<p class="text-normal">用户名称</p>
<span class="text-soft">上次修改于 3 天前</span>
<span class="text-muted">已禁用</span>

<!-- ❌ 禁止 -->
<p style="color: #333;">用户名称</p>
```

---

### 1.6 背景颜色

| 变量 | 用途 |
|------|------|
| `--mu-bg-normal` | 页面默认背景 |
| `--mu-bg-strong` | 强调区域：导航栏、头部工具栏、底部工具栏 |
| `--mu-bg-fill` | 填充背景：分段控件底色、区块内嵌容器 |
| `--mu-bg-stripe` | 表格斑马纹交替行 |
| `--mu-bg-disabled` | 禁用状态控件背景 |
| `--mu-bg-mask` | 遮罩层背景（全屏覆盖） |
| `--mu-bg-overlay` | 弹出层、浮出面板背景 |

---

### 1.7 边框颜色

| 变量 | 原子类 | 用途 |
|------|--------|------|
| `--mu-border-color-strong` | `.border-strong` | 强调性分隔、输入框聚焦边框 |
| `--mu-border-color-normal` | （默认）| 常规组件边框 |
| `--mu-border-color-soft` | `.border-soft` | 轻量分隔线、卡片边框 |

---

## 2. 形状 Tokens

### 2.1 边框弧度

| 变量 | 用途 |
|------|------|
| `--mu-common-border-radius` | 输入框、按钮、标签等常规组件 |
| `--mu-window-border-radius` | 弹窗、抽屉、浮出面板 |

---

## 3. 字体 Tokens

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-font-sans` | — | 无衬线字体族，正文 |
| `--mu-font-mono` | — | 等宽字体族，代码块 |
| `--mu-common-font-size` | `14px` | 组件标题、正文主字号 |
| `--mu-common-line-height` | `20px` | 正文行高 |

---

## 4. 间距 Tokens

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--mu-base-spacing` | `8px` | 布局间距基准，所有 `{n}x` 类均以此为倍数 |
| `--mu-content-spacing` | `5px` | 行内元素间距，图标与文字之间等 |

间距倍数对照：

| 倍数 | 像素值 | 典型用途 |
|------|--------|---------|
| `1x` | 8px | 紧凑元素内边距 |
| `2x` | 16px | 常规卡片内边距 |
| `3x` | 24px | 区块间距 |
| `4x` | 32px | 大区域分隔 |

---

## 5. 阴影 Tokens（由浅到深）

| 变量 | 适用元素 |
|------|---------|
| `--mu-shadow-focus` | 聚焦的输入控件 |
| `--mu-shadow-float` | 悬浮突出的卡片、按钮 |
| `--mu-shadow-popup` | 下拉菜单、Tooltip、消息提示 |
| `--mu-shadow-layer` | 抽屉面板、侧边浮层 |
| `--mu-shadow-modal` | 模态对话框 |

---

## 6. 输入控件尺寸 Tokens

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-input-size` | `32px` | 默认输入框高度 |
| `--mu-input-size-small` | `24px` | 小尺寸输入框 |
| `--mu-input-size-large` | `40px` | 大尺寸输入框 |

---

## 7. Z-index Tokens（层级由低到高）

| 变量 | 适用场景 |
|------|---------|
| `--mu-z-index-float` | 突出卡片、悬浮按钮 |
| `--mu-z-index-layer` | 抽屉、侧边浮层 |
| `--mu-z-index-modal` | 模态对话框 |
| `--mu-z-index-popup` | 下拉框、Tooltip |
| `--mu-z-index-ontop` | 全局消息提示、全屏加载动画（最高层） |

> **层级使用规则**：不允许手写 `z-index` 数值，一律使用以上变量。
