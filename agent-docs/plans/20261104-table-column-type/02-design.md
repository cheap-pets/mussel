# 设计

## 方案概述

列类型层新增 `list` 类型（`src/components/table/column-types/list.js`），`link: Boolean` 为**列级**选项：整列全 text 或全 link，条目级 link 键不参与渲染（人工-1 [1-1]，decisions 实施轮间第 1 条）。`link` 列重写为兼容壳：compile 内构造 list 语义列对象（`type:'list'` + 列级 `link:true` + `_raw: column` 原列引用）后委托 `ListColumn.compile`，`listItems` 以 `(record, value)` 透传取值链，`col.type` 保持 `'link'`（注册表层转换，见「被拒绝的备选」1）。`text.js` 增加 `link` 选项（链色 + hover 下划线，色走 `text-{color}`）与数组值门控（落占位链）。

canvas 端（table-ex）：`col.type === 'link'` 的 4 处字符串分发扩展认识 `'list'`；`linkTextColorOf/linkHoverColorOf` 新增 `color` 色名维度（`item.color` 查表优先；无 color 时非 link 列条目（`item.link === false`）用 `textColor`，其余回退 `colors.primary` 谱系 hover ?? color ?? primaryColor——老式自定义条目行为不变，R1-1b 修复）；list 条目全部回报命中矩形（A6：所有条目可点击），hover 样式按 `item.link !== false` 门控（产物 `link` 字段值 = 列级 `column.link`，表达式不变）；`resolveCellContent` 取值后统一数组门控（A9：type 为 null/''/字符串且不在 {link,list,tag,button} 的列一律返回 `{}` 落占位；非字符串 type 的自定义列豁免），删除 `drawArrayLines`、`drawTextValue` 数组分支、`resolveTooltipText` 数组分支与 row-geometry 数组行数/变高判定分支。

DOM 样式：新 `.mu-table__list-cell`（竖排、每项单行省略、link 列条目色 `text-{color}`、a:hover 下划线、`[disabled]` 置灰）替代 `.mu-table__link-cell`（横排 inline）；text.link 新 `.mu-table__cell-link`（cursor + hover 下划线）。list/link 条目不复用 `.mu-link` 类——atomic 导入序下其 `color: var(--mu-primary-color)` 会覆盖 `text-{color}`（atomic.js:6-7，探索报告 CSS 风险）。非 link 列条目按正文色渲染，不消费 `color`。

事件：list/link 列所有条目（含非 link 列纯文本条目）点击 emit `cell-item-click`，payload 统一 `{ record, column, item }`（canvas 版外包 `recordIndex`，decisions 第 8 条）；payload 的 `column` 取原始列引用（`column._raw ?? column`）；tag/button 键不变。

触及模块边界：column-types（list.js 新增、link.js/text.js/index.js/style.scss 修改）、table/ex（cell-painters.js、row-geometry.js、editor.js、table-ex.vue）、demo 两页 + table-ex self-checks 三文件。不改 base/table.vue、table-row.vue（render 协议不变）。

## 遵循约定与复用

提取自探索报告「现有约定」：

- 列类型协议：`{ align?, width?, compile(column, dom) }`，compile 产 render `({ record, recordNumber, value, emit })`；dom=true 产 `{ text?, class, style, items?, events }`（items 条目 `{ is, text, title, attrs: { class, style }, events }`），dom=false 产 `{ text, color, title }` 或 `{ items: [{ kind, text, color, title, onItemClick }] }`
- 值归一惯例（link.js:9-18 / tag.js:9-15 同款）：数组对象元素原样、primitive 包装、单值包单元素数组——**仅 link 兼容壳沿用**（`valueToLinks` 单值包装保 `links: 12345` 夹具）；ListColumn 缺省仅接受数组值（A4），非数组落占位
- `ensureFn`（src/utils/type.js:80-84）包装 color/class/style 等可配置项
- dots 双层机制：compile 内 `listOption.max` dots（render 产物自持 `'...'` payload）+ canvas 绘制层 `_maxItems` dots（table-ex.vue:1218-1221 补发）
- 颜色：DOM `text-{color}` 类（typography.scss:44-58）、canvas `theme.colors` 查表（theme.js:60-105，17 色 + gray 回退）
- 目录/命名：`src/components/table/column-types/<type>.js` + index.js 注册；BEM `mu-` 前缀；`--mu-*` 变量
- 空值落占位链：render 返回 null → DOM `cell.text ?? placeholder`（table-row.vue:25）、canvas `content.text ?? placeholder`（cell-painters.js:432，render null 经 `|| {}` 兜底 cell-painters.js:229）
- dev 警告：`src/utils/warn.js` 的 `warn({ component, message })`（`isDev` 取自 `src/env.js` 的 `__env__`；vite 库 dev 构建与 demo 构建均为 `'development'`，vite.demo.config.js:208）；caption 兼容警告复用该通道，`once` 去重由 helper 承担
- A9 数组门控口径：数组值仅条目列（link/list/tag/button；tag/button 的值本身即条目数组）与非字符串 type 的自定义列消费；type 为 null/''/其他字符串（text/number/date/bool/enum/check/img/progress 等）一律落占位链（非字符串 type 直接透传自定义类型对象，resolveColumnType index.js:33）
- 同名键注记：`column.link` 三处同名不同义、互不波及——canvas 专属 button 列「链接形态按钮」（cell-painters.js resolveTooltipButtons `content.link === true`，实施后 :1493；demo data/table-ex main-view.vue:728 夹具）、text 列 link 样式选项、list 列整列 link 渲染开关（人工-1 [1-1]）。三者的 compile 按 `type` 分发互不可达；`isPlainTextColumn` 的 `column.link !== true` 排除子句仅对满足类型条件（type null/''/text）的 text.link 列生效，button（canvasOnly）与 list（type:'list'）均不满足该类型条件
- demo 页 URL `/data/<name>/`；不新增页面（复用 data/table、data/table-ex，不触发 watch 重启约束）

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| src/components/table/column-types/list.js | 新增 ListColumn（双通道 compile：`listItems(record, value)` 取值、列级 link 判定（`column.link === true` 整列生效，条目 `link` 键不参与渲染）、条目归一，见「接口 / 数据结构」） | A4~A7 |
| src/components/table/column-types/link.js | 重写为兼容壳：linkOption 映射（danger→color）+ 条目归一（danger→color）+ 列级 `link: true` + `_raw: column`，委托 ListColumn.compile；删除自有 DOM/canvas 渲染 | A7 |
| src/components/table/column-types/text.js | ① `link === true`：色缺省 `'primary'`、DOM 单行产物 class 追加 `mu-table__cell-link`、多行 div 条目 class 追加同款；② render 首行门控改为 `if (!value \|\| Array.isArray(value)) return null` | A1/A2/A3 |
| src/components/table/column-types/index.js | `ColumnTypes` 注册 `list: ListColumn` + import | A4 |
| src/components/table/column-types/style.scss | ① 新增 `.mu-table__list-cell`（并入 :41-44 padding 收窄规则；条目 `display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`、`a:hover` 下划线 + cursor、`[disabled]` 置灰 pointer-events:none）；② 新增 `.mu-table__cell-link { cursor:pointer; &:hover { text-decoration:underline } }`；③ 删除 `.mu-table__link-cell` 规则（:41-52 中 link 部分；`tag-cell` 部分保留） | A1/A5 |
| src/components/table/ex/cell-painters.js | ① `isPlainTextColumn`（:167-171）排除 `column.link === true`；② `resolveCellContent` 取值后统一数组门控（A9：`col.type` 为 null/''/字符串且不在 `{link,list,tag,button}` → `return {}`，非字符串 type 自定义列豁免；该门控同时覆盖原 `_plainText` 直渲路径）；③ `drawContentItems` :397 与 `resolveTooltipItems` :1531 分发条件扩为 `col.type === 'link' \|\| col.type === 'list'`；④ `linkTextColorOf`/`linkHoverColorOf`（实施后 :689-708）优先读 `item.color` 查表（`item.danger` 回退保留），无 color 时非 link 列条目（`item.link === false`）用 `theme.textColor`、其余回退 `colors.primary` 谱系（hover ?? color ?? primaryColor，R1-1b 修复：恢复 HEAD 老式自定义条目悬停谱系）；⑤ `drawLinkItems` 所有条目执行 report（实施后 :1087），hover 门控 `isLinkEntryHovered`（实施后 :885-890）`item.link !== false`——`link` 字段值 = 列级 `column.link`（人工-1 [1-1]，表达式不变）；⑥ 删除 `drawTextValue` 数组分支（:548-551）、`drawArrayLines`（:602-632）与 `resolveTooltipText` 数组分支（:1469-1481） | A1/A4/A5/A6/A9 |
| src/components/table/ex/row-geometry.js | ① `isLinkColumn`（:31-33）扩为 `col.type === 'link' \|\| col.type === 'list'`（注释同步）；② `columnLineCount` :127-129 数组分支改为 `if (Array.isArray(value)) return 1`（A9 后数组值恒单行/占位）；③ `indicatesVariableMode`（:351-354）删除文本列数组项，仅剩 `isLinkColumn(col) && count > 1`；④ 删除 `isTextPresentingColumn`（:36-40）与 `GRAPHIC_ITEM_TYPES`（:21-24；全仓 grep 仅 :128/:353 消费，改后无消费方）；⑤ :365-369 注释更新（hasArrayValues 语义收窄，controller 4 处消费点 row-geometry-controller.js:195/207/227/233 不改名） | A9 |
| src/components/table/ex/editor.js | `NON_EDITABLE_TYPES`（:38）追加 `'list'` | A4（list 不可编辑，对齐 link） |
| src/components/table/ex/table-ex.vue | `emitDomItemClick` capped dots payload（:1219）：kind `'link'` 的键由 `[item.kind]` 改为 `item`（tag/button 键不变） | A6/decisions 第 8 条 |
| demo/src/data/table/main-view.vue | ① 新增 demo-section「list 列 / text.link」：list 全 text 列与全 link 列（`column.link`，含 `{id}` 附加键、color 变体/disabled/超限 dots，另含遗留条目 `link: true` 键夹具验证其不参与渲染 + 标量值记录 + `@cell-item-click` payload 日志 span）、text.link 列（含 color 变体与 multiline+lineClamp 夹具）、link 兼容列（caption/danger/color/disabled 数据，验证 A7）；② 边界回归段追加 text 列数组值夹具（断言落占位）；③「列类型」段 note 增补 list | A1~A7 DOM 验证 |
| demo/src/data/table-ex/main-view.vue | ① `itemColumns`（实施后 :709-729）追加 list 全 text 列、list 全 link 列（`column.link`）与 text.link 列、`itemRecords`（:618-704）追加对应字段（条目级 link 夹具随 R1 迁移为整列）；② `multilineColumns`（:599-615）中 `strings`/`nums` 数组列改 `type:'list'`（`strings` 列 `maxItems:3` 改 `listOption.max:3`，DOM/canvas 同截断，列注释同步），并新增 text 列数组值夹具列 + `multilineRecords`（:566-597）对应字段（验证 A9 落占位）；③ 参照表 `:columns="columns"`（:230）与舞台同源，新增列自动同步，无需改绑定 | A1~A7/A9 canvas 验证 |
| demo/src/data/table-ex/self-checks/cell-painters.js | 更新受 link→list 兼容壳 / A6 / A9 影响的用例与文件头覆盖说明：数组多行（:1066-1083）改 A9 占位断言；link/tag 双通道（:1161-1218）与 LinkColumn dom（:1266-1319）改新产物（list-cell / `text-{color}` / payload `item` / `link` 字段取列级 `column.link`）；link 竖排与悬停（:1393-1505）改 `item.color` 生效；数组 tooltip（:1833-1858）改为 list 条目通道 + 文本数组无 tooltip；R1：1a stub `THEME_COLORS` 语义色与 `THEME.primaryColor` 同源化（对齐 theme.js readColors 语义色读 `--mu-{name}-color`）、1b 悬停谱系断言恢复 HEAD 口径（`colors.primary` hover ?? color ?? primaryColor） | 终验 self-checks 0 FAIL |
| demo/src/data/table-ex/self-checks/row-geometry.js | 估高/变高用例（:274-301、:304-367）改为「文本列数组不触发变高、list/link 条目计数决定行数」 | 同上 |
| demo/src/data/table-ex/self-checks/spans.js | 分层用例（:403-467）对照组改用 link 列条目计数触发 `hasArrayValues` | 同上 |

不改动：`src/components/table/base/table.vue`、`table-row.vue`（render 协议与消费端不变）；`src/styles/link.scss`（用户工作区改动，不动）；editor 的 textarea 数组开值/提交规整逻辑（editor.js normalize*，A9 仅限渲染链路，editor 自检保持）。

## 接口 / 数据结构

### list 列（ListColumn）

```js
// 列定义
{
  type: 'list',
  field: 'xxx',                  // 或 value 函数（value 经 ensureFn 后 (record) 求值）
  link?: Boolean,                // 列级：整列 link 渲染（全 text / 全 link，人工-1 [1-1]）；link 兼容壳设 true
  listItems?: (record, value) => 项数组, // 自定义取值（对齐 column.links/column.tags），缺省仅接受数组 value
  listOption?: {
    max?: Number,        // dots 截断（对齐 linkOption.max/tagOption.max）
    color?: String,      // link 列条目缺省色（decisions 第 6 条），如 'danger'
    disabled?: Boolean,  // 条目级缺省
    class?: String|Array|Function,
    style?: Object|Function
  },
  title?: Boolean        // 条目 title（对齐 link/tag）
}

// list 项（decisions 第 5 条 + 实施轮间第 1 条修正）：string | number | { label?, color?, disabled?, ...任意属性 }
// label 标准键；caption 保留兼容（label ?? caption 取值，经 warn() 开发期警告一次）
// 条目对象原样引用传出（payload item），仅 primitive 包装为 { label: el }
// link 生效值 = column.link === true（整列，条目 link 键不参与渲染、随任意属性原样保留传出）；
// color 仅 link 列条目消费（decisions 第 6 条）
```

render 产物：

```js
// dom=true
{
  class: 'mu-table__list-cell',
  items: [{
    is: isLink ? 'a' : 'span', // isLink = column.link === true（整列，下同）
    text: label,
    title,
    attrs: {
      class: [isLink ? `text-${color}` : null, _class], // 非 link 列不消费 color；_class = listOption.class 求值结果
      style, disabled?
    },
    events: { click }          // 所有条目（A6）；payload { record, column, item }
  }, ...]
  // max dots 条目：is / 色类随列级 link 判定（link 列 dots 为 a + `text-{listOption.color ?? 'primary'}`，
  // 非 link 列 dots 为 span 无色类），events.click 恒绑定，payload item '...'，
  // title = 被截断条目 label join '\n\n'
}
// dom=false
{
  items: [{
    kind: 'link',              // 复用 link 命中/hover 链（painter 侧零改动）
    link: isLink,              // = column.link（列级）；hover 门控依据；A6 点击所有条目，hover 仅 link 列条目
    text, title,
    color,                     // link 列条目: entry.color ?? listOption.color ?? 'primary'；非 link 列: null
    disabled,
    onItemClick                // 所有条目（A6）；payload { record, column, item }
  }, ...]
  // dots 条目同上（link 字段 = 列级 column.link），payload item '...'
}
```

条目解析规则（decisions 第 5/6 条 + 实施轮间第 1 条修正）：

- 值形态：ListColumn 缺省取值仅接受数组（A4）；非数组（含标量）→ 空内容落占位。单值包装只存在于 link 兼容壳的 `listItems`（`valueToLinks`）
- 条目归一：数组对象元素原样、primitive 包 `{ label: el }`
- 取值：`entry.label ?? entry.caption`（caption 时经 `warn({ component:'table', message })` 开发期警告，once 去重由 utils/warn 承担）
- link：`column.link === true`（列级整列生效，人工-1 [1-1]；条目对象遗留 `link` 键不参与渲染，随任意属性原样保留传出）
- 色：仅 link 列条目 `entry.color ?? listOption.color ?? 'primary'` → `text-{color}` / colors 查表；非 link 列条目恒正文色（`text-{color}` 不落、canvas 用 `theme.textColor`）
- disabled：`entry.disabled ?? listOption.disabled`；DOM `attrs.disabled = ''`（CSS 置灰 + pointer-events 拦截点击）、canvas `emitDomItemClick` :1214 isDisabledAttr 拦截（现状）
- 空判定：`label ?? caption` 为 null/'' 的条目过滤（对齐 isValidLink link.js:3-5）

### link 兼容壳（LinkColumn 重写）

```js
// LinkColumn.compile(column, dom)：
// 1. getLinks = ensureFn(column.links || valueToLinks)（原样保留取值链，调用带 (record, value)）
// 2. listItems = (record, value) => getLinks(record, value) 数组化后逐条归一
//    （单值 → 单元素数组的包装留在 valueToLinks，ListColumn 缺省不包装，A4）：
//    对象且 danger === true → { ...el, color: el.color ?? 'danger' }（decisions 第 7 条；
//      该项 payload 为映射对象，其余属性保留）
//    对象其余 → 原引用保留（caption 键经 ListColumn 兼容读取，color 键自然激活）
//    primitive → { label: el }
// 3. 委托 ListColumn.compile({ ...column, type: 'list', link: true, _raw: column,
//    listOption: { max, disabled, color: linkOption.danger === true ? 'danger' : undefined,
//                  class: linkOption.class, style: linkOption.style },
//    listItems }, dom)
//    注 1：link: true 为列级键（整列 link，人工-1 [1-1]）；{...column} 展开后显式覆盖
//    注 2：listItems 必须透传 value（缺省 valueToLinks 依赖 field 值），否则 link 列全空
```

### text 列（TextColumn）

```js
// column.link === true 时：
//   color = getColor(record, value) || 'primary'   // 链色缺省
//   dom 单行：class 追加 'mu-table__cell-link'（td 级）；lineClamp > 1：div 条目 attrs.class 追加
//   canvas：{ text, color: 'primary' | color 名, title }（decisions 第 11 条：仅链色文本，
//   无 hover 下划线/条目命中；isPlainTextColumn 排除 column.link 后自然走 drawTextValue 单行路径）
// 数组门控：if (!value || Array.isArray(value)) return null   // decisions 第 10 条
// danger：不新增（decisions 第 9 条，红色用 color:'danger'）
```

### payload（A6，decisions 第 8 条）

- DOM：所有 list/link 条目（含非 link 列纯文本条目）`emit('cell-item-click', { record, column, item })`；canvas：`{ record, column, item, recordIndex }`（emitDomItemClick :1204 外包，现状机制）
- `column` = 原始列引用（`column._raw ?? column`；兼容壳经 `_raw` 传递，canvas 侧 col._raw 同源）
- item = 归一后条目对象原样引用（含 id 等任意属性；danger 映射项为含 color 的映射对象）；dots（compile 内 max 与 canvas _maxItems 两层）payload `item: '...'`
- tag/button 列 payload 键不变（tag.js:93、table-ex.vue:1194）

## 被拒绝的备选

1. **列准备层改写 type 字符串（'link'→'list'）**：须同步 4 处 `col.type === 'link'` 分发（cell-painters.js:397/:1531、row-geometry.js:31-33 三个消费点、editor.js:38）+ DOM/canvas 双端列准备各改一遍（table.vue:166-200 与 cell-painters.js:175-213）+ editor 双类型登记；注册表层转换 `col.type` 不变，兼容层零分发改动，单一转换点双端生效（两通道都经 resolveColumnType：table.vue:168、cell-painters.js:178）。被拒。
2. **ListColumn 直接识别 danger 键**（壳不做条目映射）：list 项结构混入 link 遗产键，违反 decisions 第 5 条（经实施轮间第 1 条修正）既定项结构（`{ label?, color?, disabled?, ...任意属性 }`）；danger→color 映射收敛在兼容壳内，list 实现纯净（A7）。被拒。
3. **list/link 条目复用 `.mu-link` 类**：atomic.js 导入序 typography→link，同特异性下 `.mu-link` 的 `color: var(--mu-primary-color)` 覆盖 `text-{color}`（探索报告 CSS 覆盖风险，link.scss:1-11），条目色失效；改容器内专属 hover/disabled 规则 + `text-{color}` 染色。被拒。
4. **canvas 条目新 kind `'list'` 独立链路**：painter 侧 hit/hover（itemHits、isLinkEntryHovered cell-painters.js:892/:866/:1098）、onItemRect 回报、emitDomItemClick 分发全链改造；复用 kind `'link'` 仅新增 `link` 布尔字段区分样式/hover，命中链零改动，payload 键在 compile 与 capped dots 两处收敛为 item。被拒。
5. **保留条目级 link 叠加列级缺省（`entry.link ?? column.link`）**：整列形态可被单条目改写，违背人工-1 [1-1]「整列全 text 或全 link」裁决；条目级键移除后 link 判定单点（`column.link === true`），DOM/canvas 双端与 demo/断言口径唯一，dots 条目与普通条目判定同源。被拒。

## 风险与回滚

- **link 列行为变化（breaking，decisions 已裁决）**：① DOM 布局横排 inline → 竖排每项一行（A7 共用 list 实现的必然结果，canvas 端本就竖排）；② payload 键 `link` → `item`（decisions 第 8 条）；③ link 对象既有 `color` 键开始生效（decisions 第 7 条）；④ 实施轮间语义迁移（人工-1 [1-1]）：list 条目级 `link` 键不再参与渲染，首轮实施遗留的 `{ label, link: true }` 条目夹具按纯文本渲染（R1 迁移）。爆炸半径：所有 `type:'link'` 使用方（demo 侧 data/table:141/:165、table-ex:670/:728/:740/:823/:834、table-advanced、case-form 等仅形态变化，无需代码改）。双向门：还原 link.js 单文件即回滚。
- **A9 canvas 数组拆行移除（breaking，decisions 已裁决）**：text/number/bool/date/enum 等非条目列数组值不再每元素一行（拆行路径删除，统一落占位链）；范围仅渲染链路，不涉及 editor 数组开值/提交。爆炸半径：table-ex 依赖数组拆行的使用方。双向门：还原 cell-painters.js/row-geometry.js 数组分支。
- **list 非 link 列条目可点击（A6）**：canvas 命中矩形建在 kind `'link'` 上（条目产物 kind 恒 `'link'`），hover 样式由 `item.link !== false` 抑制（非 link 列条目产物 `link: false`）；老式自定义 kind `'link'` 条目无 `link` 字段（undefined ≠ false）→ 行为不变。非 link 列条目点击属新增交互（A6 验收要求；无 pointer/hover 样式，与 DOM 端 span 一致）。
- **self-checks 基线（本次直接更新）**：cell-painters / row-geometry / spans 三份自检含旧数组拆行与旧 link 产物断言（详见改动清单），随本设计同步改写；终验要求 0 FAIL。其余 pixel 断言（painter.js itemHits/veil、R4a/R4b）经核对不受影响（link 条目计数与槽位锚不变）。
- **R1 修复轮回归面（语义迁移 + 05-verify-1.md 三项 FAIL）**：list.js 判定源 / 兼容壳列级键 / demo 两页条目级 link 夹具（改整列）/ self-checks 断言同轮迁移，回归由 A4/A6 新断言（含遗留 link 键条目渲染为 span 的负向断言）覆盖；canvas 条目命中失效（verify 失败项 2/3）根因未闭合，修复触碰 painter.js/interactions.js/table-ex.vue 点击链时按失败项 3 的操作序列变体复测（见实施步骤 R1-4）。
- **单向门**：无（全部改动可按文件还原；无数据迁移/接口删除）。
- 合并冲突面：`src/styles/link.scss` 为用户工作区未提交改动，本设计不触及该文件。

## 测试计划

demo 服务：rollup watch 常驻 + :3000；页面 `/data/table/`、`/data/table-ex/`。服务未运行时报告环境阻塞（00-task.md 验证环境）。playwright 优先 DOM/可访问性快照断言。

| 验收标准 | 归属片 | 手段 | 检查方式 |
|---|---|---|---|
| A1 text.link 渲染与 color→class | 片3 | `浏览器` | /data/table/ 新 section：DOM 断言 text.link 单元格 class 含 `mu-table__cell-link` + `text-{color}`（color 变体各一）；无 color 时 `text-primary`；hover computed style `text-decoration` 含 underline（element hover 后取值）。canvas 侧 /data/table-ex/ DOM 参照表同断言 + canvas 区目检链色（人工，DOM 参照并排） |
| A2 danger 不新增 + 数组拒绝 | 片3 | `浏览器` + 代码审查 | demo 回归段 text 列数组值夹具 → playwright 断言 td 文本 = placeholder（`-`）；审查 text.js 无 danger 分支 |
| A3 multiline/lineClamp 保留 | 片3 | `浏览器` | demo 多行 text.link 夹具：断言条目 class 含 `line-clamp`/`pre-line` 与 `--line-clamp` style；既有无 link 多行列不回归 |
| A4 list 列渲染 + 列级 link | 片1（DOM）/ 片2（canvas） | `浏览器` | /data/table/：断言 list 单元格 class 含 `mu-table__list-cell`；link 列（`column.link: true`）整列条目为 `a` 元素且 class 含 `text-{color}`（缺省 `text-primary`、color 变体各一）；全 text 列整列条目为 `span` 且绑定 click（A6）、无 `text-{color}`；全 text 列遗留 `{ label, link: true }` 条目夹具 → 仍渲染 `span`（条目 link 键不参与渲染，人工-1 [1-1] 负向断言）；标量值夹具 → 落占位（仅接受数组）。 /data/table-ex/ DOM 参照表同款断言 + canvas 区目检竖排与整列链色（对齐 A1 手段） |
| A5 每项单行省略 | 片1（DOM）/ 片2（canvas） | `浏览器` + 目检 | 窄列（width 固定）+ 超长文本项：断言条目 computed style `white-space: nowrap`、`text-overflow: ellipsis`、`overflow: hidden`，且 `scrollWidth >= clientWidth`（截断发生）；多项断言各占一行（条目 offsetTop 递增）；canvas 区目检复用 drawLinkItems 既有逐条省略 |
| A6 cell-item-click payload | 片1（DOM）/ 片2（canvas） | `浏览器` | demo payload 日志 span：playwright 分别点击 **link 列条目**与**全 text 列条目** → 日志 JSON 含 `record`/`column`/`item`（item 为条目对象原样，含 id 等附加键；column 的 field/caption 与原始列配置一致，非兼容壳派生对象）；disabled 项点击无日志；/data/table-ex/ canvas 区点击 link 列与 list 文本列两类条目 → 日志含 `recordIndex` |
| A7 link 兼容共用 list 实现 | 片1（DOM）/ 片2（canvas） | `浏览器` + 代码审查 | data/table 新 section link 兼容列（caption/danger/color:teal/disabled 数据）与 /data/table-ex/ 既有 link 列/`linkReferenceRecords`（danger/color 夹具）：断言渲染为 `mu-table__list-cell` 竖排、条目色 `text-danger`（danger:true 映射）/`text-teal`（color 键激活）、捕获 payload 键 `item`；审查 link.js 仅含映射 + 委托（import ListColumn，无渲染逻辑） |
| A8 构建通过 + demo DOM 验证 | 终验 | `命令` | `npm run build` 退出码 0 |
| A9 table-ex 其他列不支持数组 | 片2 | `浏览器` + 代码审查 | /data/table-ex/ text 列数组值夹具：canvas 区不拆行（dom 参照表断言落占位 `-` + canvas 区目检单行）；multiline 场景 `strings`/`nums` 改 list 后正常渲染；审查 `resolveCellContent` 数组门控（type null/''/其他字符串落 `{}`，非字符串 type 豁免）、`drawArrayLines`/tooltip 数组分支已删、row-geometry 数组分支恒 1 行；self-checks row-geometry 用例通过 |

全局检查（终验）：lint（eslint，改动文件无新错误；样式改动过 stylelint --fix）；/data/table-ex/ self-checks 全量通过（0 FAIL，含本次更新的三份用例与 R1 修复的 1a/1b 两用例）；demo（`__env__='development'`）控制台出现一次 list `caption` 兼容警告（utils/warn once 去重）。

## 实施步骤

### 片1：DOM 端 list 列 + link 兼容壳（A4/A5/A6/A7 DOM 面）

1. 新建 `src/components/table/column-types/list.js`（ListColumn 双通道 compile，接口见上）；`index.js` 注册 `list`。
   - 完成判据：demo data/table 临时列 `{ type:'list' }` 渲染出 `mu-table__list-cell` + 竖排条目（playwright 断言；demo 夹具在步骤 3 落位，可临时列验证或与步骤 3 合并复核）。
   - 文件集合：list.js、index.js。依赖：无。
2. 重写 `link.js` 为兼容壳（映射 + 委托）；`style.scss` 增 `.mu-table__list-cell` 规则、删 `.mu-table__link-cell` 规则。
   - 完成判据：demo 既有 link 列（caption 数据）渲染为 list-cell 竖排，danger 项 `text-danger`、disabled 项置灰不可点（playwright）。
   - 文件集合：link.js、style.scss。依赖：步骤 1。
3. demo `data/table/main-view.vue`：新 section「list 列 / text.link」——list 全 text 列与全 link 列（`column.link`，含 `{id}` 附加键、color 变体/disabled/超限 dots、遗留条目 `link: true` 键夹具）+ `@cell-item-click` payload 日志 span + link 兼容列（caption/danger/color:teal/disabled，A7 夹具）+ text.link 占位结构；旧 linkColumns（:160-173）保留作回归对照。
   - 完成判据：A4/A5/A6/A7 的 DOM 断言全部通过（playwright；A6 先覆盖 link 列条目与全 text 列条目）。
   - 文件集合：demo/src/data/table/main-view.vue。依赖：步骤 2。

### 片2：canvas 端 list + 数组支持移除（A4/A6/A7 canvas 面 + A9）

4. `cell-painters.js`：分发扩展（drawContentItems/resolveTooltipItems）、色维度（linkTextColorOf/linkHoverColorOf）、drawLinkItems 全条目 report + hover 门控、`isPlainTextColumn` 排除 `column.link`、`resolveCellContent` 统一数组门控、删 drawArrayLines / drawTextValue 数组分支 / tooltip 数组分支。
   - 完成判据：`npm run build` 通过；demo 临时 list 列 canvas 区竖排渲染（或步骤 6 后复核）、list 全 text 列条目点击产出 cell-item-click（A6，日志）。
   - 文件集合：cell-painters.js。依赖：片1 步骤 1。
5. `row-geometry.js`（isLinkColumn 扩展、数组分支、变高判定、删 isTextPresentingColumn/GRAPHIC_ITEM_TYPES）、`editor.js`（NON_EDITABLE_TYPES + 'list'）、`table-ex.vue`（capped dots payload item 键）。
   - 完成判据：list 多条目行 canvas 变高正确（多条目行高于单行行高，目检）；list 列点击不进编辑。
   - 文件集合：row-geometry.js、editor.js、table-ex.vue。依赖：步骤 4。
6. demo `data/table-ex/main-view.vue`：itemColumns/itemRecords 增 list 全 text 列、list 全 link 列（`column.link`）与 text.link 列；multiline 场景 `strings`/`nums` 改 list 列并新增 text 数组占位夹具；参照表随 `columns` 同源自证。
   同步更新 self-checks 三文件（cell-painters / row-geometry / spans）至本设计的 link/list/A9 新语义。
   - 完成判据：A9 断言通过；self-checks 面板 0 FAIL；canvas/DOM 参照并排形态一致（目检）。
   - 文件集合：demo/src/data/table-ex/main-view.vue、demo/src/data/table-ex/self-checks/cell-painters.js、demo/src/data/table-ex/self-checks/row-geometry.js、demo/src/data/table-ex/self-checks/spans.js。依赖：步骤 5。

### 片3：text 列 link 选项 + 数组门控（A1/A2/A3）

7. `text.js`（link 选项、色缺省、数组门控、DOM class）；`style.scss` 增 `.mu-table__cell-link`（与片1 同文件不同规则，串行于片1 步骤 2 之后）。
   - 完成判据：A1/A2/A3 DOM 断言通过（playwright，含 data/table-ex DOM 参照表）。
   - 文件集合：text.js、style.scss。依赖：片1 步骤 2（style.scss 串行）。
8. demo `data/table/main-view.vue` 补 text.link 夹具（含 color 变体与 multiline+lineClamp）与数组回归夹具（同文件续写片1 步骤 3 的 section）。
   - 完成判据：片3 相关 playwright 断言全通过。
   - 文件集合：demo/src/data/table/main-view.vue。依赖：步骤 7、片1 步骤 3（同文件串行）。

### 终验

9. 全量验证：`npm run build`、eslint（改动文件）、stylelint --fix（style.scss）、两 demo 页 playwright 全量断言（A1~A9 清单）、self-checks 面板 0 FAIL 核对。
   - 文件集合：无新增。依赖：片1~片3 全部。

### R1 修复轮（primary 实施，decisions 实施轮间第 2/3 条）

首轮实施已落地片1~片3（05-verify-1.md：DOM 面 A1~A7 全 PASS、A9 PASS）；本节为第二轮实施（同一 primary）工作面 = 人工-1 [1-1] 语义迁移 + 05-verify-1.md 三项 FAIL 修复。片1~片3 步骤不再重执行，仅按下列步骤在既有实现上修改。

- **R1-1 语义迁移（人工-1 [1-1]）**：`list.js` link 判定改列级单点——`isLinkEntryOf` 的 `entry.link ?? listOption.link ?? false` 改为 `column.link === true`（entry.link 不消费，现状 list.js:46-48/:110）、link 缺省源 `listOption.link` 改 `column.link`（:110）、文件头注释同步；`link.js` 兼容壳 `listOption.link: true`（现状 :50）改为委托对象顶层 `link: true`；demo 两页条目级 link 夹具迁移为整列（data/table listColumns/listRecords 现状 :248-268、data/table-ex itemRecords.list 现状 :653/:671-673/:698 与 itemColumns 增拆 list 全 text 列 + 全 link 列，note/code 文案同步）；self-checks 条目 `link` 字段断言改列级来源。
  - 完成判据：A4/A6 断言按列级口径通过（含全 text 列遗留 `{ label, link: true }` 条目渲染为 `span` 的负向断言）。
  - 文件集合：src/components/table/column-types/list.js、link.js、demo/src/data/table/main-view.vue、demo/src/data/table-ex/main-view.vue、demo/src/data/table-ex/self-checks/cell-painters.js。依赖：无。
- **R1-2 修复 verify 1a（self-checks stub 口径）**：stub `THEME_COLORS` 语义色与 `THEME.primaryColor` 同源化（对齐 theme.js readColors 语义色读 `--mu-{name}-color`，真实主题两者相等），「list link 条目缺省 primary」断言期望保持 `THEME.primaryColor` 口径。
  - 完成判据：该用例 PASS；`npm run build` 通过（真实渲染行为不变）。
  - 文件集合：demo/src/data/table-ex/self-checks/cell-painters.js（stub :68-79、断言 :1523）。依赖：R1-1（同文件同轮）。
- **R1-3 修复 verify 1b（悬停谱系回归）**：`linkHoverColorOf`/`linkTextColorOf` 无 color/danger 条目恢复 HEAD `colors.primary` 谱系回退（hover ?? color ?? primaryColor，现状 :694-695/:707 直落 `primaryColor` 丢失 .hover 层）；`item.link === false` 分支（非 link 列条目）保持 `textColor`。老式自定义 kind:'link' 条目（无 link 字段）悬停色回归 HEAD。
  - 完成判据：self-checks `linkHoverColorOf` 用例（HEAD 既有断言，verify 报告 :1748）PASS；A6/A7 canvas 复测不回归。
  - 文件集合：src/components/table/ex/cell-painters.js。依赖：R1-1。
- **R1-4 定位修复 verify 失败项 2/3（canvas list/link 列条目点击失效，根因未闭合）**：按 05-verify-1.md 定位方向排查条目命中链——painter.js（drawCellClipped :462-486 itemHits 收集、paintRegion :1225-1240 脏区分支）、interactions.js（resolveItemClick :327-378）、table-ex.vue（hover :912-945 / 点击 :1093-1097）；绘制侧已排除（像素行带证实条目文本正常）。修复后按失败项 3 做时序复测：直接点击 / 先滚动 / 先 hover / 场景切换后点击，link 列与 list 列（link 列与全 text 列）条目均稳定触发 `cell-item-click`。
  - 完成判据：/data/table-ex/ canvas 区 link 列与 list 列条目点击均稳定产出 `cell-item-click`（payload 键 `item`、含 `recordIndex`），四种操作序列变体全过；link 列条目 hover cursor=pointer。
  - 文件集合：src/components/table/ex/painter.js、interactions.js、table-ex.vue（以实际定位为准）。依赖：R1-1。
- **R1-5 全量复验**：`npm run build`、eslint/stylelint、两 demo 页 A1~A9 全量断言（列级 link 口径）、self-checks 0 FAIL（201/201）。
  - 文件集合：无新增。依赖：R1-1~R1-4。

## 未解问题

1. 【验证受限】canvas 端颜色/布局（A1 链色、A5 逐条省略、A9 不拆行、list 竖排）无 DOM 断言手段，测试计划以 DOM 参照表断言 + 目检/并排比对 + self-checks 覆盖；若目检发现 canvas/DOM 形态不一致，按「DOM 参照为准」修正 canvas 分发。
2. 【实施待定位】canvas list/link 列条目点击失效（05-verify-1.md 失败项 2/3）根因未闭合（绘制侧正常、行为证据确凿），由 R1-4 定位修复；若定位结论需结构性改动命中链（超出上述三文件的自然修复面），回设计修订再实施。
