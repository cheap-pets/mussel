# 边框、圆角与阴影

边框颜色、宽度、样式与圆角、阴影的变量及原子类。边框颜色的语义取值来自灰阶，整体柔和、避免喧宾夺主。

## CSS 变量

### 边框颜色

边框色由灰阶映射而来，三档由深到浅：

| 变量 | 原子类 | 用途 |
|------|--------|------|
| `--mu-border-color-strong` | `.border-strong` | 强调性分隔、输入框聚焦边框 |
| `--mu-border-color-normal` | （默认）| 常规组件边框 |
| `--mu-border-color-soft` | `.border-soft` | 轻量分隔线、卡片边框、表格内框 |

### 边框弧度

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--mu-radius-control` | `4px` | 输入框、按钮、标签等常规组件 |
| `--mu-radius-panel` | `8px` | 浮出面板、抽屉等面板级容器 |
| `--mu-radius-modal` | `12px` | 模态对话框 |

### 阴影（由浅到深）

| 变量 | 适用元素 |
|------|---------|
| `--mu-shadow-hairline` | 发丝线描边，并作为以下阴影的第一层 |
| `--mu-shadow-focus` | 聚焦的输入控件 |
| `--mu-shadow-float` | 悬浮突出的卡片、按钮 |
| `--mu-shadow-popup` | 下拉菜单、Tooltip、消息提示 |
| `--mu-shadow-layer` | 抽屉面板、侧边浮层 |
| `--mu-shadow-modal` | 模态对话框 |

## 原子类

### 边框宽度

n: 2 ~ 4 像素值，1px 用无后缀类；方向支持 `-x` / `-y` / `-t` / `-r` / `-b` / `-l`。

| 类名 | 说明 |
|------|------|
| `.border` | 四边 1px 边框 |
| `.border-n` | 四边 npx 边框 |
| `.border-t` / `.border-t-n` 等 | 单方向边框 |

### 边框颜色

4 色 × 7 方向，后缀 `-soft` / `-strong` / `-primary` / `-danger`，如 `.border-b-soft`。

### 边框样式

3 样式 × 7 方向，后缀 `-dashed` / `-dotted` / `-double`，如 `.border-dashed`。

### 圆角

`.radius-*` 与 `.mu-radius-*` 两套类名等价。

| 类名 | 说明 |
|------|------|
| `.radius-control` | 一般组件圆角（4px） |
| `.radius-panel` | 面板圆角（8px） |
| `.radius-modal` | 模态窗口圆角（12px） |

### 阴影

| 类名 | 说明 |
|------|------|
| `.shadow-float` | 突出元素阴影 |
| `.shadow-popup` | 弹出元素阴影 |
| `.shadow-layer` | 浮动层阴影 |
| `.shadow-modal` | 模态窗口阴影 |
| `.shadow-focus` | 焦点阴影（需 `:focus`） |
| `.shadow-focus-within` | 焦点阴影（需 `:focus-within`） |
