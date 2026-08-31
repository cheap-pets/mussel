# 安装与初始化

Mussel 通过 `install` 作为 Vue 插件挂载，完成组件注册、图标注册、主题色、多语言配置，并注入全局 `$mussel` 上下文。返回传入的 `app`，便于链式 `.mount()`。

```javascript
import { install } from 'mussel'

install(app, {
  root: '#app',
  dark: 'auto',
  colors: { primary: '#1c7ed6' },
  icons: { /* 自定义图标 */ },
  locale: 'zh',
  localeResources: { /* 自定义语言包 */ }
}).mount('#app')
```

## install(app, options)

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| app | App | Vue 应用实例（`createApp` 返回值），必填 |
| options | Object | 安装配置，见下表 |

### options 选项

| 属性 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| root | String \| Element | `document.body` | 应用根元素（字符串选择器或 DOM 元素），用于注入主题 class 和 CSS 变量 |
| dark | Boolean \| `'auto'` | — | 暗色模式开关。`true` 强制暗色，`'auto'` 跟随系统 `prefers-color-scheme`，不设置或 `false` 为亮色 |
| colors | Object | 内置默认色 | 自定义主题色，自动派生对应调色板与 `--mu-*` CSS 变量。合法 key：语义色 `primary` / `secondary` / `success` / `warning` / `danger` + 基本色名 `red` / `pink` / `grape` / `violet` / `indigo` / `blue` / `cyan` / `teal` / `green` / `lime` / `yellow` / `orange`；`neutral` / `gray` 不派生自身调色板，仅作灰阶基准（优先级 neutral → gray → primary） |
| icons | Object | — | 初始注册的图标集合，`{ 名称: svg数据或class字符串 }`，等价于调用 `installIcons(icons)` |
| locale | String | 自动检测 | 语言：`'zh'` \| `'en'`，未指定时按浏览器语言自动判断（中文环境为 `zh`，否则 `en`） |
| localeResources | Object | — | 自定义语言包，**整包替换**写入指定 `locale` 下（不与内置键合并，只传部分字段会丢失该语言的内置键）；Mussel 内置 `zh` / `en` |
| *(其他)* | — | — | 其余字段作为 `componentOptions` 存入 `$mussel.options`，供组件读取（如 `splitter.*`、`tree.nodeIcons`、`calendar.weekStartsOn` 等） |

> [!NOTE]
>
> `install` 内部执行顺序：注入 `$mussel` 上下文 → 设置语言（`setupLocale`）→ 设置根元素 class（`mu-root` + `mu-dark`，由 `dark` 决定）→ 设置主题色（`setupColors`）→ 注册图标（`installIcons`）→ 注册全部组件 → 注册滚动指令（`v-mu-scrollbar`）。

## 全局 `$mussel` 上下文

`install` 后，组件内可通过 `inject('$mussel')` 或 `this.$mussel` 获取上下文：

```javascript
const { rootElement, options, messageBox, setupColors } = inject('$mussel')

messageBox.alert('操作完成')
setupColors({ primary: '#be4bdb' })  // 运行时换肤，默认写入当前应用根元素
```

| 属性 | 说明 |
| ---- | ---- |
| rootElement | Element，`root` 解析后的根 DOM 元素 |
| options | Object，传入的 `componentOptions`（剔除 `root`/`dark`/`colors`/`icons`/`locale`/`localeResources` 之后的部分） |
| messageBox | 命令式对话框与通知 API（`alert` / `confirm` / `error` / `warn` / `notify`） |
| setupColors | 主题色设置函数（已绑定到当前上下文），见下文「运行时换肤」 |

## installIcons(icons)

独立注册图标，可在 `install` 之外任意时机补充。值可为 SVG 字符串/数据，或 icon-font 的 class 字符串：

```javascript
import { installIcons } from 'mussel'

installIcons({
  refresh: RefreshIcon,        // svg data
  bolt: 'icon icon-bolt'       // icon-font class
})
```

## 主题色

`install` 时通过 `options.colors` 配置主题色，内部将自定义色合并到内置色板（`BASE_COLORS` + `SPEC_COLORS`），自动派生调色板与灰阶，并写入根元素的 `--mu-*` CSS 变量。灰阶的基准色按 `neutral → gray → primary` 的优先级选取（前三者均未设置时回退到主色）。

库同时导出包含全部派生色的 `colors` 对象，以及内置图标注册表 `icons`，可在运行时读取色板 / 图标或用于自定义渲染（如色板选择器）：

```javascript
import { colors, icons } from 'mussel'

// colors 是包含基础色、语义色及其调色板/灰阶的完整对象
// 如 colors.primary、colors.blue0、colors.gray10 等

// icons 是已注册图标的集合（key → { svg?, cls?, animation? }）
// 如 Object.keys(icons) 可列出所有可用图标名
```

如需在 `install` 之后动态切换主题色，使用 `$mussel` 上下文中的 `setupColors`（见下文「运行时换肤」）。

## 运行时换肤 — `$mussel.setupColors`

主题色设置函数**挂载在 `$mussel` 上下文上**（非顶层导出），已绑定到当前应用上下文，可在 `install` 之后任意时机调用——运行时换肤、动态切换主题。

```javascript
// 组件内
const { setupColors } = inject('$mussel')
setupColors({ primary: '#be4bdb' })  // 默认写入当前应用根元素
```

| 参数 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| customColors | Object | `{}` | 自定义主题色，key 同 `options.colors`：语义色 `primary` / `secondary` / `success` / `warning` / `danger` + 基本色名 `red` / `pink` / `grape` / `violet` / `indigo` / `blue` / `cyan` / `teal` / `green` / `lime` / `yellow` / `orange`；`neutral` / `gray` 仅作灰阶基准（优先级 neutral → gray → primary），自动派生调色板与灰阶，并写入 `--mu-*` CSS 变量 |
| rootElement | Element | `$mussel.rootElement` | 写入 CSS 变量的根元素；未传时回退到当前上下文的 `rootElement`，再回退到 `document.body` |

> [!NOTE]
>
> `setupColors` 会把传入色合并到运行时 `colors` 对象并更新根元素的 `--mu-*` 变量。它**只写入 CSS 变量**，不改变 `$mussel.rootElement`。
