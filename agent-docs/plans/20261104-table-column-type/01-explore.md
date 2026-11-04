# 探索报告

基线确认：dev @ 6980b6f；工作区改动 `M src/styles/link.scss`（用户已有，见约束）、`?? agent-docs/plans/20261104-table-ex-measure-perf/`（无关）。`decisions.md` 为空，无已确认约束。

## 相关代码

### 列类型体系与 DOM 通道（mu-table）

- `src/components/table/column-types/index.js:16-34` — ColumnTypes 注册表（text/enum/rec_no/check/bool/date/datetime/number/currency/link/tag/img/image）+ `resolveColumnType`（未知 type 回退 TextColumn）；新 `list` 类型在此注册
- `src/components/table/column-types/text.js:3-55` — TextColumn.compile(column, dom)：DOM 通道 color → `text-{color}` class（:29）、multiline/lineClamp → `pre-line`/`line-clamp`+`--line-clamp`（:30-34，>1 时包 div 条目）；canvas 通道产 `{ text, color, title }`（:18-24）；无 danger 分支、无数组值分支（text 直取 value）
- `src/components/table/column-types/link.js:7-104` — LinkColumn：值归一 valueToLinks（:9-18，数组对象元素原样保留、primitive 包 `{ caption: el }`、单值包 `[{ caption: value }]`）；linkOption 仅解构 `{ max, danger, disabled }`（:21，无 color）；DOM 条目 `is:'a'` + `mu-link`/`mu-link--danger`（:70-89），返回 `{ class: 'mu-table__link-cell', items }`；canvas 条目平铺 `{ kind:'link', text, danger, disabled, onItemClick }`（:39-62）；两通道点击均 `emit('cell-item-click', { record, column, link })`（:47/:59/:92-93，dots 条目 payload 值 `'...'`）
- `src/components/table/column-types/tag.js:38-101` — 同构参照：条目级 color（DOM `text-{c}`+`bg-{c}-translucent` :87，canvas color 平铺 :56）、max/dots、cell-item-click payload 键 `tag`
- `src/components/table/base/table.vue:161-205` — internalColumns 列准备：`col._render = type.compile(el, true)`（:180，DOM 通道恒传 dom=true）；emits 含 `cell-item-click`（:91-99）
- `src/components/table/base/table-row.vue:12-27` — DOM 消费端：`cell.items` → `<component :is>` + `v-bind="item.attrs"` + `v-on="item.events ?? {}"`（knowledge items-events-可选 兜底）；无 items 时 `{{ cell.text ?? placeholder }}`（数组值经 Vue 插值对象序列化渲染，推测：Vue toDisplayString 对数组走 JSON.stringify，未运行实测）
- `src/components/table/column-types/style.scss:41-52` — `.mu-table__link-cell/__tag-cell` padding 收窄 + 条目 `overflow:hidden; max-width:calc(100% - 4px); margin:2px`（td `white-space:nowrap` 下多链接横排 inline）

### canvas 通道（mu-table-ex）

- `src/components/table/ex/cell-painters.js:125-148` — createColumnRender：canvas 通道调 `type.compile(column)` 不传 dom（缺省 false）；progress/button 为 canvas 专属类型不经注册表
- `src/components/table/ex/cell-painters.js:165-171` — isPlainTextColumn 短路（P2）：`!text && !multiline && !canvasOnlyKind && color==null && type∈{undefined,'','text'}` 免 render 直渲——text 列新增 link 选项须纳入排除，否则链色丢失
- `src/components/table/ex/cell-painters.js:373-426` — drawContentItems 分发：单 item + `line-clamp` class 改道 drawText 多行（:378-395）；`col.type === 'link'`（:397）竖排 drawLinkItems；其余横排 drawItems
- `src/components/table/ex/cell-painters.js:603-632` — drawArrayLines：文本呈现列数组值每元素一行、逐元素省略、超 `_maxItems` 第 maxItems 行 `'...'`
- `src/components/table/ex/cell-painters.js:701-717` — linkTextColorOf/linkHoverColorOf：恒两色 primary/danger（danger→`colors.danger`，无 color 维度）；hover 下划线仅条目路径（drawItemText :917-922 / drawLinkEntry :1046-1048）
- `src/components/table/ex/cell-painters.js:1024-1114` — drawLinkItems：竖排每条一行、单条省略、超限 dots、每条按列 align 各自对齐（knowledge table-ex-item-column-align）、onItemRect 回报命中矩形（kind 'link'）
- `src/components/table/ex/row-geometry.js:24-40,106-132,351-354` — `isLinkColumn(col)`=`col.type==='link'`（:31）与 `isTextPresentingColumn`（GRAPHIC_ITEM_TYPES :24 排除 tag/button/check/img/image/progress）；link 列行数=render 条目计数（:125）；文本呈现列数组值行数=min(length,maxItems)（:127-128）；变高模式判定（:353）
- `src/components/table/ex/table-ex.vue:1093-1232` — finishCellClick 事件序（item click → 选中/cell-click 链 → 编辑）；emitDomItemClick（:1201-1224）：canvas 条目 `onItemClick` 自持派发、payload 外包 `recordIndex`（DOM 版无 recordIndex）；`_maxItems` 截断 dots 补发 payload `'...'`（:1218-1221）
- `src/components/table/ex/editor.js:38` + `src/components/table/ex/theme.js:60-105` — NON_EDITABLE_TYPES 含 `'link'`（新 list 需评估加入）；canvas 色板 colors 固定 17 色（12 彩色 hover 同色 + 5 语义 hover=-4 浅色；gray 不入 map 为回退色）

### 样式

- `src/styles/typography.scss:44-58` — `.text-{color}` 类全集：5 语义（含 `text-danger`）+ gray + 12 彩色，色值 `--mu-{name}(-color)`
- `src/styles/link.scss:1-20`（工作区版）+ `src/styles/atomic.js:6-7` + `src/components/table/base/table.scss:45-67` — `.mu-link`（primary 色 + hover 下划线）+ `.mu-link--danger` + `[disabled]` 置灰；**工作区已删除** `.mu-link--{语义}` 色类与 hover 变色（用户未提交改动）；atomic 导入序 typography→link，同元素叠加时 `.mu-link` 的 color 覆盖 `.text-{color}`（同特异性后定义胜出，knowledge css-split-equal-specificity-order 同类坑）；td 基线 nowrap+ellipsis+hidden（单行省略）

### demo

- `demo/src/data/table/main-view.vue` — mu-table 演示页：列类型段（:14-22）、link 列操作演示（:160-172）、边界回归段（:73-88）
- `demo/src/data/table-ex/main-view.vue:224-243,618-682` + `demo/src/catalog.js:107-129` — table-ex 验证页含「DOM 版 mu-table 参照」段（canvas/DOM 并排比对，可挂 A1~A7 验证）；link 三态/彩色对象夹具（对象 color 键 :634,:637 当前不被 link.js 消费）；catalog 登记 5 个 table 相关页面

## 现有约定

- 列类型协议：类型对象 `{ align?, width?, compile(column, dom) }`；compile 产 render `({ record, recordNumber, value, emit })`；dom=true 产 `{ text?, class, style, items?, events }`（items 条目 `{ is, text, title, attrs: { class, style }, events }`），dom=false 产 `{ text, color, title }` 或 `{ items: [{ kind, text, color/danger/disabled, title, onItemClick }] }`（knowledge compile-双通道协议）
- 值归一惯例（link/tag 同款）：数组对象元素原样、primitive 包 `{ caption }`、单值包单元素数组
- 事件：`cell-item-click` 双端 payload 同构 `{ record, column, <kind> }`（kind 为 link/tag/button 条目原对象），canvas 侧额外外包 `recordIndex`；dots 条目 payload 值 `'...'`
- 颜色：DOM 落 `text-{color}` class、canvas 落色名由 `theme.colors` 查表（17 色名 + gray 回退）；`ensureFn`（`src/utils/type.js:80-84`）把非函数配置包成常量闭包，color 支持 `色名 | (record,value)=>色名`
- 目录/命名：新列类型 = `src/components/table/column-types/<type>.js` + 注册表登记；ex/ 模块隔离（cell-painters 不 import theme/layout，主题经参数注入）
- 无测试框架；table-ex demo 页内置 self-checks（`demo/src/data/table-ex/self-checks/`，挂载即跑 runChecks）
- 知识库：`agent-docs/knowledge/INDEX.md` 相关条目——compile 双通道协议、table 列 color 参数、items events 可选、条目列对齐协议、demo 页 URL /data/ 前缀、demo watch 新页需重启

## 约束与风险

- **00-task.md 验证环境 URL 过时**：实际页面为 `http://localhost:3000/data/<name>/`（catalog 路径 `data/table` 等；knowledge demo-page-url-data-prefix），非 `/<name>/`
- **link.scss 工作区改动**：`.mu-link--{语义}` 色类与 `.mu-link:hover` 变色已被用户删除（git diff 确认）——text/link 的 DOM 着色只能走 `.text-{color}` 类（与任务目标一致）；不得还原该文件
- **CSS 覆盖顺序**：同元素叠加 `mu-link` + `text-{color}` 时 `.mu-link` 的 `color: var(--mu-primary-color)` 覆盖色类（atomic.js 导入序）；DOM 实现若共用元素须处理（提高色类特异性或分离元素）
- **`col.type === 'link'` 字符串分发散布 4 处**：cell-painters.js:397（绘制）、:1531（tooltip 溢出）、row-geometry.js:31-33（行数/变高/文本列判定，含 :37/:125/:353 三个消费点）、editor.js:38（不可编辑）。link→list 兼容转换若在注册表/compile 层完成（col.type 保持 `'link'`），分发点无感；若改写 type 字符串须全数覆盖
- **isPlainTextColumn 短路**（cell-painters.js:167-171）：text 列新增 `link` 选项不纳入排除条件 → canvas 直渲丢链色/链样式
- **DOM/canvas 布局差异**：DOM link 多条目横排 inline（td nowrap），canvas 竖排每条一行；list 列「每项单行」与 canvas 语义一致，DOM 需新增竖排布局 CSS（现 `.mu-table__link-cell` 无竖排规则）
- **canvas 文本路径无条目机制**：text 列（非 items）无 onItemRect 命中/hoverItem 通道；text.link 在 canvas 的 hover 下划线/独立点击命中需条目化才可得
- **demo/文档先行于代码**：demo link 夹具对象已带 `color` 键（main-view.vue:634,637），quick-reference_components.md:1670 宣称 linkOption 含 color——link.js 均未实现（:21 只解构 max/danger/disabled，:51/:83 条目只取 caption/disabled/danger）
- **text 列历史无 danger**：`git log -S danger -- text.js` 为空；A2「text 列不再接受 danger」在现有代码无对应删除物（见未解问题 5）
- **数组值现状（text 列）**：DOM 渲染为 JSON 序列化串（推测，未实测）；canvas 每元素一行（drawArrayLines）；row-geometry 按每元素一行估高。移除 text 数组支持仅影响 text（number/bool/date 等文本呈现列的数组分支保留）
- **demo watch 新增页面目录需重启构建 + catalog.js 登记**（knowledge demo-watch-new-entry-restart）——验证优先复用现有页面（table / table-ex 均有可挂载段）

## 验证方式

- `npm run build`（build:base + build:ex，各 dev/prod 两遍 vite build）
- `npm run demo:build`（watch 模式，已由开发常驻；服务 :3000，页面 `/data/<name>/`）
- 无单测；table-ex self-checks 随页面运行（改动 cell-painters/row-geometry 后留意自检基线，knowledge canvas-pixel-assert-anchor-drift）
- lint：eslint 8.57.0（口径 src + demo/src）；样式错误先 `stylelint --fix`

## 未解问题

1. 【用户取舍】list 项数据结构形态：
   a) 对齐 link/tag 归一惯例：元素 = `string | number | { caption?, link?, color?, disabled? }`（建议——与 valueToLinks/valueToTags 同构，`{ link: true }` 为其子集，兼容面最大）
   b) 最小集：`{ link: true }` 对象 + 原始值，不引入 color/disabled
2. 【用户取舍】list 列 link 样式项的颜色来源：任务仅说「`{ link: true }` 项按 link 样式渲染」。是否吃列级 color / 条目 color（→ `text-{color}`）？
   a) 列级 color 缺省 primary、条目对象 color 覆盖（建议，对齐 text 列 color 语义与 tag 条目色先例）
   b) 恒 primary，不引入 color
3. 【用户取舍】link 列兼容映射细节：linkOption.danger 与条目 danger/disabled 如何进 list+color 体系？
   a) `danger:true → color 'danger'`（DOM `text-danger`、canvas `colors.danger`），disabled 原样保留（建议）；link 对象既有的 color 键（demo/文档已出现）顺势激活
   b) danger 布尔直通 list 条目（保留 mu-link--danger 路径，不满足「共用 list 实现」的纯净度）
4. 【用户取舍】A6 payload `{ record, column, link }` 与双端差异：DOM 版无 recordIndex、canvas 版外包 recordIndex（现状即如此）；list 项点击 payload 键名与 recordIndex 取舍：
   a) 键名 `link`、维持双端现状差异（建议——与 link 列 payload 完全同构）
   b) 键名 `item` 或 DOM 补 recordIndex（偏离 link 惯例，影响面大）
5. 【用户确认】A2「text 列不再接受 danger」语义：text.js 历史无 danger 路径（git -S 空）。建议理解为「text.link 场景用 color 表达红色（`text-danger` 类已存在），不为 text 引入 danger 布尔」——即无需删除任何现有代码，验收改为「不新增 danger 支持」。若另有所指需澄清
6. 【设计取舍】link→list 转换实现层：注册表层（LinkColumn 内部委托 ListColumn 或 resolveColumnType 改写，col.type 保持 `'link'`，4 处字符串分发无感；建议方向）vs 列准备层改写 type 字符串（须同步 4 处分发 + editor + demo 夹具）。归设计阶段裁定
7. 【用户取舍】text 列数组值拒绝方式：
   a) compile 内数组门控 → 不产出内容、落占位链（与 `!value` 门控同式，建议）；canvas 侧 isTextPresentingColumn 的数组分支保留（number/bool 等仍用）
   b) 控制台开发期警告 + 忽略
8. 【用户取舍】text.link 在 table-ex（canvas）的形态：
   a) 仅链色文本渲染（无 hover 下划线、无独立条目命中，点击仍走 cell-click；建议——A1 未要求 item 事件，改动最小）
   b) 条目化复用 link 命中/hover 机制（引入 cell-item-click 语义扩散，超出 A1~A7 范围）
