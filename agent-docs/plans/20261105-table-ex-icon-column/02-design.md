# 设计：table-ex icon 列与图标按钮（修订 6）

代码基线：dev 分支 worktree（2026-11-05）。行号以编写时为准。

修订 1（2026-11-05，用户 4 条要求）：icon 列收敛单图标（仅注册名 + color）；button 列支持图标按钮；editButton 仅注册图标且 onClick 改 emit；补性能与 API 便利权衡。

修订 2（2026-11-05，peer 审改）：校正注册表实际规模（28 个 tabler + 3 复合，非「全量」）；icon 列 color 上提 `column.color`、选项收敛为 `iconOption.size`；canvas 条目补 `size`；统一 `drawIconGlyph` 共享助手并明确导出；`requestImage` 改多监听（修复多行共用图标仅首格重绘）；码点解析状态机与 pending 重绘链定案；button 图标测宽/几何/tooltip 溢出补齐；editButton 解析器落点收敛；demo 夹具与验证节改为可执行（self-checks 浏览器运行 + `node --check`，cls 依赖注入 class 夹具）。

修订 3（2026-11-05，primary 定稿收尾）：全文一致性核对——peer 16 项实质改动融入后，术语 / 协议字段 / 章节引用 / 实施清单 / 验证节交叉自洽；全部源码引用行号复核无误。修正 `resolveColor` 虚构符号为内联解析式（仓库无该函数，fff 全库 0 命中）；补「方案概述」「风险与回滚」「验收标准归属」；冲突点前言与 editButton 节的「不留兼容层」表述改为指向未解问题 1（过渡期 A/B 由人工确认门裁决）；未解问题 1 补两方向权衡（迁移成本 / 性能 / API 一致性）与协议引入版本证据（v4.2.0 定稿提交 `1c8f326`）。

修订 4（2026-11-05，人工意见回应，确认门裁决落实）：K-1a 未解问题 1 定案方向 A——editButton 旧形态直接移除不留兼容层，新增「破坏性变更与迁移指引」节（svg → `installIcons`、onClick → `@edit-button-click`）供发布说明引用；K-1b 全局改名 editorButton → editButton（协议键 / 事件名 / 代码符号 / 常量，破坏性变更面合并表述）；K-4 推翻 D1——码点解析时机改为图标 install 时（`src/icons/index.js`），glyph/fontFamily 存入注册表项，cell-painters 状态机删除，icons/index.js 进入实施范围（片 1 步骤 1）；K-2 复核无 `iconOption.color` 残留；「未解问题」清空。

修订 5（2026-11-05，二轮设计调整第 1 轮，用户 4 项裁决落实，decisions.md「二轮设计调整裁决」）：a) button pill 高度与 icon-only 宽改 `--mu-control-height-small`（24）——经主题快照新增字段 `controlHeightSmall`（readPx 尺寸先例）+ constants 回退常量；`TAG_HEIGHT` 与 button 链解耦（tag 链不动）；`BUTTON_ICON_GAP` 随形态删除成死代码一并删除；b) icon+caption 形态删除——caption/icon 互斥、文本优先（caption 非空 → caption-only 且 icon 忽略），ellipsizeButton / buttonsOverflowOf / drawButtonPill / drawButtonLink / 哨兵与 warn 语义同步；c) icon-only 宽高一致 = 24、图标水平垂直居中，link 形态 icon-only 定案（无 pill，宽 = 图标本体 12）；d) ellipsizeButton 裁剪检查顺序缺陷（05-verify-终-2 失败项 1）随 icon-only 降级路径删除而结构性消解——caption-only 省略结果为空串即返回 null（不得落空文本条目），右缘裁剪条款保持、回归断言（0 fillText + 0 pill fill/stroke + 0 onItemRect）入实施清单。theme.js / constants.js / self-checks（cell-painters + theme）纳入片 2 改动面；上轮终验 UNVERIFIED（tooltip 矩阵子断言）随本轮矩阵重算重跑补验（decisions.md 二轮调度裁决）。

修订 6（2026-11-05，二轮设计第 3 轮，primary 定稿收尾）：peer 审改（06-amend-2，实质 3 + 非实质 13）全部确认融入，无回退——实质 #1 caption-only 空文本 `if (!text) return null` 已入伪代码、#2 d 回归断言强化（0 fillText + 0 pill fill/stroke + 0 onItemRect + 删原 glyph 位置断言）、#3 `controlHeightSmall: 32` 自定义快照断言；全文一致性收尾——self-checks 期望值复算自洽（条目推进 = 宽 + cell padding 8、fakeMeasure CJK 9px/字符：texts `'编辑@16'/'<glyph>@56'/'删除@90'`、宽 `[34,24,34]`，d 场景「甲」需 25 > 内容宽 24 必空串）、上轮实施后行号漂移修正（`defineEmits :156-170`、`tryEditButtonClick :1051`、`isEditButtonHit :973`、`emitButtonItemClick :1198`）、「修订 1 补充调研」节加基线时点注记、步骤 14 补 button 图标注释（`:52-53`）随形态收敛同步改写、实施清单增「二轮实施范围」注记；用户 4 项二轮裁决逐条核对均在正文与验证节落实（pill 高快照取值 / 互斥文本优先 / icon-only 方形居中 / 裁剪顺序修复含回归断言）。

## 方案概述

三个能力，全部落在 table 列类型体系与 canvas 绘制链内，双通道（canvas compile / DOM compile）覆盖（button 除外，canvas 专属类型）：

1. **icon 列**（新增列类型 `icon`）：value 收敛为 icons 注册名 string，`column.color` 设色、`iconOption.size` 定尺寸；纯展示、不可编辑、无条目点击。
2. **button 列图标按钮**：条目协议扩展可选 `icon` 键（注册名），**caption 与 icon 互斥、文本优先**（caption 非空 → caption-only 且忽略 icon；caption 空 + 有效 icon → icon-only），icon+caption 形态删除（二轮调整 b）；pill 高度与 icon-only 宽 = `--mu-control-height-small`（主题快照读取，缺省 24，二轮调整 a/c）；link 形态（`column.link`）为两形态的无 pill 变体。测宽、空哨兵与 tooltip 溢出同步适配。
3. **editButton 改造**：`column.editButton.icon` 收敛为注册名（协议键由 `editorButton` 改名，确认门裁决 K-1b），`onClick` 属性移除，改为组件 emit `'edit-button-click'`（与 links item click 同构）；旧形态直接移除不留兼容层（确认门裁决方向 A）。

触及的模块边界与接口：

- `src/icons/index.js`：`install` 注册 **cls 形态项**时同步执行离屏码点解析（确认门裁决 K-4，取代原 D1 渲染时解析），注册表项扩展 `{ glyph, fontFamily, glyphStatus }`；导出 `whenGlyphReady(icon, callback)` 供绘制侧重绘桥接。
- 新增 `src/components/table/column-types/icon.js`（`IconColumn` 双通道 compile）；导出 `resolveIconEntry(name)` 供四处共用（icon 列 / button 图标 / `paintEditButton` / `isEditButtonHit`）。
- `src/components/table/ex/cell-painters.js`：导出 `drawIconGlyph(ctx, icon, { x, centerY, size, color, onLoad })`（cls 路径直读注册表项，无解析状态机）；`requestImage` 改多监听；`measureItem`/`drawItem` icon 分支；button 链按两形态互斥重构（二轮调整）。
- `src/components/table/ex/theme.js` / `constants.js`（二轮调整新增改动面）：`readSnapshot` 增 `controlHeightSmall: readPx(probe, '--mu-control-height-small')`；`constants.js` 增 `CONTROL_HEIGHT_SMALL_FALLBACK = 24`（镜像 `root.scss:140`，C2 镜像常量收拢）。
- `src/components/table/ex/table-ex.vue`：`defineEmits` 追加 `'edit-button-click'`，`tryEditButtonClick` 改 emit，`isEditButtonHit` 门控改 `resolveIconEntry`。
- `src/components/table/ex/editor.js` / `row-geometry.js`：各一行类型登记（`NON_EDITABLE_TYPES` / `GRAPHIC_ITEM_TYPES`）。
- 破坏性变更一处（合并表述）：editButton 协议键改名 + 旧形态（svg 串 / 图片 URL 直传、`onClick` 属性）移除，无过渡层；迁移指引见「破坏性变更与迁移指引」。

## 现状依据

- 列类型注册表：`src/components/table/column-types/index.js:17` `ColumnTypes` map；`resolveColumnType(type)` 非字符串直取类型对象，兜底 TextColumn。
- 双通道协议（知识库：table 列 compile(column, dom) 双通道协议）：
  - `compile(column, dom=false)` → canvas 数据产物（`kind` 平铺，list/tag 路线）。
  - `compile(column, dom=true)` → DOM 形态产物 `{ is, attrs, events }`；base table `src/components/table/base/table.vue:180` 消费（`type.compile(el, true)`），`base/table-row.vue:9-21` 以 `<component :is>` 渲染（`v-bind="item.attrs"`、`v-on="item.events ?? {}"`、子节点 `{{ item.text }}`）。
- canvas 条目识别：`src/components/table/ex/cell-painters.js:726` `resolveItemKind` —— `item.kind` 优先；回退 is/class（check/img/link/tag/text）。新 kind 经 `kind` 字段直通，主干（`drawItems` / `measureItem` / `drawItem`）各加一个分支即可。
- svg 图标 canvas 绘制先例：`cell-painters.js:122` `requestIconImage(icon, color, onLoad)` —— svg 串 `currentColor` 替换为色后转 data URL，走 `requestImage` 缓存管线（`imageCache`），`loaded` 后 `drawImage`；消费先例 `painter.js:994` `paintEditButton`（onLoad → `state.onImageLoad` → `invalidateCell` 该格）。
- icons 注册表：`src/icons/index.js:9` `icons` 普通对象；`install(data, 'svg' | 'cls')` 注册（`:233-304`，svg 经 `sanitizeHTML` 净化 `:296`）。**实际规模**：`src/icons/tabler-icons.js` 仅导出 28 个 tabler 图标（X/check/x/ok/info/alert/question/chevron*4/arrow*2/list/grid/dots/search/file/folder/folderOpen/sun/moon/star/starred/leftCollapse/leftExpand/clock/calendar），另有 3 个复合内置项（`icons/index.js:306-320` windowClose/treeNodeExpand/dropdownExpand）= 共 31 个内置注册名。应用经 `installIcons({ 名称: svg串或class串 })`（公开 API，`docs-site/guide/install.md:81-93`）注册自有图标。
- DOM 侧图标渲染同构参照：`src/components/icon/icon.vue` —— `<span class="mu-icon" v-html="data.svg">`（svg）或 class 直挂（cls）；`.mu-icon` 样式仅定义在 `src/components/icon/icon.scss`（width 1em、font-size calc(1em+2px)、`> svg { width/height: 1em }`）；tabler svg 自带 `width="24" height="24"`（`node_modules/@tabler/icons/icons/outline/pencil.svg:3-4`），无该 CSS 时 DOM 侧为 24px。
- `parseIconValue`（`icon.js:5-24`）支持 `'name'` 与 `'.cls'` 形态，注意其会向 icons 注册表对象写入 `animation`（副作用，列实现避开，直接查 `icons[name]`）。
- 编辑豁免：`src/components/table/ex/editor.js:38` `NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check', 'link', 'list', 'button', 'progress']`；`isCellEditable`（`editor.js:111`）还要求 `column.editor != null`。
- 垂直居中锚：知识库 canvas-text-optical-centering —— `centeredTextAnchor(ctx, centerY)`（`cell-painters.js:576`，模块私有），fillText 路径统一复用。

### 修订 1 补充调研

（本节为任务前基线现状记录，行号与 editButton 段旧符号名以编写时为准；上轮实施落地全局改名后行号有少量漂移、旧名已不存在，当前行号以「修订 5 补充事实」与正文各节引用为准。）

- **button 列现状（canvas 专属类型）**：不入 `ColumnTypes` 注册表（`column-types/index.js:17` 无 button），`cell-painters.js:65` `CANVAS_ONLY_TYPES = { progress: true, button: true }` 在 `resolveColumnType` 前分发；`cell-painters.js:136-145` `createColumnRender` button 分支产出 `{ canvasKind: 'button', buttons: getButtons(record) ?? [], link: column.link === true || null }`。绘制链：`cell-painters.js:1223` `drawButton`（横排两遍式）→ `layoutButtonEntries:1199` 测宽（`ellipsizeButton:1283` caption 省略、空文本 null 哨兵终止）→ `drawButtonLink:1300`（column.link 纯文字链）/ `drawButtonPill:1324`（tag 同构 pill，TAG_HEIGHT 20 / TAG_PADDING_X 8，`cell-painters.js:46-47`）。条目形态 `{ caption, color, disabled }`；命中回报 `cell-painters.js:1253-1258` `onItemRect({ kind: 'button', index, rect, disabled })`（命中区 = pill 矩形）。估高：`row-geometry.js:74` `GRAPHIC_ITEM_TYPES` 含 button（恒 1 行免 render）。**注意**：`drawButton` 无 `onImageLoad`/`row`/`colIndex` 钩子（`drawCanvasKindContent` `cell-painters.js:360-384`），图标异步加载需补。tooltip 溢出判定 `buttonsOverflowOf`（`cell-painters.js:1440`）与 `resolveTooltipButtons` 均按「空 caption = 哨兵」写死，图标按钮需同步适配。
- **editButton 现状**（任务前基线现名为 `editorButton` / `editorButtonRectOf` / `paintEditorButton` / `isEditorButtonHit` / `tryEditorButtonClick` / `EDITOR_BUTTON_*`——本次全部改名 `editButton*` / `EDIT_BUTTON_*`，映射见「破坏性变更与迁移指引」；本段按基线现名描述）：`column.editorButton = { icon, onClick }`，icon 为 SVG 串或图片 URL（文档 `docs-site/components/table-ex.md:281`；demo `demo/src/data/table-ex/main-view.vue:334` `import pencilIcon from '~icons/outline/pencil.svg'`、`:459-462` 夹具）。规格常量 `constants.js:47-48`（区 24×24、图标 16）；区矩形单一事实源 `editor.js:87-99` `editorButtonRectOf`；绘制 `painter.js:991-1013` `paintEditorButton` —— `requestIconImage(icon, theme.textColor, …)` 后 `drawImage`，hover 覆盖层最上层；命中 `table-ex.vue:969-984` `isEditorButtonHit`（门控 `col?.editorButton?.icon` truthy）；点击 `table-ex.vue:1046-1056` `tryEditorButtonClick` 直接调 `col.editorButton.onClick?.({ record, recordIndex: hit.rowIndex, column: col._raw ?? col })`，点击序在树槽之前（`table-ex.vue:1166`），局部交互不选中行、不发 cell-click。
- **links item click 的 emit 方式**：`table-ex.vue:154-167` `defineEmits` 含 `'cell-item-click'`。canvas 通道 render 产物自持回调 —— `column-types/list.js:70` `canvasItemOf` 条目挂 `onItemClick: () => emit('cell-item-click', { record, column: columnRef, item: entry })`；点击时 `table-ex.vue:1206-1235` `emitDomItemClick` 经 `resolveCellContent(col, { record, recordNumber, emit: wrappedEmit })` 重取产物后 `canvasItem.onItemClick?.()`，payload 外包 `recordIndex`，disabled 条目只续链不发；DOM 通道 `list.js:94-95` `events.click` 同构。button 条目走独立派发 `table-ex.vue:1193-1201` `emitButtonItemClick`，payload 键 `button`（= `buttons[index]` 配置对象原引用）。
- **icons 注册表消费方式**：`install` 注册项形态 `{ svg?, cls?, animation?, hash }`；`parseIconValue`（`icon.js:5-24`）`icons[name]` 直接查表（O(1)），未注册 dev 警告；`.cls` 形态直构 `{ cls }`；副作用——会向注册表对象写 `animation`（列实现避开，直接查 `icons[name]`）。

### 修订 2 补充事实（审改依据）

（本节为修订 2 时的现状记录，多数项已在修订 4 实施落地；具体行号以源码与「修订 5 补充事实」为准。）

- **`requestImage` 单监听**（`cell-painters.js:76-100`）：仅在缓存未命中时挂 `image.onload = () => onLoad?.()`；命中 `loading` 条目的后续请求**不登记回调**。单个 editorButton / 单张 img 无碍（缓存命中时已 loaded），但 icon 列 N 行共用同一图标时只有首个请求格收到 onLoad → 其余格加载完成后仍空白（painter 侧 `invalidateCell` 逐格，`painter.js:1370-1374`/`1427-1428`）。必须改为多监听。
- **`imageCache` 上限**：`IMAGE_CACHE_LIMIT = 200`、超限整体 `clear()`（常量 `cell-painters.js:55`、超限清空 `:80`）。icon 列缓存条目 = 图标数 × 色数；典型用量远低于上限，超限仅退化为一次 data URL 重载（无网络），不作拆分（见权衡 7）。
- **self-checks 运行方式**：`demo/src/data/table-ex/self-checks/index.js` 由 demo 页「自检结果」面板调用（`main-view.vue:1468`），断言同步执行、依赖浏览器 `document`/`Image`；源模块经相对路径导入后间接 `import '@/utils/type'`，**node 直接 import 会 `ERR_MODULE_NOT_FOUND: Cannot find package '@/utils'`**（本次实测）。node 侧只能 `node --check` 语法校验。
- **仓库无 iconfont 资产**：demo/src 下无 `.woff/.ttf/.otf`、无 `@font-face`、无 cls 图标注册点（`install(` 仅 app 挂载与 `installIcons` 公开 API）。cls 码点解析与绘制验证需自带注入 class 夹具。
- **Vue innerHTML 空值**：`@vue/runtime-dom` 3.5.39 `patchDOMProp` 对 `innerHTML` 的 `value == null` 直接跳过（`runtime-dom.cjs.js:579-584`），DOM 产物省略 innerHTML 键与传 null 等价，不产生 `"null"` 文本。
- **`centeredTextAnchor` 私有**（`cell-painters.js:576`），painter 无法直接复用，需设计共享导出（修订 2 时拟新增的私有 `resolveIconGlyph` 已随 K-4 取消——码点解析挪至 icons 模块，cell-painters 无解析状态机）。

### 修订 5 补充事实（二轮调整依据）

- **变量与既有消费**：`--mu-control-height-small: 24px`（`src/styles/root.scss:140`），定义于 `.mu-root,.mu-light` 块（`root.scss:29-151`，与主题色同作用域）；既有消费均为 DOM `var()` 引用（`button.scss:38`、`input.scss:22`、`tab-bar.scss:127`），无 canvas 读取先例。
- **快照读尺寸先例**：`theme.js` `readPx`（`:40-43`）已读 4 个尺寸变量入快照（`readSnapshot` `:126-129`：rowHeight/headHeight/cellPadding/cellLineHeight，raw 读取、未定义 → 0、消费侧回退）；`demo/src/data/table-ex/self-checks/theme.js:5` 注释载明设计期曾有 controlHeight 快照字段（C3 死代码清理移除）。`snapshotsEqual`（`:255-274`）按 `Object.keys` 泛型迭代，新字段自动参与相等判定与 mutation 抑制。demo 页 `document.body` 带 `.mu-root`（`self-checks/theme.js:63` 注释），探针作用域内该变量可解析。
- **button 链实施现状**（修订 4 落地后行号 = 本轮改造对象；「修订 1 补充调研·button 列现状」段行号为任务前基线，以本段为准）：常量块 `cell-painters.js:48-55`（`TAG_HEIGHT/TAG_PADDING_X/TAG_FONT_SIZE/TAG_RADIUS/BUTTON_ICON_SIZE/BUTTON_ICON_GAP`）；`drawButton` `:1307`（`onItemRect` 命中矩形两形态共用 `TAG_HEIGHT` `:1341-1346`）；`layoutButtonEntries` `:1283`；`ellipsizeButton` `:1375-1402`（右缘裁剪判定 `:1395` 位于 icon-only 降级分支 `:1387-1393` 之后——05-verify-终-2 失败项 1）；`drawButtonLink` `:1408`；`drawButtonPill` `:1444`（icon+caption 图标 x `:1467`、caption x `:1485`）；`buttonsOverflowOf` `:1578-1633`；`resolveTooltipButtons` `:1664-1675`。**`TAG_HEIGHT` 另被 tag 绘制链共用**（`drawTag` `:1082-1086`、items 命中矩形 `:863`）——拆分后 tag 链不得改动。
- **夹具现状**：self-checks `THEME` 主题夹具（`self-checks/cell-painters.js:94-112`）无 controlHeight 类字段；theme 计数断言 = 20 固定字段 + colors 共 21 键（`self-checks/theme.js:241-280`），尺寸变量由 `SIZE_VARS` 内联自含声明（`:38-39`）。`fakeMeasure` CJK 9px/字符（`self-checks/cell-painters.js:218-221`），rowHeight 36 夹具下 button 垂直锚 centerY = 19。
- **`ellipsize` 不 trim**（`text-wrap.js:179-203`）：`maxWidth ≤ 0` 或一个字符（含省略号）都放不下才返回空串——「caption 放不下」与「caption 原生空」可经源头 `String(button.caption ?? '') === ''` 判定区分（d 修复的事实基础，空白串行为两口径一致：均走 caption-only）。
- **`resolveIconEntry` warn 链**（`column-types/icon.js:18-30`）：未注册名 dev warn 一次（`utils/warn` 按 message 去重）返回 null；非 string / 空串静默 null——icon 忽略语义（caption 非空不解析）天然免除 warn。

## 冲突点与处理（decisions vs 修订要求）

decisions.md 由调度者按修订同步更新（00-task.md 约束），此处仅列冲突与处理方式：

| 冲突点 | 原设计 / 裁决 | 修订要求 | 处理 |
| --- | --- | --- | --- |
| icon 列 value 形态 | 原设计「值与列协议」：注册名 + 对象直传 + 数组多条目（iconOption.max） | D4：单图标、仅注册名、不支持 img | 按修订：value 收敛为注册名 string，删除对象直传 / 数组 / max / dots 路径 |
| icon 列 color 位置 | 原设计 `iconOption.color`（+ class/style） | 用户要求「支持 color 设置图标颜色」，未指定位置 | 上提为 `column.color`（与 text 列 `column.color` 同契约，`text.js:40`）；`iconOption` 仅留 `size`。理由：单值列的既有约定是列级 color（text/enum），`*Option` 内 color 仅用于「多条目默认色」（tagOption/listOption），icon 无条目层 |
| icon 列条目点击 | 原设计「命中矩形（若启用条目点击）」可选项 | 修订要求穷举「只支持…不支持…支持 color」，未含点击 | 删除该节；按纯展示定案（用户要求原文穷举，00-task.md:9；后续如需点击，条目协议已预留 `onItemClick` 挂载点，`list.js:70` 同构，不构成单向门） |
| D1 码点解析 | 渲染时离屏解析 + 永久缓存（cell-painters） | 确认门裁决 K-4：解析时机应为图标 install 时 | 已裁决：解析挪至 `install`（`src/icons/index.js`），结果存注册表项；cell-painters 状态机删除（见「码点解析」） |
| D2 svg 复用 requestIconImage | svg 串替换 currentColor → data URL 缓存管线 | 无冲突 | 保留，扩展覆盖 button 图标与 editButton 的 cls 形态 |
| D3 kind 平铺 | `item.kind` 优先直通，dom 通道 `{ is, attrs, events }` | 无冲突 | 保留（单条目仍走 items 数组，见权衡 2） |
| button pill 高度 | 修订 4：`TAG_HEIGHT` 20 恒定（tag 同构） | 二轮调整 a：= `--mu-control-height-small` | 快照字段 `controlHeightSmall` 读取 + constants 回退常量；`TAG_HEIGHT` 与 button 链解耦（tag 链不动）；`BUTTON_ICON_GAP` 随形态删除成死代码一并删除 |
| icon+caption 形态 | 修订 4：三形态（icon-only / icon+caption / caption-only） | 二轮调整 b：caption 与 icon 互斥、文本优先 | icon+caption 删除（有文本忽略 icon）；ellipsizeButton / buttonsOverflowOf / drawButtonPill / drawButtonLink / 哨兵与 warn 语义同步 |
| icon-only 宽度 | 修订 4：pill 宽 = TAG_HEIGHT（20）/ link 宽 = BUTTON_ICON_SIZE（12） | 二轮调整 c：宽高一致 = `--mu-control-height-small`，图标水平垂直居中 | pill 宽 = 高 = 快照值 24；link 形态无 pill，「宽高一致」pill 语义不适用，宽 = 图标本体 12（定案见「button 列图标按钮」） |
| ellipsizeButton 裁剪顺序 | 修订 4 已定「右缘剩余 < 阈值 → 不绘制并终止」，实现降级分支后置（05-verify-终-2 失败项 1） | 二轮调整 d：顺带修复 | 降级路径随 b) 整体删除，缺陷结构性消解；条款保持，回归断言入实施清单（见权衡 10） |

editButton 的 `onClick` 属性与 icon 直传（svg 串 / 图片 URL）为 20261027 问题 5 新增协议，按 D6 改造为目标态（仅注册名 + emit，见「editButton 改造」）；确认门已裁决（decisions.md「确认门裁决」）：**方向 A，不留过渡层**，协议键与事件名同步改名（K-1b），迁移指引见「破坏性变更与迁移指引」。

## 值与列协议（icon 列，收敛后）

- `value`：icons 注册名（string），经既有 field / value 取值链求值。**仅此一种形态**：不支持对象直传 `{ svg | cls }`、不支持数组、不支持 img src。
- 空值与非法值：
  - `value == null` → compile 返回空（不 warn），落通用占位链（`column.placeholder` / 表格占位），与 list 非数组同构（`list.js:123`）。
  - `value` 非 string（number/object/array 等）→ 空 + dev warn 一次（`utils/warn`，devOnly + 按 message 去重，`src/utils/warn.js:6-22`）。
  - string 但未注册 → 空 + dev warn 一次（同 `icon.js` 未注册警告风格）。
  - 三种情况均显示占位文本（非「空渲染」，`drawDisplayText` 对空内容走 `col.placeholder ?? placeholder`，`cell-painters.js:444`）。
- `column.color`：色名 | `(record, value) => 色名`（`ensureFn`，与 text 列 `column.color` 同契约）；null/缺省 = 正文色；未知色名 → canvas 回退 `theme.textColor`（同 `drawDisplayText`），DOM 无对应 `text-*` class → 继承正文色。
- `column.iconOption`（仅 1 键）：`size`：Number，缺省 16（对齐 `CHECK_SIZE`，`constants.js:20`），非正数/非法回退 16。**双通道生效**：canvas 直绘；DOM 条目内联 `font-size: {size}px`（`text-{color}`/`mu-icon` 的 1em 随之为 size）。
- `align` 缺省 `center`（icon 列惯例，同 enum `enum.js:6` / rec_no 的类型级 `align` 字段）。
- 无条目点击（纯展示列，`events: {}`）。

## button 列图标按钮

button 列为 canvas 专属（`ColumnTypes` 无 button，`column-types/index.js:17-32`），**本项仅 canvas 通道**；base table DOM 无 button 类型，不新增。button 条目协议 `{ caption?, icon?, color?, disabled? }`（`icon` = icons 注册名 string），**caption 与 icon 互斥、文本优先**（二轮调整 b）：

- **形态判定（源头判定，非 ellipsize 产物判定）**：`String(button.caption ?? '')` 非空 → caption-only，`icon` 键完全忽略（不解析、不绘制、不 warn）；空串 → icon-only 候选，经 `resolveIconEntry(button.icon)` 解析。
- **caption-only**：现状行为不变（pill 内 `TAG_PADDING_X` 内距 + 12px 文字、超宽省略）。
- **icon-only**（caption 空 + 有效注册 icon）：pill 宽 = 高 = `controlHeightSmall`（`--mu-control-height-small`，快照值，缺省 24），图标 12×12 在 pill 内水平垂直居中（x = `x + (h − 12)/2`、centerY 锚），固定宽不省略。
- **link 形态**（`column.link`）：两形态的无 pill 变体——caption-only 同现状；icon-only 宽 = 图标本体 `BUTTON_ICON_SIZE`（12，无 pill 几何，「宽高一致」的 pill 语义不适用），图标 x = 条目起点（无内距）、centerY 垂直锚；命中框沿用 link 现状（`TAG_HEIGHT` 高度框，本轮不动）。
- **空哨兵**：caption 空且无有效 icon（无 icon 键 / 未注册）→ 该条目不绘制且终止后续（现有语义）。
- **未注册名**：仅 caption 空时才解析 → dev warn 一次（`resolveIconEntry` 内部，`icon.js:23-28`）+ 哨兵终止；caption 非空时 icon 被忽略，不触发 warn。
- **右缘裁剪（d 条款保持）**：右缘剩余 < 形态最小占位（caption-only = `padX*2`、icon-only = 形态宽）→ 该条目不绘制且终止后续。裁剪判定先于任何绘制：caption-only 的 ellipsize 结果为空串 → 直接返回 null（不得返回空文本条目，否则会绘制无文字 pill 并继续推进 x）；icon-only 降级路径已随形态收敛整体删除，05-verify-终-2 失败项 1 的判定后置问题结构性消解，回归断言保留（0 fillText + 0 pill fill/stroke + 0 onItemRect，见实施清单片 2）。
- **尺寸常量**：`BUTTON_ICON_SIZE = 12` 保留（TAG_FONT_SIZE 同档）；`BUTTON_ICON_GAP` 删除（icon 与 caption 不再并存，全链零引用）；pill 高度不入模块常量，经 `buttonHeightOf(theme)` = `theme?.controlHeightSmall || CONTROL_HEIGHT_SMALL_FALLBACK`（`constants.js` 新增回退常量，镜像 `root.scss:140`）求值。
- 图标色与文字色同源：pill 形态常态 `buttonTextOf`、hover 反转 `bgNormal`（`cell-painters.js:1352-1367`）；disabled 置灰同链；link 形态同 `drawButtonLink` fillStyle 链（含 hover 谱系）。
- 命中与点击**协议零改动**（几何随 pill 高变化）：`onItemRect` 回报矩形即 pill 矩形（pill 形态高 = 快照值（缺省 24）、y = `centerY − h/2`；link 形态沿用 `TAG_HEIGHT`），`emitButtonItemClick`（`table-ex.vue:1198`）payload 与派发链不变。
- tooltip：`buttonsOverflowOf` 计宽随形态收敛同步（icon-only pill 计快照宽 24 / link 计 12；caption-only 不再扣图标宽）；`resolveTooltipButtons` 全文仍取 caption（纯图标组无文本 → 无 tooltip，属预期）。

## editButton 改造

- 协议收敛：`column.editButton = { icon }`，`icon` = icons 注册名 string；不再接受 svg 串 / 图片 URL，`onClick` 属性移除——确认门裁决方向 A：**直接移除不留兼容层**，迁移指引见「破坏性变更与迁移指引」。
- **onClick → emit**：`tryEditButtonClick`（原 `tryEditorButtonClick`，`table-ex.vue:1051`）改为 `emit('edit-button-click', { record, recordIndex: hit.rowIndex, column: col._raw ?? col })`——payload 与原 onClick 参数逐字一致；`defineEmits`（`table-ex.vue:156-170`）追加 `'edit-button-click'`。与 links item click 同构点：走组件 emit 而非属性回调；差异点：links 回调由 render 产物条目自持（条目数据在 render 闭包内），editButton 为列级配置无 render 闭包，由组件壳直接 emit。
- **图标解析单一入口**：`column-types/icon.js` 导出 `resolveIconEntry(name)`（`icons[name]` 查表 + 未注册 dev warn；不做负缓存——注册表可运行时 install）。icon 列 compile、button 图标绘制、`paintEditButton`、`isEditButtonHit` 四处共用；`isEditButtonHit`（原 `isEditorButtonHit`）门控改为 `resolveIconEntry(col?.editButton?.icon) != null`，未注册名两边一致判失败（不绘制、不命中、不 pointer、点击落既有选中/编辑链）。**不新增 `resolveEditButtonIcon`**（同一查表无需二次封装）。
- 绘制：`paintEditButton`（原 `paintEditorButton`）改为调用共享 `drawIconGlyph`（见下），svg 路径经 `drawIconGlyph` 内部照旧走 `requestIconImage(icon.svg, theme.textColor, …)`，cls 走注册表项 glyph 直绘（色 = `theme.textColor`，尺寸 = EDIT_BUTTON_ICON_SIZE 16，中心 = 区矩形中心，x 左对齐于矩形内 16px 槽）。未注册名不绘制。
- 局部交互语义不变：不选中行、不发 cell-click、不开编辑、点击序在树槽前。
- **符号与常量改名**（K-1b，随本片一并落库）：`editorButtonRectOf` → `editButtonRectOf`（`editor.js:87` 导出，消费方 `painter.js:4` / `table-ex.vue:107` / `self-checks/editor.js:37` / `self-checks/painter.js:24`）；`EDITOR_BUTTON_AREA` / `EDITOR_BUTTON_ICON_SIZE` → `EDIT_BUTTON_AREA` / `EDIT_BUTTON_ICON_SIZE`（`constants.js:47-48`，消费方 `editor.js:9` / `painter.js:21-22`）；`table-ex.vue` 内注释（`:813-814`、`:968-972`、`:1049`）同步改名。

## compile 双通道产物（icon 列）

```js
// dom=false（canvas）—— 单条目仍走 items 数组（权衡 2）
{ items: [{
  kind: 'icon',
  icon,        // icons[value] 注册表项原引用 { svg?, cls?, glyph?, fontFamily?, glyphStatus?, animation?, hash }
  color,        // 色名（column.color 求值，null = 正文色）；绘制期 theme.colors 查表
  size,         // iconOption.size 归一值（canvas 唯一尺寸来源，measureItem/drawItem 消费）
  title         // column.title === true ? value : null（仅 DOM 通道实际可见，见「配套」）
}] }

// dom=true（DOM）
{
  class: 'mu-table__icon-cell',
  items: [{
    is: 'span',
    text: null,
    title,
    attrs: {
      class: ['mu-icon', icon.cls, color && `text-${color}`],  // svg 与 cls 统一挂 mu-icon
      style: [{ fontSize: `${size}px` }],
      ...(icon.svg ? { innerHTML: icon.svg } : null)          // 无 svg（cls 形态）省略键
    },
    events: {}
  }]
}
```

- 注册表查表在 render 函数内（每次求值），不在列准备期快照——运行时 `installIcons` 后新行/重绘即时生效。
- svg 优先于 cls（注册项同时含两者时取 svg，DOM 侧不再叠 cls class 渲染 glyph）。
- svg 形态 DOM 尺寸由 `.mu-icon`/`.mu-table__icon-cell` 规则控制：`width: 1em` 随内联 font-size = size；canvas 侧按 `size` 直绘。

## canvas 绘制（cell-painters.js）

### measureItem 分支

`kind === 'icon'` 返回 `Math.min(item.size, contentWidth)`（方形，宽=高）。高度 ≤ 行高不撑行；估高：`row-geometry.js:74` `GRAPHIC_ITEM_TYPES` 追加 `'icon'`（与 tag/check 同构，估高恒 1 行免 valueOf / render 调用）。加载中仍占位（不返回 null，避免加载完成后横向跳动）。`tooltipItemWidthOf` **不加** icon 分支：canvas tooltip 以「溢出」为触发前提，且 `title: true` 时 icon 条目 `text` 为 null 已使 `resolveTooltipItems` 返回 null，该分支为死代码（见「配套」）。

### drawItem 分支

`kind === 'icon'` → `drawIconGlyph(ctx, item.icon, { x, centerY, size: Math.min(item.size, maxWidth), color, onLoad })`（`color` 即下方解析式的求值结果，不新增助手函数）：

- `color`：`item.color && theme.colors[item.color]?.color`，缺省/未知回退 `theme.textColor`（同 `drawDisplayText` 口径，`cell-painters.js:452`）。
- `onLoad`：`onImageLoad ? () => onImageLoad(row, colIndex) : undefined`（drawItem 已收到 row/colIndex）。
- **x 由 drawItems 布局给出，绘制内部不改 `textAlign`**（原设计「textAlign 按列 _align」会与 `layoutItemPositions`/`itemsStartX` 的双重对齐叠加）；统一 `textAlign = 'left'`，x 为条目起点，与 `drawItemText`/`drawTag` 一致。
- `maxWidth ≤ 0` 直接 return（窄格防御）。

### drawIconGlyph（共享助手，导出）

`export function drawIconGlyph(ctx, icon, { x, centerY, size, color, onLoad })`：svg → `requestIconImage(icon.svg, color, onLoad)`，`status === 'loaded'` 才 `drawImage(entry.image, Math.round(x), Math.round(centerY - size / 2), size, size)`；cls → **直读注册表项**（解析已由 install 完成，cell-painters 无解析状态机，K-4）：`icon.glyphStatus === 'ready'` 才设置 `ctx.font` = `` `${size}px ${icon.fontFamily}` ``、`fillStyle = color`、`textAlign = 'left'`、`centeredTextAnchor(ctx, centerY)` 取垂直锚，`fillText(icon.glyph, x, anchor.y)`；`'pending'` → 静默不绘 + `whenGlyphReady(icon, onLoad)`（icons 模块导出，解析/字体就绪后一次性回调 → `invalidateCell` 重绘）；`'failed'` → 不绘不登记（install 侧已 dev warn）。`icon` 传入即注册表项原引用（`resolveIconEntry` 查表产物），非注册表形态不入此函数。三处消费：icon 列 drawItem、button 图标、`painter.paintEditButton`（painter 已 import cell-painters，无环）。

### 码点解析（install 时，src/icons/index.js —— 确认门裁决 K-4，取代 D1）

归属 icons 模块（非 cell-painters）：`install`（`src/icons/index.js:233-304`，公开别名 `installIcons`，`src/index.js:6,66`）注册 **cls 形态项**时同步执行离屏码点解析，结果写入注册表项。用户仍无需显式传 char。

- **存储形态（定案 a）**：注册表项扩展为 `{ cls, glyph, fontFamily, glyphStatus, animation?, hash }`（svg 项无 glyph 三字段）：`glyph` = content 解码后字符（`\xxxxxx` 十六进制转义经 `String.fromCodePoint` 解码，字面字符直用）；`fontFamily` = `getComputedStyle(el).fontFamily`；`glyphStatus` = `'pending' | 'ready' | 'failed'`（仅 cls 项）。`glyph` 为派生数据，**不参与 `solveIconHash` 的 hash 计算**（`icons/index.js:247-250`，保持 `svg + cls + animation` 口径）。
- **解析手法**（沿用 D1 已验证路线）：模块级单一隐藏容器（`position:absolute; visibility:hidden; left:-9999px`，首次懒建、常驻），`<i class="{cls}">` 挂入 → `getComputedStyle(el, '::before').content` 去引号 → `getComputedStyle(el).fontFamily`。**解析元素常驻容器、延迟到字体就绪后统一清理**——canvas `fillText` 不触发 @font-face 懒加载，常驻元素使字体加载被自然触发，`fonts.ready` 语义完整（实测确认点 2）。
- **失败处理与重试（定案 b，两跳重试，归属 icons 模块）**：content 有效 → `glyphStatus = 'ready'`；此时若 `document.fonts && document.fonts.status !== 'loaded'`，该条目记字体待就绪，由模块级**单次** `document.fonts.ready.then` 统一 flush（tofu 替换重绘，避免 per-glyph 订阅）。content 空/`none`（样式表未就绪）→ `'pending'`，挂重试链：① `document.fonts?.ready.then(retry)`（有 FontFaceSet 时）；② 再一帧 `requestAnimationFrame` 兜底（覆盖 fonts.ready 先于 icon CSS 注入就绪的场景）；两跳后仍失败 → `'failed'` + dev warn 一次（`utils/warn`，消息含图标名与 cls，提示样式表未含该 class），不再重试。调度器模块级去重（一次调度覆盖全部 pending 条目）。
- **SSR / 无 document 防御（定案 c）**：`install` 在 SSR 阶段也会被调用（`src/index.js:55` 位于 `if (isBrowser)` 块外；`src/index.js:36-39` 已有 `typeof document !== 'undefined'` 先例）——解析入口 `typeof document === 'undefined'` 直接跳过：不建容器、不挂重试、不 warn，注册项保持 `{ cls }` 原形态。客户端为独立运行时、重新 install 时正常解析；DOM 通道 class 直挂不读 glyph，SSR 不受影响（与项目「SSR 不兼容场景需 ClientOnly」现状一致，`AGENTS.md`）。
- **就绪回调（表格侧重绘桥）**：icons 模块导出 `whenGlyphReady(icon, callback)`——`pending` 条目登记，解析成功或字体就绪后一次性回调并移除；`ready`/`failed` 不回调（调用方已分支处理）。`drawIconGlyph` 的 cls-pending 路径以它桥接 `onLoad` → `invalidateCell`。
- **幂等性（定案 e）**：同名重注册时 `icons[key] = icon` 覆盖总是执行（`solveIconHash` 的 return 仅退出内层函数，`icons/index.js:253-259`、`:301`）——覆盖前若旧项 `old.cls === icon.cls && old.glyphStatus === 'ready'`，新项**继承** `glyph`/`fontFamily`/`glyphStatus`（同 cls 免重复 DOM 读取）；cls 变化或旧项非 ready → 重新走解析链（pending 重挂重试，failed 重置）。compile 产物持注册表项原引用，重注册换新对象不受影响——查表在 render 函数内每次求值（见「compile 双通道产物」）。
- 内置 31 项全为 svg 形态（`install(tablerIcons, 'svg')` `src/icons/index.js:306`，3 个复合项 `:308-320`），install 内置注册**零解析开销**；解析仅发生在应用 `installIcons` 注册 cls 形态时。

### 异步图标加载管线（requestImage 多监听）

`requestImage(src, onLoad)`（`cell-painters.js:76-100`）改为条目累积监听：

```js
entry = { image, status: 'loading' | 'loaded' | 'failed', listeners: [] }
// 命中且 status === 'loading' → listeners.push(onLoad)（去重不需要：同格重复登记至多多一次 invalidate）
// image.onload → status = 'loaded'；快照并按序调用全部 listeners；清空
// image.onerror → status = 'failed'；清空 listeners
```

- 不改返回契约（仍返回 entry），缓存命中且已 `loaded` 时不回调（调用方以 status 判定，既有 editButton（基线 svg 直传）/img 路径行为不变）。
- 同步 `Image` 桩（self-checks `cell-painters.js:776-796`）下首个请求即触发 onload，现有「恰回调一次」断言仍成立（单 listener）。
- 收益：icon 列 N 行共用图标时，加载完成一次 flush N 个 `invalidateCell`，rAF 合帧为一次整幅重绘（`painter.js:1383-1391`）；同时修正 img 列同 src 多行的同类缺陷。

### button 列图标绘制（drawButton 链扩展，二轮调整后）

- **hooks 补齐**（已落地维持）：`drawCanvasKindContent`（`cell-painters.js:360-384`）向 `drawButton` 透传 `onImageLoad`、`row`、`colIndex`（与 `drawItems` `cell-painters.js:716` 同款），供 svg 图标异步加载后 invalidate 该格。
- **高度取值链**：`theme.js` `readSnapshot` 增 `controlHeightSmall: readPx(probe, '--mu-control-height-small')`（raw 读取，未定义 → 0，回退在消费侧——与 rowHeight 同模式）；cell-painters 模块内助手 `buttonHeightOf(theme)` = `theme?.controlHeightSmall || CONTROL_HEIGHT_SMALL_FALLBACK`；`drawButton` / `buttonsOverflowOf` 入口各求值一次，经参传 `layoutButtonEntries` → `ellipsizeButton` 与 `drawButtonPill`（签名形态实施自定，与周边位置参数链一致）。
- **测宽 / 哨兵 / 裁剪**（`ellipsizeButton` 重构，伪代码；padX = link ? 0 : TAG_PADDING_X）：

```js
const remaining = rightBound - x                    // 右缘剩余（ellipsize 空文本的统一判据）
if (String(button.caption ?? '') !== '') {          // 源头判定（互斥短路）
  // caption-only：icon 忽略不解析；{ text, width: textWidth } = ellipsize(caption, maxWidth = max(0, remaining − padX*2))
  if (!text) return null                            // 空文本（右缘放不下）→ 不绘制且终止 —— d 条款，不得落空文本条目
  return { text, icon: null, width: Math.min(padX*2 + textWidth, remaining) }
}
const icon = button.icon ? resolveIconEntry(button.icon) : null
if (!icon) return null                              // 空哨兵（含未注册，warn 在 resolve 内）
const width = link ? BUTTON_ICON_SIZE : buttonHeight // icon-only 固定宽不省略
return remaining < width ? null : { text: null, width, icon }
```

- **绘制**：`drawButtonPill` —— 圆角矩形高 = buttonHeight、y = `centerY − h/2`；icon-only 图标 `drawIconGlyph` 居中（x = `x + (h − BUTTON_ICON_SIZE)/2`、centerY 垂直锚）；caption-only 文字路径不变（icon 恒 null）。`drawButtonLink` —— icon-only 图标于条目起点 x、centerY；caption-only 不变。色取同一条填充色变量（pill 常态/hover 反转、link 常态/hover、disabled 置灰），`onLoad` = `onImageLoad ? () => onImageLoad(row, colIndex) : undefined`。
- **`onItemRect`**：pill 形态命中矩形高 = buttonHeight（y = `centerY − h/2`）；link 形态沿用 `TAG_HEIGHT` 现状。
- icon 解析移入 caption 空分支（互斥短路：caption 非空条目零查表零 warn；仍为 drawButton 循环内逐条目 O(1) 查表，不做按 record 预解析，见权衡 4）。
- hover 反转引起的色变化：svg 缓存键含色串自然分键（既有行为），cls 直接传色无分键（D2）。
- **`TAG_*` 常量注释解耦**（`cell-painters.js:45-47`）：tag pill 与 button 不再「同构高度」——TAG_HEIGHT 仅 tag 绘制链消费（`drawTag` `:1082-1086`、items 命中 `:863`、link 形态 button 命中框），button 高度经 `buttonHeightOf` 取快照值。

## 性能与 API 便利权衡（修订要求 4）

1. **icon 列单图标 vs 原多条目形态**：API 上 string 直用（`field` 值 `'user'` 即成列），无数组规整 / max 截断 / dots 语义；代价是放弃多图标横排与对象直传灵活性（用户明确要求收敛）。性能上 compile 单次查表 O(1)，无多条目测宽与溢出丢弃循环。
2. **单条目仍走 items 数组 vs 专用绘制路径**：专用路径（仿 drawButton 的 canvasKind 分发）可省一次单元素数组遍历与 `layoutItemPositions`，但 painter 主干需加分发分支、对齐 / 垂直锚逻辑双份维护；items 复用使 `measureItem`/`drawItem`/`drawItems` 主干零分发改动（D3 精神），单元素数组遍历为纳秒级。**选 items 复用**。
3. **注册名 vs svg 串直传**：注册表项经 `sanitizeHTML` 净化（`icons/index.js:296`）且引用稳定可被 compile 产物复用；svg 串直传绕过净化、每列定义重复占内存。**代价不可低估**：内置注册表仅 31 个名字（28 tabler + 3 复合），远非「全量」；任何未内置图标都需应用 `installIcons` 注册一次（svg 串或 icon-font class）。这是「只支持已注册图标」（用户要求）的直接成本：换来统一净化 / 查表 / 警告链与 O(1) 解析，文档需明确列出内置名与注册方式。
4. **button 图标绘制期查表**：`buttons` 为行级函数产物（`getButtons(record)`），无法列准备期预解析；每帧每条目一次 `resolveIconEntry` 查表 O(1)（纳秒级），不做按 record 的预解析缓存（失效管理成本远超收益）。
5. **editButton emit vs onClick 属性**：性能等价（每次点击一次派发）。API 上 emit 符合组件库约定（`v-on` 绑定、模板可见、可多监听），回调属性持闭包引用且不可多绑；与 links item click 方式同构（用户点名要求）。破坏性：协议键改名 + `onClick` 与 svg/URL 直传移除——该协议为 20261027 新增（v4.2.0 引入，`1c8f326`），仓库内唯一使用点是 demo（`main-view.vue:459-462`，且用 svg 串，改造后必须换注册名），无仓库内其它调用方；外部使用方不可由仓库证伪，已裁决方向 A 不留兼容层，发布说明附「破坏性变更与迁移指引」。
6. **图标色参与缓存键的差异**：svg 经 data URL 缓存、键含色串（主题切换 / hover 反转自然分键，缓存条目数 = 图标数 × 色数）；iconfont `fillStyle` 直传色不参与任何缓存键（D2 已裁决）。两者首帧未就绪（图片未加载 / 字体 pending）均走「先空绘 + 就绪回调 invalidate 重绘」链，无同步阻塞；首帧后同一图标多格由 `requestImage` 多监听一次 flush（见「异步图标加载管线」）。
7. **缓存容量**：共享 `imageCache` 上限 200、超限整体清空（常量 `cell-painters.js:55`、超限清空 `:80`）；icon 条目占用 = 图标数 × 色数（主题态）。典型表格（≤20 图标 × ≤3 色）远低于上限；超限仅触发一次无网络的数据 URL 重载 + 重绘，不产生错误。**不做独立缓存拆分**（会破坏 `getImageEntry` 既有断言与 img 路径同源），若实施期实测超限再按 `requestImage(src, onLoad, cache)` 参数化扩展。
8. **码点解析时机（install 时 vs 渲染时，确认门裁决 K-4，取代 D1 对比）**：每 cls 图标 install 时一次离屏解析（两次 `getComputedStyle` + 一次元素挂载，微秒级），表格渲染路径**零 DOM 读取、零状态机**——cell-painters 的 `glyphCache`/`resolveIconGlyph` 整体删除，`drawIconGlyph` cls 路径三行分支（ready 绘 / pending 登记 `whenGlyphReady` / failed 跳过）。成本转移到应用启动期（注册时同步解析，样式表通常已就绪——`<link>` CSS 阻塞、install 晚于 CSSOM），收益归渲染热路径与 N 行共用图标的稳定性；解析归 icons 模块后成为通用能力，其他 canvas 消费方可直接读注册表项。代价：未就绪重试与 SSR 防御逻辑落在公共 icons 模块（复杂度 +），install 早于样式注入的应用依赖两跳重试（fonts.ready + rAF）。
9. **尺寸变量化（二轮调整 a/c）：快照读取 vs 常量同步 vs SCSS 同源导出**：选**快照读取**——`readSnapshot` 增 1 字段（init/换肤时一次 `readPx`，与 rowHeight 等既有尺寸字段同一探针批次读取、不进绘制热路径；`theme.js:126-129` 先例），绘制热路径仅对象属性读取 + `||` 回退，零成本。收益：应用覆写 `--mu-control-height-small` / 主题调整自动跟随（换肤 MutationObserver → 快照重读 → relayout + 整幅重绘链免费获得），单一事实源在 CSS；canvas-only 类型无 DOM 对照，常量漂移不可见，快照读取从机制上消灭漂移。代价：theme.js 与 self-checks 计数断言联动、假 theme 夹具需回退路径。拒绝备选：①JS 常量同步（`root.scss` 改值需人工同步，应用覆写变量不跟随——canvas-only 无 DOM 对照，错位不可见）；②SCSS 同源导出（`root.scss` 的 24px 为字面量非 SCSS 变量派生，且项目无 build-time CSS→JS 通道——`vite.config.js` 只向 SCSS 注入 `$colors`，方向相反；新建机制成本远超一字段收益）。
10. **形态收敛（二轮调整 b）：两形态互斥 vs 保留三形态**：API 上条目形态 3 → 2（icon-only / caption-only），规则一句话（「有文本文本优先」）；代价是图标与文字并存的视觉表达力（用户明确要求删除）。实现净简化：`ellipsizeButton` / `buttonsOverflowOf` / `drawButtonPill` / `drawButtonLink` 四处删除 icon+caption 分支（iconWidth 扣减、`BUTTON_ICON_GAP`、icon-only 降级路径全删），绘制 / 测宽 / tooltip 三链同构收敛——d 缺陷（降级分支后置）随降级路径删除结构性消解，无需独立补丁。性能顺带收益：caption 非空条目零 `resolveIconEntry` 查表（互斥短路在解析前）。

## 配套

- `editor.js` `NON_EDITABLE_TYPES` 加 `'icon'`（用户显式配 `editor: true` 时不开编辑）。
- tooltip：
  - `column.title === true`：DOM 通道条目挂 `title` 属性（原生 tooltip 显示注册名）；**canvas 通道不会触发**——`resolveTooltipItems` 以 `item.text` 拼全文（`cell-painters.js:1513`），icon 条目 `text` 为 null 即返回 null，且 icon 宽恒 ≤ 内容宽不构成溢出。视作已知通道差异，不额外改造。
  - `column.title` 为 Function/String：走 `resolveTooltipCustomTitle`，canvas/DOM 均生效（canvas hover 即显示）。
  - button 图标：`buttonsOverflowOf` 适配（见「button 列图标按钮」）。
- 样式：`src/components/table/column-types/style.scss` 增 `.mu-table__icon-cell > .mu-icon`（`display:inline-block; width:1em; vertical-align:middle`）与 `> svg { display:block; width:1em; height:1em }`——不依赖 `icon.scss` 是否被打包（tabler svg 自带 24px 尺寸，缺规则会显示 24px）；font-size 由条目内联 `size` 提供。
- demo 夹具：
  - `demo/src/data/table-ex/main-view.vue`：editButton 夹具改注册名（`pencil` 不在内置 28 名单，改用内置名如 `dots`/`search`）+ `@edit-button-click` 监听替换 `:459-462` 的 `pencilIcon` 直传与 `onClick`；新增 icon 列（混合内置 svg 名与注入 cls 名）、button 图标列——二轮调整后夹具形态：icon-only（内置 svg 名 + 注入 cls 名）、caption+icon（文本优先忽略演示）、未注册名（caption 条目忽略 / icon-only 哨兵终止，后者入 self-checks 不入 demo 宽列）、link 形态同源对照列。
  - `demo/src/data/table/main-view.vue`：新增 icon 列夹具（DOM/base table 通道验证，`docs-site/components/table.md:107-119` 类型表的对应列）。
  - cls 夹具：demo 样式（`demo/src/common/style.css`）新增两个注入类——`.mu-demo-glyph-a::before { content: '\25CF' }`（转义形式）、`.mu-demo-glyph-b::before { content: '●' }`（字面字符形式），页面经 `installIcons({ demoGlyphA: 'mu-demo-glyph-a', demoGlyphB: 'mu-demo-glyph-b' })` 注册；不引入字体文件。
- 文档同步四处（实施阶段经用户确认后更新，项目 AGENTS.md 约定），精确落点：
  - `skills/mussel-ui/references/components/data.md`：列类型表 `:173-190`、`editorButton` 行 `:293`（键名改 `editButton`）、button 列 `buttons` 行、不可编辑类型行 `:310`
  - `docs/quick-reference_components.md`：列类型表 `:1681`、`editorButton` 行 `:1808`（键名改 `editButton`）、`:1825` 不可编辑类型行
  - `docs-site/components/table.md`：`:80`（12 种 → 13 种）、`:107-119` 类型表
  - `docs-site/components/table-ex.md`：`:53` button 示例、`:289` 扩展列类型表、`:281` editorButton 行（键名改 `editButton`、事件 `@edit-button-click` 示例）、`:298` 编辑器不可编辑类型行（补 `icon`）
  - icon 列文档需写明：仅注册名、内置 31 名清单与 `installIcons` 注册方式、`color`/`iconOption.size`、DOM 通道 `title` 差异
  - button 图标文档需写明（二轮调整后）：caption 与 icon 互斥、有文本文本优先（icon 忽略）；icon-only 宽 = 高 = `--mu-control-height-small`（24，随主题变量）、图标水平垂直居中；link 形态 icon-only 宽 = 图标本体（12）

## 实施清单（按片组织，串行）

**二轮实施范围**：片 1 / 片 3 步骤与上轮实施（05-verify-终-2 对应轮，修订 4 设计）一致，源码已落地——`drawIconGlyph`（`cell-painters.js:138`）、`resolveIconEntry`（`column-types/icon.js:18`）、`whenGlyphReady`（`icons/index.js`）、`'edit-button-click'`（`table-ex.vue:169`）、类型登记（`editor.js:38` / `row-geometry.js:74`）均在——本轮作为回归基线核对，无新改动；**本轮增量 = 片 2 步骤 12–17（【新增改动面】/【改写】项）+ 步骤 25 终验**（含 tooltip 矩阵补验）。

**片 1：icon 列（单图标，注册名 + color）+ install 时码点解析**

1. `src/icons/index.js` —— install 时 cls 项码点解析（存储形态 / 两跳重试 / SSR 防御 / 幂等继承，见「码点解析」节）；导出 `whenGlyphReady`
2. `src/components/table/column-types/icon.js` —— `IconColumn`（双通道 compile、`resolveIconEntry` 导出、非法值/未注册门控 + dev warn、`size` 归一）
3. `src/components/table/column-types/index.js` —— 注册 `icon: IconColumn`
4. `src/components/table/column-types/style.scss` —— `.mu-table__icon-cell` 基础样式
5. `src/components/table/ex/cell-painters.js` —— 导出 `drawIconGlyph`（cls 路径直读注册表项 + `whenGlyphReady` 登记，**无 glyphCache/resolveIconGlyph 状态机**）；`requestImage` 多监听；`measureItem`/`drawItem` icon 分支
6. `src/components/table/ex/editor.js` —— `NON_EDITABLE_TYPES` 加 `'icon'`
7. `src/components/table/ex/row-geometry.js` —— `GRAPHIC_ITEM_TYPES` 加 `'icon'`
8. `demo/src/data/table-ex/main-view.vue` —— icon 列夹具（svg 名 + 注入 cls 名 + color/size 用例）
9. `demo/src/data/table/main-view.vue` —— icon 列夹具（DOM 通道）
10. `demo/src/common/style.css` —— 两个注入 class（escape/字面）
11. `demo/src/data/table-ex/self-checks/cell-painters.js` —— recordingCtx 增记 `drawImage`；icon 编译产物/门控/绘制/`drawIconGlyph`/`resolveIconEntry` 断言；install 解析断言（`installIcons` 注册夹具 cls 后 `glyph`/`fontFamily` 非空、`glyphStatus === 'ready'`、`whenGlyphReady` 对 ready 项不回调）

**片 2：button 列图标按钮（二轮调整后；【新增】/【改写】标相对修订 4 增量）**

12. `src/components/table/ex/theme.js` ——【新增改动面】`readSnapshot` 增 `controlHeightSmall: readPx(probe, '--mu-control-height-small')`；三处「20 固定字段」注释（`:2` / `:107` / `:249`）改 21
13. `src/components/table/ex/constants.js` ——【新增改动面】`CONTROL_HEIGHT_SMALL_FALLBACK = 24`（镜像 `root.scss:140`，C2 镜像常量收拢，注释注明变量名与取值处）
14. `src/components/table/ex/cell-painters.js` ——【改写】`buttonHeightOf(theme)` 内部助手；`BUTTON_ICON_GAP` 删除；`ellipsizeButton` 重构（形态互斥源头判定 + 无降级路径，**d 显式修复**：caption 省略为空串 → `return null`，右缘裁剪判定先于一切绘制，降级分支删除）；`layoutButtonEntries`/`drawButtonPill`/`drawButtonLink`/`onItemRect`（pill 高 = 快照值，link 沿用 TAG_HEIGHT）同步；`buttonsOverflowOf` 删除 `iconWidth` 扣减与 `remaining < padX*2 + BUTTON_ICON_SIZE` 提前返回、icon 解析移入 caption 空分支（caption 非空条目零查表零 warn）、icon-only 计宽 pill = `buttonHeightOf(theme)` / link = 12；`TAG_*` 常量注释解耦（`:45-47`）；button 图标注释（`:52-53`，「图标与 caption 间距 4px；icon-only pill 宽 = TAG_HEIGHT」）随 `BUTTON_ICON_GAP` 删除与快照取值同步改写
15. `demo/src/data/table-ex/main-view.vue` ——【改写】button 图标夹具（`:692-699`）：icon-only（svg 名 + cls 名）、caption+icon 忽略演示、未注册名、「按钮」「链接按钮」两列同源对照维持
16. `demo/src/data/table-ex/self-checks/cell-painters.js` ——【改写】button 块断言：命中矩形 `'9,20'` → `'7,24'`（`:1024-1028`，块名「tag 同构」表述同步）；两形态矩阵重算——夹具 `[caption+icon, icon-only, caption+未注册]` → texts `['编辑@16', '<glyph>@56', '删除@90']`、宽 `[34, 24, 34]`（caption 条目 icon 忽略：无 glyph fillText、未注册名零 warn——console.warn 捕获，`:2214-2232` 同款）；省略断言 caption x = 16（无图标偏移），删除原 glyph 位置断言（`:2386-2390`，改造后 caption 条目无 glyph fillText）；**d 回归**（`:2392-2399` 场景保留）：width 40、caption+icon 条目 → 0 次 fillText + 0 次 pill fill/stroke + 0 条 onItemRect（仅断 fillText 会漏掉「空文本 pill 仍绘制」的退化实现）；icon-only 右缘剩余 < 24 → 该条目 0 绘制且终止（如 width 56 夹具 `[caption '甲', icon, caption '乙']` → texts 仅 `['甲']`、onItemRect 仅 1 条）；哨兵两态维持 + 新增未注册 icon-only 哨兵；tooltip 矩阵重算（icon-only 24 计宽：44 溢出 / 70 不溢出维持；caption+icon 计宽忽略 icon：10 字 106 ≤ 144 不溢出、15 字 151 > 144 溢出）；`THEME` 夹具补 `controlHeightSmall: 24` + 回退断言（`{ ...THEME, controlHeightSmall: undefined }` → pill 宽仍 24）+ 自定义高度断言（`controlHeightSmall: 32` → icon-only pill 宽/命中矩形高 32、命中矩形 `'3,32'`、图标居中 x = 起点 + 10——证明高度由快照驱动而非硬编码 24）
17. `demo/src/data/table-ex/self-checks/theme.js` ——【新增改动面】快照计数 20 → 21 固定字段（14 色 + 字号/字体 + 5 尺寸，`:241-280`；头注释 `:4-5`「20 固定字段…controlHeight 已随 C3 死代码清理移除」同步改写为二轮新增 `controlHeightSmall`，块名 `:241` 与内联注释 `:270`/`:275`/`:279` 的 20 → 21）；`SIZE_VARS` 追加 `--mu-control-height-small: 24px`（夹具自含，不依赖页面根作用域）；`pxKeys` 补 `controlHeightSmall: 24`

**片 3：editButton 改造（注册名 + emit + 全局改名）**

18. `src/components/table/ex/constants.js` —— `EDITOR_BUTTON_AREA`/`EDITOR_BUTTON_ICON_SIZE` 改名 `EDIT_BUTTON_AREA`/`EDIT_BUTTON_ICON_SIZE` + 注释更新（`:45-48`）
19. `src/components/table/ex/editor.js` —— `editorButtonRectOf` 改名 `editButtonRectOf`（`:87`）
20. `src/components/table/ex/painter.js` —— `paintEditorButton` 改名 `paintEditButton` + 改 `drawIconGlyph` + `resolveIconEntry` 门控；import 改名（`editButtonRectOf`、`EDIT_BUTTON_*`）
21. `src/components/table/ex/table-ex.vue` —— `isEditorButtonHit` 改名 `isEditButtonHit` 且门控改 `resolveIconEntry`、`tryEditorButtonClick` 改名 `tryEditButtonClick` 且改 emit `'edit-button-click'`、`defineEmits` 追加、注释同步改名（`:813-814`/`:968-972`/`:1049`）
22. `demo/src/data/table-ex/main-view.vue` —— editButton 夹具改键名 + 注册名 + `@edit-button-click` 监听
23. `demo/src/data/table-ex/self-checks/painter.js` —— editorButton 夹具改注册名（先 `installIcons` 注册一次性唯一 svg，保持「加载中按钮区不半绘制」断言有效；现 `:1121` 直传 svg 串，改造后 `resolveIconEntry` 判失败会使该断言空转）；`editorButtonRectOf` 引用改 `editButtonRectOf`（`:24`）
24. `demo/src/data/table-ex/self-checks/editor.js` —— `editorButtonRectOf` 引用改名（`:20`/`:37`/`:678-699`）；`resolveIconEntry` 门控断言（先注册夹具名再断言命中/未命中）

**终验（依赖片 1–3）**

25. demo 页全量验证（见「验证」）+ self-checks 全跑

片间依赖：**片 1 → 片 2 → 片 3 串行**。片 1/片 2 同改 `cell-painters.js` 与 `self-checks/cell-painters.js`；片 1/2/3 同改 `demo/src/data/table-ex/main-view.vue`（文件集合相交，不可并发）；片 2 新增 `theme.js` / `constants.js` / `self-checks/theme.js` 改动面，其中 `constants.js` 与片 3 改名（步骤 18）同文件不同行、串行消解；片 2 的 cls 图标路径、片 3 的 cls 绘制均依赖片 1 的 `drawIconGlyph` 与 icons 模块解析；片 3 的 `editor.js` 改名与片 1 的 `NON_EDITABLE_TYPES` 同文件不同行，串行消解。文档同步（四处）在实施确认后进行（不占片）。

## 验证

验收标准归属（00-task.md 修订要求 1–4 → 片 / 手段）：

| 要求 | 归属 | 手段 |
| --- | --- | --- |
| 1 icon 列：单图标 + 仅注册名 + color | 片 1 | self-checks（浏览器面板）+ demo 页双通道 |
| 2 button 列图标按钮 | 片 2 | self-checks + demo 页（canvas） |
| 3 editButton：仅注册图标 + onClick → emit | 片 3 | self-checks + demo 页 |
| 4 性能与 API 便利权衡 | 「性能与 API 便利权衡」节 | 人工审（无自动化手段） |

- 静态：`node --check` 新增/修改的 `.js`（含 `.vue` 的 `<script setup>` 提取后校验）；本项目无 eslint/typecheck 配置。
- self-checks（浏览器 demo 页「自检结果」面板，`http://localhost:3000/data/table-ex/`；源模块带 `@/` 别名，node 不可直接 import，仅作语法校验）：
  - icon：`prepareColumn`+`resolveCellContent` 双通道产物形状（canvas 单条目 `kind/icon/color/size`、DOM `mu-icon` + `text-{color}` + `innerHTML`）；`value == null` 空产物且不 warn、非 string / 未注册名空产物、落 placeholder（`drawCell` fillText `'-'`）；`drawIconGlyph` cls 路径以 recordingCtx 断言 `fillText` 的 glyph/font `${size}px …`/x 与颜色（glyph 取自注册表项，install 时已解析）、svg 路径经同步 `Image` 桩断言 `drawImage` 尺寸 = size；`resolveIconEntry` 已注册命中 / 未注册 null；install 解析断言（夹具 cls 注册后 `glyph`/`fontFamily` 非空、`glyphStatus === 'ready'`）。
  - button：两形态互斥（caption+icon 条目仅 caption 绘制；未注册 icon 配 caption 时零 warn——console.warn 捕获，`self-checks/cell-painters.js:2214-2232` 同款）；icon-only pill 宽 = 高 = 24（快照与回退两路）、图标居中 x = 起点 + 6、命中矩形 `y,height = 7,24`（centerY 19 ± 12）；自定义快照 `controlHeightSmall: 32` 时宽/高/命中矩形随之为 32 / `3,32`、图标居中 x = 起点 + 10（证明值由快照驱动，非硬编码）；caption-only 宽 = 8×2 + caption、省略只作用 caption（x = 起点 + 8）；右缘裁剪两向——caption 放不下（width 40 夹具）→ 0 次 fillText + 0 次 pill fill/stroke + 0 条 onItemRect 且终止（05-verify-终-2 失败项 1 回归；空文本条目不得落绘制）、icon-only 剩余 < 24 → 该条目 0 绘制且终止；空哨兵（caption 空且无/未注册 icon 终止后续，icon-only 有有效图标继续）；tooltip 溢出矩阵重算后全跑——icon-only 24 计宽（contentWidth 44 溢出 / 70 不溢出）、caption+icon 计宽忽略 icon（10 字不溢出 / 15 字 151 > 144 溢出）、纯图标组无 tooltip。上轮终验 UNVERIFIED 的「tooltip 溢出矩阵」子断言随本矩阵重跑补验（decisions.md 二轮调度裁决）。
  - editButton：`resolveIconEntry` 门控（注册 → 命中；未注册 → 不命中，`isEditButtonHit` 为组件内函数，几何断言沿用既有 `editButtonRectOf` 组）；`self-checks/painter.js` 的 editButton 夹具改注册名（一次性唯一 svg）后，「加载中按钮区不半绘制」与 hover 抑制断言保持有效。
  - 说明：install 解析的 pending → 两跳重试 → failed 链路依赖异步样式/字体时序，不入同步断言（demo 页常规路径样式表已就绪，install 同步解析成功，ready 态可断言；浏览器验证覆盖重试链）。self-checks 判定口径 = **fresh load 首跑**（同会话重跑受 `warn once` 非幂等影响，decisions.md 二轮调度裁决；05-verify-终-2 测试质量问题 1）。
- demo 页验证（`http://localhost:3000/data/table-ex/` 与 `/data/table/`，rollup watch 已启，知识库 demo-page-url-data-prefix；playwright 优先 DOM/可访问性快照断言）：
  - icon 列（table-ex/canvas）：svg 名显示、注入 cls 名的转义/字面两形态解析显示、`column.color` 染色、`iconOption.size` 生效、暗色主题切换 svg 重着色（缓存分键）、同一图标多行首帧后全部显示（多监听 flush 一次重绘）、未注册名/空值落占位文本。
  - icon 列（base table/DOM）：`<mu-icon>` 渲染、`text-{color}` 染色、内联 font-size = size、`title` 属性。
  - button 列：icon-only（内置 svg 名 + 注入 cls 名，pill 24×24 图标居中）/ caption-only / caption+icon（文本优先，icon 不显示）、link 形态（icon-only 宽 12）、hover 反转图标色跟随、自定义 `--mu-control-height-small`（页面覆写为 30/32）时 pill 高宽随变量变化（快照跟随，刷新/切换后生效）、未注册名（caption 条目忽略；icon-only 哨兵终止入 self-checks）、点击 payload 不变。
  - editButton：hover 显示已注册图标（svg 与注入 cls 两种）、点击触发 `edit-button-click`（payload `{ record, recordIndex, column }`）、不选中行不开编辑、未注册名不绘制不命中。
- 不可验证项（如实记录）：真实 icon-font 字体文件的 tofu/字体加载时序（仓库无字体资产），仅验证「注入 class → 解析 → 绘制」链路；如需端到端，由使用方项目验证。

## 实测确认点（不预先断言，demo 验证定案）

1. `getComputedStyle(el, '::before').content` 的转义形式（icons 模块 install 时解析）：Chrome 存在返回 `"\e600"` 字面转义与返回已解码字符两种记载；解析器兼容，两形态各以注入 class 覆盖。
2. 字体未加载时 `fillText` 的临时 tofu：install 解析成功但 `document.fonts.status !== 'loaded'` 时，由 icons 模块单次 `fonts.ready` flush `whenGlyphReady` 回调重绘；离屏解析元素常驻容器以触发 @font-face 懒加载（canvas `fillText` 不触发）。本仓库无字体资产，仅确认链路触发不抛错。
3. `.mu-table__icon-cell > .mu-icon` 规则与 `icon.scss` 共存时的尺寸（内联 font-size 覆盖 calc(1em+2px)，svg 1em = size）。
4. button 24px pill（`--mu-control-height-small`）内 12px 文字（TAG_FONT_SIZE）与 12px icon-only 图标（水平垂直居中）的观感；紧凑行高自定义（`--row-height` < 30 时 24px pill 贴近行线、< 25 时越行线）的视觉余量（默认 36 行高无虞；pill 高为绘制期值，不参与行高估算）。
5. editButton cls 形态在 hover overlay 层的 `fillText` 与 svg `drawImage` 视觉一致性（x 左对齐于 16px 槽，中心同一槽位）。

## 风险与回滚

- **单向门（破坏性 API 变更，已裁决方向 A，回滚须同步回退协议、事件名、符号改名与全部使用点）**：editButton 协议收敛 + 全局改名（K-1a/K-1b 合并表述）——协议键 `column.editorButton` → `column.editButton`、`onClick` 属性与 svg 串 / 图片 URL 直传移除（不留兼容层）、事件 `edit-button-click` 为新名（新增事件，无旧名迁移）。涉及符号与文件：`table-ex.vue` `isEditButtonHit`（原 `isEditorButtonHit`，`:973`）/ `tryEditButtonClick`（原 `tryEditorButtonClick`，`:1051`）、`painter.js` `paintEditButton`（原 `paintEditorButton`，`:991`）、`editor.js` `editButtonRectOf`（原 `editorButtonRectOf`，`:87`，消费方 `painter.js:4` / `table-ex.vue:107` / `self-checks/editor.js:37` / `self-checks/painter.js:24`）、`constants.js` `EDIT_BUTTON_AREA`/`EDIT_BUTTON_ICON_SIZE`（原 `EDITOR_BUTTON_*`，`:47-48`）、demo 夹具 `main-view.vue:459-462`、`self-checks/painter.js:1121`、四处文档 editButton 行（`data.md:293`、`quick-reference_components.md:1808`、`table-ex.md:281`）。爆炸半径：仓库内 = 上列文件；仓库外 = v4.2.0 起的使用方（svg 直传概率不低），升级后旧协议键静默失效（不绘制、不命中、无 pointer，仅 dev warn）且事件需换绑 `@edit-button-click`；发布说明必须附「破坏性变更与迁移指引」。
- **双向门（共享模块行为变更，影响全部 icons 消费方）**：icons 模块 install 时新增 cls 解析（DOM 读写 + 注册表项扩展字段 + `whenGlyphReady` 导出）。回归点：icon 组件（`icon.vue` 只读 svg/cls/animation，不读 glyph，零影响）、`parseIconValue` 副作用路径不涉 glyph；内置 31 项全 svg，install 内置注册零解析开销。回滚 = 移除 install 内解析调用与 `whenGlyphReady` 导出（cell-painters 的 cls-pending 分支同步回退）。
- **双向门（共享管线行为变更，回归面广但可独立回退）**：`requestImage` 多监听——消费方含 img 列（`measureItem`/`drawCellImage`）与 `requestIconImage`（editButton / icon / button 图标）。回归点：img 同 src 多行从「仅首格重绘」变为「逐格 invalidate、rAF 合帧一次重绘」（缺陷修正方向）；既有单 listener 场景「恰回调一次」语义保持。回滚 = 还原单监听实现。
- **双向门（纯增量，未配置零影响）**：icon 列（新文件 + `index.js` 一行注册 + `editor.js`/`row-geometry.js` 登记行 + `style.scss` 新规则）；button 图标（`icon` 键可选，caption-only 路径零改动）；`edit-button-click` 事件（纯新增，不触碰既有事件名）。回滚 = 删分支 / 去注册。
- **双向门（快照字段扩展，二轮调整，实际为纯增量）**：`readSnapshot` 增 `controlHeightSmall` + `constants.js` 回退常量。回归点：`snapshotsEqual` 泛型迭代自动覆盖新字段（暗色/换肤重读与 mutation 抑制链不变）；不读该字段的消费方零影响；`self-checks/theme.js` 计数断言联动（片 2 步骤 17）。回滚 = 删字段 + 删常量 + cell-painters 高度取值回退硬编码。
- **双向门（button 形态与高度行为变更，二轮调整，canvas 专属）**：两项拆分——① `icon` 键与形态互斥为本任务内新增、未随任何版本发布（v4.2.0 无 button icon 键），仓库外无使用方，协议非破坏性；② **pill 高度 20 → 24 是已发布 button 列的视觉变更**（API / 协议 / 事件不变，但仓库外所有使用 button 列的应用 pill 变高 4px），按用户裁决 a 执行、发布说明需注明；自定义主题覆写 `--mu-control-height-small` 的应用按变量语义自动跟随（预期行为，缺省 24）。回滚 = 还原 `ellipsizeButton` / `buttonsOverflowOf` / `drawButtonPill` / `drawButtonLink` 至修订 4 形态。
- **合并风险**：片 1/2 同改 `cell-painters.js` 与 `self-checks/cell-painters.js`，三片同改 `demo/src/data/table-ex/main-view.vue`；片 2 与片 3 同改 `constants.js`（不同行）——按片 1→2→3 串行消解（「实施清单」片间依赖）。

## 破坏性变更与迁移指引（确认门裁决方向 A，供发布说明直接引用）

一处合并的破坏性变更面：**editButton 旧形态移除 + 协议键 / 事件名 / 符号改名**（`column.editorButton` 协议为 v4.2.0 引入，`1c8f326`；外部影响不可由仓库证伪，按裁决不留兼容层）。

| 旧（v4.2.0） | 新 | 迁移动作 |
| --- | --- | --- |
| `column.editorButton = { icon: '<svg 串>', onClick }` | `column.editButton = { icon: '<注册名>' }` | svg 串改经 `installIcons({ 名称: '<svg 串>' })` 注册后引用注册名；或换用内置名之一（清单见文档 icon 列节） |
| `column.editorButton.icon = '<图片 URL>'` | 无对应形态 | 图片 URL 不再支持；将图标转为 svg 串注册（iconfont class 形态同样可注册） |
| `onClick: payload => {...}` 属性 | `@edit-button-click` 组件事件 | 回调体迁至模板监听；payload 形状不变（`{ record, recordIndex, column }`） |
| `column.editorButton`（键名本身） | `column.editButton` | 即使已用注册名，键名也要改 |

迁移示例（发布说明引用）：

```js
// v4.2.0
const columns = [{ field: 'amount', editorButton: { icon: pencilSvg, onClick: p => edit(p.record) } }]

// 升级后
installIcons({ pencil: pencilSvg })
const columns = [{ field: 'amount', editButton: { icon: 'pencil' } }]
```

```html
<mu-table-ex :columns="columns" @edit-button-click="p => edit(p.record)" />
```

- 未注册名行为：不绘制、不命中、无 pointer（仅 dev warn），点击落回既有选中/编辑链。

## 未解问题

无待人工确认项（本轮无确认门）；3 项自决点已按代码事实定案，终验报告按此标注：

1. **CSS 变量取值策略** → 主题快照 `readPx` 读取（定案）：尺寸字段入快照有直接先例（`theme.js:126-129` rowHeight 等 4 字段；`demo/src/data/table-ex/self-checks/theme.js:5` 注释载明设计期曾有 controlHeight 字段），应用覆写变量 / 换肤自动跟随；拒绝 JS 常量同步（覆写不跟随、`root.scss` 改值漂移，canvas-only 无 DOM 对照错位不可见）与 SCSS 同源导出（项目无 build-time CSS→JS 通道，机制新建成本远超一字段收益）——详见权衡 9。补充核实：该变量仅在 `.mu-root,.mu-light` 块定义（`root.scss:140`），无 `.mu-dark` 覆盖，明暗态取值一致；button 高度只在绘制期消费（`row-geometry.js:74` button 归 `GRAPHIC_ITEM_TYPES`，估高恒 1 行、不读 pill 高），换肤时快照重读 + `onChange` 已覆盖重绘，无需额外布局重算。
2. **link 形态 icon-only 宽高语义** → 宽 = 图标本体 `BUTTON_ICON_SIZE` 12（定案）：link 无 pill 几何（`drawButtonLink` 无底无边框，`cell-painters.js:1408-1437`），「宽高一致 = 24」的 pill 语义不适用；图标 12×12 即宽高一致，x = 条目起点、centerY 垂直锚，命中框沿用 link 现状（`TAG_HEIGHT` 高度框，与 caption-only link 同口径）。
3. **caption 非空时 icon 的忽略深度** → 完全忽略（定案）：不解析、不绘制、不 warn（`resolveIconEntry` 的未注册 warn 仅在 caption 空的 icon-only 候选触发，`icon.js:23-28`）——「有文本文本优先」的字面语义，且免除有效 caption 条目的无谓 warn 噪声。
