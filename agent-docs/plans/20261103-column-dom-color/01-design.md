# 列类型双通道输出改造：dom 参数 + color 直取（20261103）

## 任务目标

为 `src/components/table/column-types/` 各列类型统一 `compile(column, dom = false)` 双通道签名：

- `dom === true`：mu-table DOM 渲染，输出 `is`/`class`/`style`/`events`/`attrs` 等 DOM 通道属性；颜色经 `text-{c}` 等 class 落地。
- `dom !== true`：table-ex canvas 渲染，**不输出** `is`/`class`/`style`/`events`/`attrs`，改输出 `color` 等数据属性；canvas 端（`ex/cell-painters.js`）不再从 class 名解析颜色，全部改为直读 `color` 属性。

配套：

1. bool/number/currency/date/datetime 列新增 `column.color` 参数（色名字符串或 `(record, value) => 色名` 函数）。
2. mappings 特性收敛为 **text 类型独有**（经 `TextColumn.compile` 内 mapper，双端同源）；number/bool 的映射通道删除。
3. link 恒两色（默认 primary / `danger: true` 用 danger），不引入 color。
4. 修复 canvas 端 P2 短路 bug（text + mappings 列映射失效）。

参考基准：HEAD `0e0467d`。`text.js` 已完成改造（`compile: (column, dom = false)`，dom 分支输出 class/style/items，canvas 分支输出 `{ text, color, title, ...attrs }`）——本次其余列类型照此模式实施。

## 已确认的事实（勿重复查证）

- 调用方：`base/table.vue:180` 已传 `type.compile(el, true)`；`ex/cell-painters.js` `createColumnRender`（约 136 行）不传第二参（canvas）。
- 17 色板名（`theme.colors` 键集，`ex/theme.js` readColors）：`primary secondary success warning danger red pink grape violet indigo blue cyan teal green lime yellow orange`。每色 `{ color, translucent, hover }`；语义色 `hover` = `--mu-{name}-color-4`（悬停浅色），12 彩色 `hover` 同色。**gray 不入 colors map**。
- theme 快照固定字段（`readSnapshot`）：`textColor`、`textColorMuted`、`borderColor`、`borderColorStrong`、`bgStrong`、`bgDisabled`、`hoverBg = --mu-gray-translucent`、`primaryColor`、`gray = --mu-gray` 等。
- `ensureFn(value)`（`src/utils/type.js`）：非函数返回 `() => value`；`ensureFn(undefined)()` → `undefined`。
- 类名体系：`text-{17色}` 与 `bg-{17色}-translucent` 均含 `gray`（`typography.scss` / `background.scss` 已就绪）。`.mu-tag` 基础样式 = gray 底 + `box-shadow: inset 0 0 0 1px currentColor`（边框随文字色）。
- `link.scss` 现状：`.mu-link` 默认 primary、`:hover` 变 `--mu-primary-color-4`；`.mu-link--danger` + hover `--mu-danger-color-4`。残留的 `mu-link--{secondary|success|warning}` 变体无生产者，**本次不动**。
- `ex/interactions.js` check 列点击按 `col.type` 派发 `update:cell-value`，不消费 items 的 `events`；check/img/rec_no 列类型**不改**（canvas 端识别走既有 is/class 判定，保持回退兼容）。
- 知识库相关条目（agent-docs/knowledge/INDEX.md 32/33/34）由主会话更新，subagent 不动。

## 逐文件改动

### 1. `src/components/table/column-types/bool.js`

```js
import { t } from '@/langs'
import { ensureFn } from '@/utils/type'

export const BoolColumn = {
  align: 'center',
  compile: (column, dom = false) => {
    const {
      trueText = t('Table.BOOL_TRUE'),
      falseText = t('Table.BOOL_FALSE'),
      color
    } = column

    const getColor = ensureFn(color)

    return ({ record, value }) => {
      if (value == null) return { text: null }

      const text = value ? trueText : falseText
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
```

### 2. `src/components/table/column-types/number.js`

NumberColumn 与 CurrencyColumn 同款改造（保留各自 formatter 构建）：

```js
import { ensureFn } from '@/utils/type'

export const NumberColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const { locales = 'zh-CN', color } = column
    const getColor = ensureFn(color)

    const formatOption = { /* 现状不动 */ }
    const formatter = new Intl.NumberFormat(locales, formatOption)

    return ({ record, value }) => {
      const text = formatter.format(value)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
```

CurrencyColumn 仅 formatOption 默认值不同，同款。

### 3. `src/components/table/column-types/date.js`

DateColumn / DateTimeColumn 同款（各自 format 默认值保留）：

```js
import { toDateString } from '@/utils/date'
import { ensureFn } from '@/utils/type'

export const DateColumn = {
  align: 'right',
  compile: (column, dom = false) => {
    const { formatter = toDateString, format = 'yyyy-MM-dd', color } = column
    const getColor = ensureFn(color)

    return ({ record, value }) => {
      const text = formatter(value, format)
      const c = getColor(record, value)

      return dom
        ? { text, class: c ? [`text-${c}`] : null }
        : { text, color: c || null }
    }
  }
}
```

### 4. `src/components/table/column-types/link.js`

`compile: (column, dom = false)`。`valueToLinks`/`getLinks`/`linkOption`（`max`/`danger: _danger`/`disabled: _disabled`）/`showTitle` 现状保留。`getLinkClass`/`getLinkStyle` 仅 dom 分支消费。

canvas 分支（新增，置于 dom 分支之前或之后皆可，注意 `dotsIndex` 共用）：

```js
if (!dom) {
  return {
    items: (max ? links.slice(0, max) : links).map((link, idx) => {
      if (idx === dotsIndex) {
        return {
          kind: 'link',
          text: '...',
          title: showTitle && links.slice(idx).map(el => el.caption).join('\n\n')
        }
      }

      const { caption, disabled = _disabled, danger = _danger } = link

      return {
        kind: 'link',
        text: caption,
        title: showTitle && caption,
        danger: danger || null,
        disabled: disabled || null
      }
    })
  }
}
```

dom 分支 = 现状代码原样（`is: 'a'`、`attrs: { class: ['mu-link', _class], style: _style }`、`events`、dots 处理、`danger` → `mu-link--danger`、返回 `{ class: 'mu-table__link-cell', items }`）。

**link 不引入 color 参数。**

### 5. `src/components/table/column-types/tag.js`

`compile: (column, dom = false)`。canvas 分支（新增）：

```js
if (!dom) {
  return {
    items: (max ? tags.slice(0, max) : tags).map((tag, idx) => {
      if (idx === dotsIndex) {
        return {
          kind: 'tag',
          text: '...',
          title: showTitle && tags.slice(idx).map(el => el.caption).join('\n\n')
        }
      }

      const { caption, color = _color } = tag

      return {
        kind: 'tag',
        text: caption,
        title: showTitle && caption,
        color: color || null
      }
    })
  }
}
```

dom 分支在现状基础上改一处：颜色类恒落地（默认 gray）：

```js
// 现状：if (color) itemClass.push(`text-${color}`, `bg-${color}-translucent`)
// 改为：
const name = color || 'gray'

itemClass.push(`text-${name}`, `bg-${name}-translucent`)
```

`pill`/`flat`/`events`/dots/外层 `{ class: 'mu-table__tag-cell', items }` 现状保留。

### 6. `src/components/table/mappings.js`

- 删除 `isMappableColumnType`（已无消费者）。
- 其余（`mappingsFromOptions` / `selectOptionsFromMappings` / `normalizeMappings` / `createDisplayMapper`）不动。

### 7. `src/components/table/ex/cell-painters.js`

a. import：删 `isMappableColumnType`；新增 `import { TextColumn } from '../column-types/text'`（仅用于 `_mapText` 门控的类型比较）。

b. `prepareColumn` 内 `_mapText` 挂载（约 192 行）改为 text 类型独占 + 映射源存在才挂：

```js
// 显示映射 text 类型独有（TextColumn.compile 内 mapper 为双端单一事实源，此处仅供
// row-geometry 估高取显示文本）；无映射源不挂恒等 mapper
col._mapText = !column.text && type === TextColumn &&
  (column.mappings != null || column.options != null)
  ? createDisplayMapper(column)
  : null
```

c. `isPlainTextColumn`（约 156 行）追加映射源排除（修 P2 短路 bug：text + mappings/options 列必须走 compile 内 mapper）：

```js
function isPlainTextColumn (column, canvasOnlyKind) {
  return !column.text && !column.multiline && !canvasOnlyKind &&
    column.mappings == null && column.options == null &&
    (column.type == null || column.type === '' || column.type === 'text')
}
```

d. `resolveCellContent`（约 202-224 行）：删「映射器返回非 null 即终结」分支；短路分支删 `_mapText` 三元：

```js
// P2 短路：纯文本列免 render 调用（无映射源才短路，映射列走 compile 内 mapper）
if (col._plainText) return { text: value }
```

e. `resolveItemKind`（约 670 行）：canvas 通道 kind 优先：

```js
function resolveItemKind (item) {
  // canvas 通道产物自带 kind（link/tag）；check/img 无 dom 参数改造，走 is/class 回退
  if (item.kind) return item.kind

  const cls = itemClassOf(item)

  if (cls.includes('mu-table__cell-check')) return 'check'
  if (item.is === 'img') return 'img'
  if (item.is === 'a') return 'link'
  if (cls.includes('mu-tag')) return 'tag'

  return item.text != null ? 'text' : null
}
```

f. 删 `colorClassOf`（约 683 行）。`linkTextColorOf` / `linkHoverColorOf` 重写为两色三态（读平铺字段，经 `isTruthyAttr` 判 disabled）：

```js
/** link 条目文本色：disabled → muted；danger → colors.danger.color；默认 primaryColor */
function linkTextColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  const palette = item.danger ? theme?.colors?.danger : null

  return palette?.color || theme?.primaryColor
}

/** link 条目悬停色：danger → colors.danger.hover（danger-4）；默认 colors.primary.hover（primary-4）；disabled muted */
export function linkHoverColorOf (item, theme) {
  if (isTruthyAttr(item.disabled)) return theme?.textColorMuted || theme?.gray

  const palette = item.danger ? theme?.colors?.danger : theme?.colors?.primary

  return palette?.hover ?? palette?.color ?? theme?.primaryColor
}
```

g. `drawTag`（约 977 行）：`colorClassOf(item, 'tag')` 改直读，边框与文字同色（对齐 dom `currentColor`），缺省 gray（colors 无 gray 键，走快照 `gray`/`hoverBg`）：

```js
const name = item.color || 'gray'
const palette = name === 'gray' ? null : theme?.colors?.[name]
const borderColor = palette?.color ?? theme?.gray
const fillColor = palette?.color ?? theme?.gray
const trackFill = palette?.translucent ?? theme?.hoverBg
```

（命名自定，语义：底 translucent、边框=文字色、gray 特判。其余绘制逻辑不动。）

h. `drawDisplayText` → `drawTextValue` / `drawArrayLines` 消费 `content.color`：

- `drawDisplayText` 取 `const color = content.color && theme?.colors?.[content.color]?.color`，非空时作为参数传入。
- `drawTextValue` / `drawArrayLines` 增加 `color` 入参，`ctx.fillStyle = color || theme?.textColor`（替换原 `ctx.fillStyle = theme?.textColor` 两处站点）。
- 单行省略路径（`drawTextValue` 尾部）同样使用。

i. link 条目 disabled 平铺消费（`item.attrs?.disabled` → `item.disabled`）：

- `isLinkEntryHovered`（约 890 行）
- `reportHitRect`（约 814 行，link 分支的回报）
- `drawLinkItems` 内 `report` 调用（约 1082 行）

j. 顶部注释块（约 19-25 行取值链描述）同步：`_mapText` 语义改为「text 类型独有，供估高」；补 canvas 条目 `kind` 协议一句话。

### 8. `src/components/table/ex/row-geometry.js`

`valueOf`（约 59-70 行）：mapper 产物由文本改为对象，取 `.text`：

```js
if (col._mapText) {
  const mapped = col._mapText(value)

  if (mapped != null) return mapped.text
}
```

函数注释同步（「按显示文本取值」保持，注明 mapper 返回对象取 text）。

### 9. `src/components/table/ex/editor.js`

`resolveEditorType`（约 139-156 行）：

```js
// ② text 列带下拉来源 → 'select'（number 不再支持 mappings/options 派生；enum 类型已删）
if (typeName === 'text' && hasSelectSource(column)) return 'select'
```

删 `typeName === 'enum' ||` 与 `typeName === 'number'` 分支；函数头注释块同步（删 enum 兼容描述）。`hasSelectSource` / `usesDerivedOptions` / `resolveSelectOptions` / `normalizeEditorOpenValue` / `normalizeCommitValue` 不动（text 仍走 mappings 派生）。

### 10. `src/components/table/ex/table-ex.vue`

grep 本文件内消费 link 条目 DOM 形态字段的站点（`item.attrs`、`isDisabledAttr` 调用处、`domItem` 相关 canvas/DOM 对照逻辑，约 1229 行附近），canvas 条目已平铺 `disabled`/`danger`/`text` 后同步改读平铺字段。`isDisabledAttr` 谓词本身保留。

### 11. demo

- `demo/src/data/table-ex/main-view.vue`：原 number/bool 列的 `mappings` 用法改为 `color` 用法（如 `color: r => r.amount > 0 ? 'success' : 'danger'`）；link/tag 列定义核对（不需要 color）。demo 页 URL：`http://localhost:3000/data/table-ex/`。
- `demo/src/data/table-ex/self-checks/cell-painters.js`（约 660+ 行文件）：
  - 删「enum 废弃兼容」整块（约 449-472 行）。
  - 重写「bool 统一 mappable」块：trueText/falseText 缺省文案断言保留；删 mappings/options 断言；新增 `color` 断言（字符串色名 / `(record, value) => 色名` 函数，canvas 产物 `{ text, color }`、dom 产物 class `text-{c}`）。
  - 「mappings 优先 / options 转换」块（约 400-448 行）：number 列映射断言删除（number+options 不再映射，`content(...).text` 应为 Intl 格式化或原值）；text 列断言保留。
  - 重写「prepareColumn：_mapText/_plainText 判定」块（约 518-551 行）：断言 text+mappings 挂 `_mapText`（函数）、`_plainText === false`（短路修复核心断言）；number+options `_mapText === null`；无映射源 text 列 `_mapText === null` 且 `_plainText === true`；currency+mappings `_mapText === null`。
  - 新增 link/tag canvas 条目结构断言块：`compile(column)`（不传 dom）产物 items 元素含 `kind`/`text`/`title`，link 含 `danger`/`disabled` 平铺，tag 含 `color`；**不含** `is`/`attrs`/`events`。dom 通道 `compile(column, true)` 产物保持 DOM 形态。
  - 新增文本 color 直取断言（若现有断言体系有 ctx stub 可复用；否则跳过像素级，断言 `drawTextValue` 传参层不可行时以 content 层 `{ text, color }` 断言为准）。
- `demo/src/data/table-ex/self-checks/interactions.js`：涉及 link 条目 `attrs.disabled` 的断言同步平铺字段（grep `attrs` 定位）。

## 验证（按序执行，全部通过才算完成）

1. `npm run build`（若构建报错，修复后重跑）。
2. eslint：全局 eslint 8.57.0，口径限 `src` 与 `demo/src`（`.eslintignore` 已含 demo/dist）。命令参考：`npx eslint src demo/src`。
3. playwright 打开 `http://localhost:3000/data/table-ex/`（demo watch 已在 3000 端口运行，**不要重新构建/重启**）：
   - 页面自检清单全部通过（DOM 文本断言，不截图）。
   - 断言示例：bool/number 列颜色（canvas 侧经自检探针）、tag/link 条目结构。
4. mu-table DOM 渲染验证：demo 中找使用 mu-table 的页面（`demo/src/data/` 下 grep `mu-table`），断言 bool/number/date 列配 color 后 td 内出现 `text-{c}` class。

## 禁止事项

- 不提交 git、不 push。
- 不修改 `skills/`、`docs/`、`docs-site/` 下任何文档（主会话后续统一处理）。
- 不修改 `link.scss` 残留的 `mu-link--{secondary|success|warning}` 死样式。
- 不改 `check.js` / `record-number.js` / `image.js` / `text.js` / `index.js`。
- 不动 `agent-docs/knowledge/`。
- demo watch 若未运行导致页面 404，报告阻塞，不要自行启动构建。
