# 样式总览

Mussel 的视觉样式由两部分构成：

- **CSS 变量（Design Tokens）**：颜色、字体、间距、圆角、阴影、层级、控件尺寸均基于 `--mu-*` CSS 变量，组件与业务样式统一从变量取值。
- **原子类（Utility Classes）**：布局、间距、排版等高频样式提供开箱即用的原子类，无需手写 CSS。

按用途查阅：

| 用途 | 页面 |
|------|------|
| 基本色、语义色、透明/极浅变体、文本色、背景色 | [颜色](/guide/styles-colors) |
| 字体族、字号、对齐、空白处理、文本省略 | [字体与文本](/guide/styles-typography) |
| 内外边距、Gap、控件尺寸 | [间距与尺寸](/guide/styles-spacing) |
| 定位、显示、溢出、Flex、对齐、Z-index | [布局与层级](/guide/styles-layout) |
| 边框、圆角、阴影 | [边框、圆角与阴影](/guide/styles-surface) |
| 典型页面结构示例 | [常用布局模式](/guide/styles-patterns) |

使用规范见[设计原则](/guide/principles)。

## mu- 前缀别名类

文本、背景、阴影、圆角四组原子类均有 `.mu-*` 前缀的等价别名（如 `.mu-text-strong` = `.text-strong`），用于避免与项目内同名类冲突。

## 暗色主题（`.mu-dark`）

`install` 时设置 `dark: true`（或 `'auto'` 且系统为暗色）会把 `mu-dark` class 加到根元素，token 随之重映射，无需手动覆盖变量：

- **灰阶反转**：文本色改用浅灰——strong=gray-1、normal=gray-4、subtle=gray-7、soft=gray-10、muted=gray-12
- **边框**：strong=gray-6、normal=gray-9、soft=gray-12
- **背景**：bg-normal=gray-19、bg-overlay=gray-17、bg-fill=gray-16、bg-stripe=gray-18
- 透明/极浅变体的暗色表现见[颜色](/guide/styles-colors)；另设 `color-scheme: dark`

## 其他工具类

### 指针与选择

| 类名 | 说明 |
|------|------|
| `.cursor-default` / `.cursor-auto` / `.cursor-pointer` | cursor |
| `.select-none` / `.select-auto` / `.select-all` / `.select-text` | user-select |
| `.pointer-event-none` / `.pointer-event-auto` | pointer-events |

### 链接

| 类名 | 说明 |
|------|------|
| `.mu-link` | 主色链接样式：指针光标、hover 下划线 |
| `.mu-link--danger` | 危险色变体 |
| `.mu-link[disabled]` | 禁用态（灰色、不可点击） |
