# 字体与文本

字体族、字号变量与文本排版原子类。文本颜色类见[颜色](/guide/styles-colors)。

## CSS 变量

### 字体

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-font-sans` | — | 无衬线字体族，正文 |
| `--mu-font-mono` | — | 等宽字体族，代码块 |
| `--mu-font-size-normal` | `14px` | 组件标题、正文主字号 |
| `--mu-font-size-small` | `12px` | 小号文字 |
| `--mu-font-size-large` | `16px` | 大号文字 |

## 原子类

### 对齐 / 行高 / 大小写

| 类名 | 说明 |
|------|------|
| `.text-left` / `.text-center` / `.text-right` | text-align |
| `.leading-none` | line-height: 1 |
| `.uppercase` / `.lowercase` / `.capitalize` | text-transform |

### 空白处理

| 类名 | 说明 |
|------|------|
| `.whitespace-normal` / `.whitespace-nowrap` | white-space |
| `.whitespace-pre` / `.whitespace-pre-line` / `.whitespace-pre-wrap` / `.whitespace-break-spaces` | white-space 扩展 |

### 文本省略

| 类名 | 说明 |
|------|------|
| `.text-ellipsis` | 单行省略，溢出显示省略号 |
| `.line-clamp` | 多行省略，通过 `--line-clamp` 变量控制行数（默认 2 行） |
