# 设计 — mussel 高性能可编辑表格（mu-canvas-table 演进）

任务：`.pipeline/20261025-editable-table/00-task.md`。探索报告：`01-explore-stk.md`（下称 stk 报告）、`01-explore-kaka.md`（kaka 报告）、`01-explore-mussel.md`（mussel 报告）。决策：`decisions.md`（检查点 3 + 检查点 4 人工指令，均已落实，本轮不回退）。**本轮（检查点 5 定向修订）输入：`03-human-3.md`（人工 3 条 UI 缺陷，每条按 blocker 对待），修复方案见改动清单「缺陷修复 R1（人工 3）」表与文末「评审回应（人工 3）」；实施基线 = 05-verify-2 PASS 后的工作区现状（主实施 G1–S1 已完成并验证，R1 为其后的定向缺陷修复步骤，修订后不再评审直接实施——decisions.md [检查点 5]）**。本轮人工 3 修订已实地复核：painter.js:272-313（paintCellRange 行背景 fillRect）/​:359-387（paintGridlines）/​:391-409（paintFixedArea）/​:599-651（paintOverlay hover 行带/编辑描边）/​:677-804（paintRowBand/paintColBand/paintCellRegion/paintResizeBand）/​:810-853（paint 分区调度）、editor.js:306-400（computeEditorStyle 全文）、canvas-table.scss:104-153（__editor 规则）、input.scss:9-67（.mu-input 基础盒）/​:180-185（border 1px）、theme.js:103-109（bgNormal/bgStripe/selectBg/hoverBg）、layout.js:427-472（stickyWidth = containerWidth、spacerWidth = max(colsWidth, containerWidth)）、interactions.js:104-127（resolveCursor 三参现状）、demo/src/data/canvas-table/main-view.vue:47-50（grip 模板）/​:845（onStageResizeStart）/​:1139-1148（ct-resize-handle 样式）。前轮输入 `03-review-6.md`（blocker 1 / major 5 / minor 5，共 11 条）逐条处理见「评审回应（评审 6）」；再前两轮输入 `03-review-5.md` + `03-human-2.md` 的处理见「评审回应（评审 5 + 人工 2）」，人工 1/2 意见方案零回退。本设计引用的工作区文件均已逐一核对存在（核对记录见各节行号；本轮复核：link.js 全文、link.scss 全文、tag.scss:28-45、text.js:3-35、interactions.js:14-15/:38-60/:70-75/:208-226、canvas-table.vue:604-665、layout.js:53-108、form/index.js 全文、input.scss:180-181/:248-252、root.scss:1-9/:20-27/:33-40（语义色 0–9 数字谱系与彩色无数字变体 = link.scss hover 取色依据，见 P1）；前轮引用见各评审回应表）。

**本轮修订要点（人工 3，R1）**：① **行背景带充满视口宽**——paintCellRange 行背景 fillRect 右缘由"所绘列右缘"改为 `max(列右缘, stickyWidth)`（paintCellRange 增第 5 参 `bandToX`，仅滚动区 pass 传 stickyWidth、固定列 pass（paintFixedArea 内调用）不传，防固定 pass 行底色覆盖已绘滚动区内容；A2.1）；② **hover 描边 = 编辑浮层矩形，四周 4px 间距**——editor.js 新导出 `EDITOR_GAP = 4`，computeEditorStyle 重写为统一等距内缩矩形（删 per-type 高度分支与垂直居中式），painter hover 描边同源同矩形（import EDITOR_GAP，A7 新增例外）；文本左缘一致性按 `padding-left = cellPadding − EDITOR_GAP − 1` 反算（scss `calc(var(--cell-padding) − 5px)`，A5.3/A5.4）；③ **demo 缩放 grip 改右下三角**——`.ct-resize-handle` 视觉改 `::after` + `clip-path: polygon(100% 0, 100% 100%, 0 100%)` 三角（`var(--mu-primary-color)` 0.5 不变，元素本体保持 16×16 全命中区，A6.2）。实施步骤单步 R1（白名单 6 文件），测试计划补 #16。

**前轮修订要点（评审 6）**（评审 6 全部 11 条接受，其中 blocker 1 扩改动面至 table 共享文件）：link 对象数组颜色经 **`src/components/table/column-types/link.js`（数据层）+ `src/styles/link.scss`（色类层，tag.scss 同款 @each 模式）** 落地（P1，改动清单新增两行、G2 原子完成、DOM 版回归断言与回滚策略见风险表）；拖拽调宽下限经 layout.js 新导出 `resolveTypeMinWidth` + 壳 startResize 传参接入（P2）；`hitTest` 增 `cellX`、`resolveCursor` 增 context 第三参（P3）；dots 字符统一 `'...'`（DOM link.js:47/tag.js:46 字面值，P4）；弹性分支 clamp 复用已解析 min（P5）；maxLines 行级求值 `_resolveMaxLines(record)` 闭包（P6）；`resolveInitialExpandedKeys` 签名扩 records/keyOf/parentKeyOf + 内部 BFS 计层（P7）；`treeIndents(colIndex, row)` 回调契约（P8）；theme.js 职责收缩为快照与信号（P9）；form 导出计数 20 项（P10）；input.scss 行号 :181/:248-252（P11）。

## 方案概述

**选型结论：canvas 绘制（四维论证见下）；路线决策：在现有 `src/components/canvas-table/`（前序任务产物，未提交，前序 05-verify-2 PASS、demo 77 项自检）基础上优化演进，不彻底重构、不新建组件。**

组件保持 `MuCanvasTable` / `<mu-canvas-table>`（内部名 `MusselCanvasTable`）：单 canvas 分区绘制 + 原生滚动容器（sticky canvas + spacer 撑高）承载虚拟滚动，DOM 只负责边框/滚动条/编辑浮层/空态；单元格编辑经组件模板内 DOM 浮层复用 mussel 输入组件（`MuInput`/`MuSelect`/`MuDateInput`/`MuSwitch` + **textarea（库内 memo 原生约定，人工 2 意见 2）**）；颜色/字体/尺寸经探针元素读 `--mu-*` 计算样式，MutationObserver 感知暗色切换。

本轮（人工 1 + 人工 2 修订后）改动分两层：

**① 能力扩展（人工 1 五项，其中 3/4/5 经人工 2 修订，架构级）**

1. **树形数据**（人工 1 意见 1）：`tree: Boolean` + 平铺 records 经 `key`/`parentKey` 字段（`treeProps` 可配置字段名，参考 tree 组件 `DEFAULT_DATA_PROPS` 可配置模式）构建 DFS 展开序平铺；展开态受控（`treeExpandedKeys` / `update:tree-expanded-keys`）+ `defaultExpandLevel`（0-based `level <= defaultExpandLevel`，对齐 tree 组件，A2.4）；树形列缩进 + 展开/收起箭头 canvas 绘制；与变高行虚拟滚动的联动（展开/收起 → 平铺重建 → 行高几何重建 → totalHeight/spacer 更新 → 滚动锚定）一并设计（A2.4）。
2. **编辑 UI**（人工 1 意见 2）：单击单元格进编辑（与选中/聚焦、dblclick、列宽拖拽、排序点击的冲突矩阵见 A5.2）；可编辑格 hover 感知（cursor `text` + 1px 主色内描边）；编辑浮层改为内容区矩形定位、`column.editor.border` 可选边框，编辑/非编辑态单元格与内容边距一致（A5.4）。
3. **预设列类型默认宽度 + 最小宽度**（人工 1 意见 3 + 人工 2 意见 1 修订）：canvas-table 侧 `TYPE_DEFAULT_WIDTHS` 常量表（每类型 `{ width, minWidth }` 双值，12 无类型宽的内置 + progress/button 新类型），**仅在 `solveWidths` 的弹性分支作初始宽与最小宽基线（同位替换 COL_FALLBACK 与 `col.minWidth == null` 时的 80px 隐式下限，不动定宽链 `widthOverrides ?? col.width ?? type.width` 与定宽分支 `getPixelNumber(col.minWidth) ?? 0`；下限复用已解析 min，字符串 '80px' 不回归——评审 6 P5）**；无 type 列（默认 TextColumn）回退 `text` 条目；`col.minWidth` 显式值覆盖类型最小宽；调宽下限接入 = 壳 `startResize` 传参 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`（layout.js 新导出，评审 6 P2；clamp 位置 `resolveResizeWidth` 不动）。check/rec_no（type.width 50px）与显式 `col.width` 列的定宽行为完全不变（不动 table 列类型注册表——那会改变现有 DOM table 默认列宽，见被拒绝备选 #9）。
4. **新列型与统一色板**（人工 1 意见 4 + 人工 2 意见 3）：`progress`（进度条）、`button`（多按钮）新类型（仅 canvas-table，经 canvas 专属类型表分发，A3.3）；`link` 列多条 + `danger` 变体落地；`tag` 列多标签颜色落地；**各处颜色字段（`progressOption.color`、`buttons[].color`、`tag.color`、`link.color` 等）统一支持 mussel 内置色板名（primary、red 等 17 色，A6.1）**；link/tag/button 点击命中 → `cell-item-click`（**DOM 版 table 已有同名事件（table.vue:90），canvas 版本期补齐**，payload 对齐 `{ record, column, link|tag|button }` + canvas 附加 `recordIndex`；**超限 `'...'` 省略条目同样命中发事件（payload 值 `'...'`，DOM link.js:47/tag.js:46 字面值），对齐 DOM 版 dots 绑定行为**，A3.3/A4.3；绘制期收集条目命中矩形按 (row, col) 粒度合并 + 窗口裁剪）。**link 对象数组与颜色的解析/取色路径（评审 6 P1）**：数据层改共享文件 `table/column-types/link.js`——`valueToLinks` 对象元素原样保留（非对象包 `{ caption }`）、item 构造与 `linkOption` 解构增 `color`、`if (color) itemClass.push('mu-link--' + color)`；视觉层 `styles/link.scss` 增 16 新色类 + danger 既有规则保留（合计 17 色全覆盖，@each 对齐 tag.scss:28-45 先例，DOM/canvas 双侧生效，danger 排除理由见改动清单共享文件表）；canvas 取色 = drawItems 解析 `mu-link--{color}` class 查快照 colors（与 drawTag 解析 `mu-tag--{color}` 同款机制）——对象数组颜色不再依赖"透传"假设（现状 `valueToLinks` 将对象元素包成 `caption` 为对象、item 不读 color，评审 6 核实，A3.3/风险表/回滚行同步）。
5. **多行文本 + 变高行虚拟滚动重设计**（人工 1 意见 5 + 人工 2 意见 2 修订为 `maxLines`/`maxItems` 双字段）：text/link 列数据支持**文本、数字、数组**（数组元素含数字，逐元素 String 化）；**`maxLines: Number` 定义多行**（1–10，缺省 1 = 单行省略；字符串值自动换行，行数超 maxLines 时末行收缩显示 `'…'`，文本省略字符 `'…'` 与条目 dots 字符 `'...'` 的区分见 A3.5）；**`maxItems: Number` 定义数组最多显示个数**（1–10，缺省 10；超出时第 maxItems 项显示 `'...'`，与 DOM dots 字面值一致）；**数组值字段无条件直接渲染多行（每元素一行）、按行数计算高度**（人工 1 意见 5 原文，无需显式标记）；link 列支持**字符串数组与对象数组**（对象 `{ caption, color, danger, disabled }` 设置链接颜色等，A3.3）——link 列定为条目列：数组即竖排每条一行，条目数受 maxItems 钳制（A3.5 统一规则）；**多行/数组值编辑用 textarea 编辑器**（复用库内 memo 约定：原生 `<textarea class="mu-input">` + v-model，A5.5；数组值编辑用换行分割成数组）；**maxLines 的行级求值（评审 6 P6）**：列准备挂 `_resolveMaxLines(record)` 闭包——`col.maxLines` 常量直接 clamp；DOM 风格 `multiline + lineClamp` 兼容路径**不在列准备期求值函数列**（无 record），闭包内按 record 求值 `ensureFn(col.lineClamp)(record) ?? 10` 后 clamp——drawText、computeRowHeights/ensureRowMeasured、editor textarea 判定三处同源调用，函数形态 lineClamp（`lineClamp: (record)=>n`）行高与绘制必然一致；高性能文本测量（字符数短路判定 + measureText 按需精算 + 折行结果缓存，"仅测量更长的字段"）；虚拟滚动从等高模型重设计为**行几何策略模式**——等高快速路径保留（O(1)），变高模式经 Fenwick 树行高索引（O(log n) 更新/定位，与分段树/朴素前缀和数组对比选型见 A2.3 与被拒绝备选 #7/#8）；估高下界 + 按需精算 + totalHeight 单调增长 + 滚动锚定补偿（A2.2/A2.3）。文本测量统一经 theme.js 测量工厂注入（`createTextMeasurer`，A2.2），text-wrap 为纯函数模块。

**② 前轮既定质量增量（保留，含在改动清单内）**

1. **编辑值类型规整**（`editor.js` 纯函数）：`number`/`currency` 列提交收敛为 number 或 `null`（非数值输入保留原字符串、交由 validate 拦截——概括补全，03-review-3 问题 3）；数值型枚举提交按编辑前值类型回写 `number`。mussel 报告未解问题 #2 已核实关闭（Vue `vModelText` looseToNumber，证据见 A5.5）。
2. **主题快照扩容**：固定字段 17 → **21**（`bgStrong` + `controlHeight` + `textColorMuted` + `bgDisabled`）+ `colors` **固定 17 色 map**（12 彩色 + 5 语义，gray 回退不入，全量读取，不经列准备期收集——记录级色（tag.color、`(record)=>` 配置）在列准备期不可见，固定全集消除来源与刷新契约问题，A6.1），check disabled 底衬对齐 DOM 版，link/button disabled 色有快照来源。
3. **`editor.js` 死代码路径清理**（`focusAfterRender` 不可达守卫）。

**③ 检查点 5 缺陷修复（人工 3，R1——实施基线 = 05-verify-2 PASS 后工作区现状）**

1. **行背景充满表格宽度**（人工 3 意见 1）：表格 viewport 宽 > ΣcolWidths 时（全部列定宽，solveWidths 只把剩余宽摊给未定宽列），striped/选中/普通行背景与 hover 行带只画到 ΣcolWidths——`paintCellRange` 行背景 fillRect 右缘 = 所绘列右缘（painter.js:285-290），[Σ, W) 区域 clearRect 后保持透明。修复：行背景带右缘 = `max(所绘列右缘, stickyWidth)`（视口坐标系；Σ ≥ viewport 横向滚动时画布自然裁剪到视口右缘，不超真实内容宽），固定列遮挡关系靠分区绘制顺序保持（固定 pass 不扩带，A2.1）。
2. **hover 描边与编辑浮层统一为 4px 等距矩形**（人工 3 意见 2）：现状 hover 描边贴格缘（painter.js:636-638 `strokeRect(x+0.5, y+0.5, colWidth−1, heightAt−1)`）、编辑浮层 inset = padding−1/padding 两套口径（editor.js:391）——位置不一致且间距 0/1/8px 不等。修复：hover 描边矩形 = 编辑浮层矩形 = 单元格矩形四周内缩 `EDITOR_GAP = 4px`（editor.js 导出，painter 同源消费）；文本左缘一致性按 `cellPadding − EDITOR_GAP − 1` 反算输入内边距（A5.4 重新推导，约束 5 在新口径下成立且顺带修复现状 textarea 文本左缘 +10px 偏差）。
3. **右下角缩放 grip 改右下三角**（人工 3 意见 3）：该元素为 demo 夹具 `.ct-resize-handle`（main-view.vue:47-50 模板 + :1139-1148 样式，`var(--mu-primary-color)` + opacity 0.5 的 16×16 方块）——非组件库元素。修复：视觉改右下三角（`::after` + clip-path，`--mu-*` 变量色不变，元素本体 16×16 命中区不变，A6.2）。

**遗留问题**（意见 7）：03-review-3 minor 6 条全部采纳修正（见「评审回应（人工 1）」意见 7 行）；前设计未解 2 条——#1 文档同步时机仍待用户确认（不可自决，保持未解）；#2 MuSelect 下拉高亮相等语义本轮核实关闭（单选 MuSelect 的 `provide('select')` 不含 `selectedValues`（select.js:95-99），MuOption 的 `selected = selectedValues?.value.has(...)`（option.vue:26）在单选下拉恒为 undefined——单选面板本无选中高亮机制，不存在严格匹配失效问题；multi-select 的 Set.has 严格语义不涉及表格编辑器；open 字符串化对显示路径 `comboValue` 的 `v in optionLabels`（select.js:72-87）对象键宽松命中无害且必要）。

### 验收标准对照索引（00-task.md 十条）

| # | 验收标准 | 对应章节 |
|---|---------|---------|
| 1 | canvas vs DOM 选型决策（三库对比四维 + mussel 现状评估） | [选型决策](#选型决策验收-1canvas-vs-dom) |
| 2 | 优化现有 vs 彻底重构（能力盘点 + 差距分析） | [路线决策](#路线决策验收-2优化现有-canvas-table不彻底重构) |
| 3 | 完整组件 API 逐项与现有 table 对照 | [A1](#a1-组件-apiprops--events--方法--插槽与现有-table-逐项对照) |
| 4 | 渲染架构与虚拟滚动设计（窗口/滚动/按需重绘；禁止全量绘制） | [A2](#a2-渲染架构与虚拟滚动) |
| 5 | 列定义结构及映射与差异 | [A3](#a3-列定义结构) |
| 6 | 列头拖拽调宽与排序交互 | [A4](#a4-列头拖拽调宽排序与条目点击) |
| 7 | 单元格编辑设计（适配层/生命周期/数据流/校验/提交取消/只读控制） | [A5](#a5-单元格编辑设计) |
| 8 | 样式方案（--mu-* 取值/暗色/视觉对齐） | [A6](#a6-样式方案) |
| 9 | 文件结构与模块划分 | [A7](#a7-文件结构与模块划分) |
| 10 | 范围边界 | [A8](#a8-范围边界本期不支持) |

### 人工意见验收对照（人工 1 + 人工 2 修订后口径 + 人工 3 缺陷修复，设计内自含）

| 意见 | 验收点 | 对应章节 | 测试计划行 |
|------|--------|---------|-----------|
| 1 tree | `tree` 平铺 key/parentKey 数据渲染为树；字段名可配；展开/收起交互与事件；树 + 虚拟滚动（展开收起后滚动位置稳定） | A2.4 / A3.4 | #11 |
| 2 编辑 UI | 单击进编辑（选中/编辑一次完成，与拖拽/排序无冲突）；可编辑格 hover 感知（cursor + 描边）；编辑器边框可选且两态边距一致 | A5.2–A5.4 | #12 |
| 3 默认列宽（人工 2 意见 1 修订） | 各预设类型未配 width 时缺省宽**与最小宽**双生效；`col.minWidth` 可覆盖类型最小宽（**含字符串形态 '80px' 正常解析，评审 6 P5**）；**bool 60 等窄类型不再被 80px 隐式下限抬高**；**无 type 列回退 text 默认宽 160**；显式 width 不受影响；**拖拽下限同步接入类型最小宽（壳 startResize 传参，评审 6 P2）** | A3.2 / A4.1 | #6 / #13 |
| 4 新列型 + 色板（人工 2 意见 3） | progress/button/link 多条/tag 多色渲染正确；**各处颜色字段支持内置 17 色板名（primary/red 等，含记录级 `(record)=>` 与条目级）**；**link `color`/`linkOption.color` 经 link.js 落 class + link.scss 色类 + canvas colors 查表（评审 6 P1 完整链路）**；link/tag/button 点击发 `cell-item-click`（payload 对齐 DOM 版 `{ record, column, link\|tag\|button }`，dots 值 `'...'`）；tag 点击与 DOM 版一致 | A3.3 / A4.3 / A6.1 | #14 |
| 5 多行与变高（人工 2 意见 2 修订） | `maxLines` 定义多行（≤10，溢出末行收缩 `'…'`——文本视觉省略字符）；`maxItems` 定义数组显示上限（≤10，超出第 maxItems 项 `'...'`——DOM dots 字面值，两类字符二分见 A3.5）；text/link 列数据支持文本/数字/数组；link 支持字符串数组与对象数组（对象设置颜色等）；**多行/数组编辑用 textarea，数组换行分割**；**maxLines 行级求值（函数 lineClamp 按 record 取值，评审 6 P6）**；行高按内容变化；10 万行滚动流畅；滚动锚定不跳动；与树/调宽联动正确 | A2.2–A2.4 / A3.5 / A5.5 | #7 / #15 |
| 7 遗留 | review-3 minor 6 条 + 未解 2 条处置 | 评审回应（人工 1） | 全表 |
| 人工 3（检查点 5） | ①行背景充满视口宽（Σ < W 延伸右缘 / Σ ≥ W 不越界 / 固定列遮挡不变）②hover 描边 = 编辑浮层矩形且四周 4px（左缘一致性新推导）③demo grip 右下三角（命中区不变） | A2.1 / A5.3 / A5.4 / A6.2 / 改动清单 R1 表 | #16 |

### 选型决策（验收 #1）：canvas vs DOM

三库定位（各报告结论）：stk-table-vue = 纯 DOM 虚拟滚动（原生 `<table>`，零运行时依赖）；kaka-grid-next = 纯 canvas 引擎（51,005 行 TS，分层门禁体系）；mussel canvas-table = 单 canvas + 原生滚动容器的已实现已验证组件（9 文件 = 8 个 js/vue 共 3,696 行 + 1 个 scss）。

#### 四维对比

| 维度 | DOM 路线（stk 实证） | canvas 路线（kaka 实证） | 结论 |
|------|---------------------|-------------------------|------|
| **性能** | 渲染量同样可约束到视口（stk：`slice(startIndex, endIndex+1)`），但每个窗口变化帧的成本构成 = Vue patch + DOM 节点增删 + style/layout/paint + 弃置 vnode/节点的 GC；stk 为此做了 13 项机制优化（silent-scroll 静默写入、rAF 节流、Fenwick 树行高、key 必须放 template 防 unkeyed diff 等，useVirtualScroll 1,032 行含约 300 行历史边界修正），无保存的实测数据（其 perf 结果目录为空——stk 报告未解问题 #1） | 滚动帧成本 = 纯 draw call（无 DOM 构建与布局、不经 Vue 渲染层）；kaka 实测：20 列定宽/auto 60.1 fps（整屏 4.7/5.9 ms）、120 列定宽 60.1 fps（4.6 ms）、120 列 auto 22.8 fps（37.9 ms）——瓶颈 = 可见格数 × 单格成本，两路线同源，canvas 单格成本更低（无 DOM 构建） | **canvas 优**。大数据量下两者都可行（stk 数万行流畅自证），差距在每格成本与帧路径可控性；mussel canvas-table 已在 10 万行 demo 验证（lastPaint 外部断言仅绘视口行 + OVERSCAN）。变高行重设计（本轮）两侧成本同源（行高索引 + 窗口计算），不改变结论 |
| **资源占用** | 常驻 DOM = 视口行 × 列 + 表头 + 占位 tr，滚动时节点增删带来 GC 压力；stk 构建产物 JS ≈ 277 KB（未压缩）+ CSS 21 KB | 表格区常驻 DOM 恒为 O(1)（canvas + overlay + spacer ≈ 个位数节点）；kaka 核心 min+gzip 115 KB——但其中 features 层 16,263 行（占 32%，树/小地图/分支图/透视等非目标能力），vue 入口全量 1.02 MB raw | **canvas 优**（DOM 节点与节点 churn O(1) vs O(视口格数)）。体积维度对 mussel 无意义：mussel canvas-table 随库构建（dist/mussel.js 为整库体积，前序验证记录），无独立分发负担 |
| **可扩展性** | 单元格内容扩展性最强：`customCell` 组件注入（`<component :is>` 进每个 td）+ CustomCellProps 契约 + feature 注册机制 | 单元格内容扩展 = draw 回调 / 继承 BaseColumn / style 函数，无 Vue 渲染通道与插槽（kaka Vue 层仅 2 个状态栏插槽） | **DOM 优**。但对「可编辑表格」场景该差距被两端缓解：① 单元格内容以文本/轻图形为主，canvas-table 复用现有 table 列类型 render 管线（自定义类型对象输出 text 天然支持，本轮绘制类别扩展到 items 四类 + canvas 专属 progress/button，见 A3）；② 编辑器是真实 mussel 输入组件，经 DOM 浮层挂载（A5）——恰好绕开 canvas 无法嵌组件的短板。另注：现有 mussel table 本身无插槽、无 customCell 机制，DOM 路线在 mussel 体系里反而要发明新的扩展通道 |
| **开发便利（mussel 视角，决定性）** | 两条子路成本都 ≥ 一个全新组件：(a) **改造现有 table**——现状是全量 `<table>` v-for 渲染（table-row.vue 无窗口化），加虚拟滚动需重构行渲染/占位/固定列/hover 指示条全链，且现有使用方回归风险；现有 table 也无调宽、无编辑能力。(b) **移植 stk**——11,370 行 TS + Vue 2.7 兼容结构（props 必须内联 `<script setup>` 等需剥壳）+ 其编辑是演示级实现（仅原生 input、无校验、无表格级/列级只读、无编辑器扩展注册——stk 报告约束与风险节），任务约束 4（复用 mussel 输入组件 + 适配层）在其中无现成对应物，只能借鉴 customCell 注入通道 | 3,696 行已实现、前序 05-verify-2 PASS（demo 77 项自检）、约束 0–5 全部命中；本轮能力扩展（tree/变高行/新列型）在既有模块边界内加 3 个新模块 + 既有模块扩展（A7），stk 的变高行 Fenwick 树（useVirtualScroll.ts:788-820、rowHeightFenwickTree.ts:1-74）提供成熟参考 | **canvas 优，且不对称**：DOM 路线 = 3–5 千行级新工程；canvas 路线 = 既有 3.7K 行 + 本轮约 1.5–2K 行级扩展 |

**结论：canvas。** 四维中 canvas 在性能、资源占用、开发便利三维占优；DOM 仅在单元格内容扩展性占优，而该短板对可编辑表格场景已被「列类型管线复用 + 编辑 DOM 浮层」组合覆盖（前序设计已验证此判断，本轮绘制类别落地（items 四类 + canvas 专属 progress/button）与 cell-item-click 进一步收窄差距）。

#### mussel 现状评估（选型输入）

- 现有 DOM table（`src/components/table/`，385+89 行）：全量渲染、无虚拟滚动（10 万行不可用）、无列宽拖拽、无编辑、无插槽无方法——作为高性能可编辑表格的起点缺 4 项核心能力（mussel 报告 §1）。
- 现有 canvas-table（`src/components/canvas-table/`，9 文件 = 8 个 js/vue 共 3,696 行 + 1 个 scss，未提交）：虚拟滚动（10 万行 demo）、列宽拖拽、排序（`update:order-by`）、单元格编辑（4 类编辑器 + validate + 只读控制）、固定左列、hover 5 模式、DPR/暗色适配、5 个 expose 方法、demo 77 项自检 PASS——约束 0–5 全部命中（mussel 报告 §2，本设计写作时已复核关键源码）。
- kaka 报告的 P0 实测结论（可见格数 × 单格成本是共同瓶颈；事件派发非主因）同时约束两条路线，不构成 DOM 路线的翻案证据。

### 路线决策（验收 #2）：优化现有 canvas-table，不彻底重构

#### 现有实现能力盘点（对照本任务验收标准）

| 验收标准 | 现状 | 依据 |
|---------|------|------|
| #3 API 逐项对照 | 已实现：17 props / 8 events / 5 方法 / 1 插槽，13 个 props 与 table.vue 同名同义 | canvas-table.vue:92-127、:779-785（本设计已核对）；mussel 报告 §2 |
| #4 渲染架构与虚拟滚动 | 已实现：单 canvas 5 分区、sticky+spacer 原生滚动、rAF 合帧、OVERSCAN=2 行/列双窗口、lastPaint 绘制统计外露（painter.js:694-697 `draw` 返回 `paint()` 统计；「禁止全量绘制」由 demo 自检与测试计划的外部断言核验，见 A2） | mussel 报告 §2；前序 05-verify-2 PASS（A3 实测 rowCount 13/13/11 ≤ 窗口上界） |
| #5 列定义结构 | 已实现：table 列字段全量沿用 + `editable`/`resizable`/`editor` 三字段 | mussel 报告 §2；canvas-table.vue:141-149 列准备管线 |
| #6 列头调宽与排序 | 已实现：4px 手柄命中、固定列排除、move 临时前缀和、`column-resize` 事件；排序三态循环 + `update:order-by` | interactions.js / layout.js:290-321（mussel 报告 §2） |
| #7 单元格编辑 | 已实现：适配层（定位/生命周期/数据流/校验/提交取消矩阵）、表格级+列级只读、4 类编辑器复用 | editor.js 全文（本设计已核对）；demo canvas-table-editable |
| #8 样式方案 | 已实现：探针 + 17 字段快照 + MutationObserver 暗色 + 视觉规格对齐 | theme.js:30-72（本设计已核对） |
| #9 文件结构 | 已实现：9 文件模块划分 | 目录实存（本设计已核对） |
| #10 范围边界 | 已声明（前序设计 A9 十二条 + 前两轮修订调整） | mussel 报告 §2 引 02-design.md A9 |

#### 差距分析（重构 vs 优化的判据）

本轮输入后差距为**八项**：前轮三处质量项 + 人工 1 五项能力项。逐项判断扩展性：

| # | 差距 | 扩展方式 | 是否结构性 |
|---|------|---------|-----------|
| 1 | 编辑提交值类型/空值未规整 | editor.js 新增纯函数（前轮已设计） | 否 |
| 2 | 主题快照缺 `--mu-bg-strong`、`--mu-text-color-muted`、`--mu-bg-disabled`；新列型需 17 色体系 | theme.js 固定字段 17 → 21 + `colors` 固定 17 色 map（A6.1） | 否 |
| 3 | editor.js 死代码 | 删除（前轮已设计） | 否 |
| 4 | 无树形（意见 1） | 新模块 `tree.js`（纯函数）+ 绘制/命中/事件扩展 | 否——树不改变渲染管线（树行 = 平铺后普通行），只改变"records → 平铺行数组"的数据准备层 |
| 5 | 编辑触发/hover 感知/浮层边距（意见 2） | interactions.js 决策函数 + editor.js 定位函数 + scss 类 | 否 |
| 6 | 无类型默认宽（意见 3） | layout.js 常量表 + solveWidths 弹性分支基线一行的改动 | 否 |
| 7 | 无 progress/button 列型、tag/link 颜色、item 点击（意见 4） | cell-painters.js 绘制（progress/button 经 canvas 专属类型表分发）+ painter.js itemHits 收集 + interactions 命中 | 否——items 落地机制已有（check/link/tag/img 四类 + 文本），扩展类别（canvas 专属分发）与颜色解析 |
| 8 | 等高行模型（意见 5，最大项） | 行几何策略模式（新模块 row-geometry.js + text-wrap.js）：等高路径 O(1) 保留，变高路径 Fenwick 索引；painter/layout/interactions/editor 的行坐标计算统一经几何接口 | **半**——涉及 5 个模块的行坐标算式替换，但全部收敛为 `topAt/heightAt` 单点替换（等高模式下与原算式恒等），无管线重排 |

**彻底重构**（kaka 式分层引擎）需重写 3,696 行已验证代码；其收益（类型门禁、分层边界、18 种内置列类型）建立在 kaka 的 TS + 门禁体系上，对纯 JavaScript、无门禁的 mussel 体系不可迁移，且 51,005 行的体量与 mussel「单组件 3.7K 行」的现实不可比。八项差距全部可在既有模块边界内扩展（两项经新模块隔离）。**无结构性能力差距支撑重构成本。选优化现有。**

> 前序决策标注：本设计 A5.5 的枚举提交类型保持规则，修订前序流水线（20261023-canvas-table）中「enum 提交值恒为 mapping key 字符串」的文档化行为（editor.js:19-20 头注引 decisions「[I1 前]⑦」）。修订理由：数值型 enum 编辑往返后 `record[field]` 类型漂移是实际缺陷（受控数据流下父级被迫自行 `Number()` 转换），类型保持规整是可预测且零成本的修复；该决策属前序流水线产物而非本任务 `decisions.md` 约束，本设计有权修订并在此明示。

### 探索报告未解问题的处置（设计裁量项）

| 来源 | 问题 | 处置 |
|------|------|------|
| stk #1 | 浏览器真实 DOM 节点量/帧率/内存实测数字缺失 | 不作为选型前置。选型引用 kaka 已有实测（四维表）+ mussel canvas-table 10 万行 demo 已验证事实；机制层结论（渲染量均可约束到视口、单格成本差异）已足够支撑决策 |
| stk #2 | stk API 与 mussel table 逐项映射 | 由本设计 A1 完成（以 mussel 现有 table 为对照基线，stk 仅作机制参考不进 API；其变高行 Fenwick 树作为 A2.3 选型参考之一） |
| stk #3 | canvas（kaka）vs DOM（stk）对比合并 | 本设计选型决策节完成 |
| stk #4 | stk 编辑缺口（无校验/只读/扩展点）在适配层如何补齐 | 已由现有 canvas-table editor.js 补齐（validate / isCellEditable / editor 配置），本设计 A5 文档化；本轮再补类型规整层 |
| kaka #3 | 两级函数式只读模型 vs 任务约束的映射（是否加行级） | 不加。任务约束 4 明确「表格级与列级」，现实现即此模型；行级（`editable: (record)=>boolean`）列为未来扩展（被拒绝备选 #5），范围边界 #7 |
| kaka #1/#2 | vue.mjs 体积拆分 / BranchGraphColumn | 与本任务无关（本轮不涉及 vue 桥接移植与分支图），不处置 |
| mussel #1 | canvas-table 未提交产物处置（保留/重构弃置） | 保留演进——「优化现有」路线的直接推论；git 处置（提交入库）属实施后用户决策，本流水线不实施 |
| mussel #2 | MuInput type='number' 提交值实际类型（string vs number）待实验 | 第 2 轮已核实关闭：Vue 3.5.39 `vModelText` 在 DOM type=number 时自动 `looseToNumber`（runtime-dom.esm-bundler.js:1577/:1580），MuInput `<input v-model>` 经 inputAttrs 绑定 type（input.vue:6、input.js:54-59）——合法数值提交 number；空串/非数值输入回落 string（shared.esm-bundler.js:96-99）。A5.5 规整层三形态收敛保留 |
| mussel #3 | `--mu-bg-strong` 是否补入快照 | 补齐（本期改动 #2），root.scss:54/:110 双态已定义、绘制侧一处消费 |
| mussel #4 | canvas-table 三处文档（skills/docs/docs-site）未同步 | 延后。项目 AGENTS.md「完成代码实现后，未经用户确认，不更新文档」，列入范围边界 #15 与未解问题 #1 |

## 遵循约定与复用

提取自 mussel 报告「现有约定」节，关键项本设计写作时已复核源码：

- 命名：注册名 `MuCanvasTable`（`<mu-canvas-table>`），内部名 `MusselCanvasTable`（canvas-table.vue:90）；CSS BEM `mu-` 前缀（`mu-canvas-table__editor` 等）。
- 文件结构：`src/components/canvas-table/` = `canvas-table.vue` + `canvas-table.scss`（就近 import）+ 模块 js + `index.js`；已注册于 `src/components/index.js:21,:58`。本轮新增 3 个模块 js（A7），不动注册。
- 代码：纯 JavaScript、Vue 3 `<script setup>`、shallowRef/computed、`throttle-debounce` 包（canvas-table.vue:61）。
- 复用（均已存在并被 canvas-table 引用）：`../table/utils.js`（ensureFn/getPixelNumber）、`../table/column-types/index.js`（resolveColumnType，cell-painters 复用列类型体系）、`@/utils/key-builder`（autoIncrementKeyBuilder，canvas-table.vue:136-137）、`@/utils/type`（isFunction/isObject/isString，editor.js:44）、`../form/index.js` 输入组件（editor.js:46）、`v-mu-scrollbar` 指令、全局 `sizechange` 事件。
- 状态管理与数据流：props 单向 + `update:*` 受控事件（组件不改 record，父级在 `update:cell-value` 处理器内执行变更——editor.js 头注契约、demo onCellValueChange:160-168 现行用法）；编辑器 payload 传原始引用非 reactive 代理（editor.js:270-272）。树展开态同款宽松受控（内部 Set + `update:tree-expanded-keys` 通知 + prop 引用变化覆盖，同 `headerChecked`/`orderBy` 模式）。
- 错误处理：探针读取 try/catch 保留上次快照（theme.js:168-173）；painter 未识别脏区按整幅兜底；编辑 commit/cancel 幂等（editor.js:445-485）；树构建迭代 DFS + visited 防环、孤儿挂根（A2.4）。
- 测试方式：无测试框架；demo 页 + playwright DOM/像素断言 + demo 内置 self-checks 断言面板（`demo/src/data/canvas-table/self-checks/` 现状 7 断言文件 + `index.js` 聚合注册（index.js:15-29 注册 6 组），模块级纯函数断言模式——本期新增 3 个断言文件并同步注册为 9 组，删除 dblclick 组、同步 interactions 断言组）。
- 样式约束：颜色/间距/z-index 一律 `--mu-*` 变量；新列型颜色全部经 theme 快照 `colors` map 读取。**内置色板 = 17 色：12 彩色基础（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange，读 `--mu-{name}`）+ 5 语义（primary/secondary/success/warning/danger，读 `--mu-{name}-color`），每色再读 `--mu-{name}-translucent`**——色名集合与消费先例 = tag.scss:28-45（`mu-tag--{color}` 色类体系，gray 不入色板、为回退）；变量定义 = root.scss:1-9 色名表（`$BASE_COLORS` 含 gray 共 13 + `$SEMANTIC_COLORS` 5，其中 gray 不入 colors map）、:33-35 基础色 translucent（`.mu-root,.mu-light` 块定义、暗态继承该定义）、:37-40 语义色 translucent 明态、:92-95 语义色 translucent 暗态覆盖（本设计已核对）。
- **textarea 编辑器约定**（人工 2 意见 2）：mussel **无独立 textarea 输入组件**（form/index.js 导出 20 项 = 17 个输入组件 + MuForm/MuFormRow/MuFormField 3 个容器组件，无 textarea（评审 6 P10 修正计数），MuInput 模板为硬编码单行 `<input>`，input.vue:6）。库内既有多行输入约定 = form-field 的 `INPUT_TYPES.memo`（input-types.js:3）：原生 `<textarea>` 元素 + `class: 'mu-input'` + `v-model`（form-field.vue:12 `v-model="form.model[prop]"` 经 `:is` 挂载原生标签）。canvas-table 多行编辑浮层**复用同款约定**（原生 `<textarea class="mu-input">` + v-model，复用 input.scss 边框/padding 样式体系），不新写输入组件。
- 视觉常量镜像先例：check 方框 16px/圆角 4（cell-painters.js:23-25）、tag pill 20px/padding 0 8px/12px（cell-painters.js:28-31，镜像 tag.scss:1-18）、树缩进 16px（镜像 tree.scss:3 `--mu-tree_node-indent`——该变量定义于 `.mu-tree` 作用域，组件探针读不到，canvas 侧取常量 16）。

## 改动清单（含新增或修改的测试文件）

> **基线说明（人工 3 轮）**：下列"新增模块 / 共享文件 / 既有源文件 / demo"四表为前轮主实施（G1–S1）的改动记录，05-verify-2 已 PASS（工作区现状即其实施产物）。本轮人工 3 缺陷修复增量见末尾**「缺陷修复 R1（人工 3）」表**——涉及 painter.js / editor.js / canvas-table.scss 的几何口径（hover 描边、编辑浮层 inset/高度）以 **A5.3/A5.4/A2.1 现行文本为准**，前轮行内的旧公式（padding−1、clamp 高度、贴格缘描边）按本说明视为已修订，不逐行改写历史记录。

新增模块（3）：

| 文件 | 改动 | 原因 |
|------|------|------|
| `src/components/canvas-table/text-wrap.js`（新） | 文本折行纯函数（**测量能力全部经注入的 `measure(text, font)` 回调，模块自身不触 canvas**）：`tokenize`（CJK 单字 + 拉丁/数字连续段为原子词）、`estimateLineCount({ text, fontSize, maxWidth })`（短路：`text.length × fontSize ≤ maxWidth` → 1 行，不测量——"仅测量更长的字段"）、`wrapLines({ text, font, maxWidth, measure, cache, maxLines })`（贪心折行，先全宽 `measure` 下界判定，仅多行候选逐词折行；超长词逐字断；**maxLines 钳制（A3.5）：折行行数 > maxLines 时截断为 maxLines 行且末行收缩加 `'…'`（末行自尾部逐词/逐字退格并复测，至 `内容 + '…'` 适配 maxWidth）**；返回 `{ lines, lineCount, clamped }`）、`createWrapCache(limit)`（key = text+font+width+maxLines，上限 2000 整体清空，复用 theme.js createMeasureCache 模式） | 意见 5 高性能文本测量与多行换行 + 人工 2 意见 2 maxLines 钳制；measure 由组件壳经 theme.js `createTextMeasurer()` 创建注入（A2.2）——行高计算与 drawText 用同一 wrapLines + 同一缓存，折行结果单一事实源 |
| `src/components/canvas-table/row-geometry.js`（新） | 行几何策略：`createUniformRowGeometry({ rowHeight, rowCount })`（topAt=i×h 等 O(1) 算式）与 `createVariableRowGeometry({ initialHeights })`（Float64Array + 内部 Fenwick：`createFenwick(n)` 前缀和/单点加 O(log n)、`findRowAtOffset` O(log n) 倍增下降）；统一接口 `heightAt/topAt/bottomAt/totalHeight/rowCount/offsetToRow/visibleRange(scrollTop, viewH, overscan)/updateHeight(i,h)→Δ/rebuild(heights)`；`computeAnchorShift({ prevTopAtAnchor, nextTopAtAnchor })` 锚定补偿；`computeRowHeights({ records, columns, colWidths, theme, measure, wrapCache, treeIndents })` 全量快速估高 + `ensureRowMeasured({ ..., treeIndents })` 单行精算（内部 import text-wrap 纯函数）。**行数语义（A3.5）**：文本呈现列（不含 link）数组值 → `min(length, maxItems)` 真值（不测量）；字符串 + maxLines>1 → 短路单行真值，否则估 1 行标待精（精算 = wrapLines 钳制 maxLines）；**link 条目列（条目列，A3.5）→ 经列类型 render 求值 items 计数后 `min(count, maxItems)` 真值**（render 为轻量数组构造，与绘制期同款调用）；`treeIndents(colIndex, row)` 可选回调（评审 6 P8：签名带列号，仅树形列返回 `16 × level + 16`、其余列 0，非树形多行列不误扣；A2.4，无树传 null 零成本）；返回值含 `hasArrayValues` 供模式判定 | 意见 5 变高行虚拟滚动核心 + 人工 2 意见 2 maxLines/maxItems；Fenwick 选型对比见 A2.3；measure 注入同上 |
| `src/components/canvas-table/tree.js`（新） | 树纯函数：`buildChildrenIndex(records, { keyOf, parentKeyOf })`（O(n) Map，同父按出现序，`hasChildren` Set）；`buildFlatRows(records, { keyOf, parentKeyOf, expandedKeys, childrenIndex })` 迭代 DFS（显式栈防爆栈、visited Set 防环、孤儿/空 parentKey 挂根）→ `{ rows, levels, parentKeys, hasChildren }`（**hasChildren 平行数组**——树形列绘制箭头/空槽、resolveTreeToggle、resolveCursor 的判定来源，免消费方 O(n) 反查）；`resolveInitialExpandedKeys({ treeExpandedKeys, defaultExpandLevel, records, keyOf, parentKeyOf, childrenIndex })`（评审 6 P7：**level 来源 = 内部从根集（parentKey 空/孤儿）迭代 BFS 计算 `levelsByKey: Map<key, level>`——不依赖 buildFlatRows 产物 levels（展开集是 buildFlatRows 的输入，鸡生蛋；且全收起时深层节点不在平铺中）**；**展开判定 = 节点层级 `level <= defaultExpandLevel`，0-based 根=0，对齐 tree 组件 tree-node.vue:100-106；收集 `level 达标 && childrenIndex.hasChildren(key)` 的 key**；`treeExpandedKeys` prop 非空时直接返回 prop（受控优先，跳过解析））；`toggleKey(set, key)` | 意见 1 树数据构建；纯函数可自检 |

共享文件（3，评审 6 P1 新增——link/tag 对象条目颜色的数据层与视觉层，DOM 版 table 同文件消费；tag.js 为 S1 实施期裁决修复后的文档补记行，见该行原因列）：

| 文件 | 改动 | 原因 |
|------|------|------|
| `src/components/table/column-types/link.js` | ① `valueToLinks`（link.js:9-15）：数组元素 `el != null && typeof el === 'object'` → **原样保留**（对象元素不再被包成 `{ caption: 对象 }`——现状该形态 DOM 渲染为 `[object Object]`）；字符串/数字元素仍包 `{ caption: el }`（现状不变）。② `linkOption` 解构增 `color: _color`（link.js:18 现状仅 `max/danger/disabled`）。③ item 构造解构增 `color = _color`（link.js:50），`if (color) itemClass.push(\`mu-link--${color}\`)`（与 tag.js:49-56 的 `mu-tag--{color}` 落 class 同款机制）。`isValidLink`（对象元素有 `caption` 字段即有效）、dots/title 路径（`links.slice(idx).map(el => el.caption)`，对象元素有 caption，正常）、events.click payload（link 变量 = 原对象/dots `'...'`）均不需改动 | 评审 6 P1（blocker）：现状对象数组显示 `[object Object]` 且 `color` 从不进入 item——canvas 与 DOM 双侧的 link 对象数组颜色都必须先在数据层成立。**DOM 版行为变化 = 仅对象数组从坏显示（`[object Object]`）修复为 caption 文本 + 新增可选 color class；未配对象数组/color 的既有列零变化**（字符串/数字/单值路径、max/danger/disabled 语义逐行保持） |
| `src/styles/link.scss` | 增 **16 个新色类**（@each 生成，写法对齐 tag.scss:28-45 先例）：4 语义色 `.mu-link--{primary/secondary/success/warning} { color: var(--mu-{v}-color); &:hover { color: var(--mu-{v}-color-4) } }` + 12 彩色 `.mu-link--{red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange} { color: var(--mu-{v}); &:hover { color: var(--mu-{v}) } }`（gray 不入，对齐 tag 色板口径；下划线均继承 `.mu-link:hover`）；**danger 不入 @each——`.mu-link--danger` 既有规则（link.scss:13-19）已完整覆盖（color + hover `--mu-danger-color-4`）且保留不动**：@each 重复生成会同特异性后定义胜出，把既有 hover 变浅行为覆盖为同色（DOM 版既有 `linkOption.danger` 列回归，违反零变化承诺）；hover 取色依据：语义色有 0–9 数字谱系（root.scss:23-25 `--mu-{v}-color-#{$i}`，与 `.mu-link:hover`（link.scss:8）既有 `-4` 用法一致），12 彩色无数字变体（root.scss:12-14 仅色值 + :33-35 translucent）故 hover 同色；合计 4 + 12 + 1（danger 既有）= **17 色全覆盖** | link 的 `mu-link--{color}` class 视觉落地（DOM 侧）；canvas 侧不消费该 scss（drawItems 解析 class 查快照 colors），但 class 命名体系需与 DOM 样式一致——DOM/canvas 双侧同色名同色值。纯增量：新 class 名无既有使用方（对象数组现状不可用；danger 不新写），零回归面 |
| `src/components/table/column-types/tag.js` | `valueToTags` 数组元素包装改为 `el => (el != null && typeof el === 'object' ? el : { caption: el })`——对象条目 `{ caption, color, pill, flat }` **原样保留**（现状一律包 `{ caption: el }`，对象条目 color/class 丢失、`mu-tag--{color}` class 从不产生、DOM 侧显示 `[object Object]`）；字符串/数字元素仍包 `{ caption: el }`，标量路径不变；该文件其余逻辑零改动。color/pill/flat 经既有解构落 class（canvas 端 cell-painters 按该 class 查快照 colors 17 色板取色，DOM 端同 class 生效） | 与 link.js P1 同型的孪生缺口：人工意见 3「各处颜色设置支持内置色」/ 测试计划 #14 要求 tag 颜色可定义（含对象条目与记录级 color），评审 6 修订仅补 link.js 入改动清单、tag.js 遗漏。**补记说明（I2-1 裁决）：本行系 S1 实施期 BLOCKED(拆分过粗) 裁决授权修复后的文档补记（decisions.md「[S1 集成]」，04-impl-集成.md 已记录），改动已实施并验证，仅补记不改变技术内容** |

既有源文件（9）：

| 文件 | 改动 | 原因 |
|------|------|------|
| `src/components/canvas-table/layout.js` | 新增导出 `TYPE_DEFAULT_WIDTHS`（A3.2 表，**每类型 `{ width, minWidth }` 双值**，仅含无类型宽的 12 内置 + progress/button + `_fallback` 条目）并接入 `solveWidths` **弹性分支**（layout.js:76-78）：定宽链 `widthOverrides[key] ?? col.width ?? resolveColumnType(col.type).width` 与定宽分支 `clamp(px, min, max)`（min = `getPixelNumber(col.minWidth) ?? 0`，layout.js:62/:75）**保持不变**（check/rec_no 的 type.width 50px 仍为定宽）；仅 `px == null` 的列改为 `const base = TYPE_DEFAULT_WIDTHS[typeNameOf(col)] ?? TYPE_DEFAULT_WIDTHS._fallback; widths[i] = clamp(base.width, col.minWidth == null ? base.minWidth : min, max)`——**同时替换初始宽基线（COL_FALLBACK）与 `col.minWidth == null` 时的 80px 隐式下限（layout.js:77 现状），`col.minWidth` 显式值覆盖类型最小宽**；**下限复用循环头部已解析的 `min = getPixelNumber(col.minWidth) ?? 0`（layout.js:62），不把原始 `col.minWidth` 传给 clamp——字符串 `'80px'` 经 `Math.max(value, '80px')` 会得 NaN（评审 6 P5：列 API `width/minWidth/maxWidth` 支持 String，docs-site/components/table.md:252；`col.minWidth` 存在但不可解析时按现状语义用 0）**；`typeNameOf(col)`：`typeof col.type === 'string' ? (col.type || 'text') : '_fallback'`——**无 type/空 type 列回退 `text` 条目（默认宽 160，resolveColumnType(undefined) 同样回退 TextColumn，index.js:33）；对象/函数自定义类型回退 `_fallback`（80/40）**；**调宽下限接入（评审 6 P2）：新增导出 `resolveTypeMinWidth(col) = TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth`（不含 40 兜底），消费点 = 组件壳 `startResize` 传参 `minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`（canvas-table.vue:628 现状仅传 `getPixelNumber(col.minWidth)`，改此行；`resolveResizeWidth` 的 `minWidth ?? RESIZE_MIN_WIDTH` 逻辑（interactions.js:221-226）与 `findResizeColumn`（仅命中检测，无 clamp）均不动——真正 clamp 位置在 resolveResizeWidth，前稿"改 findResizeColumn"表述废止）**；`computeViewRows`/`rowAt` 增 `rowGeometry` **可选**参数——**未传时经新导出 `resolveRowGeometry({ rowGeometry, rowHeight, rowCount })` 构造 uniform 几何（等高算式恒等）**（G2 中间态组件壳不传参仍可用，03-review-5 问题 3）；`relayout` 签名增可选 `rowGeometry`（contentHeight 改 `headHeight + rowGeometry.totalHeight`），返回快照携带 `rowGeometry` 引用 | 意见 3（人工 2 意见 1 修订：默认宽 + 最小宽）/5；定宽/弹性两分支行为均与现状兼容（弹性列初始宽与下限 80/80 → 类型感知双值）；字符串 minWidth 不回归（P5）；拖拽下限接到真实 clamp 位置（P2） |
| `src/components/canvas-table/painter.js` | `viewportRowY` 改 `layout.rowGeometry.topAt(row) - scrollTop + headHeight`、行背景/网格线行界/overlay 行带高度改 `heightAt/bottomAt`（等高下恒等）；**单格矩形与裁剪同步变高（03-review-5 问题 9）**：`cellRectAt`（painter.js:120-127）height 改 `rowGeometry.heightAt(row)`、`paintCellRange` 每格 rect.height 同源、`paintCellRegion` 裁剪高由 `layout.rowHeight + 1`（painter.js:594-596）改 `heightAt(row) + 1`（等高下恒等；变高行内条目垂直居中与单格脏区重绘正确）；paintOverlay hover 分支扩展：hover 格可编辑（state 传入 `isCellEditableFn` + editable）时画 1px 内描边（`withAlpha(theme.primaryColor, 0.45)`）；`paintCellRange` 绘制 items 时经回调收集条目命中矩形到 `state.itemHits`——**粒度 = (row, col) 二级 Map**（外层 Map<row, Map<col, Array<{ kind, index, rect }>>>，内层按 (row,col) 键整组替换）：全幅绘制先滚动区 `paintCellRange(viewColsRange)` 再 `paintFixedArea → paintCellRange({from:0,to:fixedCount})` 两次 pass（painter.js:568-572/:311、脏区 paintRowBand 同款双 pass，:543-548），按行整组替换会令固定列 pass 覆盖滚动区 pass 的同行条目——(row, col) 粒度下两 pass 写不同 col 键，互不覆盖；**每次全幅/脏区绘制批次结束时按当前可视窗口行 [start, end) 裁剪 itemHits**（窗口外行删除，Map 大小 O(窗口行 × item 列)，长滚不增长）；**绘制状态对象（paintState）契约扩展（03-review-5 问题 13）**：`records` → `displayRows`（树开 = 平铺行数组、树关 = records 原序，painter/interactions/editor 全消费方经此取行）、`flatInfo: { levels, hasChildren }`（树关 = null）、`expandedKeys`、`tree`、`isCellEditableFn`、`editable`、`measure`、`wrapCache`（组件壳创建 painter 时组装传入）；`draw`/`drawRegion` 返回统计口径注释明确 = **最近一次绘制调用**（整幅或脏区）——外部断言按 A2.5 口径 | 意见 2b/4/5 + 03-review-5 问题 9/13；itemHits 内存有界 |
| `src/components/canvas-table/cell-painters.js` | `prepareColumn` 扩展：标记 **`_maxLines`**（`col.maxLines != null ? clamp(col.maxLines, 1, 10) : null`——仅常量形态；DOM 风格 `multiline+lineClamp` 等效映射见 `_resolveMaxLines`）与 **`_resolveMaxLines(record)` 闭包**（评审 6 P6：`col.maxLines != null` → 返回 `_maxLines`；否则 `col.multiline` → `clamp(ensureFn(col.lineClamp)(record) ?? 10, 1, 10)`——**函数形态 lineClamp 按 record 行级求值，与 text.js:13-17 render 内求值同款 ensureFn 语义；不在列准备期求值（无 record，函数形态只会得 undefined 回退 10，行高/绘制分裂）**；其余 → 1。drawText、computeRowHeights/ensureRowMeasured（经内部列消费）、editor textarea 判定三处同源调用）、**`_maxItems`**（`clamp(col.maxItems ?? 10, 1, 10)`）、**`_isTreeColumn`**；**canvas 专属类型表分发（03-review-5 问题 6）**：`CANVAS_ONLY_TYPES = { progress, button }` 在 `resolveColumnType` 之前查询（`col.type` 字符串命中 → canvas 专属 render：progress → `{ canvasKind:'progress', value: _value(record) ?? record[field] }`（数值钳制 [0,100]）、button → `{ canvasKind:'button', buttons: ensureFn(column.buttons)(record) ?? [] }`），未命中走 `resolveColumnType`（不再被回退 TextColumn 绘制文本）；`drawCell` 按 `canvasKind` 分发 `drawProgress`/`drawButton`（进度条/按钮真实绘制，非 items 产物）；**文本路径（A3.5 统一规则）**：`resolveCellContent` 产物为 text（string/number/**array**——数字逐元素 String 化）→ `drawText`：数组 → 每元素一行、行数 > `_maxItems` 时第 `_maxItems` 行显示 `'...'`（前 `_maxItems − 1` 元素 + dots 行——**条目级 dots 字符统一 `'...'`（三点 ASCII，DOM link.js:47/tag.js:46 字面值）；文本视觉省略（wrapLines 末行收缩、单行超宽）保持 `'…'`（U+2026，cell-painters.js:41 `ELLIPSIS` 现状常量，CSS `text-overflow: ellipsis` 视觉同款）——数据条目字面文本与视觉省略号两类字符二分，评审 6 P4 统一口径**）；字符串 + `col._resolveMaxLines(record) > 1` → `wrapLines` 多行（maxLines 钳制 + 末行 `'…'`，text.js:19-29 的 DOM 风格 items 产物由 **drawCell 识别"单 item + line-clamp class"形态改道 drawText**（item.text 为绘制文本，maxLines 取 `col._resolveMaxLines(record)`——与 render 内 `--line-clamp` 求值同函数恒等，评审建议"按 record 求值"路径；保留 enum/date 等格式化 render 的前提下绕开 TextColumn 的 DOM 分支））；字符串 + `_resolveMaxLines(record) == 1` → 单行省略（现状）；measure/wrapCache 经参数透传（与 row-geometry 同一函数与缓存，行高与绘制折行必然一致；首行 `rect.y + padding + lineHeight/2` 顺次 `+ lineHeight`）；`drawItems` 回报条目矩形（kind/rect 收集回调参数，**dots `'...'` 条目同样回报**——DOM 版 dots 绑定 events.click，A4.3）；**link 列（条目列，A3.5）**：数组值（字符串/对象混合）→ **竖排每条一行**（单条超宽省略），条目数 > `_maxItems` 时第 `_maxItems` 条显示 `'...'`；**取色路径（评审 6 P1）**：render 产物 item 的 `attrs.class` 含 `mu-link--{color}`（link.js 本期产出，见共享文件表）→ `drawItems` link 分支解析 class 名 → 文本色 `colors[color]?.color ?? primaryColor`（未知名/无 class 回退主色，与 drawTag 解析 `mu-tag--{color}` 同款机制）；`mu-link--danger` → `colors.danger.color`；`item.attrs.disabled` → 文本 `theme.textColorMuted`；`drawTag` 解析 `mu-tag--{color}` class → 底 `colors[name].translucent` + 边框/文字 `colors[name].color`（快照 colors 固定 17 色 = 12 彩色 + 5 语义，色名集合与 tag.scss:28-45 一致；未知名/gray 回退现状灰底）；`drawProgress`（轨道 `theme.bgStrong` 8px 圆角 4 + 填充 `colors[color]?.color ?? colors.primary.color` + showText 百分比 12px，color 经 ensureFn 支持 `(record)=>`）与 `drawButton`（tag 同构轻量按钮：20px/padding 0 8px/圆角 4/translucent 底 + 色边框 + 色文字，条目 `{ caption, color = 'primary', disabled = false }`、buttons/color 支持 `(record)=>`；disabled 底 `theme.bgDisabled`、文字 `theme.textColorMuted`；**条目矩形回报 itemHits（kind:'button'，可点击命中）**，progress 不回报）；树形列绘制（`col._isTreeColumn` 时内容区前置 `level × 16px` 缩进 + **父行（flatInfo.hasChildren[row]）**16px 箭头三角、叶行 16px 空槽，箭头方向经 `expandedKeys` 判定）；check disabled 底衬 `theme?.bgStrong \|\| theme?.hoverBg`（回退链统一，03-review-3 问题 1） | 意见 1/2b/4/5 + 人工 2 意见 2/3；前轮差距 #2；link 取色经 class 解析不透传（P1）、maxLines 行级求值（P6） |
| `src/components/canvas-table/interactions.js` | 删除 `resolveCellDblclick`（编辑触发改 click）；新增 `resolveCellClickOpen({ hit, cellEditable })`（表体 + isCellEditable → openEditor，意见 2a）；`resolveCursor` 签名扩**第三参 `context = {}`（`{ flatInfo, editable, isCellEditableFn }`，评审 6 P3——现状两参签名 `(hit, columns)` 无 flatInfo/layout 上下文，树槽/可编辑格判定无从取数）**：表体可编辑格（`context.editable && context.isCellEditableFn(column)`）返回 `'text'`，**树箭头槽命中（树开 + 树形列 + `flatInfo.hasChildren[rowIndex]` + `hit.cellX` 槽内）返回 `'pointer'`**（手柄 `col-resize`、表头可排序 `pointer` 优先级不变）；新增 `resolveTreeToggle({ hit, columns, flatInfo })`（**判定用 `hit.cellX`（评审 6 P3：`cellX` 为相对命中列内容区左缘偏移，hitTest 内算好——纯函数无 colLefts/scrollLeft 上下文，用 `hit.x − 列左` 不可实现）**：树形列 + `hit.cellX < flatInfo.levels[hit.rowIndex] × 16 + 16` 槽内且 `hasChildren[hit.rowIndex]` → `{ row, key }`）与 `resolveItemClick({ hit, itemHits })`（**判定用 `hit.x/hit.y`**：窗口内行 (row, col) 条目矩形反查 → `{ kind, index }`，**dots `'...'` 条目同样命中**——DOM 版 dots 绑定 events.click，A4.3）；**`hitTest` 返回值增 `x, y, cellX`**（interactions.js:38-60 现状返回 `{ isHeader, colIndex, rowIndex, resizeCol }` 不含坐标——`x/y` 透传输入指针坐标（条目矩形反查），**`cellX = x − (colLefts[colIndex] − (colIndex < fixedLeftColumns ? 0 : scrollLeft))`（colIndex ≥ 0 时，否则 null；colLefts/scrollLeft/fixedLeftColumns 均为 hitTest 现有入参，零新增输入）**——树槽判定的坐标来源，03-review-5 问题 12 + 评审 6 P3）；`resolveResizeWidth`/`RESIZE_MIN_WIDTH` 不动（拖拽下限接入在壳传参，见 layout.js/canvas-table.vue 行——评审 6 P2） | 意见 1/2a/4 + 03-review-5 问题 12 + 评审 6 P3 |
| `src/components/canvas-table/editor.js` | 前轮三项保留：`usesDerivedOptions`/`normalizeEditorOpenValue`/`normalizeCommitValue` 导出与接入（open 记 `context.rawValue`、commit validate 前规整）、删 `focusAfterRender`/`focusTimer`、头注更新；**`NON_EDITABLE_TYPES` 移除 `'link'`**（editor.js:52——link 列本期可编辑，人工 2 意见 2；rec_no/img/image/tag/check 仍排除）；**textarea 编辑器（人工 2 意见 2）**：`EDITOR_COMPONENTS` 增 `textarea: 'textarea'`（原生元素 tag 字符串，`<component :is="'textarea'">` + `v-model`（vModelText 同款语义）——复用 form `INPUT_TYPES.memo` 约定（input-types.js:3、form-field.vue:12/:73），编辑浮层模板现状 `<component :is>` 通道（canvas-table.vue:45-50）零改动支持）；`resolveEditorType` 扩展：显式 `editor.type` 优先；**text/link 列缺省按开值形态与 maxLines 判定**——open 时 `Array.isArray(rawValue) || column._resolveMaxLines(record) > 1` → `'textarea'`，否则 `'input'`（**行级求值 `_resolveMaxLines(record)`（评审 6 P6）：函数形态 lineClamp 的 legacy 列在准备期无 `_maxLines` 常量，判定时按 record 求值——与 drawText/computeRowHeights 同源，行高与编辑器形态必然一致**；其他列沿用 COLUMN_TYPE_EDITORS 映射）；**提交矩阵 textarea 分支**：Enter 换行不提交、**Ctrl/Cmd+Enter 显式提交**、Esc 取消（容器 keydown 捕获，textarea 内 Esc 冒泡至 `__editor` 容器现状通道）、blur 延迟兜底 / 画布 pointerdown / 滚动即提交（同 input 减 Enter）；`focusEditor` 聚焦查询扩展 `textarea` 元素；**数组值开值/提交（A5.5 ④⑤）**：open 值 `Array.isArray(rawValue) ? rawValue.map(v => v?.caption ?? v).join('\n')`（link 对象数组取 caption）: String(rawValue ?? '')；提交 `context.rawWasArray ? value.split('\n') : value`（数组元素一律字符串）；`computeEditorStyle` 重写为内容区矩形（A5.4：`left = colLefts[i] − (i < fixedCount ? 0 : scrollLeft) + (border ? padding − 1 : padding)`、`top = headH + topAt(row) − scrollTop + (heightAt(row) − 浮层高)/2`、`width = colWidth − 2(padding−1)`（border）/ `− 2padding`（无边框）；**浮层高按编辑器类型**：input/select/date `min(heightAt, controlHeight + (border ? 2 : 0))`、**switch `min(heightAt, controlHeight)` 且 `bordered = false`**（无边框概念的具体化，03-review-5 问题 14）、**textarea `clamp(heightAt(row) − 2×padding, controlHeight, 10 × lineHeight + 2×padding)`**（多行编辑占满内容区高、上限 10 行 + padding，超出内部滚动），controlHeight/lineHeight 经 theme 快照字段；editing 增 `bordered` 标记（容器类切换） | 意见 2c/5 + 人工 2 意见 2（textarea/数组编辑）+ 前轮差距 #1/#3 + 03-review-5 问题 14；left 表达式含固定列条件（与 A5.4 一致，03-review-4 问题 11） |
| `src/components/canvas-table/theme.js` | `readSnapshot(probe)`：固定字段 17 → **21**（增 `bgStrong`、`controlHeight: readPx('--mu-control-height-normal')`（root.scss:141）、`textColorMuted: readVar('--mu-text-color-muted')`（root.scss:46/:101）、`bgDisabled: readVar('--mu-bg-disabled')`（root.scss:55/:111））+ `colors` **固定 17 色 map**（**12 彩色基础（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange）读 `--mu-{name}` + 5 语义（primary/secondary/success/warning/danger）读 `--mu-{name}-color`，每色再读 `--mu-{name}-translucent`；色名集合 = tag.scss:28-45 色类体系（gray 不入 map、为绘制回退）——root.scss `$BASE_COLORS` 实为 13 色（含 gray），"12 基础"前口径不准，03-review-5 问题 10 修正**；translucent 定义：基础色 root.scss:33-35（`.mu-root,.mu-light` 块、暗态继承）、语义色明态 :37-40 + 暗态覆盖 :92-95——**不经列准备期收集**，任何一次 readSnapshot（挂载/暗色切换/DPR/refreshTheme）colors 随整体快照一并重读，无过期问题）；新增导出 `createTextMeasurer()`（离屏 canvas 2d ctx + 现有 `createMeasureCache`（theme.js:136-151，painter.js:74-87 现状消费方）包装 → `measure(text, font)`，主线程同步）；**职责边界（评审 6 P9）：theme.js 只负责快照读取与变更信号——`createThemeWatcher` 的 onChange/refresh 通知通道现状已有（theme.js:158-175/:209-214，零改动），"wrap 缓存失效 + 全量快速重估 + rebuild + 锚定"（契约⑤）不在 theme.js 实施（本模块无 records/rowGeometry，几何消费归组件壳——A7 模块隔离），全部落在组件壳 onChange 处理器（见 canvas-table.vue 行）——前稿"theme.js 回调链增重估步骤"表述废止**；探针 try/catch 保留 | 意见 2c/4 + 人工 2 意见 3 + 前轮差距 #2；03-review-4 问题 4/5、03-review-5 问题 10、评审 6 P9 |
| `src/components/canvas-table/canvas-table.vue` | props 增 `tree: Boolean false`、`treeProps: Object`、`treeExpandedKeys: Array`、`defaultExpandLevel: Number 0`（**语义 0-based `level <= defaultExpandLevel`：缺省 0 = 展开根层级，-1 = 全收起，对齐 tree 组件，A2.4——A1 旧表述"0 = 全收起"废止**）；emits 增 `update:tree-expanded-keys`、`cell-item-click`；expose 增 `expandAll()`、`collapseAll()`、`getTreeExpandedKeys()`；模板移除 `@dblclick`（canvas-table.vue:21）与 `onDblclick`（:543-580）及 **import `resolveCellDblclick`（:80）**——click 处理器内经 `resolveCellClickOpen` 开编辑；树接线（records/treeProps/treeExpandedKeys → buildFlatRows → 平铺行数组供全部绘制/交互消费；树重建时 editor.commit + 锚定）；**watch 契约扩三 prop + 主题维度**：`tree`（开/关 → displayRows 切换 records 原序/平铺 + 几何 rebuild + spacer + 锚定 + 整幅重绘）、`treeProps`（字段名变化 → 展开集按新 key 语义失效清空 + defaultExpandLevel 重解析 → 同上重建链）、`treeExpandedKeys`（引用变化覆盖内部 Set → 重建平铺，A2.4 已述，本轮明确入 watch 表）、**themeWatcher onChange/refresh（主题/字号/行高变量刷新 → wrap 缓存失效 + 变高行全量快速重估 + rebuild + 锚定，A2.2 契约⑤，03-review-5 问题 15；**重估实施位置 = 壳的 onChange 处理器（relayout 前），theme.js 仅发信号——评审 6 P9**）**；行几何接线（列含 `_resolveMaxLines` 常量/legacy 多行（文本呈现列）**或估高扫描 `hasArrayValues`** → computeRowHeights + variable 几何，否则 uniform；模式只升不降——后续变更引入首个数组值时该行重估发现 → 升级 variable + 全量快速重估 + rebuild + 锚定，A2.2；滚动帧窗口 ±OVERSCAN ensureRowMeasured → updateHeight → Δ 累计锚定 scrollTop + spacer 同步；**估高/精算调用传 `treeIndents(colIndex, row)` 回调（评审 6 P8：签名带列号——`(colIndex, row) => tree && colIndex === treeColIndex ? 16 × levels[row] + 16 : 0`，inset 仅作用于树形列，非树形多行列返回 0 不扣减（前稿 `treeIndents(row)` 单参签名无法区分列，会对非树形列误扣），A2.4/03-review-5 问题 7）**；`measure`/`wrapCache` 创建（createTextMeasurer + createWrapCache）并注入 painter state 与 row-geometry 调用；**paintState 组装扩展（A2.1 契约，03-review-5 问题 13）**：displayRows/flatInfo/expandedKeys/tree/isCellEditableFn/editable/measure/wrapCache；hover 感知接线（editable + isCellEditableFn 传 painter）；**`resolveCursor` 调用（canvas-table.vue:455 现状 `resolveCursor(result.hit, preparedColumns.value)`）传第三参 context `{ flatInfo, editable: props.editable, isCellEditableFn }`（评审 6 P3——树槽 pointer 与可编辑格 text 判定的数据来源）；`startResize` 的 `resolveResizeWidth` 传参（canvas-table.vue:628 现状 `minWidth: getPixelNumber(col.minWidth)`）改为 `minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`（评审 6 P2——拖拽下限缺省取类型最小宽，40 兜底仍由 resolveResizeWidth 内 `?? RESIZE_MIN_WIDTH` 承接）**；click 链扩展（树槽 toggle 优先 → item 命中（含 dots）次之 → 编辑开启 → 选中/cell-click 链，A4.3 优先级）；调宽 up 后多行列行高失效重估（A4.2）；`focusEditor` 旁注释更新（前轮）+ 聚焦查询扩展 textarea | 意见 1/2/5 全部接线终点 + 03-review-5 问题 7/13/15 + 评审 6 P2/P3/P8/P9 |
| `src/components/canvas-table/canvas-table.scss` | `__editor` 定位改为内容区矩形规则配套：`__editor--borderless > .mu-input { border-color: transparent; background: none; padding: 0 }`（含 `:focus-within` 保留 focus 光环、`&.mu-input` 通配 combo 根）；border 模式 `__editor > .mu-input { padding: 0 }`（文本对齐边框内缘=padding 线，A5.4 精确一致推导）；**textarea 编辑器样式（人工 2 意见 2）**：`__editor > textarea.mu-input { display: block; width: 100%; height: 100%; resize: none; overflow: auto; padding: 3px 10px; line-height: var(--cell-line-height, 18px); font-family: inherit }`（覆盖 INPUT_TYPES.memo 的固定 `height: 80px` 内联缺省由浮层内联 style 控制高，多行编辑态文本行高与单元格多行绘制一致）；`100%` 宽高填充规则保留（width/height 由内联 style 控制） | 意见 2c + 人工 2 意见 2 |
| `src/components/canvas-table/index.js` | 无改动（新模块经组件内部 import，不经导出面） | — |

demo（自检 3 新增 + 5 修改 + 2 页修改）：

| 文件 | 改动 | 原因 |
|------|------|------|
| `demo/src/data/canvas-table/self-checks/text-wrap.js`（新，测试） | 断言：短路判定（len×fontSize ≤ width → 1）、全宽下界判定、CJK 逐字断行、拉丁词原子不拆、超长词逐字断、缓存命中（**注入计数 measure**——wrapLines 的 measure 为参数，测试传计数包装即可，无 canvas 依赖）、**maxLines 钳制（行数截断 + 末行以 '…' 结尾且适配 maxWidth + clamped 标记；maxLines=1 等价单行省略）** | 意见 5 + 人工 2 意见 2 模块级 |
| `demo/src/data/canvas-table/self-checks/row-geometry.js`（新，测试） | 断言：uniform 模式与等高算式恒等；variable 模式 topAt/totalHeight/updateHeight Δ/offsetToRow/visibleRange 与朴素参考实现（测试内 O(n²) 逐行累加）一致（随机高度数组 1000 行，measure 注入计数包装）；Fenwick rebuild 后一致；锚定补偿值正确；computeRowHeights 的 hasArrayValues/数组值 `min(length, maxItems)` 真值（**含超限 dots 行计数 = maxItems**）/**maxLines 精算钳制（常量形态与 `_resolveMaxLines(record)` 行级求值（评审 6 P6）：函数形态 lineClamp（`(record)=>record.deep?3:1`）两条 record 各自按求值行数计高——内部列夹具经 prepareColumn 产出）**/link 条目 `min(render 计数, maxItems)`/**`treeIndents(colIndex, row)` 回调（评审 6 P8）：树形列 + 非树形多行列同表用例——inset 仅扣减树形列 contentWidth，非树形多行列按全宽折行（单参误扣的回归断言）** | 意见 5 + 人工 2 意见 2 模块级 + 03-review-5 问题 7 + 评审 6 P6/P8 |
| `demo/src/data/canvas-table/self-checks/tree.js`（新，测试） | 断言：DFS 展开序、层级数组、**hasChildren 平行数组**（父行 true/叶行 false）、孤儿挂根、环防护（A→B→A 不死循环）、expandedKeys 增删、**defaultExpandLevel 解析（0-based `level <= defaultExpandLevel`：0 → 收集 level 0 父节点 key、1 → level 0+1、-1 → 空集；签名含 `records/keyOf/parentKeyOf`（评审 6 P7），内部 BFS 计层不依赖 buildFlatRows 产物 levels（全收起时深层不可见）——孤儿/深层节点层级亦正确）** | 意见 1 模块级 + 03-review-5 问题 8 + 评审 6 P7 |
| `demo/src/data/canvas-table/self-checks/index.js`（改，测试） | **聚合注册 6 → 9 组**：import 并注册 `text-wrap`/`row-geometry`/`tree` 三组（index.js:15-29 现状仅 6 组——不注册则 runner 不执行，G1-a 判据与测试计划 #15 的"三组全绿"落空）；模块头注释（G 编号口径）同步 | 03-review-4 问题 6；自检入口 |
| `demo/src/data/canvas-table/self-checks/interactions.js`（改，测试） | **删除 dblclick 断言组并同步 import**：`:23` 的 `resolveCellDblclick` import 移除（模块 ESM 加载即失败点）、`:361-395` 断言组改为 `resolveCellClickOpen`/click 语义断言（表体可编辑格 openEditor、表头/列越界/cellEditable 缺省不开）；模块头注释"dblclick 门控"表述同步（:8）；新增：resolveTreeToggle（**hit.cellX 槽内判定（`cellX < levels[row]×16+16`）——槽外（cellX 超槽位）不 toggle、叶行槽内不 toggle**（评审 6 P3））、resolveCursor 三参 context（**树箭头槽 `pointer`（flatInfo.hasChildren + cellX 槽内）/ 叶行槽内 `default` / 可编辑格 `text`——context 缺省时维持现状返回（回归）**）、resolveItemClick（**hit.x/hit.y** (row,col) itemHits 反查 + 窗口外行不命中 + **dots `'...'` 条目同样命中**）、**hitTest 返回值含 x/y/cellX 断言（cellX 相对命中列内容区，固定列不含 scrollLeft 偏移、滚动区含——两态对照，评审 6 P3）**、**resolveResizeWidth 组合 resolveTypeMinWidth clamp 用例（`minWidth: resolveTypeMinWidth(col)` 时 text 列不可低于 80、bool 列 40、`col.minWidth` 显式值优先——评审 6 P2，接线链 = 壳 startResize 传参）** | 03-review-4 问题 1（blocker）+ 03-review-5 问题 12；意见 1/2a/4 + 评审 6 P2/P3 |
| `demo/src/data/canvas-table/self-checks/layout.js`（改，测试） | TYPE_DEFAULT_WIDTHS 断言：各类型缺省宽 + **最小宽**（**bool 未配 width/minWidth → 60 不被 80 抬高**、**无 type 列 → text 160/80**、`_fallback` 自定义类型 80/40）、`col.minWidth` 显式覆盖类型最小宽、**`col.minWidth: '80px'` 字符串形态解析为 80（评审 6 P5——clamp 复用 getPixelNumber 已解析值，NaN 回归断言：结果为 Number 且非 NaN）**、显式 width 优先、type.width（check/rec_no）优先于 TYPE_DEFAULT_WIDTHS 且保持定宽（**定宽分支 min 仍 `getPixelNumber(col.minWidth) ?? 0`**）、弹性均摊语义保留（宽容器未配 width 列 ≥ 默认宽、窄容器 = 默认宽）、**`resolveTypeMinWidth(col)` 断言（text 80 / bool 40 / 无 type 80 / `_fallback` 40 / col.minWidth 显式时不介入（壳组合优先级在壳侧）——评审 6 P2）**、**调宽 clamp 下限缺省 = 类型最小宽（col.minWidth 覆盖，经 resolveResizeWidth 组合断言在 interactions 组）**；rowGeometry 参数化的 computeViewRows/rowAt 断言（等高恒等 + 变高窗口 + **未传 rowGeometry 时 resolveRowGeometry 回退等高**——G2 中间态路径） | 意见 3（人工 2 意见 1）+ 03-review-4 问题 2 + 03-review-5 问题 1/3 + 评审 6 P2/P5 |
| `demo/src/data/canvas-table/self-checks/painter.js`（改，测试） | 变高行下 viewportRowY/行带 rect/**cellRectAt 高度 = heightAt(row)/单格脏区裁剪高**断言（注入 fake rowGeometry，03-review-5 问题 9）；itemHits 断言（**(row, col) 粒度**：滚动区 + 固定列双 pass 绘制后两区条目并存不互覆、**dots `'...'` 条目（字面三点，评审 6 P4 口径）在收集集合内**；**连续两次窗口滚动绘制后 Map 行集合 ⊆ 最新窗口**——窗口裁剪断言） | 意见 4/5；03-review-4 问题 9、03-review-5 问题 4/9 + 评审 6 P4 |
| `demo/src/data/canvas-table/self-checks/cell-painters.js`（改，测试） | THEME 夹具补 `bgStrong`/`controlHeight`/`textColorMuted`/`bgDisabled`/`colors`（固定 17 色形态 = 12 彩色 + 5 语义，gray 不入）；**canvas 类型分发断言：`type:'progress'`/`'button'` 列 resolveCellContent 产出 canvasKind（非 text）**（03-review-5 问题 6）；**LinkColumn compile 产物断言（评审 6 P1——link.js 共享文件改动的 DOM 版回归断言，模块级 import LinkColumn 直接断言 render 产物）：对象数组元素 → `item.text = caption`（非 `[object Object]`）+ `item.attrs.class` 含 `mu-link--{color}`；字符串数组/单值 → `{ caption: el }` 包裹行为不变；`linkOption.color` 落全部条目 class；条目级 color 覆盖 linkOption.color；`max` 超限 dots 条目 `item.text = '...'` 且 events.click 存在；danger/disabled 路径不变**；多行文本绘制断言（行数 × lineHeight 决定绘制调用次数——注入计数 measure 或 fillText 采样；**maxLines 钳制末行 '…'、数组值每元素一行 + 超过 maxItems 时第 maxItems 行 `'...'`（dots 字面三点）、DOM 风格 multiline+lineClamp 单 line-clamp item 改道 drawText**）；**函数形态 lineClamp 改道用例（评审 6 P6）：`lineClamp: (record)=>record.deep?3:1` 两条 record 的 drawText 行数分别 3/1（与 _resolveMaxLines 同源）**；**link 竖排断言（数组每条一行 + 对象元素 `mu-link--{color}` class 解析 colors 取色/danger/disabled 三态 + 超过 maxItems dots `'...'`）**；tag 颜色断言（`mu-tag--success` → colors.success 底色像素采样）；**TagColumn compile 产物断言（S1 实施期补记——共享文件表 tag.js 行〔对象条目原样保留修复〕的 DOM 版回归断言，镜像 LinkColumn compile 断言写法，cell-painters 组 27→28 条）**；progress 轨道/填充/文本断言；button/link disabled 用 textColorMuted/bgDisabled 断言；树箭头/缩进断言（hasChildren true/false 两态） | 意见 1/4/5 + 人工 2 意见 2/3；03-review-4 问题 5、03-review-5 问题 2/5/6 + 评审 6 P1/P4/P6 |
| `demo/src/data/canvas-table/self-checks/theme.js`（改，测试） | `bgStrong`/`controlHeight`/`textColorMuted`/`bgDisabled` 入 colorKeys/pxKeys 计数公式（**21 固定字段**）；`colors` 断言（**固定 17 色 = 12 彩色 + 5 语义，gray 不入 map**，每色 color+translucent 双形态，不传 colorNames 参数）；detail 文案同步（色名集合引 tag.scss:28-45 口径） | 前轮差距 #2 + 人工 2 意见 3；03-review-4 问题 4/5、03-review-5 问题 10 |
| `demo/src/data/canvas-table/self-checks/editor.js`（改，测试） | 前轮规整断言组保留（三形态 input、null 直通、enum number/string、显式 options、number 列 + editor.type:'select' + 显式 options 原样）+ 本轮 computeEditorStyle 内容区矩形断言（border/无边框两态的 left/top/width 与 A5.4 公式一致）；**switch 分支高度断言（editorH = controlHeight、bordered = false，03-review-5 问题 14）**；**textarea 分支断言（高度 = clamp(heightAt − 2padding, controlHeight, 10×lineHeight + 2padding)；开值数组 → join('\n')、提交 split('\n') 数组；link 对象数组开值取 caption；Ctrl+Enter 提交 / Enter 换行不提交 / Esc 取消）**；**link 列不在 NON_EDITABLE_TYPES 断言（editor.js:52 移除后）**；**新增固定列用例**（`i < fixedCount` 时 left 不减 scrollLeft——横向滚动 scrollLeft > 0 下两断言对照）；旧口径文案同步范围扩至 :363（03-review-3 问题 4，含 :8/:176/:375） | 前轮 + 意见 2c + 人工 2 意见 2；03-review-4 问题 11、03-review-5 问题 14 |
| `demo/src/data/canvas-table/main-view.vue`（改，测试夹具） | 前轮 check 列 disabled 夹具（id%10===0）保留；新增夹具：树数据页签（1 万节点平铺 key/parentKey + tree/treeProps/treeExpandedKeys + defaultExpandLevel 1 + **tree 开/关与 treeProps 切换控件**——watch 重建断言用 + **树形列长文本（maxLines）组合——树缩进行高 e2e**）、多行文本列（长文本字符串 + **`maxLines` 变体（3/10）** + **数组值字段（数字数组与字符串数组，不配 maxLines——验证数组值自动多行）** + **`maxItems` 变体（3）** + **DOM 风格 multiline+lineClamp 兼容列（含函数形态 lineClamp：`(record)=>record.deep?3:1`——评审 6 P6 e2e）**）、**link 列三态夹具（字符串数组 / 对象数组（含 color/danger/disabled）/ 单值数字）**、progress/button 列、彩色 tag 列（`tags` 数组各色，含记录级 `tag.color`）、link 多条 + danger + disabled；**全类型默认宽页签（全部列不配 width——含 bool 列与无 type 列）**；**固定列 + 非固定列 link/button 组合**（fixedLeftColumns ≥ 1 且 item 列分居两区——双 pass 命中 e2e 夹具）；**DOM 版参照段（main-view.vue:151-164 既有 DOM mu-table 并排段）加 link 对象数组 + color 列——DOM 版 link.js 改动的 e2e 回归（对象 caption 文本渲染 + `mu-link--{color}` class 落 DOM（getComputedStyle 色 = link.scss 色类），评审 6 P1）**；`window.__canvasTable` 调试句柄扩 `getTreeExpandedKeys`/flatRows 长度 | 意见 1/3/4/5 + 人工 2 意见 1/2/3 端到端夹具；03-review-4 问题 7/9/13、03-review-5 问题 1/5/7 + 评审 6 P1/P6 |
| `demo/src/data/canvas-table-editable/main-view.vue`（改，测试夹具） | 前轮夹具保留（数值 enum 列、stock `editor:{type:'input'}`、price clearable、「最近提交」typeof、`window.__canvasTableEditable` 解包句柄）；新增：单击编辑验证区（无 dblclick 依赖）、`editor.border` 开/关两列对照、hover 感知区、**textarea 编辑验证区（maxLines 列 + 数组值列 + link 数组列：开值 join、Ctrl+Enter 提交、数组提交 = 换行分割数组（事件日志展示 Array.isArray 与元素）、「最近提交」形态显示 string/array）** | 意见 2 + 人工 2 意见 2 端到端夹具 |

缺陷修复 R1（人工 3，实施基线 = 05-verify-2 PASS 后工作区现状；源文件 4 + demo 夹具 1 + 自检 2）：

| 文件 | 改动 | 原因 |
|------|------|------|
| `src/components/canvas-table/painter.js`（改） | ① `paintCellRange` 增第 5 参 `bandToX`（painter.js:272-313）：行背景 `fillRect` 宽度由 `x1 − x0`（所绘列区间，:285-290）改 `max(x1, bandToX ?? x1) − x0`；五个滚动区调用点（paint 整幅 :828、paintRowBand :693、paintColBand :726、paintCellRegion :758、paintResizeBand :797）传 `layout.stickyWidth`，`paintFixedArea` 内调用（:400）不传（固定 pass 带宽保持 [0, fixedWidth]，防固定 pass 行底色覆盖已绘滚动区内容——遮挡关系仍由分区顺序承担，A2.1）。② hover 编辑描边矩形（paintOverlay，:629-639）由贴格缘 `strokeRect(x + 0.5, y + 0.5, colWidth − 1, heightAt − 1)` 改为 `strokeRect` 于 `cellRectAt(layout, row, col)` 四周内缩 `EDITOR_GAP` 的矩形（import `EDITOR_GAP`，A5.3）；取色/绘制时机/hoverMode none 抑制不变 | 人工 3 意见 1（行背景未充满）+ 意见 2（描边位置与间距）；现状证据见「评审回应（人工 3）」 |
| `src/components/canvas-table/editor.js`（改） | 新导出 `export const EDITOR_GAP = 4`；`computeEditorStyle`（:347-400）重写：删 `inset = bordered ? padding − 1 : padding`（:391）、per-type `editorH` 分支（:380-388）与居中式 `top = ... + (rowH − overlayH) / 2`（:395），改 A5.4 统一公式（left/top = 格原点 + EDITOR_GAP、width/height = 格宽高 − 2×EDITOR_GAP，height 加 `max(…, 0)` 防退化配置负值）；`bordered` 判定（:365-367）与返回字段形状不变；`theme` 参数保留不再消费（头注标注）；`CONTROL_HEIGHT_FALLBACK`/`CELL_LINE_HEIGHT_FALLBACK`/`TEXTAREA_MAX_LINES` 常量随公式删除（`CELL_PADDING_FALLBACK` 若无他处消费一并清理） | 人工 3 意见 2；单一矩形口径 + hover/编辑同源 |
| `src/components/canvas-table/canvas-table.scss`（改） | `__editor > .mu-input`（:123-127）`padding: 0` 改 `padding: 0 0 0 calc(var(--cell-padding, 8px) - 5px)`（文本左缘 = 4 + 边框 1 + 3 = 8，A5.4）；`__editor--borderless > .mu-input`（:149-153）**删除自身 `padding: 0`**（保留 border-color/background 覆盖——否则同特异性后定义胜出清掉基础规则 padding-left，borderless 左缘退到格左 + 5）；`__editor > textarea.mu-input`（:132-144）`padding: 3px 10px` 改 `padding: calc(var(--cell-padding, 8px) - 5px)`（左缘与首行顶对齐 drawText，顺带修复现状 +10px 偏差）；width/height 100% 与 resize:none 等其余规则不变 | 人工 3 意见 2（4px 口径下约束 5 左缘一致的反算落地） |
| `src/components/canvas-table/canvas-table.vue`（改，[R1] 裁决补列——decisions.md [R1]） | textarea 分支模板（:48-54）删除内联 `style="padding-right: 0; padding-left: 0;"`（原 :52，整条 style 属性删除——该 style 仅含此二声明；模板其余零改动）：该内联为 R1 前稿「inset = padding−1」旧口径的配套残留（彼时左缘清零由模板内联承担），R1 修订将左缘补偿移入 scss 基础规则（上行 canvas-table.scss `calc(var(--cell-padding, 8px) - 5px)`）时遗漏清理——内联 style 优先级高于选择器，scss 左/右两向补偿被覆盖失效（padding-top/bottom 未被内联覆盖故垂直方向正确）。删除后 A5.4 textarea 四边 calc 口径完整生效（文本左缘/首行顶 = 格左/格顶 + padding） | 人工 3 意见 2（约束 5 textarea 左缘一致）的实施配套清理；实施期验证 #16② 实证内联覆盖致文本左缘格左 + 5 ≠ + 8，经 decisions.md [R1] 裁决授权补列（R1 改动清单遗漏项） |
| `demo/src/data/canvas-table/main-view.vue`（改，测试夹具） | `.ct-resize-handle` 样式（:1139-1148）：元素本体 `background: var(--mu-primary-color); opacity: 0.5` 移除（本体透明，16×16 命中区与 `cursor: nwse-resize` 不变），新增 `&::after { content: ''; position: absolute; inset: 0; background: var(--mu-primary-color); opacity: 0.5; clip-path: polygon(100% 0, 100% 100%, 0 100%) }` 右下三角（视觉三角形 = 直角在右下、斜边自右上至左下）；模板 :47-50 与 `onStageResizeStart`（:845）零改动；另按测试计划 #16 增"窄列"夹具场景（3–4 列显式定宽、ΣcolWidths ≈ 60% 容器宽、striped 开——行背景充满断言的 e2e 载体） | 人工 3 意见 3（grip 形状）+ 意见 1（e2e 夹具） |
| `demo/src/data/canvas-table/self-checks/painter.js`（改，测试） | 新增断言组"行背景带宽度"：手织 layout（colWidths 合计 < stickyWidth）整幅 draw 后 (a) x ∈ (Σ, W−2) 采样——斑马行 = bgStripe、普通行 = bgNormal、选中行 = selectBg 原色（透明画布）；(b) hover 行带同区域 = blend(hoverBg, 行底色)；(c) 行横带脏区（hover 进出）重绘后同采样保持；(d) 固定列场景（fixedCount ≥ 1 + Σ < W）整幅后滚动区列文本像素仍在（固定 pass 不扩带回归）；(e) Σ > W 场景（既有夹具）采样 W−1 处为行底色（画布裁剪，不越界）。既有"hover 编辑感知"组（:723-750）采样点改 `cellRect.x + EDITOR_GAP`（描边 1px 位置）并补描边外缘距格缘 = 4 断言 | 人工 3 意见 1/2 模块级 |
| `demo/src/data/canvas-table/self-checks/editor.js`（改，测试） | `computeEditorStyle` 断言组（:416-501）按 A5.4 新公式重写：`EDITOR_GAP` 导出值 = 4；input/switch/textarea 三类型同矩形（left = colLefts + 4、top = 行视口 y + 4、width = colWidths − 8、height = heightAt − 8）；border/borderless 两态矩形相同（bordered 标记差异）；固定列对照（i < fixedCount 不减 scrollLeft）保持；变高行（fake rowGeometry）height = heightAt − 8；`theme: undefined` 与传入 theme 矩形相等（theme 不再消费）；删 clamp 上限/居中差/`[7, 34]` 回退等旧口径断言（:429-:493 内涉及项） | 人工 3 意见 2 模块级 |

共享文件改动（评审 6 P1 新增 + S1 补记 tag.js，见上方"共享文件（3）"表）：`src/components/table/column-types/link.js`、`src/styles/link.scss`、`src/components/table/column-types/tag.js`——**其余** table/ 与 form/ 文件零触碰（link.js/tag.js 为 canvas 侧 render 管线的数据源，改动为对象条目修复 + 可选 color class 的纯增量，兼容策略与回归断言见共享文件表与风险表）；`src/components/index.js`、`demo/src/catalog.js` 零改动（组件与 demo 页均已注册）。R1 增量不触碰任何共享文件。

文档三处同步（skills/docs/docs-site）不列入本流水线（项目规约需用户确认，范围边界 #15）。

## 接口 / 数据结构

以下 A1–A8 为目标态完整规格。【现状·已验证】= 现实现保持不变（前序 05-verify-2 PASS，本设计写作时已复核关键源码）；【本期改动】= 本期增量。

### A1. 组件 API（props / events / 方法 / 插槽）与现有 table 逐项对照

组件：`MuCanvasTable` / `<mu-canvas-table>`。

#### props 对照（canvas-table.vue:92-116 现状 + 本期新增）

| prop | 类型/默认 | 与现有 table 对照 |
|------|----------|------------------|
| `keyField` | `String` | 相同；树模式下同时是树节点 key 的缺省字段（见 `treeProps.key`） |
| `records` | `Array, () => []` | 相同；引用变化 → 滚动复位 + relayout + 整幅重绘（canvas-table.vue:790）。树模式下为**平铺数组**（每行含 key/parentKey 字段值，A2.4） |
| `columns` | `Array, () => []` | 字段沿用 + `editable`/`resizable`/`editor`/`maxLines`/`maxItems`（本期新字段）/新类型（A3）；引用变化 → 清空 widthOverrides + 列准备 + relayout |
| `selectedRecord` | `Object` | 相同 |
| `selectedRecordKey` | `[String, Number]` | 相同 |
| `headerChecked` | `Object` | 相同（check 列表头 ✓ 受控状态） |
| `orderBy` | `String` | 相同；树模式下排序图标照常受控展示，排序语义父级自理（平铺重排与树 DFS 序的关系由父级处理，A2.4） |
| `recordsOffset` | `Number, 0` | 相同（rec_no 起始序号） |
| `fixedLeftColumns` | `Number` | 语义相同；实现为 canvas 固定区整高不透明重绘（非 sticky） |
| `gridlines` | `'none'｜'all'｜'row'｜'column'`，默认 `all` | 相同 |
| `hoverMode` | `'none'｜'row'｜'column'｜'cross'｜'cell'`，默认 `row` | 相同；hover 感知描边在 `none` 时不绘制（用户显式关 hover） |
| `striped` | `Boolean` | 相同 |
| `placeholder` | `String` | 相同 |
| `emptyText` | `String, ''` | **canvas-table 新增**（现有 table 无空态节点）；优先级 `empty` 插槽 > `emptyText` |
| `recordsVersion` | `Number, 0` | **新增**：异步就地修改 records 的整幅重绘通知通道 |
| `editable` | `Boolean, false` | **新增**：表格级可编辑总开关 |
| `resizable` | `Boolean, false` | **新增**：表格级列宽拖拽总开关 |
| `tree` | `Boolean, false` | **【本期】新增**（意见 1）：树模式开关。开启后组件按 key/parentKey 构建 DFS 展开序平铺（A2.4）；关闭时 records 原序即行序（现状） |
| `treeProps` | `Object` | **【本期】新增**：树字段名配置 `{ key, parentKey }`，缺省 `{ key: props.keyField ?? 'id', parentKey: 'parentId' }`——字段可配置模式对齐 tree 组件 `props` 配置（tree.vue:26、default-options.js:1-10 `DEFAULT_DATA_PROPS.key='id'`）；树模式下 `key` 字段值必须可标识节点（同值多节点行为未定义） |
| `treeExpandedKeys` | `Array` | **【本期】新增**：展开节点 key 受控态（宽松受控，同 `headerChecked` 模式）：点击箭头 → 内部 Set 更新 + `emit('update:tree-expanded-keys', [...keys])`；本 prop 引用变化 → 覆盖内部 Set → 重建平铺 |
| `defaultExpandLevel` | `Number, 0` | **【本期】新增**：初始展开层级，仅首布局前解析一次。**展开判定 = 节点层级 `level <= defaultExpandLevel`（0-based：根 = 0）——对齐 tree 组件 `autoExpandLevel`（tree.vue:3 根 `:level="0"`、tree-node.vue:100-106 `props.level <= level` 且 `expandLevel ?? -1`）**。缺省 0 = 展开根层级（显示一级子节点）；-1 = 全收起。03-review-5 问题 8 修正（A1 旧表述"0 = 全收起"废止） |

#### events 对照（canvas-table.vue:118-127 现状 + 本期新增）

| event | payload | 与现有 table 对照 |
|-------|---------|------------------|
| `header-click` | `column` | 相同语义：除 check ✓ 表头外所有表头点击均发 |
| `cell-click` | `{ record, recordIndex, column }` | 相同；**【本期】树模式下 recordIndex 为平铺序行号**；条目（link/tag/button）命中时本事件照发（DOM 版 a/span 点击冒泡 td 的对齐） |
| `update:header-checked` | `(column, value)` | 相同 |
| `update:cell-value` | `{ record, recordIndex, column, value }` | 语义扩展：check 翻转与编辑器提交共用；**value 经 A5.5 规整层后发出**（number/currency → number 或 null（非数值串保留交 validate）；数值 enum → number；**textarea 数组原值 → 换行分割的字符串数组**） |
| `update:selected-record` | `record` | 相同 |
| `update:selected-record-key` | `key` | 相同 |
| `update:order-by` | `String`（`'field:asc'｜'field:desc'｜''`） | **canvas-table 新增**：三态循环计算下一状态 emit |
| `column-resize` | `{ column, width }` | **新增**：列宽拖拽结束时发 |
| `update:tree-expanded-keys` | `Array<String\|Number>` | **【本期】新增**（意见 1）：点击箭头展开/收起后发（新的完整 keys 数组） |
| `cell-item-click` | `{ record, column, link }` / `{ record, column, tag }` / `{ record, column, button }` + canvas 附加 `recordIndex` | **DOM 版 table 已有（table.vue:90），canvas 版本期补齐**（03-review-4 问题 3）：DOM 版 link 列发 `{ record, column, link }`（link.js:59-60）、tag 列发 `{ record, column, tag }`（tag.js:59-60，docs-site/components/table.md:220 记载 `{ record, column, link/tag }`）。canvas 版 payload **键名对齐 DOM 版**（`link`/`tag`/`button`，button 为 canvas 新列型的对应键），附加 `recordIndex`（canvas 平铺行号，DOM 版无——附加键不破坏既有处理器迁移）；**`link`/`tag` 值的形态（评审 6 P1/P4）：常规条目 = render 时的条目对象（link 对象数组元素即 `{ caption, color, danger, disabled }` 原对象——DOM 版 events.click 回传 render 内 link 变量（link.js:60），canvas 对齐回传条目对象）；dots 超限条目 = `'...'`（三点 ASCII 字面值，DOM link.js:47 `item.text = link = '...'` / tag.js:46 同款赋值）**；命中范围与 DOM 版一致：link/tag/button 条目点击均发（tag 点击与 DOM 版对齐）；**超限 `'...'` 省略条目（dots）同样命中发事件，payload 值为 `'...'`**——DOM 版 `events.click` 绑定在 dots/常规条目的 if/else 分支之后、对全部条目生效（link.js:46-47 `item.text = link = '...'` 后 :59-60 统一绑定；tag.js:46-47/:59-60 同款；table-row.vue:18 `v-on="item.events"` 全量绑定），03-review-5 问题 4 修正 + 评审 6 P4 字符统一（**条目级 dots 全文统一 `'...'`；文本视觉省略 `'…'` 为另一字符类，见 A3.5**）；disabled 条目不发（link disabled 现状语义，DOM 版 disabled 链接仍绑定 click 但 attrs.disabled——canvas 侧对齐"不发"以避免误触，与 DOM 版的该处差异列入 A8 #12 注）。前序范围边界 #3「仅呈现」由意见 4 升级废止 |

#### 方法（defineExpose，canvas-table.vue:779-785 现状 + 本期新增；现有 table 无方法）

| 方法 | 说明 |
|------|------|
| `scrollToRecord(keyOrIndex)` | 滚动到指定记录（keyField 值或行号）；**【本期】变高模式下 top 取 `rowGeometry.topAt(row)`**，树模式下 key 查找在平铺行数组内 |
| `refreshTheme()` | 手动重读 `--mu-*` 快照 → relayout → 整幅重绘 |
| `getLayoutInfo()` | 只读布局快照 `{ colWidths, contentWidth, contentHeight, rowHeight, headHeight, viewRows, rowGeometryMode, lastPaint }`——**【本期】增 `rowGeometryMode: 'uniform'｜'variable'`**；`lastPaint.rowCount ≤ 窗口行数上界` 的外部断言来源不变（等高模式上界 `ceil(视口高/行高) + OVERSCAN + 1`；变高模式上界 = 窗口计算产出的 `viewRows.count`，自检按 mode 分别断言） |
| `getThemeSnapshot()` | 当前主题快照（本期起 **21 固定字段** + `colors` 固定 17 色 map，A6.1） |
| `getCellRect(row, col)` | 单元格在页面坐标系中的矩形；**【本期】height 取 `heightAt(row)`** |
| `expandAll()` | **【本期】新增**（意见 1）：展开全部节点（等价展开集 = 全部有子节点 key） |
| `collapseAll()` | **【本期】新增**：清空展开集 |
| `getTreeExpandedKeys()` | **【本期】新增**：当前展开 key 数组（调试/受控回读） |

#### 插槽

| 插槽 | 说明 |
|------|------|
| `empty` | 空态自定义内容；优先级 `empty` 插槽 > `emptyText` > 默认空态 |

单元格级插槽策略：**不提供**（与 kaka canvas 路线、现有 table 一致）。自定义渲染经列类型体系（A3）。

### A2. 渲染架构与虚拟滚动

#### A2.1 DOM 骨架与分区绘制【现状·已验证】

```
div.mu-canvas-table                    ← 根：外框/圆角（scss）
  div.mu-canvas-table__scroll          ← 原生滚动容器（overflow:auto + v-mu-scrollbar）
    div.mu-scrollbar__tracks           ← v-mu-scrollbar 注入（0 尺寸 sticky，不参与滚动几何）
    div.mu-canvas-table__sticky        ← 双轴 sticky 钉视口；指针事件全绑此层
      canvas.mu-canvas-table__canvas     尺寸 = 容器 clientWidth/Height
      div.mu-canvas-table__overlay     ← 编辑浮层/空态/阴影条
    div.mu-canvas-table__spacer        ← 撑出滚动范围（width = max(列总宽, 容器宽)；
                                          height = max(0, totalHeight + headH − 视口高)）
```

单 canvas 分区绘制顺序（后区不透明覆盖前区）：1 表体滚动区 → 2 网格线 → 3 固定左列区 → 4 表头区 → 5 覆盖层。DPR 标准直乘。滚轮/触控板/键盘/拖滚动条全走原生滚动。**本期不变**；变高行只改各行 y/height 的取值来源（经行几何接口）。

**行背景带宽度口径（R1，人工 3 意见 1）**：行背景（普通/斑马 `rowBackground`、选中，及覆盖层 hover 行带的合成底）在分区 1 的绘制带右缘（视口坐标系）：

```
bandRight = max(所绘列区间右缘 x1, bandToX ?? x1)      // paintCellRange 第 5 参 bandToX
  · 滚动区 pass（整幅/行横带/列竖带/单格/调宽竖带）：bandToX = layout.stickyWidth（= 容器 clientWidth）
  · 固定列 pass（paintFixedArea 内 paintCellRange 调用）：bandToX 不传（带 = 固定列区间 [0, fixedWidth]）
推导：
  · ΣcolWidths < viewport（全部列定宽且未填满）：x1 = Σ − scrollLeft = Σ → bandRight = stickyWidth，
    行背景充满至视口右缘（修复点）；
  · ΣcolWidths ≥ viewport（横向滚动）：x1 ≥ stickyWidth（末可视列右缘已越视口）→ bandRight = x1，
    fillRect 超出画布部分被自然裁剪 → 实际绘制恒 ≤ 视口右缘，不超真实内容宽；
  · 固定列遮挡：分区 3 在分区 1 之后整高不透明重绘（painter.js:396-400），固定 pass 不扩带，
    滚动区带虽可延伸至全宽含固定区下方，最终视觉由分区顺序保证固定列内容在上——遮挡关系不变。
与网格线口径一致：行线本就全宽（paintGridlines 行线 fillRect(0, y, W, 1)，maxWidth = stickyWidth，
painter.js:371-374），列线止于真实列缘（不变）；表头底色/底边框本就整宽（paintHeader fillRect(0,0,W,headH)）。
y-scrolled 相关整行带：表头/底部投影条为 DOM 元素 `__header-shadow`/`__bottom-shadow`（width:100%，
canvas-table.scss:60-79）本就全宽，无需改动；滚动/hover 触发的行横带脏区重绘（paintRowBand，clip 全宽 +
erase 后重走分区 1）经同一 paintCellRange 修复自动覆盖。hover 行带（paintOverlay fillRect(0, y, W, h)）
本就全宽，修复后其下方分区 1 行底色亦全宽——半透明 hoverBg（--mu-gray-translucent）在任意 x 合成起点一致。

**绘制状态对象（paintState，组件壳组装传入 painter——canvas-table.vue:203-221 现状契约）本期扩展字段**（03-review-5 问题 13）：`displayRows`（树开 = 平铺行数组 / 树关 = records 原序——painter/interactions/editor 全消费方经此取行，取代直接读 records）、`flatInfo: { levels, hasChildren }`（树关 = null；hasChildren 为树形列绘制与 resolveTreeToggle/resolveCursor 的判定来源）、`expandedKeys`、`tree`、`isCellEditableFn` + `editable`（hover 编辑描边）、`measure` + `wrapCache`（多行折行注入）。

#### A2.2 行几何策略（意见 5 核心：等高/变高双模式）

**模式判定**（数据 + 列双输入，只升不降）：`columns.some(col => col.maxLines > 1 || (col.multiline && col.lineClamp != null))`（文本呈现列配置 `maxLines > 1` 常量，或 DOM 风格 `multiline + lineClamp`（常量/函数形态均算——函数形态无法在准备期得具体值，配置存在即入候选，行级真值经 `col._resolveMaxLines(record)` 求值，评审 6 P6），A3.5）**或估高扫描发现数组值**（`computeRowHeights` 返回 `hasArrayValues`——任一文本呈现列的 value 为数组，或 link 条目列 render 条目数 > 1，**无需显式标记**，意见 5"数组直接渲染成多行"无条件生效）→ **variable**；否则 **uniform**（现状路径，O(1) 算式，零额外成本——绝大多数场景不变慢）。估高扫描在任何 records/columns 准备期运行，先于几何创建，故初始判定即正确；**后续变更引入首个数组值**（就地改/编辑提交/recordsVersion 重估该行时发现）→ 该行重估发现值形态 string→array → 升级 variable 模式（全量快速重估 + rebuild + 锚定）。**模式只升不降**（与行高单调性同理，避免 uniform/variable 抖动），本期不回降。

**文本测量注入**（03-review-4 问题 8）：`measure(text, font)` 由组件壳经 theme.js 新导出 `createTextMeasurer()` 创建（离屏 canvas 2d ctx + `createMeasureCache` 缓存包装，theme.js:136-151 现有工厂），单实例注入：row-geometry 的 `computeRowHeights`/`ensureRowMeasured`、painter state（→ cell-painters drawText）。行高计算与绘制折行用**同一 wrapLines + 同一 wrapCache**，行数结果单一事实源（高度与绘制必然一致）。text-wrap.js 自身零 canvas 依赖（measure 为参数，自检注入计数包装）。

**统一接口**（`row-geometry.js`，painter/layout/interactions/editor 全部经此取行坐标，不感知模式）：

```js
// createUniformRowGeometry({ rowHeight, rowCount })   —— topAt(i)=i×h、offsetToRow=floor(y/h)、
//    visibleRange 与现状 computeViewRows 算式（layout.js:139-146）恒等
// createVariableRowGeometry({ initialHeights })       —— Float64Array + Fenwick 树
{
  mode, rowCount,
  heightAt(i), topAt(i), bottomAt(i),       // 行顶/底（内容坐标系，不含表头）
  totalHeight,                              // 全部行高之和
  offsetToRow(contentY),                    // 内容 y → 命中行号
  visibleRange(scrollTop, viewH, overscan), // → { start, end }（end 排他；变高模式从
                                            //   offsetToRow(scrollTop) 起累加 heightAt
                                            //   至覆盖 viewH，两侧各扩 overscan）
  updateHeight(i, h),                       // 仅 variable：写 heights + Fenwick add(Δ)，返回 Δ
  rebuild(heights)                          // 行集合变化（records 替换/树展开收起/调宽失效）后整体重建 O(n)
}
```

**行高的来源：主动计算而非被动测量**（canvas 与 DOM 表格的本质差异）：DOM 表格（stk autoRowHeight）渲染后量 `tr.offsetHeight` 回填；canvas 行高是纯函数 `heightAt = f(record, columns, colWidths, theme)`，可估可算可缓存。行高公式（A3.5）：

```
rowHeight(row) = max(--row-height,  --cell-padding×2 + lines(row) × --cell-line-height)
lines(row)     = max over 多行候选列（contentWidth 按列扣树形列 inset：inset 来源 =
                 treeIndents(colIndex, row) 回调（评审 6 P8：签名带列号——仅树形列返回
                 16×level + 16，其余列返回 0，非树形多行列不误扣），A2.4）：
                 文本呈现列（text/enum/date/datetime/number/currency/bool/无 type/自定义 text 输出，不含 link）：
                   value 数组 → min(value.length, _maxItems)（真值，不测量——数组元素即行；
                                超限时第 _maxItems 行为 '...'，行数不变，意见 5「按行数计算高度」）
                   字符串 + _resolveMaxLines(record) > 1 → estimateLineCount 短路（len × fontSize ≤ contentWidth → 1，不测量）
                                → 否则精算 wrapLines(text, font, contentWidth, maxLines = _resolveMaxLines(record)).lineCount
                                  （折行 + maxLines 钳制一体，measureText 按需；maxLines 行级求值，评审 6 P6）
                   字符串 + _resolveMaxLines(record) == 1 → 1（单行省略，不参与变高）
                 link 条目列 → 条目数 = render 求值 items 计数后 min(count, _maxItems)（含 dots 行合并，
                                真值——数组竖排每条一行；单值 = 1 行，A3.3/A3.5）
无多行候选列（uniform 模式）→ 恒 --row-height
```

**估高 + 按需精算管线**：

1. **数据/列准备期全量快速估高**（O(n) 纯算术，无 measureText）：数组值列（min(length, maxItems)）、link 条目列（render 求值为轻量数组构造，与绘制期同款调用，min(count, maxItems)）与短路单行列得真值；长文本列估 1 行（下界）并标记待精。10 万行纯算术估算约 1ms 级，可接受。本遍同时产出 `hasArrayValues`（模式判定输入，上文）。
2. **进窗精算**：每帧可视窗口 ±OVERSCAN 行逐行 `ensureRowMeasured`——待精行经 `wrapLines` 得精确行数（全宽 `measureText` 下界 == 1 则免折行；多行候选才逐词折行；maxLines 钳制在 wrapLines 内完成）→ `updateHeight`。
3. **单调性**：估值 = 1 行下界，精算 ≥ 估值 → 行高只增不减 → totalHeight/spacer 单调增长，无回缩抖动。未访问区域保持估值 → 滚动条随滚动微增长（渐进精算固有行为，stk autoRowHeight 同款；列入已知行为，测试计划 #15 断言"滚动条不回缩"）。
4. **滚动锚定**（scroll anchoring）：精算回填导致锚行（当前视口首行 `offsetToRow(scrollTop)`）上方总高变化 Δ 时，`scrollTop += Δ` 同步补偿（在布局更新批次内一次写入，视口内容视觉不动）。DOM 原生 scroll anchoring 不适用于 spacer 模式（内容在 canvas，无 DOM 流），必须手动。
5. **折行/行数缓存**：`createWrapCache`（key = text+font+width+maxLines，上限 2000 整体清空）；measureText 经现有 `createMeasureCache`（painter.js:74-87）。滚动重复经过同一批行零重算。

**数据变更契约**（无 deep watch，现状扩展）：① 同步就地改 → nextTick 重绘该行（若该行行高受影响——多行列编辑——精算 + updateHeight + 锚定；**该行值形态变数组且当前 uniform → 触发模式升级 variable**，见上）；② `recordsVersion` 递增 → 整幅（多行列值变化时行集合高度重估——渐进，只重估窗口；重估发现数组值同理触发升级）；③ 引用替换 → 滚动复位 + 全量重估 + rebuild；④ 树展开/收起 → 见 A2.4；⑤ **行高失效维度全集（03-review-5 问题 15 扩容）**：调宽 up / 容器 resize / 列显隐 / **主题·字号·行高变量刷新（themeWatcher onChange/refresh——快照 font/lineHeight 变化）** → 多行列 contentWidth 或 font 变 → 行高按列宽/字体维度整体失效（wrap 缓存 key 含 width/font 自动失效）→ 全量快速重估 + rebuild + 窗口重精算 + 锚定（契约接入点 = theme.js onChange 链与组件壳 relayout 前，改动清单 theme.js/canvas-table.vue 行）。

#### A2.3 变高索引选型：Fenwick 树（对比分段树与朴素前缀和数组）

变高模式需要的原语操作与频次（n = 行数，滚动稳态）：

| 操作 | 频次 | 说明 |
|------|------|------|
| `topAt(i)` 前缀和 | 每帧每可见行 1 次（绘制）/ 每帧常数次（窗口、锚定） | 高频读 |
| `offsetToRow(y)` 定位 | 每帧 1–2 次（滚动窗口起点、锚行） | 高频读 |
| `updateHeight(i, Δ)` 单点更新 | 每帧 0–20 次（进窗精算回填） | 中频写 |
| `rebuild(heights)` 重建 | 行集合变化时（records 替换/树 toggle/调宽失效）O(n) | 低频，与平铺重建同级成本 |

三方案对比：

| 方案 | 构建 | 单点更新 | 前缀和 | 偏移定位 | 代码量 | 评价 |
|------|------|---------|--------|---------|--------|------|
| **Fenwick 树（BIT，Float64Array）** | O(n) | O(log n) | O(log n) | O(log n)（树上倍增下降） | ~60 行 | **选定**。stk 实证（useVirtualScroll.ts:788-820 变高行窗口 + utils/rowHeightFenwickTree.ts:1-74），变高场景全部原语覆盖，实现最小且有成熟参考；不支持原位插入/删除——本场景行集合变化本就重建平铺数组，rebuild O(n) 顺带完成，无损失 |
| 分段树 | O(n) | O(log n) | O(log n) | O(log n)（节点 sum 下降） | ~120 行（2n 数组） | 拒绝（被拒绝备选 #7）：区间聚合能力（min/max/懒标记）本场景不需要；代码量 2 倍无对应收益 |
| 朴素前缀和数组 | O(n) | **O(n)**（后缀重算） | O(1) | O(log n)（二分） | ~15 行 | 拒绝（被拒绝备选 #8）：读最快，但滚动稳态每帧最多数十次 O(n) 单点更新（10 万行 → 每帧数十万次 Float64Array 写，可与帧预算争用）；查询 O(1) 优势在每帧常数次查询下无意义 |

**结论：Fenwick。** 写路径 O(log n) 对进窗精算回填是稳态保障；读路径 O(log n) × 每帧几十次在 10 万行下 ≈ 数百次浮点运算，可忽略；实现小、有 stk 双文件实证可对照移植（剥离 TS 与 Vue 2.7 结构）。

#### A2.4 树模式（意见 1）：数据、展开与虚拟滚动联动

**数据契约**：`records` 为平铺数组，每行含树 key 字段值与 parentKey 字段值（字段名 `treeProps.key ?? keyField ?? 'id'`、`treeProps.parentKey ?? 'parentId'`——参考 tree 组件字段可配置模式，tree.vue:23-40 `props: Object` 合并 `DEFAULT_DATA_PROPS`，default-options.js:1-10）。示例：

```js
<mu-canvas-table :records="flatRows" tree :tree-props="{ key: 'id', parentKey: 'pid' }"
                 :tree-expanded-keys="expanded" @update:tree-expanded-keys="v => expanded = v" />
// flatRows = [{ id: 1, pid: null }, { id: 11, pid: 1 }, { id: 111, pid: 11 }, ...]
```

**构建**（`tree.js` 纯函数，迭代实现）：

1. `buildChildrenIndex`：一次遍历建 `Map<parentKey, row[]>`（同父按 records 出现序）+ `hasChildren: Set<key>`，O(n)。
2. `buildFlatRows(records, { keyOf, parentKeyOf, expandedKeys, childrenIndex })`：从根集（parentKey 为 null/undefined/空串，或父 key 不在集合中的孤儿——容错挂根）出发**迭代 DFS**（显式栈，10 万节点不爆栈；visited Set 防环——脏数据 A→B→A 不死循环）；仅展开节点递归子级。产出 `{ rows（展开序 record 数组）, levels（平行层级数组）, parentKeys, hasChildren（平行布尔数组） }`——**hasChildren 为树形列绘制（父行箭头/叶行空槽）、`resolveTreeToggle` 与 `resolveCursor` 的判定来源**（03-review-4 问题 10），消费方免 O(n) 反查。
3. 组件内 `displayRows`：树关 = records 原序（现状零成本）；树开 = buildFlatRows 产物。**painter/interactions/editor 全部消费 displayRows**（树行即普通行，绘制/编辑/hover/选中/固定列/网格线全沿用）。

**展开态与 watch 契约**（03-review-4 问题 13 + 03-review-5 问题 8 + 评审 6 P7）：组件内 `Set`；点击箭头 → toggle → emit `update:tree-expanded-keys` → 重建；`treeExpandedKeys` prop 引用变化覆盖内部 Set → 重建平铺（入 watch 表）；`defaultExpandLevel` 首布局前经 `resolveInitialExpandedKeys` 解析——**展开判定 = 节点层级 `level <= defaultExpandLevel`（0-based：根 = 0），收集满足判定的有子节点 key；**level 来源 = 函数内部从根集迭代 BFS 计层（签名含 records/keyOf/parentKeyOf/childrenIndex——buildFlatRows 的 levels 是展开序产物且全收起时深层不可见，不能作为输入，评审 6 P7）**；缺省 0 = 展开根层级，-1 = 全收起**（对齐 tree 组件 `autoExpandLevel`：tree.vue:3 根 `:level="0"`、tree-node.vue:100-106 `props.level <= level`、`expandLevel ?? -1`——A1/A2.4/self-checks/test #11 同一口径）。**`tree` prop 切换**（开/关）→ displayRows 切换 records 原序/平铺 + 几何 rebuild + spacer 同步 + 锚定 + 整幅重绘（关闭→开启时展开集保留，首开按 defaultExpandLevel 解析）；**`treeProps` 引用变化** → key/parentKey 字段名变化使既有展开集语义失效 → 清空展开集 + defaultExpandLevel 重解析 → childrenIndex/displayRows 全链重建（同上链）。三 prop 均入组件 watch 重绘表（现状 records/columns/recordsVersion 同款）。

**树形列绘制**：树开时缺省首个数据列为树形列，列定义 `treeNode: true` 显式指定。内容区前置缩进 `level × 16px`（镜像 tree.scss:3 `--mu-tree_node-indent: 16px`；该变量定义于 `.mu-tree` 作用域，组件探针不可达，取常量 16）+ 16px 箭头槽：父行画箭头（收起 ▸ / 展开 ▾，canvas path 三角 12px，`--mu-text-color-normal`，hover 主色），叶行画空槽——同级文本左缘恒对齐。箭头槽 hover cursor `pointer`。

**展开/收起与虚拟滚动联动**（意见 1 与意见 5 的交互，用户点名设计）：

```
点击箭头 → toggle 内部 Set → emit update:tree-expanded-keys
  → buildFlatRows 重建 displayRows（O(n)；行高缓存按 record 引用为键，未变行复用）
  → 行几何 rebuild（估高 O(n) 纯算术，已精算行经 record 引用缓存保留真值）
  → totalHeight 变化 → spacer 同步
  → 滚动锚定：锚行 = 收起/展开子树的父行（或原视口首行仍在平铺中的最近祖先），
     Δ = 新 topAt(锚行) − 旧 topAt(锚行)，scrollTop += Δ（展开子树在视口上方时正补偿，
     视口下方/视口内时不影响上方几何 Δ=0）；收起导致 contentHeight 缩到 scrollTop + viewH 以下时 clamp
  → editor.commit()（行号语义失效，先提交——commit 幂等）
  → 整幅重绘
```

- hover/选中跨重建保持：按 record key 在新平铺中重定位行号（`findRowByKey` 现状逻辑在 displayRows 上运行）。
- 树 + 多行列组合：树行高走同一估高/精算管线（flatRows 即 records 输入）；**树形列内容宽扣减 inset（`contentWidth = 列宽 − (16 × level + 16)`，经 `treeIndents(colIndex, row)` 回调传入 `computeRowHeights`/`ensureRowMeasured`——回调按列返回（仅树形列非 0），树形列自身与多行列同列时折行按扣减后宽度计算，非树形多行列不受影响，03-review-5 问题 7 + 评审 6 P8）**；树展开引入的行以缓存/估值进入几何，锚定同款。
- 树模式下排序：`orderBy` 图标照常（受控展示）；排序点击 emit 不变；**平铺数组重排会改变 DFS 序的输入序（兄弟顺序），树结构本身不受影响**——父级排序时应保持同父兄弟连续或接受 DFS 按新出现序。文档注明，不拦截。
- 树 + check 列父子级联勾选：范围外（范围边界 #7 之注）。
- 树懒加载子节点（异步展开）：范围外（kaka lazyLoading / stk treeLoading 机制不移植，范围边界 #17）。

#### A2.5 禁止一次绘制全部行的保证机制【现状·已验证，口径扩展】

painter `draw`/`drawRegion` 返回统计 `{ rowStart, rowEnd, rowCount, colStart, colEnd, elapsed }`（painter.js:694-697 为 `draw` 返回 `paint()` 统计；库内无 rowCount 比较或 throw），`getLayoutInfo().lastPaint` 与 demo 调试面板外露。**`lastPaint` = 最近一次绘制调用（整幅或脏区）的统计**——脏区绘制（hover 带/单格/行带）的 rowCount 为脏区行数，不满足窗口上界口径（03-review-5 问题 11）。外部断言口径 = **最近一次整幅绘制**：断言前先触发整幅重绘（`recordsVersion++` 或 `refreshTheme()`）再读取。uniform 模式 `rowCount ≤ ceil(视口高/行高) + OVERSCAN + 1`（+1 = scrollTop 非行对齐上缘跨行，layout.js:139-146 floor/ceil 组合）；variable 模式 `rowCount == rowGeometry.visibleRange(...).count`（窗口由几何接口产出，lastPaint 记录该次整幅实际绘制范围）。库内不抛错（组件库生产环境不宜因断言崩溃，理由见被拒绝备选 #6）。

### A3. 列定义结构

#### A3.1 完整列定义（现状 + 本期新增字段）

```js
{
  field: 'price', caption: '单价',
  type: 'currency',                 // 12 内置类型 + 本期 'progress' | 'button'（仅 canvas-table，
                                    //   见 A3.3）；对象/函数 = 自定义类型；无 type = TextColumn
  width: 110, minWidth: 40, maxWidth: 400,   // number | '50px'；未配 width 时取 TYPE_DEFAULT_WIDTHS[type].width
                                    //   作弹性列初始宽、.minWidth 作最小宽基线（col.minWidth 覆盖，A3.2）
  align: 'right', sortable: true,            // 沿用
  text: (record) => ..., value: (record) => ...,   // 沿用；value/字段值支持 文本 | 数字 | 数组
                                                    //   （数组 = 多行/多条，人工 2 意见 2，A3.5）

  maxLines: 3,                      // 【本期】定义多行（Number，1–10，缺省 1 = 单行省略）：
                                    //   字符串值自动换行，行数超 maxLines 时末行收缩显示 '…'
                                    //   （人工 2 意见 2；DOM 风格 multiline+lineClamp 配置等效映射：
                                    //   经 _resolveMaxLines(record) 行级求值（lineClamp 支持
                                    //   n | (record)=>n，函数形态按 record 取值，A3.5），评审 6 P6）
  maxItems: 5,                      // 【本期】数组最多显示个数（Number，1–10，缺省 10）：
                                    //   超出时第 maxItems 项/行显示 '...'（三点，DOM dots 字面值）
  treeNode: true,                   // 【本期】树形列标记（树开时缺省首个数据列，可显式指定）

  editable: true,                   // canvas-table 新增（沿用）：列级只读控制（本期起 link 列亦可编辑）
  resizable: false,                 // 沿用：列级禁用调宽
  editor: true | {                  // 沿用 + 本期字段：
    type: 'input'|'select'|'date'|'switch'|'textarea',  // 缺省按列类型/开值形态映射（A5.5）；
                                    //   text/link 列开值为数组或 maxLines>1 → textarea
    props: { ... },                           // 透传（不变）
    validate: (value, { record, column }) => true | '错误文案',   // 不变
    border: true                              // 【本期】编辑器边框开关（缺省 true；switch/textarea 忽略或另有高度语义，A5.4）
  },

  // 意见 4/人工 2 意见 3 新类型专属（color 均为内置 17 色板名）：
  progressOption: { color: 'success', showText: true },   // progress 列（ensureFn 支持 (record)=>配置）
  buttons: [{ caption: '编辑', color: 'primary', disabled: false }, ...] | (record) => buttons,  // button 列
  // link 列：links / value 支持字符串、数字、字符串数组、对象数组
  //   [{ caption, color, danger, disabled }]（对象设置链接颜色等，人工 2 意见 2）；
  //   linkOption { max, danger, disabled }（DOM 沿用字段）+ linkOption.color（本期新增字段，
  //   17 色板名，列级缺省色——经 link.js 落 mu-link--{color} class，DOM/canvas 双侧生效，
  //   link.scss 色类 + canvas colors 查表双消费，评审 6 P1）
  // tag 列沿用：tags / tagOption { max, color }、tag.color 条目级（tag.js:49-56）
}
```

**与现有 table 列定义的映射与差异**：

- 取值与渲染管线复用（非重实现）：列准备 `resolveColumnType(col.type)` → `_render`，`_text/_value` ensureFn（canvas-table.vue:141-149 / cell-painters.js prepareColumn）；取值链 `_text(record)` 非 null 直出 → `_value(record) ?? record[field]` → `render({record, recordNumber, value, emit})`，`text` 直绘（string/number/array——数字 String 化、数组每元素一行）、`items` 按 `is`/class 落地（**本期绘制类别**：文本 + items 四类（check/link/tag/img）+ canvas 专属分发 progress/button——后者非 render items 产物，A3.3），`class/style/title` 忽略（DOM 通道字段）。既有列定义原样传入即得与 table 一致的文本语义。
- 差异 ①：`width`/`minWidth` 缺省取 `TYPE_DEFAULT_WIDTHS[type]` 双值（A3.2），table 靠 `table-layout: fixed` 平分。
- 差异 ②：`class/style/title` 仍为 DOM 通道能力不消费；**多行入口 = `maxLines`/`maxItems`（canvas 字段）**，DOM 版 `multiline`/`lineClamp` 字段经等效映射消费（multiline+lineClamp → `_resolveMaxLines(record)` 行级求值（函数形态按 record，评审 6 P6），A3.5——DOM 风格配置在 canvas 侧同样生效）；多行省略策略 = 末行收缩 `'…'`（文本省略）/第 maxItems 项 `'...'`（条目 dots，A3.5 字符二分）。
- 差异 ③：`editable/resizable/editor/progressOption/buttons/treeNode/maxLines/maxItems` 为 canvas-table 字段，table 忽略未知字段、双方列定义可安全互换。
- 差异 ④：`type: 'progress' | 'button'` 仅 canvas-table 识别（canvas 侧 `CANVAS_ONLY_TYPES` 分发先于 table 注册表查询，A3.3；table 侧 resolveColumnType 未知类型回退 TextColumn，column-types/index.js:33）；列定义在两种表格间互换时 progress/button 列退化为文本列。
- 差异 ⑤：**link 列 canvas 侧可编辑**（NON_EDITABLE_TYPES 移除 'link'，A5）且数组值竖排（A3.5）；`linkOption.max`/`tagOption.max` 为 DOM 版字段——canvas 侧 render 产物之上统一按 `maxItems`（缺省 10）再截断（两字段组合语义：render 已按 option.max 截断时通常不再触 maxItems 上限，A3.3）。

#### A3.2 预设类型默认宽度与最小宽度（意见 3 + 人工 2 意见 1）

`TYPE_DEFAULT_WIDTHS`（layout.js 导出常量，**每类型 `{ width, minWidth }` 双值**；**仅 canvas-table 消费，不改 table/column-types/*.js 的 `width` 字段**——table.vue:11 `<col :style="col._colStyle">` 会消费类型 width，改动即改变现有 DOM table 默认列宽，超范围，见被拒绝备选 #9）。**接入位置 = `solveWidths` 弹性分支**（03-review-4 问题 2 + 03-review-5 问题 1）：定宽链 `widthOverrides[key] ?? col.width ?? resolveColumnType(col.type).width`（layout.js:70-72 现状）与定宽分支 `clamp(px, min, max)`（min = `col.minWidth ?? 0`，layout.js:75）**不动**——有 type.width 的类型（check/rec_no，check.js:3-5 / record-number.js:3 各 `width: '50px'`）与显式 `col.width` 列的定宽行为与现状完全一致；仅 `px == null`（未配 width 且类型无 width）的列，弹性分支由现状 `clamp(COL_FALLBACK, col.minWidth == null ? COL_FALLBACK : min, max)`（layout.js:77——**80px 隐式下限**）改为：

```
const base = TYPE_DEFAULT_WIDTHS[typeNameOf(col)] ?? TYPE_DEFAULT_WIDTHS._fallback
widths[i] = clamp(base.width, col.minWidth == null ? base.minWidth : min, max)
// min = getPixelNumber(col.minWidth) ?? 0（循环头部已解析，layout.js:62 现状）——下限复用已解析
//   值，不把原始 col.minWidth 传给 clamp：字符串 '80px' 经 Math.max(value, '80px') 得 NaN，
//   列宽变 NaN 属对合法配置回归（列 API width/minWidth/maxWidth 支持 String，
//   docs-site/components/table.md:252——评审 6 P5）；col.minWidth 存在但不可解析时按现状语义用 0
// typeNameOf(col) = typeof col.type === 'string' ? (col.type || 'text') : '_fallback'
```

| type | 默认宽（width） | 最小宽（minWidth） | 依据 |
|------|-------|-------|------|
| text（**含无 type/空 type 列**——resolveColumnType(undefined) 同样回退 TextColumn，column-types/index.js:33） | 160 | 80 | 常规文案列惯例（kaka 列宽策略同量级；demo 观感） |
| number | 100 | 60 | 千分位数字 + 右对齐余量 |
| currency | 110 | 60 | 千分位 + 货币符号 |
| date | 110 | 80 | `yyyy-MM-dd` 10 字符 + padding |
| datetime | 160 | 100 | `yyyy-MM-dd hh:mm:ss` 19 字符 |
| enum | 100 | 60 | 映射文案常规 |
| bool | 60 | 40 | 开关图形（**现状被 layout.js:77 隐式下限抬到 80，本期修正为真 60**） |
| link | 140 | 80 | 链接文案 + hover 下划线余量 |
| tag | 140 | 80 | 标签组常规 |
| img / image（image 为注册表别名，同键值对） | 80 | 40 | 缩略图 |
| progress | 100 | 60 | 条 + 百分比文本（本期新类型） |
| button | 140 | 80 | 2–3 个轻量按钮（本期新类型） |
| `_fallback`（自定义类型对象/函数、未知类型字符串） | 80 | 40 | 现状保留（COL_FALLBACK 值 + 调宽缺省下限 40 对齐） |

（check/rec_no **不在表内**——其 50px 经 type.width 走定宽分支，现状不变。）

**语义**：`base.width` 作为**弹性列初始宽基线**、`base.minWidth` 作为**弹性列最小宽下限**（`col.minWidth` 显式值覆盖；现状两者均为 80）。默认宽仍参与剩余宽均摊：容器更宽时该列可被均摊拉伸**超过**默认宽（现状 80 基线同款行为保留）；容器不足（remain ≤ 0）时保持初始宽 → 横向滚动（现状 solver 语义，layout.js:87-105 只摊不缩）。显式 `col.width` 仍为硬宽不参与均摊。**调宽下限接入（评审 6 P2）**：layout.js 新导出 `resolveTypeMinWidth(col) = TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth`；真正 clamp 位置在 `resolveResizeWidth`（interactions.js:221-226，`minWidth ?? RESIZE_MIN_WIDTH`）——**接入点 = 组件壳 `startResize` 传参改 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`**（canvas-table.vue:628 现状仅传 `getPixelNumber(col.minWidth)`），`resolveResizeWidth`/`findResizeColumn` 均不动（后者仅命中检测无 clamp）——类型最小宽同时约束拖拽下限，"列定义可覆盖"对两值一致成立。与现状差异 = 未配 width 列的初始宽与下限从统一 80/80 变为类型感知双值。

#### A3.3 新列型与颜色（意见 4 + 人工 2 意见 2/3）

- **canvas 专属类型分发（03-review-5 问题 6）**：`type: 'progress' | 'button'` 不入 table 列类型注册表（table 侧回退 TextColumn），canvas 侧 `cell-painters.js` 的 `CANVAS_ONLY_TYPES` 表在 `resolveColumnType` **之前**按 `col.type` 字符串命中，返回 canvas 专属 render 产物 `{ canvasKind, value | buttons }`；`drawCell` 按 `canvasKind` 分发 `drawProgress`/`drawButton`——**不经 TextColumn 回退、不产出 render items**。故绘制类别口径 = 文本 + items 四类（check/link/tag/img）+ canvas 专属分发两类（progress/button）。
- **progress**（`type: 'progress'`，仅 canvas-table）：`value` = `_value(record) ?? record[field]`，0–100 数值（<0 按 0、>100 按 100 钳制）；`progressOption: { color = 'primary', showText = true }`（ensureFn 支持 `(record) => 配置`，对齐 tagOption/linkOption 模式）。绘制（内容区矩形，单行高）：轨道全宽 8px 圆角 4px `theme.bgStrong`；填充宽 = pct% × 内容宽、同高圆角、色 `colors[color]?.color`；`showText` 时条右侧 12px 百分比文本（`Math.round(value) + '%'`，右对齐列同对齐）。颜色经 theme 快照 `colors` **固定 17 色 map**（12 彩色 + 5 语义，A6.1），绘制期查表——`(record)=>` 记录级色名即时可用（快照为全量集合，无收集时序问题），未知名回退 `primary`。**progress 不参与 itemHits（不可点击）与多行（单行高）**。
- **button**（`type: 'button'`，仅 canvas-table）：`buttons: Array | (record) => Array`，条目 `{ caption, color = 'primary', disabled = false }`（color 同 17 色集合，记录级色名同上即时可用）。绘制：横排轻量按钮，**tag 同构视觉**（20px 高 / padding 0 8px / 圆角 4px / 12px 字号）：底 `colors[color]?.translucent`、边框与文字 `colors[color]?.color`；disabled 底 `theme.bgDisabled`、文字 `theme.textColorMuted`（快照 21 固定字段之二，root.scss:46/:55/:101/:111 明暗双态——03-review-4 问题 5）。超宽丢弃（drawItems 现状行为）。**条目矩形回报 itemHits（kind: 'button'，可点击命中）**；单行高。选 tag 同构的理由：全部色变量复用 tag 体系（17 色 translucent/color 双形态明暗双态已定义），与表格内标签视觉一致，不引入新样式常量。
- **link 列（条目列，数据形态升级——人工 2 意见 2 + 评审 6 P1 完整路径）**：`value`/`links` 支持**字符串、数字、字符串数组、对象数组**。**解析层（link.js 本期改，见共享文件表）**：`valueToLinks`（link.js:9-15）数组元素为对象（`el != null && typeof el === 'object'`）→ 原样保留 `{ caption, color, danger, disabled }`，字符串/数字 → `{ caption: el }`（现状），单值包单条（现状）；现状对象元素被包成 `{ caption: 对象 }`，DOM 渲染为 `[object Object]`（`isValidLink` 对象非空恒过）——属坏显示而非既定行为，本期修复。**class 产出层（link.js）**：item 构造解构 `color = _color`（`linkOption.color` 解构 `color: _color`，列级缺省色），`if (color) itemClass.push('mu-link--' + color)`——与 tag.js:49-56 落 class 同款机制，`linkOption.max/danger/disabled` 语义不变。**canvas 取色层（cell-painters）**：`drawItems` link 分支解析 item `attrs.class` 中的 `mu-link--{color}` 名 → 文本色 `colors[color]?.color ?? primaryColor`（未知名/无 class 回退主色——与 `drawTag` 解析 `mu-tag--{color}` 同款机制，快照固定 17 色）；`mu-link--danger` → `colors.danger.color`；`item.attrs.disabled` → 文本 `theme.textColorMuted`（link.scss:21-24 视觉对应）。**DOM 视觉层（link.scss 本期改）**：16 新色类（4 语义 `var(--mu-{v}-color)` + hover `--mu-{v}-color-4`、12 彩色 `var(--mu-{v})` + hover 同色，@each 对齐 tag.scss:28-45）+ danger 既有规则（link.scss:13-19）保留——合计 17 色全覆盖，DOM/canvas 双侧同色名同色值（色类构成与 danger 排除理由见改动清单共享文件表）。**条目数与行高**：**数组值竖排每条一行**（条目列数组 = 多行，无需显式标记，A3.5）；单值 = 1 行。条目显示数 = **render 求值 items 计数后 `min(count, _maxItems)`**——超出时第 `_maxItems` 条显示 `'...'`（三点，DOM dots 字面值，评审 6 P4；参与 A2.2 行高公式，估高真值不测量）；`linkOption.max`（DOM 字段）经 render 先行截断（link.js:34-47 dots 语义，产出 `'...'` 条目），canvas 在 render 产物之上按 `_maxItems` 再截断（两道上限组合，不设优先级矩阵）。单条 caption 超宽省略（条目单行，不换行）。
- **tag 多标签颜色落地**：现有 TagColumn 产出 `mu-tag--{color}` class（tag.js:49-56，**12 彩色 + 5 语义 = 17 色，gray 为无色类回退**——tag.scss:28-45 色类体系）现状 canvas 忽略统一灰底；本期 `drawTag` 解析色类 → 底 `colors[name].translucent`、边框与文字 `colors[name].color`；无色类/未知名/gray 回退现状灰底（`--mu-gray-translucent` + `--mu-gray`）；记录级 `tag.color`（tag.js:53）经固定 17 色快照即时可用；`tagOption.max`/`_maxItems` 两道截断组合同 link。`pill/flat` 变体不落地（圆角/去框差异，范围边界 #12）。
- **条目点击命中**（link/tag/button）：painter `paintCellRange` 绘制 items 时把各条目矩形收集进 `state.itemHits`——**二级 Map：外层 `Map<row, Map<col, Array<{ kind, index, rect }>>>`**，内层按 (row, col) 键整组替换：全幅绘制滚动区与固定列两次 pass（painter.js:568-572/:311）写不同 col 键，互不覆盖（03-review-4 问题 9）；**每次绘制批次结束按当前窗口行 [start, end) 裁剪**（窗口外行删除——Map 大小 O(窗口行 × item 列)，长滚有界）。click 时 `resolveItemClick({ hit, itemHits })` 用 `hit.x/hit.y` 反查（先判行在窗口内）。命中 link/tag/button → emit `cell-item-click`（payload 键名对齐 DOM 版，A1），随后**完整续行单元格点击链**（选中 + cell-click，对齐 DOM a 点击冒泡 td）；**dots `'...'` 超限省略条目同样命中发事件（payload 值 `'...'`——DOM link.js:47/tag.js:46 字面赋值，评审 6 P4 统一）**——DOM 版 events.click 绑定对全部条目生效（link.js:59-60、tag.js:59-60、table-row.vue:18，03-review-5 问题 4）；disabled 条目只续链不发 item 事件（与 DOM 版的差异：DOM 版 disabled 链接仍绑定 click；canvas 侧避免禁用项误触，列入 A8 #12 注）。progress/img 点击不命中（DOM 版无对应事件）。

#### A3.4 树形列（意见 1）

见 A2.4（数据/构建/展开）与 A3.1 `treeNode` 字段。绘制细节：缩进 = `level × 16`；箭头槽 16px（**父行箭头 / 叶行空槽，判定 = `flatInfo.hasChildren[row]`**，A2.4 产出）；**箭头槽命中判定（评审 6 P3）**：`resolveTreeToggle({ hit, columns, flatInfo })` 用 **`hit.cellX`**（hitTest 产出——相对命中列内容区左缘偏移，`colLefts/scrollLeft/fixedLeftColumns` 均为 hitTest 现有入参）判定 `cellX < flatInfo.levels[hit.rowIndex] × 16 + 16` 槽内且 `hasChildren[hit.rowIndex]` → toggle——**不用 `hit.x − 列左`**（interactions 纯函数无布局上下文，列左在 hitTest 内计算后随 hit 传递）；槽外（cellX 超出）= 普通单元格点击链。箭头命中优先于单元格点击链（toggle 不选中行、不发 cell-click——局部交互，对齐 tree-node `__expand-icon` 的 pointer-events 隔离，tree.scss:35 `pointer-events: auto` / :74 disabled `pointer-events: none`）；**箭头槽 hover cursor = `pointer`**（`resolveCursor(hit, columns, context)` 三参判定——context 含 flatInfo，`hasChildren` 为真且 cellX 槽内才感知——叶行空槽为默认 cursor，A5.3）。

#### A3.5 多行文本与行高（意见 5 + 人工 2 意见 2：maxLines/maxItems 统一规则）

**规则统一**（03-review-4 问题 7 + 03-review-5 问题 2/5 修正）：

- **列分类**（消除 link 双归属冲突，03-review-5 问题 5）：
  - **文本呈现列** = text（含无 type）/enum/date/datetime/number/currency/bool 及自定义类型的 text 输出——**不含 link**。字符串值可 `maxLines` 换行；数组值每元素一行。
  - **条目列** = link/tag/button（+ check/img/progress 图形列）。link 数组值竖排每条一行（A3.3）；tag/button/check/img/progress 恒单行高（数组走 items 逐条目语义）。
- **两个旋钮，互相独立**（人工 2 意见 2 原文语义）：
  1. **`maxLines: Number` 定义多行**（值域 1–10，缺省 1 = 单行省略）：文本呈现列的**字符串值**自动换行（`wrapLines` 贪心：CJK 逐字可断、拉丁/数字连续段原子不拆、超长词逐字断）；**行数超过 maxLines 时截断为 maxLines 行、末行收缩显示 `'…'`**（文本视觉省略字符 U+2026——**与条目级 dots `'...'`（三点 ASCII，DOM link.js:47/tag.js:46 字面值）两类字符二分：前者是视觉省略号（CSS ellipsis 同款），后者是数据条目字面文本（payload 回传值），评审 6 P4 统一口径**；末行自尾部退格复测至适配内容宽，text-wrap.js 内完成）。**DOM 风格兼容映射（评审 6 P6）**：列按 DOM 习惯配 `multiline: true`（+ 可选 `lineClamp: n | (record)=>n`）而无 `maxLines` 时，canvas 等效消费 **`_resolveMaxLines(record) = clamp(ensureFn(col.lineClamp)(record) ?? 10, 1, 10)`（行级求值——函数形态按 record 取值，与 text.js:13-17 render 内求值同款 ensureFn 语义；不在列准备期求值，无 record 时函数形态只会得 undefined 回退 10，行高/绘制分裂）**；TextColumn 在 `multiline && lineClamp` 时返回的 `{ items: [{ is:'div', attrs:{ class:'line-clamp', style:{ '--line-clamp': lineClamp } } }] }`（text.js:19-29）由 **drawCell 识别"单 item + line-clamp class"形态改道 drawText 多行路径**（item.text 为绘制文本，maxLines 取 `_resolveMaxLines(record)`——与 render 内 `--line-clamp` 同函数求值恒等；enum/date 等格式化列的 render text 输出不受影响，03-review-5 问题 2 按评审建议 B 处理）。
  2. **`maxItems: Number` 定义数组最多显示个数**（值域 1–10，缺省 10）：**数组值**（文本呈现列每元素一行 / link 列每条一行）条目数超过 maxItems 时**第 maxItems 项/行显示 `'...'`**（前 maxItems−1 项正常显示，对齐 DOM link.js:34-47/tag.js:34-47 dots 语义与字面字符）。
- **数据形态（人工 2 意见 2）**：text/link 列 `value`/字段值支持**文本、数字、数组**——数字经 String 化显示与编辑开值；数组元素可为字符串/数字（link 对象数组见 A3.3）。数组值**无条件多行（无需显式标记）**，行数 = `min(length, _maxItems)`（不测量，真值）；单元素/单条内超宽省略。逐行判定在取值链内完成（列准备期不预知数据形态）。
- **link 列单条不换行**（条目单行省略）；maxLines 对 link 列无效（条目列行数由条目数与 maxItems 决定）。
- 行高公式与管线：A2.2。uniform/variable 模式判定 = 文本呈现列 `maxLines > 1` 或 `multiline + lineClamp` 配置存在（函数形态不求具体值，评审 6 P6）**或 估高扫描发现数组值/多条目**（`hasArrayValues`），模式只升不降。
- 绘制：多行块顶部对齐（首行基线 = `rect.y + padding + lineHeight/2`，顺次 `+ lineHeight`）；行高 = `max(--row-height, padding×2 + lines × lineHeight)`（1 行 = 36 与现状一致；2 行 52；3 行 70）。
- **编辑多行/数组格（人工 2 意见 2）**：缺省编辑器 = **textarea**（open 值数组或 `_resolveMaxLines(record) > 1` 时，A5.5——行级求值，legacy 函数列与常量列一致）；textarea 浮层高 = `heightAt(row) − 2×EDITOR_GAP`（占满 4px 等距内容区高、内部滚动，A5.4 R1 口径）；数组值提交 = 换行分割成数组（A5.5 ④⑤）。

### A4. 列头拖拽调宽、排序与条目点击

#### A4.1 调宽【现状·已验证】

手柄命中 = 表头区距列右缘 ≤ 4px（`RESIZE_HANDLE`）；固定列区域与 `column.resizable === false` 排除；**拖拽下限接入（评审 6 P2）：clamp 位置在 `resolveResizeWidth`（interactions.js:221-226，`minWidth ?? RESIZE_MIN_WIDTH` 缺省 40）——接入方式 = 组件壳 `startResize` 传参（canvas-table.vue:628）改 `minWidth: getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`（layout.js 新导出 `resolveTypeMinWidth`，类型最小宽约束拖拽下限；`col.minWidth` 显式值优先，A3.2——人工 2 意见 1；`resolveResizeWidth`/`findResizeColumn` 逻辑不动，前稿"改 findResizeColumn"表述废止——该函数仅命中检测）**。move 中写 `widthOverrides` + 临时前缀和（不重跑求解）+ 竖带脏区 + 1px 参考线；up 时 emit `column-resize` → relayout。clickGuard 抑制拖拽误触点击。

#### A4.2 调宽与变高行联动【本期】

调宽 up（及容器 resize）→ 多行列 contentWidth 变 → 折行缓存按 width 维度自动失效 → 行高全量快速重估（O(n) 纯算术）+ variable 几何 rebuild + 窗口重精算 + 滚动锚定（A2.2 契约⑤）。move 中**不**重估行高（与不重跑 solveWidths 同理，防行高抖动——move 中行高按旧宽绘制，竖带脏区覆盖；up 后一次性收敛）。uniform 模式（无多行列）调宽行为与现状完全一致。

#### A4.3 点击优先级【本期：click 单一入口】

canvas `click` 事件统一处理序（树槽 → 条目 → 编辑 → 选中链）：

```
click（clickGuard.consume() 先行，拖拽后 click 丢弃——现状）
  1. 表头区（isHeader）：check ✓ 表头 → update:header-checked；否则 header-click
     （+ sortable → update:order-by）                                     【现状】
  2. 树箭头槽命中（树开 + 树形列 + flatInfo.hasChildren[row]，**hit.x 判定槽内**）：toggle 展开 →
     update:tree-expanded-keys，选中链/cell-click 不发                    【本期】
  3. item 命中（link/tag/button，窗口内行，**含 dots '...' 条目**——DOM 版全条目绑定
     events.click，03-review-5 问题 4）：cell-item-click（payload 对齐
     DOM 版键名、常规条目值 = 条目对象（link 对象数组元素即原对象，评审 6 P1）、
     dots 的 link/tag 值 = '...'（DOM 字面值，评审 6 P4），A1）→ 续行 4    【本期】
  4. 表体格：update:selected-record-key / update:selected-record / cell-click
     （check 列翻转先发 update:cell-value——现状链）；随后：
     isCellEditable → editor.open（单击进编辑，A5.2）                       【本期】
```

排序点击与编辑无冲突（表头/表体分区）；调宽拖拽与编辑无冲突（手柄在表头 + clickGuard）；选中与编辑为同一次点击的先后两步（先发选中事件再开编辑，父级一次收到完整链）。

### A5. 单元格编辑设计

#### A5.1 适配层总览（复用 mussel 输入组件，不新写输入实现）【现状·已验证 + 本期定位改造】

编辑器 = 组件模板内 DOM 浮层（`__editor` 容器 + `<component :is>`）：`input → MuInput`、`select → MuSelect`、`date → MuDateInput`、`switch → MuSwitch`（editor.js:55-60）+ **本期 `textarea → 原生 <textarea class="mu-input">`**（复用 form `INPUT_TYPES.memo` 约定，input-types.js:3——mussel 无独立 textarea 组件，核实记录见遵循约定节/评审回应人工 2 意见 2）。缺省映射（editor.js:66-74）**本期扩展**：text/link 列按开值形态判定（数组或 `_resolveMaxLines(record) > 1` → textarea（行级求值，评审 6 P6——legacy 函数 lineClamp 列判定与行高/绘制同源），否则 input；显式 `editor.type` 优先；link 列移出 NON_EDITABLE_TYPES），其余列映射不变；enum options 接线（editor.js:123-132）不变。

#### A5.2 编辑触发：单击进编辑（意见 2a）与现有交互的冲突矩阵

| 现有交互 | 冲突分析（已核现状源码） | 处置 |
|---------|------------------------|------|
| 点击选中/聚焦（click → update:selected-* + cell-click，canvas-table.vue:481-541 resolveCellClick 链） | 单击需同时完成选中与开编辑 | 同一次 click 内**先发完整选中/cell-click 链，再开编辑**（A4.3 序 4）——父级一次收到全部事件，选中态与编辑态一致 |
| dblclick 开编辑（onDblclick，canvas-table.vue:543-580；resolveCellDblclick，interactions.js:357-363） | 单击开编辑后浮层即覆盖单元格（`__editor` @dblclick.stop，canvas-table.vue:43），dblclick 第二击落浮层不再达画布——dblclick 路径成为不可达死代码 | **删除**：模板 `@dblclick`（:21）、`onDblclick`（:543-580）、`resolveCellDblclick` 及 canvas-table.vue:80 import、**self-checks/interactions.js 的 import 与 :361-395 断言组同步替换（G3 原子完成，03-review-4 问题 1）**。保留 = 死代码 |
| 列宽拖拽（startResize/clickGuard，canvas-table.vue:606-665） | 手柄在表头区，编辑在表体——坐标不重叠；且拖拽 up 后 `clickGuard.consume()` 丢弃紧随 click（现状机制），即使误触也不开编辑 | 无需改动（clickGuard 沿用） |
| 排序点击（resolveHeaderClick） | 表头区 click = 排序/header-click；表体 = 编辑。`isHeader` 分区判定（hitTest，interactions.js:52） | 无冲突 |
| check 列翻转 | check 在 NON_EDITABLE_TYPES（editor.js:52），单击 = 翻转（现状） | 无冲突 |
| 编辑中点击另一格 | pointerdown 先同步 commit（resolvePointerdown，interactions.js:340-345；canvas-table.vue:469-475）→ click 到新格 → 开新编辑 | 链路成立（现状行为组合，一次点击完成提交 + 选中 + 开新编辑） |
| validate 失败后点击他格 | open 内 commit 校验未过保持现有编辑、不开新格（editor.js:402-405 现状语义） | 沿用 |
| 不可编辑格单击 | 无编辑 | 选中 + cell-click（现状） |

**定案：编辑触发 = click（表体 + isCellEditable）**；dblclick 路径整体删除。理由：用户明确要求单击进编辑；dblclick 路径在浮层出现后不可达，保留为死代码（同一行为双通道反而引入顺序问题）。

#### A5.3 可编辑格 hover 感知（意见 2b）

- **cursor**：`resolveCursor`（interactions.js:70-75）签名扩**第三参 `context = { flatInfo, editable, isCellEditableFn }`（评审 6 P3——现状两参签名无 flatInfo/可编辑性上下文；context 缺省时行为与现状一致，回归安全）**：表体格且 `context.editable && context.isCellEditableFn(column)` 为真 → `'text'`；**树箭头槽（树开 + 树形列 + `flatInfo.hasChildren[rowIndex]` + `hit.cellX` 槽内）→ `'pointer'`**（A3.4——cellX 为 hitTest 产出的相对列内容区偏移；手柄 `col-resize`、表头可排序 `pointer` 优先级不变）。
- **视觉**：hover 落在可编辑格时，`paintOverlay` hover 分支（painter.js:629-639）追加绘制 1px 内描边矩形——**描边矩形 = A5.4 编辑浮层矩形（同一推导，R1/人工 3 意见 2）**：`strokeRect(cellX + EDITOR_GAP + 0.5, cellY + EDITOR_GAP + 0.5, colWidth − 2×EDITOR_GAP − 1, heightAt(row) − 2×EDITOR_GAP − 1)`，其中 `EDITOR_GAP = 4` 为 editor.js 导出常量（painter import 消费——hover 描边与编辑浮层单一事实源，A7 例外），`cellX/cellY/colWidth` 经 `cellRectAt(layout, row, col)`（painter.js:179-186）取值；取色 `withAlpha(theme.primaryColor, 0.45)`（`withAlpha` 为 theme.js 现有函数）不变——不占布局、与任意 hoverMode 底色叠加可辨、与单元格边框四周留 4px 间距；`hoverMode: 'none'` 时不画（用户显式关闭 hover 反馈）。hover 脏区机制（旧行/新行带重绘，组件壳 `invalidate({ rows })` → paintRowBand）不变，描边随带重绘自然生效。

#### A5.4 编辑浮层边距与边框（意见 2c）

- **定位 = 单元格矩形四周 4px 等距内缩（R1/人工 3 意见 2，覆盖前稿 padding−1/padding 口径）**：`computeEditorStyle` 全编辑器类型统一为同一矩形——hover 描边矩形（A5.3）与编辑浮层矩形逐边相等；

```
EDITOR_GAP = 4                                    // editor.js 导出常量（hover 描边/painter 同源消费）
left      = colLefts[i] − (i < fixedCount ? 0 : scrollLeft) + EDITOR_GAP
top       = headHeight + rowGeometry.topAt(row) − scrollTop + EDITOR_GAP
width     = colWidths[i] − 2 × EDITOR_GAP
height    = max(heightAt(row) − 2 × EDITOR_GAP, 0)
```

前稿的 per-type 高度分支（input/select/date = controlHeight+2、switch = controlHeight、textarea = clamp(...)）与垂直居中式 `(heightAt − 浮层高)/2` **整体删除**——等距内缩矩形中心恒 = 单元格中心，垂直对齐自动成立；`theme.controlHeight/cellLineHeight` 不再参与定位（`theme` 参数保留以稳调用方签名，标注不再消费）；switch/textarea/input 同一矩形，`bordered` 判定不变（仅切换 `__editor--borderless` 容器类，见下）。

- **边距与左缘一致的推导**（用户硬约束"编辑与非编辑状态，显示或不显示内部编辑组件边框，单元格与内部文件的边距应该一致" + 人工 3 意见 2"与单元格边框 4px 间距"）：
  - **四周 4px**：浮层矩形 = 格矩形 inset EDITOR_GAP——上下左右均 4px（36px 行 → 28px 高、两态同矩形）。
  - **文本左缘（约束 5 在 4px 口径下重新推导）**：非编辑态文本左缘 = 格左 + `--cell-padding`（8px）。编辑态 = EDITOR_GAP 4 + 边框 1（input.scss:181，borderless 态 border-color transparent 但边框宽 1px 保留）+ 输入内 `padding-left` → 令 `padding-left = cellPadding − EDITOR_GAP − 1`（= 3px）则文本左缘 = **格左 + 8px 精确一致**；scss 落地 `padding: 0 0 0 calc(var(--cell-padding, 8px) - 5px)`（5 = EDITOR_GAP + 边框 1）——`--cell-padding` 被用户覆盖时左缘一致性仍成立（canvas 侧同读该变量）。**borderless 规则删除自身的 `padding: 0` 覆盖**（否则同特异性后定义胜出会清掉基础规则的 padding-left，borderless 文本左缘退到格左 + 5）。
  - **textarea**：`padding: calc(var(--cell-padding, 8px) - 5px)`（四边）+ 1px 边框 → 文本左缘 = 格左 + 8px、**首行顶 = 格顶 + 8px**（= drawText 多行首行顶 `rect.y + padding`，A3.5）——顺带修复前稿偏差（现状 textarea `padding: 3px 10px` + inset 7 → 文本左缘格左 + 18 / 首行顶格顶 + 11，与约束 5"textarea 左缘一致"不符，实施约束 5 的"反算"原则本轮真正闭合）。
  - **垂直（单行）**：等距内缩 → 矩形中心 = 格中心，MuInput 内部 input 垂直居中 → 编辑/非编辑文本中心一致（字号同为 14px）；行高 36px 下输入框高 28px（`> .mu-input { height:100% }` 覆盖 `.mu-input` 基础 `height: var(--mu-control-height-normal)`，input.scss:13）——非标准控件高（32），系 4px 间距的必然几何，属用户指定口径。
  - `column.editor.border: Boolean`，缺省 `true`（两态仅差边框可见性：transparent/无底色 vs 原生边框，几何与文本位置完全一致）；**switch：bordered = false（无边框概念，03-review-5 问题 14）**——switch 根元素非 `.mu-input`，浮层内经 flex 居中，矩形同口径；textarea：bordered 恒 true（mu-input 边框提供编辑态边界，borderless 类不适用于 textarea）。
- 多行变高行：浮层高 = `heightAt(row) − 8`（textarea 占满内容区高、内部滚动；上限随之消失——行高本身 ≤ 16 + 10×18 = 196（maxLines ≤ 10，A2.2），浮层高 ≤ 188）；编辑多行格提交后行高经 A2.2 契约① 重估。

#### A5.5 生命周期与数据流【现状·已验证 + 触发点变更】

```
打开：click 表体可编辑格（A5.2；原 dblclick）→ isCellEditable 判定（link 列本期起可过）
      →（已在编辑则先同步提交上一格，校验未过则保持）
      → 编辑器解析（text/link 列：Array.isArray(rawValue) || column._resolveMaxLines(record) > 1 → textarea，
        否则 input；显式 editor.type 优先；_resolveMaxLines 行级求值，评审 6 P6）→ editing.value = 规整后开值 → context.rawValue
        /rawWasArray 记录原值与原值是否数组
      → 浮层渲染后聚焦（input/select/date 聚焦内部真实 <input>；textarea 聚焦 textarea 元素；
        switch 聚焦容器）——组件壳 focusEditor
提交（分类型矩阵，editor.js:326-343 + :285-297 + 本期 textarea 分支）：input Enter / 画布 pointerdown /
      滚动 / blur 延迟兜底；select/date/switch 值变化即提交（flush:'sync' watch）+ 同左兜底；
      textarea Enter 换行不提交、Ctrl/Cmd+Enter 显式提交（容器 keydown 判定）+ 画布 pointerdown /
      滚动 / blur 延迟兜底（同 input 减 Enter）
提交路径：value → 规整层（下）→ validate（规整后值）→ 清空 editing
      → emit('update:cell-value', { record, recordIndex, column, value: 规整后值 })
      → nextTick 重绘该行（多行列行高重估 + 锚定，A2.2 契约①；数组↔字符串形态变化触发模式升级判定）
取消：Esc（input/select/date 组件转发；textarea 冒泡至容器；switch 容器 keydown）→ 直接关闭不发事件
滚动即提交：浮层随滚动会漂出单元格（变高行下重定位成本更高），维持提交语义
```

**编辑值类型规整层**（editor.js 纯函数，前轮设计保留 + 本期 ④⑤）：

```js
// 签名（伪代码级规格）
usesDerivedOptions(column, editorType)
// select + mappings 派生 options（editor.props.options == null）

normalizeEditorOpenValue({ column, editorType, value })
// select + 派生 options → value == null ? value : String(value)
// textarea + Array.isArray(value) → value.map(v => v?.caption ?? v).join('\n')
//   （link 对象数组取 caption；纯字符串/数字数组直接元素 join）
// textarea + 非数组 → value == null ? '' : String(value)
// 其余原样

normalizeCommitValue({ column, editorType, rawValue, value })
// ① editorType === 'input' && column.type ∈ {number, currency}：
//      value == null → null（先于 Number()，防 Number(null)===0）
//      value === '' → null；typeof number → value
//      Number(value) 有限 → Number(value)；否则保留原字符串（非数值输入交 validate 拦截）
// ② editorType === 'select' && usesDerivedOptions && typeof rawValue === 'number'：
//      value == null → null；Number(value) 有限 → Number(value)；否则 value
// ③ 其余（text/date/switch、显式 options 的 select）：value 原样
// ④【本期】editorType === 'textarea' && Array.isArray(rawValue)：
//      value.split('\n')（数组值编辑 = 换行分割成数组，人工 2 意见 2 原文；元素一律字符串，
//      空行保留为 '' ——所见即所得；对象数组的 color/danger/disabled 等属性不随编辑保留，
//      父级受控流可按需回填——A5.5 规则要点注明）
// ⑤【本期】editorType === 'textarea' && !Array.isArray(rawValue) && typeof rawValue === 'number'：
//      value === '' → null；Number(value) 有限 → Number(value)；否则保留原字符串
//      （数字原值类型保持，同 enum/number 哲学；字符串原值 → 字符串原样（含 '\n'，换行即所见））
```

规则要点（前轮已评审定稿，概括补全——03-review-3 问题 3；本期扩 ④⑤）：number/currency 列提交收敛为 **number 或 null；非数值输入保留原字符串、交由 validate 拦截**；规整锚定列类型而非控件配置（数值列显式 `editor.type:'select'` 时走 select 规则，显式 `options` 原样是范围边界 #14 例外）；null 直通（清空语义，MuInput 清空按钮 input.js:119、combo-wrapper.vue:105-108）；enum 按 rawValue 类型保持（number → number，string/boolean → key 字符串）；open 字符串化消除 `in` 运算符隐式转换依赖（select.js:72-87）；date 不规整。**本期 ④⑤（人工 2 意见 2）**：textarea 数组原值 → `split('\n')` 数组提交（元素字符串、空行保留、对象属性不保留）；textarea 非数组原值 → 字符串原样（数字原值 Number 回转、清空 null）；单行 input 编辑 text/link 列（原值非数组且 maxLines == 1）→ 字符串原样（value 原样规则③覆盖）。

### A6. 样式方案

#### A6.1 `--mu-*` 取值方式（探针 + 计算样式）【现状·已验证 + 本期扩展】

隐藏探针 + `readVar/readPx/readFont/readInheritedFontSize`（theme.js:30-49）不变。主题快照字段演进：

| 轮次 | 字段 |
|------|------|
| 现状 | 17 字段（theme.js:52-72） |
| 前轮 | + `bgStrong`（18）——check disabled 底衬对齐 DOM 版，消费 `theme?.bgStrong \|\| theme?.hoverBg`（**回退链统一**，03-review-3 问题 1：自定义主题缺该变量时回退现状等效色，cell-painters 现有 `theme?.x` 链式取值模式） |
| 本期 | + `controlHeight: readPx(probe, '--mu-control-height-normal')`（root.scss:141，编辑浮层高，A5.4）+ `textColorMuted: readVar(probe, '--mu-text-color-muted')` + `bgDisabled: readVar(probe, '--mu-bg-disabled')`（root.scss:46/:55/:101/:111 明暗双态，link/button disabled 色，03-review-4 问题 5）→ **固定字段 21**；+ `colors: { [name]: { color, translucent } }` **固定 17 色 map**——**12 彩色基础（red/pink/grape/violet/indigo/blue/cyan/teal/green/lime/yellow/orange）读 `--mu-{name}` + 5 语义（primary/secondary/success/warning/danger）读 `--mu-{name}-color`，每色再读 `--mu-{name}-translucent`；色名集合与消费先例 = tag.scss:28-45（gray 不入 map、为绘制回退——root.scss `$BASE_COLORS` 实为 13 色（root.scss:1-6 含 gray），"12 基础"计数前口径不准，03-review-5 问题 10 修正）；translucent 定义：基础色 root.scss:33-35（`.mu-root,.mu-light` 块定义、暗态继承），语义色明态 :37-40 + 暗态覆盖 :92-95**——**不经列准备期收集**（03-review-4 问题 4：记录级色 tag.color:53、link 对象数组 `link.color`、`buttons`/`progressOption` 的 `(record)=>` 配置在列准备期不可见，收集式动态 map 必然漏色；固定全量 34 次 getComputedStyle 在一次探针快照批次内完成，开销可忽略），`readSnapshot(probe)` 签名不变，colors 随任何一次快照重读（挂载/暗色切换/DPR/refreshTheme）一并刷新，无过期契约 |

暗色感知（MutationObserver + rAF 节流 → 重读快照 → onChange 通知）、`refreshTheme()` 兜底、探针 try/catch 保留上次快照——均现状沿用；**主题/字号/行高变量刷新的变高行重估（快照 font/lineHeight 变化 → wrap 缓存自动失效 → 全量快速重估 + rebuild + 锚定，A2.2 契约⑤——03-review-5 问题 15）：实施位置 = 组件壳的 themeWatcher onChange/refresh 处理器（relayout 前）——theme.js 仅负责快照读取与变更信号（无 records/rowGeometry，不承担几何职责，评审 6 P9）**。编辑浮层为 DOM，变量切换自动生效。

#### A6.2 视觉规格（与 table.scss 逐项对齐；新增项标【本期】）

| 项 | 值 |
|----|----|
| 行高/表头高 | 局部变量 `--row-height: 36px` / `--head-row-height: 36px`；【本期】多行行高 = `max(36px, 16px + lines × 18px)`（--cell-padding 8×2 + --cell-line-height 18） |
| 单元格文本 | 字号继承 + `--mu-font-sans`，单行省略；【本期】多行列顶部对齐逐行、末行 lineClamp 省略 |
| 表头/网格线/表体底/斑马/选中/hover/固定列分隔 | 现状对齐不变（A6 表沿用：bgFill、borderColorSoft、bgNormal/bgStripe、primary-faint、gray-translucent、borderColorStrong） |
| check disabled 底衬 | 【前轮+本期口径】`theme.bgStrong || theme.hoverBg`（回退链） |
| 【本期·R1】可编辑格 hover 描边 | `withAlpha(--mu-primary-color, 0.45)` 1px 描边，**矩形 = 编辑浮层矩形（EDITOR_GAP 4px 等距内缩，与单元格边框四周 4px 间距，A5.3/A5.4）** |
| 【本期·R1】编辑浮层 | 矩形 = 格矩形四周内缩 4px（全编辑器类型同矩形，A5.4）；`border: true` 用 MuInput 原生边框（`--mu-border-color-normal`，focus 主色，input.scss:181/:248-252）；`border: false` transparent + 无底色（**不再覆盖 padding**——左缘一致性靠基础规则 `padding-left: calc(var(--cell-padding) − 5px)`），focus 光环保留；switch 无边框形态；textarea 恒有边框 + `resize: none` + 行高 `--cell-line-height` + `padding: calc(var(--cell-padding) − 5px)` |
| 【R1】demo 缩放 grip（夹具） | `.ct-resize-handle`：元素本体透明 16×16 全命中区（cursor nwse-resize 不变），视觉 = `::after` 右下三角 `clip-path: polygon(100% 0, 100% 100%, 0 100%)` + `var(--mu-primary-color)` + opacity 0.5（色不变，仅形状改三角，人工 3 意见 3） |
| 【本期】树缩进/箭头 | 16px/级（镜像 tree.scss:3）；箭头 12px 三角 `--mu-text-color-normal`、hover 主色 |
| 【本期】progress | 轨道 `--mu-bg-strong` 8px 圆角 4；填充 `colors[color].color`（17 色板名，缺省 primary）；文本 12px |
| 【本期】button / tag 彩色 | tag 同构：20px 高 / padding 0 8px / 圆角 4（--mu-radius-control）/ 12px；底 `colors[name].translucent`、边框文字 `colors[name].color`（**17 色板 = 12 彩色 + 5 语义**，镜像 tag.scss:28-45 色类体系，gray 回退） |
| 【本期】link 变体 | `colors[color].color` 文本色（link.color/linkOption.color，17 色板名）；danger `colors.danger.color`（镜像 link.scss:13-19）；disabled `theme.textColorMuted`（快照字段，读 `--mu-text-color-muted`） |
| 【本期】button/tag disabled | button disabled 底 `theme.bgDisabled`（`--mu-bg-disabled`）、文字 `theme.textColorMuted`；tag 无 disabled 态（对齐 tag.scss 现状） |
| 表头/底部投影 | DOM 阴影条 `--mu-shadow-float`。已知对齐差异：table.scss:155 硬编码双阴影不复刻（约束优先） |
| 空态 | `empty` 插槽 / `emptyText`，居中 `--mu-text-color-subtle` |

### A7. 文件结构与模块划分

本期 9 → **12 文件**（8 既有 js/vue + 3 新模块 + 1 scss）：

```
src/components/canvas-table/
├── canvas-table.vue    # 组件壳：DOM 骨架、props/emits/expose、watch 重绘表、滚动 rAF、
│                       #   指针事件接线（click 单一入口：树槽→条目→编辑→选中链）、
│                       #   树接线（buildFlatRows/展开集/锚定）、行几何接线（模式判定/精算/锚定）
├── canvas-table.scss   # BEM 样式 + 尺寸变量镜像 + sticky/spacer/overlay + editor 浮层（borderless 类）
├── index.js            # 导出（不变）
├── theme.js            # 探针/快照（21 固定字段 + colors 固定 17 色）/Observer/DPR/
│                       #   createMeasureCache + createTextMeasurer（测量工厂，壳注入）
├── row-geometry.js     # 【新】行几何策略（uniform O(1) / variable Fenwick）、估高/精算、锚定
│                       #   （measure/wrapCache 经参数注入；内部 import text-wrap 纯函数）
├── text-wrap.js        # 【新】文本折行（短路判定/贪心折行/缓存；measure 注入，零 canvas 依赖）
├── tree.js             # 【新】key/parentKey → childrenMap + 迭代 DFS 平铺（含 hasChildren）+ 展开集
├── layout.js           # 纯函数布局：solveWidths（弹性分支 + TYPE_DEFAULT_WIDTHS 宽/最小宽双值 +
│                       #   无 type 回退）/前缀和/可视窗口（经 rowGeometry，缺省 uniform 回退）/坐标换算/手柄检测
├── cell-painters.js    # 列类型绘制适配：文本（单行/多行 maxLines/数组 maxItems）+ items 四类 +
│                       #   canvas 专属分发（progress/button）+ 树形列 + 颜色解析（17 色板）；
│                       #   多行折行 import text-wrap，measure/wrapCache 经 painter state 注入
├── painter.js          # 绘制管线：5 分区/脏区/变高行坐标/itemHits 收集（(row,col) 粒度 + 窗口
│                       #   裁剪）/hover 编辑描边/lastPaint 统计；state 携带 measure/wrapCache
├── editor.js           # 编辑状态机：只读判定/解析（含 textarea + 数组开值/提交）/内容区矩形定位
│                       #   （switch/textarea 高度分支）/提交矩阵/validate/值类型规整层
└── interactions.js     # 指针交互纯函数：hitTest/排序循环/树槽与条目命中/click 开编辑/clickGuard/合帧
```

模块通信不变（组件壳持有共享状态传各模块；模块间不相互 import），新增例外：row-geometry 由 canvas-table.vue/layout/painter 消费（几何接口）；**text-wrap 为纯函数模块，由 row-geometry 与 cell-painters import**（同 layout import table utils 的纯函数引用先例，03-review-4 问题 8）；**R1 追加例外：painter import editor.js 的 `EDITOR_GAP` 常量（hover 描边与编辑浮层同一矩形口径的单一事实源，人工 3 意见 2——纯常量引用，editor.js 自身不 import 本地模块，无环）**；tree.js 仅由 canvas-table.vue 消费；painter/cell-painters 消费 theme 快照 colors 与 theme.js 测量工厂产物（painter.js:74-87 现状已 import createMeasureCache）。**canvas-table 目录外共享文件 2 个（评审 6 P1）：`../table/column-types/link.js`（LinkColumn 数据层——cell-painters 经 resolveColumnType 消费的 render 数据源，对象数组/color 解析修复）与 `src/styles/link.scss`（DOM 侧色类视觉层；canvas 侧不消费该 scss、经快照 colors 查表）**。demo 侧两页 + self-checks 断言文件 7 → 10（另 `self-checks/index.js` 注册 6 → 9 组）。

### A8. 范围边界（本期不支持）

前序 12 条 + 历次调整，本轮修订后全集：

1. 单元格/区域范围选择——仅行选中（与现有 table 一致）。
2. 键盘导航（方向键移动选中、Tab/F2/Enter 直接键入开编辑）——单击开编辑，键盘导航不做。
3. ~~`cell-item-click`：link/tag 列交互~~——**本期废止**（意见 4）：link/tag/button 点击均发事件（payload 对齐 DOM 版，A1）；仅 progress/img 点击不命中（DOM 版无对应事件）。
4. ~~`title` 悬浮、列级 `class/style`、`multiline/lineClamp` 多行截断~~——**多行本期废止**（意见 5 + 人工 2 意见 2：canvas 多行入口 = `maxLines`/`maxItems`；DOM 风格 `multiline`+`lineClamp` 经等效映射消费，A3.5）；`title` 悬浮与列级 `class/style` 仍不支持（DOM 通道字段）。
5. ~~变高行~~——**本期废止**（意见 5 支持，等高快速路径 + 变高 Fenwick 双模式）；**行合并、多级表头**仍不支持。
6. 列显隐/顺序拖拽/固定列区域调宽（固定区整体排除在调宽外）。
7. 行级只读（仅表格级 + 列级，任务约束 4 口径）；编辑历史/撤销；**树 check 列父子级联勾选**（本期树不含勾选联动）。
8. 超浏览器滚动高度上限的压缩滚动（36px 行高约 90 万行，超出未定义）。
9. 右键菜单、Excel 复制粘贴、小地图。
10. ~~分页/树形/分组聚合~~——**树形本期废止**（意见 1 支持平铺 key/parentKey 树）；分页/分组聚合仍不支持（父级自行处理 records）。
11. 触屏专项优化（交互可用，不调优）。
12. 列类型 DOM 视觉子集（收窄）：~~tag 统一灰底 pill、link 统一主色文本~~——**本期废止**（意见 4：tag 17 色、link color/danger/disabled 落地）；仍保留的差异：tag `pill/flat` 变体（统一 4px 圆角实底）、enum mapping `class` 不生效、绘制类别 = 文本 + items 四类（check/link/tag/img）+ canvas 专属分发（progress/button，非 render items）；**disabled 条目点击：canvas 侧 link disabled 不发 `cell-item-click`（避免禁用项误触），DOM 版 disabled 链接仍绑定 click（link.js:59-60 全条目绑定）——已知行为差异**。
13. datetime 列编辑精度：MuDateInput 无 datetime 类型（date-input.vue:83-86 validator），编辑值到日期精度。
14. 显式 `editor.props.options` 时的值类型规整：开值/提交值均原样。
15. 文档三处同步（skills/mussel-ui、docs/quick-reference_*、docs-site）——项目规约需用户确认后另行执行。
16. canvas-table 工作区产物的 git 提交入库——用户决策，本流水线不实施。
17. 树懒加载子节点（异步展开请求子级）——本期树为全量数据构建；懒加载（kaka lazyLoading 模式）未来扩展。
18. ~~多行文本编辑器（textarea 形态）~~——**本期废止**（人工 2 意见 2：多行/数组格编辑 = textarea，原生元素 + `mu-input` class 复用 INPUT_TYPES.memo 约定，A5.4/A5.5）。
19. `progress`/`button` 列在 DOM 版 mu-table 中的呈现——两类型仅 canvas-table 识别（DOM 侧回退文本列，A3.1 差异 ④）；如需 DOM 支持另行立项。
20. 变高行下"渐进精算"导致的滚动条随滚动微增长——固有行为非缺陷（估高 1 行下界 → 精算只增；stk autoRowHeight 同款），不做全量预计算（被拒绝备选 #10）。
21. link 对象数组编辑——textarea 开值取元素 caption 换行拼接、提交为**字符串数组**，对象的 `color`/`danger`/`disabled` 等属性不随编辑保留（父级受控流可在 `update:cell-value` 处理器按需回填，A5.5 ④）；`maxLines`/`maxItems` 配置值钳制到 [1, 10]（超出按 10 生效）。
22. **共享文件 `link.js`/`link.scss` 改动的 DOM 版影响面（评审 6 P1）**：DOM 版 mu-table 的 link 列本期同步获得——对象数组渲染 caption 文本（现状 `[object Object]` 修复）与 `link.color`/`linkOption.color` 色类视觉（link.scss 16 新类 + danger 既有规则 = 17 色全覆盖）；**字符串/数字/单值、linkOption.max/danger/disabled、class/style、showTitle 路径零变化**。DOM 版的 `linkOption.class/style` 等其余字段 canvas 侧仍不消费（既有边界不变）。

## 被拒绝的备选（含理由）

1. **DOM 路线之改造现有 table（加虚拟滚动 + 调宽 + 编辑）**：现有 table 为全量 `<table>` v-for 渲染，窗口化需重构行渲染/占位/固定列/hover 指示条全链，且现有使用方面临回归风险；改造后单帧仍承担 Vue patch + DOM 增删 + layout 成本。起点差 4 项核心能力，终点性能不优于 canvas。拒绝。
2. **DOM 路线之移植 stk-table-vue**：11,370 行 TS + Vue 2.7 兼容结构需剥壳翻译为纯 JS；其虚拟滚动正确性依赖约 300 行历史边界修正；编辑为演示级（原生 input、无校验、无只读控制、无编辑器扩展注册），约束 4 的 mussel 输入组件适配层在其中无对应物。工作量 ≥ 全新组件且引入双份列类型体系。拒绝。
3. **canvas 路线之彻底重构（kaka 式分层引擎）**：八项差距全部可在既有模块边界内扩展（两项经新模块隔离，见路线决策差距表）；kaka 架构收益依附其 TS + 门禁体系，纯 JS 无门禁的 mussel 不可迁移；51,005 行 vs 3,696 行的体量不可比。拒绝。
4. **编辑值规整改为显式 `editor.transform(value, ctx)` API**：自动类型保持规则已覆盖全部已报告漂移场景且零配置；显式 transform 增加 API 面与文档负担；确需自定义转换的父级已有受控数据流钩子。拒绝（未来漂移场景出现再议）。
5. **本期扩展列级 `editable: (record) => boolean` 行级只读（kaka 模型）**：任务约束 4 明确「表格级与列级」两级；行级只读涉及命中判定、绘制置灰、编辑判定三处联动；check 列已有行级 `disabled` 先例覆盖最常用场景。列为未来扩展。拒绝（本轮）。
6. **painter 库内全量绘制断言（违反即 throw）**：现行 painter.js:694-697 只是 `draw` 返回统计，无内建断言；组件库运行时因断言抛错对使用方是灾难性行为。「禁止一次绘制全部行」是验收约束而非使用方 API 契约，外部断言（`getLayoutInfo().lastPaint` + demo 自检 + 测试计划）已机器可查且零运行时风险。拒绝。
7. **变高行索引之分段树**：单点更新/前缀和/定位均 O(log n) 与 Fenwick 相同，额外提供区间聚合（min/max/懒标记）——本场景只需单点更新 + 前缀和 + 偏移定位，区间聚合无消费方；实现约 2 倍代码量（2n 数组 + 节点下降定位）。拒绝。
8. **变高行索引之朴素前缀和数组**：查询 O(1) 最优，但单点更新 O(n)——滚动稳态每帧最多数十次进窗精算回填，10 万行下每帧数十万次 Float64Array 写；且每帧常数次查询下 O(1) vs O(log n) 无感。写路径劣势无对应收益。拒绝。
9. **预设列宽写入 table/column-types/*.js 的类型 width 字段**：table.vue:11 `<col :style="col._colStyle">` 消费类型 width——改注册表即改变现有 DOM table 的默认列宽行为（现仅 check/rec_no 有 width），影响既有使用方，超出本任务范围。改为 canvas-table 侧 TYPE_DEFAULT_WIDTHS 常量（A3.2）。拒绝。
10. **变高行全量预计算（首次渲染前对所有行精算行高）**：10 万行 × 长文本列 measureText + 折行（首访全 miss）首屏秒级耗时，违背意见 5「高性能测量」要求。改为估高下界 + 进窗精算 + 单调收敛 + 锚定（A2.2），接受滚动条渐进增长（范围边界 #20）。拒绝。
11. **编辑触发保留 dblclick 并新增 click 双通道（`editTrigger` prop）**：单击开编辑后浮层覆盖单元格，dblclick 第二击落浮层不可达——双通道中一条是死代码；且 prop 增加 API 面与测试矩阵。用户明确要求单击，定案单一 click 通道。拒绝。
12. **树数据用嵌套 childNodes 结构（tree 组件原生形态）**：用户明确指定平铺 + key/parentKey（意见 1 原文），且平铺与 records 数组、虚拟滚动行窗口、就地编辑（record 引用稳定）天然契合；嵌套结构需双向转换。按用户指定执行（此条为记录设计依据而非拒绝用户）。
13. **树展开收起用 Vue 响应式数组 diff（splice 插入删除）+ Fenwick 原位更新**：Fenwick 不支持原位插入/删除，需 O(n) 重排索引；而平铺重建 O(n) 本就必需（DFS 序全局变化），rebuild O(n) 与之同级，逻辑更简单（一次重建 vs 增量维护的正确性风险）。拒绝增量维护。
14. **`colors` 动态色名收集（列准备期收集 `colorNames` → readSnapshot 按需读取）**：记录级色（tag.js:53 `tag.color`）与 `(record)=>` 配置（buttons/progressOption）在列准备期不可见，收集必然漏色 → 记录级颜色回退错色；且 columns/records 变化需另接快照刷新契约（canvas-table.vue:798-802 现状 columns watch 只清 widthOverrides + relayout，theme.js:161-174 观察器只在挂载/暗色/DPR/手动 refresh 时重读）——两处复杂度均为持续负担。固定 17 色全量读取（34 次 getComputedStyle，一次探针批次完成）开销可忽略且刷新契约天然成立（随任何 readSnapshot 一并重读）。拒绝（03-review-4 问题 4）。
15. **保留 `multiline: Boolean` + `lineClamp` 双字段作为 canvas 多行门控（不引入 maxLines）**：前稿方案。人工 2 意见 2 明确指定 `maxLines: Number`（单一旋钮同时定义"是否多行"与"最多行数"）与 `maxItems`——双布尔+钳制字段需要三字段组合表达（multiline+lineClamp+数组上限）且 TextColumn 的 multiline+lineClamp 组合走 items 分支需额外绕行（03-review-5 问题 2）。改为 maxLines/maxItems 后 DOM 风格配置经等效映射仍兼容（A3.5）。拒绝（按人工 2 意见 2 指定执行）。
16. **新建 `MuTextarea` 输入组件供编辑浮层与表单通用**：mussel 现无独立 textarea 组件，form 侧多行输入的既有形态 = `INPUT_TYPES.memo` 原生 `<textarea class="mu-input">`（input-types.js:3、form-field.vue:12/:73）。为表格编辑新建组件超出本任务范围（表格能力扩展，非 form 组件库扩充），且与库内既有 memo 约定并行引入第二套多行输入形态。编辑浮层复用 memo 同款原生约定（class + v-model + 浮层 scss 覆盖高度），零新增公共 API。拒绝（超范围 + 双形态）。
17. **`maxItems` 与 `linkOption.max`/`tagOption.max` 建立优先级矩阵（如 maxItems 恒优先/option.max 恒优先）**：LinkColumn/TagColumn render 内部消费 option.max（link.js:34-47/tag.js:34-47，dots 语义），canvas 无法禁用该读取；强行建立优先级需在 canvas 侧绕过 render 重实现取值（丢 DOM 管线复用）。改为**两道上限组合**：render 先按 option.max 截断（DOM 语义保留），canvas 在 render 产物之上按 `maxItems ?? 10` 再截断——配置其一或同时配置均有确定行为，无优先级规则。拒绝优先级矩阵。
18. **link 对象数组/颜色走 canvas 专属适配（不经 link.js，评审 6 P1 的备选②）**：cell-painters 对 link 列做前置专属 render，直接读原始 `column.links`/`value` 对象构造 item。拒绝：① 丢 DOM 列类型管线复用（本设计主线与任务约束 1——linkOption.max/danger/disabled/class/style、dots、events.click 语义须在 canvas 侧重实现，双实现漂移面大）；② DOM 版 table 的 link 对象数组保持 `[object Object]` 坏显示（人工 2 意见 2 的数据形态要求在 DOM 侧不成立，"与现有 table API 一致"约束受损）；③ 代码重复（对象解析/包 caption/isValid 过滤逻辑与 link.js 并行两套）。改为评审建议①：改共享 link.js 数据层 + link.scss 色类层（改动清单"共享文件（2）"表，DOM/canvas 双侧受益，兼容策略与回归断言见该表与风险表）。

## 风险与回滚

| 风险 | 影响 | 缓解 |
|------|------|------|
| 变高行窗口计算错误（topAt/offsetToRow 与实际绘制不一致） | 错位/空白/断行 | row-geometry 自检与朴素参考实现（O(n²) 逐行累加）逐项对照断言（随机高度 1000 行）；painter 绘制与 hitTest/编辑定位共用同一几何实例（单一事实源）；e2e 跳跃滚动断言 |
| 精算回填与滚动并发（帧内 scrollTop 读旧值） | 锚定补偿错位 | 精算/锚定/重绘在同一 rAF 批次内同步完成（scrollFrame 回调内：精算 → updateHeight → Δ 累计 → scrollTop 一次写入 → 窗口重算 → 绘制）；Δ 按锚行上方合计一次补偿 |
| 估高误差大（长文本列大量 1 行估值） | 滚动条大幅增长、跳跃距离漂移 | 数组值与短路单行在准备期即真值；可感知漂移限于"未访问过的长文本区"；行为与 stk autoRowField 同类；测试计划 #15 断言单调不回缩 + 锚定不跳动 |
| Fenwick 重建频率（树 toggle/调宽 up/records 替换均 O(n) 重建） | 大数据量下交互帧预算 | 重建 = O(n) 纯算术（10 万行 ≈ 1ms 级，无测量）；调宽 move 中不重估（A4.2）；树 toggle 后复用 record 引用行高缓存 |
| 树脏数据（环/孤儿/重复 key） | 死循环/丢行 | visited Set 防环、孤儿挂根（A2.4）；重复 key 行为未定义（文档声明，prop 校验不做——纯 JS 无运行时校验惯例） |
| itemHits 与双分区绘制/脏区重绘不一致（覆盖/残留/增长） | 点击命中错位；长滚内存增长 | (row, col) 二级 Map 粒度——滚动区与固定列两次 pass（painter.js:568-572/:311）写不同 col 键不互覆（03-review-4 问题 9）；每次绘制批次结束按当前窗口行裁剪（Map 大小 O(窗口行 × item 列)）；click 先判行在窗口内；自检断言双 pass 后两区条目并存 + 连续滚动绘制后 Map 行集合 ⊆ 最新窗口；e2e 固定列 + 非固定列 item 点击用例 |
| 单击开编辑误触（滚动后抬起点错格、快速扫选） | 意外进编辑 | clickGuard（拖拽）+ 命中行一致性（pointerdown/up 同格判定可加）；业界惯例（Excel/在线表格）单击编辑可接受；validate/Esc 取消路径兜底 |
| 编辑浮层 borderless 覆盖破坏 MuInput 交互（clear 按钮/下拉箭头） | 编辑器功能异常 | borderless 仅覆盖 border-color/background/padding 三项（scss 白名单），不触 box-shadow/clear/下拉；e2e 两态 clearable/select 用例回归 |
| colors 色名非法（用户传 `color: 'foo'` 或未注册 class） | 查表 miss → 错色 | colors 为固定 17 色快照（探针读必命中已定义变量）；绘制期按名查表，未知名回退（tag → 现状灰底、progress/button → primary）；自检断言 |
| TYPE_DEFAULT_WIDTHS 接入改变未配 width 列行为（含最小宽下限与字符串 minWidth） | 既有列宽视觉变化（初始宽/下限 80/80 → 类型感知双值；bool 60 生效后窄于现状 80）；`minWidth: '80px'` 字符串误传 clamp → NaN（评审 6 P5） | 定宽链、type.width 与定宽分支 min（`getPixelNumber(col.minWidth) ?? 0`）完全不动（check/rec_no 定宽 50 现状保持）；仅弹性分支基线/下限换值，**下限复用循环头部已解析 min（layout.js:62），不传原始字符串**，均摊/滚动语义不变；self-checks/layout 回归断言（type.width 优先、宽容器拉伸、窄容器保持、**bool 60 不抬 80、无 type 列 160、col.minWidth 覆盖、'80px' 字符串解析非 NaN**）；demo 全类型页（不配 width）目测 |
| maxLines 末行省略的收缩复测成本 | 长文本高频重绘下省略号收缩多次 measure | 收缩仅在 clamped 行发生（`wrapLines` 返回 clamped 标记）；收缩测量经同一 measureCache 缓存；折行结果缓存 key 含 maxLines，同列同宽重复命中 |
| G2 中间态：layout 接口变更先于组件壳接线 | G2 完成时组件壳（未改）调用新接口报错、demo 不可用 | rowGeometry 参数可选 + `resolveRowGeometry` 缺省构造 uniform 几何（等高算式恒等）——壳不传参路径与现状行为一致；self-checks/layout 断言"未传 rowGeometry 回退等高"；G3 完成真实接线 |
| 树 + 多行组合行高偏小（缩进未计入）或非树形列误扣（评审 6 P8） | 树形列长文本行高不足、文本截断；或非树形多行列行高被无谓压低 | `treeIndents(colIndex, row)` 回调传入 computeRowHeights/ensureRowMeasured（签名带列号——仅树形列返回 `16×level + 16`、其余列 0，单参签名无法区分列会误扣非树形列）；self-checks/row-geometry inset 断言（**含树形列 + 非树形多行同表用例**）+ e2e 树+长文本行高断言（demo 夹具） |
| legacy `lineClamp` 函数形态求值不一致（行高 vs 绘制 vs 编辑器，评审 6 P6） | 同列不同 record 的行高/绘制行数/编辑器形态分叉（列准备期求值只能得 undefined→10） | 三消费方（drawText / computeRowHeights·ensureRowMeasured / editor textarea 判定）统一走列准备挂的 `_resolveMaxLines(record)` 闭包——与 text.js:13-17 render 内 ensureFn 求值同款语义，单一事实源；模式判定对 `multiline + lineClamp` 配置存在即入候选（不求具体值）；self-checks/cell-painters + row-geometry 函数形态用例（`(record)=>record.deep?3:1` 两条 record 断言）+ demo 夹具 e2e |
| textarea 编辑器高度/提交形态异常（浮层高、数组 split、Ctrl+Enter） | 多行编辑体验异常/数据形态错误 | 浮层高公式按类型分支（A5.4，clamp 到 [controlHeight, 10×lineHeight+2padding] 内部滚动）；开值/提交规整 ④⑤ + self-checks/editor 断言（join/split/Ctrl+Enter/Enter 换行）；e2e textarea 验证区（demo 夹具） |
| dots 条目行为对齐 DOM（发事件 payload `'...'`） | 既有处理器收到 `'...'` 值误当真实条目 | 与 DOM 版逐字一致（link.js:46-47/:59-60、tag.js:46-47/:59-60，字面三点 `'...'`——评审 6 P4 统一，前稿 `'…'` U+2026 口径废止；文本视觉省略 `'…'` 为另一字符类不涉及 payload）；payload 值恒为 `'...'` 字面量，处理器可判别；测试 #14 断言 dots 命中发事件 + 值 |
| **link.js/link.scss 共享文件改动影响 DOM 版 table（评审 6 P1）** | DOM 版 link 列行为回归 | 改动为纯增量 + 坏行为修复：对象数组现状渲染 `[object Object]`（`isValidLink` 对象非空恒过 + `caption` 为对象）→ 修复为 caption 文本；`color` 为新字段（不配不产出 class），字符串/数字/单值/`linkOption.max/danger/disabled` 路径逐行不动（改动清单共享文件表逐条列明）；link.scss 新色类为新 class 名，无既有使用方（danger 不入 @each，既有 `.mu-link--danger` 规则保留不动——避免同特异性双规则把既有 hover 变浅行为覆盖为同色）。**回归断言三层**：self-checks/cell-painters 的 LinkColumn compile 产物断言（对象数组 caption/class/dots '...'/字符串数组不变/linkOption.color 落 class，模块级）；demo DOM 参照段（main-view.vue:151-164）link 对象数组 + color 列 e2e（DOM 渲染文本 + getComputedStyle 色 = 色类值）；`demo/src/data/table/`、`table-advanced/` 现有 link 用例目测回归 |
| **拖拽下限接线遗漏（评审 6 P2）** | text 列仍可拖至 40（预期 80）、bool 拖至 40 | clamp 唯一位置 = `resolveResizeWidth`（interactions.js:221-226），接入点 = 壳 `startResize` 传参（canvas-table.vue:628 改 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`）；self-checks/interactions 组合断言（resolveTypeMinWidth + resolveResizeWidth）+ self-checks/layout resolveTypeMinWidth 断言 + 测试 #6 拖拽下限 e2e（text 80/bool 40/col.minWidth 覆盖） |
| defaultExpandLevel 语义变更（0 = 展开根层级，旧稿 0 = 全收起） | 依赖旧语义的调用方行为变化 | 前序未发布（本期新 prop）；语义对齐 tree 组件有先例可查（tree-node.vue:100-106）；A1/A2.4/self-checks/test #11 四处同口径断言 |
| link 列开放编辑后的误触（link 点击与开编辑同格竞争） | 点击链接同时开编辑器 | A4.3 优先级：item 命中先发 cell-item-click **并续行开编辑**——与 DOM 版 a 点击冒泡 td 后进编辑的行为一致；编辑器 Esc 取消兜底；e2e link 列点击用例（事件 + 浮层两断言） |
| 数组值触发 uniform→variable 模式升级 | 升级帧整幅重算卡顿 | 升级 = 全量快速估高 O(n) 纯算术 + rebuild O(n)（10 万行 ≈ ms 级，无测量）；升级后锚定补偿视口不动；模式只升不降避免抖动；自检 + e2e（编辑提交引入数组值 → 行高即时生效） |
| 规整层变更提交值类型（既有 demo 依赖字符串提交） | 行为变化 | 前序未发布；demo「最近提交」typeof 可见；自检同步（前轮已列） |
| null 清空误落 `Number(null)===0` | 数值格清空变 0 | 规整层 null 判定先于 Number()（A5.5 ①②）；自检 null 两分支（前轮已列） |
| MuInput/MuSelect 清空按钮产出 null 路径 | 同上 | 同上 |
| enum open 字符串化与 MuSelect 相等语义 | 预选/显示异常 | 显示路径已核（select.js:72-87 宽松命中）；单选面板无高亮机制（option.vue:26 + select.js:95-99，本轮核实）；G 组 e2e 数值枚举用例 |
| 删除 dblclick/focusAfterRender 误伤聚焦 | 编辑器打开不聚焦 | 聚焦唯一依赖壳 focusEditor（canvas-table.vue:586）；测试计划 #12 activeElement 断言；**self-checks/interactions.js 同步删除 dblclick 断言组与 import（否则 ESM 加载即失败，03-review-4 问题 1）** |
| `--mu-bg-strong`/`--mu-control-height-normal`/`--mu-text-color-muted`/`--mu-bg-disabled` 在自定义主题未定义 | 探针读 0/失败 | root.scss 双态已定义（:46/:54/:55/:101/:110/:111/:141）；try/catch 保留上次快照；bgStrong 回退 `\|\| hoverBg`（统一口径）；controlHeight 读 0 时编辑器高回退 32 常量；textColorMuted/bgDisabled 读失败时回退 gray/hoverBg 链（cell-painters 现有 `theme?.x` 模式） |
| **R1 行背景带扩展误伤固定列内容（人工 3 意见 1）** | 固定 pass 行底色若同被扩展，将覆盖已绘滚动区单元格内容 | `bandToX` 仅滚动区五调用点传 stickyWidth、paintFixedArea 内调用不传（带 = [0, fixedWidth]，带宽语义与分区 3 整高不透明重绘一致）；self-checks/painter (d) 固定列 + Σ < W 整幅后滚动区文本像素仍在；e2e #16 固定列场景回归 |
| **R1 编辑浮层 28px 高（36px 行 − 2×4）压扁输入控件观感 / 小行高覆盖进一步压缩**（人工 3 意见 2） | 输入框低于标准控件高 32px（用户指定 4px 间距的必然几何）；`--row-height` 覆盖 < ~28px 时输入内容区更紧（现状 min(rowH, 34) 同样压缩，程度略增） | MuInput 盒模型核实（border 1 + flex 居中，input.scss:9-76/:181）：28px 盒 → 内容 26px > 内部 input 20px，无裁剪；e2e #16 两态文本左缘/中心一致断言 + 编辑器视觉属"需人工检查"项（沿用验证报告惯例）；不设额外下限（height = max(rowH − 8, 0) 防负值即可） |
| 回滚 | — | 本期新增 3 文件 + 既有文件修改。**实施前用 `cp -r`（或 robocopy）将 `src/components/canvas-table/`、`demo/src/data/canvas-table/`、`demo/src/data/canvas-table-editable/` 复制到 `.pipeline/` 外的备份目录**（03-review-3 问题 6 修正：三者均为 untracked，`git stash -u` 会把它们移出工作区，不是备份）；回滚 = 备份目录覆盖回来。**共享文件 `src/components/table/column-types/link.js`、`src/styles/link.scss` 为 git 已跟踪且工作区干净（git status 仅 canvas-table 相关未提交）——回滚 = `git checkout -- src/components/table/column-types/link.js src/styles/link.scss`**（评审 6 P1）。除该两文件外不触碰 table/ 与 form/ 任何文件。**R1 回滚：修复对象全部位于上述 untracked 备份集内（canvas-table 三源文件 + demo 两目录），R1 实施前同款 `cp -r` 增量备份（或依赖 git：demo/canvas-table 均 untracked，无 git 回滚通道），回滚 = 备份覆盖；`tag.js` 不在 R1 白名单** |

## 测试计划

无测试框架（项目 AGENTS.md）；验证 = demo 页 + playwright DOM/像素断言 + demo 内置 self-checks 面板。rollup watch 常驻 3000 端口（直接访问，无需重新打包）。原十条验收标准 + 人工意见项（人工 1/2 五项 + 人工 3 三缺陷 #16）：

| 验收标准 | 手段 | 检查方式 |
|---------|------|---------|
| 1 选型决策 | `人工` | 本文档选型决策节：四维对比表 + 结论明确；引用数据可回溯三份探索报告 |
| 2 优化 vs 重构 | `人工` | 路线决策节：八项差距逐项扩展性判断 + 重构拒绝理由；改动清单为既有文件扩展 + 3 新模块 |
| 3 API 对照 | `浏览器` | `http://localhost:3000/data/canvas-table/`：事件日志核对全部 10 events（`cell-item-click` 为 DOM 版已有事件的 canvas 补齐，payload `{ record, recordIndex, column, link\|tag\|button }`——recordIndex 为 canvas 附加，link/tag 键名与 DOM 版一致，**dots 条目值 = `'...'`（三点字面值，评审 6 P4 统一）**；`update:tree-expanded-keys` 本期新增）；方法经 `window.__canvasTable`：`scrollToRecord`（树模式 key 定位）、`getLayoutInfo()`（含 rowGeometryMode）、`getThemeSnapshot()`（**21 固定字段 + colors 固定 17 色 map**，A6.1）、`getCellRect`（变高行高度 = heightAt）、`expandAll`/`collapseAll`/`getTreeExpandedKeys` |
| 4 渲染架构/虚拟滚动 | `浏览器` | **断言口径 = 最近一次整幅绘制（断言前先 `recordsVersion++` 或 `refreshTheme()` 触发整幅，再读取 lastPaint——脏区绘制 rowCount 为脏区行数不满足上界，03-review-5 问题 11）**；uniform 模式：现状断言不变（`lastPaint.rowCount ≤ ceil(视口高/rowHeight)+2+1`，含非行对齐 scrollTop 如 1800018）；variable 模式：`rowCount == getLayoutInfo().viewRows.count` 且 ≤ 该窗口行数；spacer 高度 = max(0, contentH − 视口高)；数据契约通道（就地改/recordsVersion/引用替换/树 toggle/调宽·主题·字号失效通道） |
| 5 列定义 | `浏览器` | `getLayoutInfo().colWidths` 核对 clamp 与均摊；各类型显示格式化文本；数组 value 列多行；`text` 函数覆盖列显示覆盖文本 |
| 6 调宽与排序 | `浏览器` | `browser_run_code_unsafe` + `page.mouse`（`getCellRect` 换算列缘坐标）拖拽：colWidths 变化、move 无残影、拖后 click 不触发排序/不开编辑；固定列缘拖拽无效；**拖拽下限断言：未配 minWidth 的类型列不可拖至类型最小宽以下（text 80 / bool 40），`col.minWidth` 显式值覆盖**；**变高模式下拖宽多行文本列 → up 后行高重估**（该列行高变化 + 滚动条更新 + 视口不跳）；排序列三态循环 |
| 7 编辑（前轮规整回归 + textarea/数组） | `浏览器` | `http://localhost:3000/data/canvas-table-editable/`：浮层 rect 与**4px 等距内缩**矩形重合（EDITOR_GAP 口径，A5.4——人工 3 意见 2 后取代 padding−1/border 口径）；Enter/Esc/blur/滚动提交；validate 失败 `[invalid]` 且不关闭；`editable=false`/未配 editor/排除类型列 click 无浮层；规整层 e2e（stock 文本输入 typeof number、数值 enum 往返 typeof number、清空三路径 null、price 缺省路径回归）——前轮断言全集保留；**textarea 编辑（人工 2 意见 2）：maxLines 列与数组值列开编辑 → 浮层为 textarea（tagName 断言）+ 高度 = heightAt − 8（A5.4 R1 口径）；数组开值 = 元素换行拼接（input.value 断言）；Enter 键插入换行不提交、Ctrl+Enter 提交；提交值为数组（Array.isArray + 元素 = 换行分割）且「最近提交」形态显示；link 数组列同路径（对象数组开值 = caption 拼接、提交字符串数组）；数字原值 text 列 textarea 提交 typeof number 保持** |
| 8 样式/暗色 | `浏览器` | 自检面板 theme 断言（**bgStrong/controlHeight/textColorMuted/bgDisabled 入计数公式（21 固定字段）+ colors 固定 17 色形态（12 彩色 + 5 语义，gray 不入）**）+ cell-painters disabled 底衬合成断言全绿；暗色切换 500ms 内画布像素变化（含 colors 17 色全部重读）；**check disabled 底衬 e2e 合成色像素断言（dpr 换算口径——03-review-3 问题 5）：`browser_evaluate` 内 `const dpr = canvas.width / canvas.getBoundingClientRect().width`，`ctx.getImageData(x*dpr, y*dpr, 1, 1)`（dpr≠1 时后备存储坐标按 dpr 放大；前序环境为 dpr=1 基线，本口径对 dpr≠1 亦成立）**；tag 彩色/progress/按钮像素采样（colors map 值与画布合成比对，同法）；`--row-height` 覆盖后 relayout；根字号覆盖跟随；**根字号/--cell-line-height 覆盖后 variable 模式行高重估跟随（行高变化断言——契约⑤，03-review-5 问题 15）** |
| 9 文件结构 | `命令` | `ls src/components/canvas-table/` = 12 文件（8 既有 js/vue + row-geometry.js + text-wrap.js + tree.js + 1 scss）无增删（除设计所列）；`npm run build` 通过（S1 单次） |
| 10 范围边界 | `人工` | 对照 A8 二十条确认 demo 与文档无对应实现 |
| 11 树（意见 1） | `浏览器` | 树夹具页签：1 万节点渲染为树（`window.__canvasTable` 句柄断言 flatRows 长度 = 展开节点数）；点击箭头 → `update:tree-expanded-keys` 事件载荷正确 + 平铺增减；`expandAll`/`collapseAll` 生效；**defaultExpandLevel 边界断言：0 = 根层级展开（level 0 子级可见）、-1 = 全收起、1 = 两层展开（03-review-5 问题 8）**；**展开/收起视口上方节点 → 视口内容不动（scrollTop 补偿，`browser_evaluate` 记录锚行内容前后一致）**；收起滚动到底的祖先 → scrollTop clamp 不越界；树行选中/编辑/hover 正常（树行即普通行）；孤儿/环数据夹具不死循环（自检 + demo）；树形列缩进/箭头像素采样；叶子无箭头、**叶行空槽 cursor 非 pointer（getComputedStyle）**；**槽位精确断言（评审 6 P3）：父行箭头槽内（cellX < level×16+16 区域）点击 toggle；槽外（同一父行单元格文本区）点击不 toggle、走选中链（cell-click 发出）**；**树形列 + maxLines 长文本：行高按扣减 inset 后的内容宽折行（行高断言，03-review-5 问题 7）**；**`tree` 开关切换**（flatRows/行序/spacer 即时重建 + 渲染正确）与 **`treeProps` 字段名切换**（展开集清空 + defaultExpandLevel 重解析）断言（watch 契约，A2.4） |
| 12 编辑 UI（意见 2） | `浏览器` | 单击可编辑格：一次 click 依次产生 `update:selected-record-key`/`update:selected-record`/`cell-click` + 浮层出现（事件顺序断言，A4.3 序 4）；不可编辑格单击只选中不开编辑；拖拽调宽后紧随 click 被吞（不开编辑）；表头 click 排序不开编辑；hover 可编辑格 cursor = `text`（getComputedStyle 断言 canvas 容器 cursor）+ 1px 描边像素采样；hover 不可编辑格无描边；编辑浮层两态（border true/false）：`document.activeElement` 为内部 input（switch 为容器、textarea 为 textarea 元素）；**边距一致断言：两态浮层内 input 文本左缘 x（getBoundingClientRect + padding 推算）与非编辑态文本绘制起点（getCellRect().x + 8）差 ≤ 1px**；**全编辑器类型浮层 = 同一 4px 等距矩形（switch/textarea/input 逐边相等，高 = heightAt − 8，含变高行，A5.4 R1 口径——人工 3 意见 2）**；**hover 描边矩形与编辑浮层矩形逐边一致断言（hover 态采样描边 1px 位置 = cellRect.x + 4 / cellRect.y + 4，描边外缘距格缘 4px；单击进编辑后浮层 getBoundingClientRect 与之逐边差 ≤ 1px）**；borderless 态 clear 按钮/select 下拉仍可用；**固定列编辑浮层横向滚动后不错位**（scrollLeft > 0 下 getCellRect 对照浮层 rect，A5.4） |
| 13 默认列宽（意见 3 + 人工 2 意见 1） | `浏览器` | 全类型 demo（不配 width）：**宽容器断言 `getLayoutInfo().colWidths` 逐列 ≥ TYPE_DEFAULT_WIDTHS[type].width**（均摊拉伸，A3.2 语义）；**容器宽 = Σ(默认宽 + 定宽列宽) 时逐列相等**（无 remain）；**窄容器 → 逐列 = 默认宽 + 内容横向滚动**（remain ≤ 0 保持初始宽）；**bool 列 = 60（不再被 80 隐式下限抬高——layout.js:77 修正断言）；无 type 列（`{ field:'name' }`）= 160（text 回退）；自定义类型列 = 80**；**最小宽断言：`col.minWidth: 120` 显式值生效（覆盖类型最小宽）；`col.minWidth: '80px'` 字符串形态解析为 80（colWidths 值为 Number 非 NaN，评审 6 P5）；未配 minWidth 列均摊/clamp 后不小于类型最小宽**；**回归断言：未配 width 的 text 列在宽容器被拉伸（现状均摊行为保留）**；check/rec_no 列恒 50px（type.width 定宽，不受 TYPE_DEFAULT_WIDTHS 影响）；显式 `col.width` 列不参与均摊；拖拽覆盖后 override 生效 |
| 14 新列型（意见 4 + 人工 2 意见 3） | `浏览器` | progress 列：**render 产物为进度条绘制（非文本，03-review-5 问题 6）**、轨道/填充宽（pct 换算像素断言）/文本/color 变色（success 列填充 = colors.success，**含 `(record)=>` 记录级色与 17 色板抽样 primary/red**）；button 列：多按钮渲染、彩色（**含记录级色**）、disabled（底 = bgDisabled、文字 = textColorMuted 像素断言）、点击命中发 `cell-item-click`（**payload 键名 = button**）、按钮间点击不命中；link 列：**字符串数组竖排每条一行、对象数组 color/danger/disabled 三态取色（像素断言——取色链 = link.js `mu-link--{color}` class → canvas colors 查表，评审 6 P1）、单值数字 String 化显示、maxItems 超限第 maxItems 条 `'...'`**；**DOM 版 link 对象数组回归（评审 6 P1）：demo DOM 参照段（main-view.vue:151-164）对象数组 + color 列——DOM 渲染 caption 文本 + `getComputedStyle` 色 = link.scss 色类值；`demo/src/data/table/` 现有 link 用例目测不变**；**tag 点击发 `cell-item-click`（payload 键名 = tag，对齐 DOM 版）；tag 多标签 17 色中抽样 3 色像素断言（含记录级 tag.color）**；**`'...'` 超限省略条目（dots，三点字面值——评审 6 P4 统一）点击发 `cell-item-click`（payload link/tag 值 = `'...'`，对齐 DOM 版，03-review-5 问题 4）；常规条目 payload link 值 = 条目对象（对象数组元素即原对象，含 caption/color）**；disabled 条目点击只发 cell-click 不发 item 事件；**固定列 + 非固定列 link/button 分居两区（fixedLeftColumns ≥ 1）：两区条目均命中发事件（双 pass itemHits 回归，03-review-4 问题 9）**；条目点击后 cell-click 照发（冒泡语义） |
| 15 多行变高（意见 5 + 人工 2 意见 2） | `浏览器` | 多行文本列：长文本自动换行（折行结果采样首行/末行 y）；**maxLines 钳制 + 末行 `'…'`（maxLines=3 长文本断言 3 行 + 末行省略；maxLines=10 上限）**；**数组值列行数 = min(length, maxItems)（行高断言 = max(36, 16+n×18)）——含未配 maxLines 的数组值列（自动多行 + variable 模式升级，A2.2/A3.5）、数字数组元素 String 化、maxItems 超限第 maxItems 行 `'...'`**；**DOM 风格 multiline+lineClamp 兼容列与 maxLines 列渲染等效（03-review-5 问题 2）；函数形态 lineClamp（`(record)=>record.deep?3:1`）两条 record 行高与绘制行数各自按求值（评审 6 P6）**；**link 数组列行数 = min(条目数, maxItems)（含 dots 合并）行高断言（03-review-5 问题 5 统一后口径）**；混排（单行列 + 多行列）行高取多列最大；10 万行含 20% 长文本行：滚动流畅（人工）+ `lastPaint.rowCount` 窗口断言（整幅口径，#4）+ **滚动条单调不回缩**（滚动全程 scrollHeight 只增）；**滚动锚定：跳跃滚动后立即读取锚行内容 → 精算补偿帧后再读 → 一致**；**编辑提交把值改为数组 → 该行即时多行 + 行高重估（模式升级路径；数组→单字符串同理重估）**；自检面板 text-wrap/row-geometry/tree/layout/painter/cell-painters 新增组全绿（**含 itemHits 双 pass 不互覆 + 窗口裁剪断言 + maxLines 钳制 + maxItems 计数 + 函数 lineClamp 行级求值**） |
| 16 人工 3 缺陷修复（R1） | `浏览器` | **① 行背景充满**：窄列夹具场景（demo main-view 新增，ΣcolWidths < 容器宽，striped）：`browser_evaluate` + `getImageData`（dpr 口径同 #8）在 x ∈ (Σ, W−2) 采样——斑马行 = bgStripe 色、普通行 = bgNormal、选中行 = selectBg 合成色；hover 行带同区域 = blend(hoverBg, 行底色)（与列区内采样点一致——修复前后差异点）；行网格线全宽（回归）；横向滚动场景（默认 10 万行页，Σ > W）：滚动后 x = W−2 处行底色正常（不越界）；固定列 + 窄列组合：固定列右侧第一列文本仍可见（固定 pass 不扩带回归）。**② hover 描边 = 编辑框 + 4px**：hover 可编辑格 → 描边像素出现在 `getCellRect().x + 4`（1px，withAlpha(primary, 0.45) 合成色）、描边外缘距格缘 4px；单击进编辑 → 浮层 rect（getBoundingClientRect）与 hover 描边矩形逐边差 ≤ 1px；两态（border true/false）浮层内 input 文本左缘 = `getCellRect().x + 8` ± 1px（约束 5 新口径）；textarea 开编辑首行文本左缘同断言（顺带修复项）。**③ grip 三角**：`.ct-resize-handle` 本体 computed background = transparent（rgba(0,0,0,0)）、尺寸 16×16 不变；`getComputedStyle(el, '::after')` 的 clip-path 含 polygon 与 background = primary；`page.mouse.move` 至右下角 (W−4, H−4) pointerdown → 拖拽缩放仍触发（命中区不变） |
| 自检回归 | `浏览器` | `/data/canvas-table/` 自检面板全绿（77 项既有 + 本期新增各模块断言；**interactions 组 dblclick 断言已删换 click 语义组——03-review-4 问题 1；index.js 注册 9 组全部出现在面板**） |
| 构建/风格 | `命令` | `npm run build` exit 0（S1 单次）；`npx stylelint "src/components/canvas-table/*.scss" --fix` 后无新增错误 |

## 实施步骤

| # | 步骤 | 文件集合 | 依赖 | 完成判据 |
|---|------|---------|------|---------|
| G1-a | 纯函数基建：新建 `text-wrap.js`（tokenize/estimateLineCount/wrapLines（**含 maxLines 钳制与末行 '…' 收缩**）/createWrapCache，measure 注入）、`row-geometry.js`（uniform/variable 几何 + Fenwick + computeRowHeights/ensureRowMeasured（**maxLines/maxItems 行数语义 + treeIndents 回调**）/computeAnchorShift）、`tree.js`（childrenIndex/flatRows（含 hasChildren）/初始展开集（**level <= defaultExpandLevel，0-based；签名含 records/keyOf/parentKeyOf，内部 BFS 计层——评审 6 P7**）/toggleKey）；同步新建 `self-checks/text-wrap.js`、`self-checks/row-geometry.js`、`self-checks/tree.js` 并**注册进 `self-checks/index.js`（6 → 9 组）** | `src/components/canvas-table/text-wrap.js`（新）、`row-geometry.js`（新）、`tree.js`（新）、`demo/src/data/canvas-table/self-checks/text-wrap.js`（新）、`self-checks/row-geometry.js`（新）、`self-checks/tree.js`（新）、`self-checks/index.js`（改） | — | 自检面板**出现并全绿** text-wrap/row-geometry/tree 三组（runner 注册后组名可见——03-review-4 问题 6；variable 几何与朴素参考实现随机对照、环/孤儿树用例、折行短路/缓存计数/**maxLines 钳制**/maxItems 计数/treeIndents 扣减、hasChildren 断言） |
| G1-b | theme 扩展：`readSnapshot(probe)` 固定字段 17 → 21（`bgStrong`/`controlHeight`/`textColorMuted`/`bgDisabled`）+ `colors` 固定 17 色 map（12 彩色 + 5 语义，gray 不入）+ 新导出 `createTextMeasurer()`（**契约⑤变高行重估不在本步——theme.js 仅快照与 onChange 信号通道（现状已有零改动），重估逻辑归 G3 壳 onChange 处理器，评审 6 P9**）；同步 `self-checks/theme.js` 计数公式与 colors 断言 | `src/components/canvas-table/theme.js`、`demo/src/data/canvas-table/self-checks/theme.js` | — | 自检 theme 组全绿（**21 固定字段**计数 + colors 17 色形态（12 彩 + 5 语义）、bgStrong rgba 半透明形态） |
| G2 | 布局与绘制管线接入：`layout.js`（TYPE_DEFAULT_WIDTHS 宽/最小宽双值弹性分支——**下限复用已解析 min，字符串 minWidth 不回归（评审 6 P5）**+ 无 type 回退 + **`resolveTypeMinWidth` 导出（评审 6 P2，G3 壳消费）** + **rowGeometry 可选参数与 `resolveRowGeometry` 缺省 uniform 回退**）、`painter.js`（变高坐标 + **cellRectAt/单格 rect/裁剪高 heightAt 化** + hover 描边 + itemHits (row,col) 粒度收集（含 dots `'...'`）与窗口裁剪 + state 注入 measure/wrapCache）、`cell-painters.js`（**CANVAS_ONLY_TYPES 分发** + **`_resolveMaxLines(record)` 行级求值闭包（评审 6 P6——常量 maxLines 与 legacy multiline+lineClamp 双形态）** + maxItems 多行/数组 + **line-clamp item 改道** + link 竖排对象数组颜色（**class 解析路径，评审 6 P1**）+ 17 色 + 树形列（hasChildren） + bgStrong 回退链）、`canvas-table.scss`（editor borderless + **textarea 样式**）；**共享文件两件原子完成（评审 6 P1）：`../table/column-types/link.js`（valueToLinks 对象透传 + color 解构落 class）+ `src/styles/link.scss`（16 新色类 + danger 既有规则保留）——cell-painters 的 link 断言与 DOM 参照视觉依赖其产物，同步落地**；同步 `self-checks/layout.js`/`painter.js`/`cell-painters.js`（含 **LinkColumn compile 产物断言 = DOM 版回归断言**） | `src/components/canvas-table/layout.js`、`painter.js`、`cell-painters.js`、`canvas-table.scss`、`src/components/table/column-types/link.js`、`src/styles/link.scss`、`demo/src/data/canvas-table/self-checks/layout.js`、`self-checks/painter.js`、`self-checks/cell-painters.js` | G1-a（几何/折行接口）、G1-b（快照字段） | 自检三组全绿（默认宽/最小宽断言（type.width 优先、宽容器拉伸、窄容器保持、**bool 60、无 type 160、minWidth 覆盖、'80px' 字符串解析**、缺省 rowGeometry 回退）、变高 fake geometry + cellRectAt 断言、itemHits 双 pass 不互覆 + dots `'...'` 收集 + 窗口裁剪断言、**canvasKind 分发**、tag 色/progress/多行绘制断言、**函数 lineClamp 行级求值断言、LinkColumn compile 产物断言（对象数组 caption/class/dots/字符串数组不变）**）；**demo 页可编译且绘制/命中正常（本步不动 interactions.js 与组件壳——dblclick 链保持现状可用；rowGeometry 缺省回退保证壳的现行调用路径行为不变，03-review-5 问题 3）；DOM 版 mu-table 参照段 link 对象数组渲染正常（link.js/link.scss 改动的 DOM 侧验证）** |
| G3 | 交互与组件壳：`interactions.js`（删 `resolveCellDblclick`、新增 `resolveCellClickOpen`/`resolveTreeToggle`（**hit.cellX 槽内判定**，评审 6 P3）/`resolveItemClick`（**hit.x/hit.y**）、**hitTest 返回值增 x/y/cellX**、**resolveCursor 第三参 context `{ flatInfo, editable, isCellEditableFn }`**（P3））与 `canvas-table.vue`（**同步删 :80 import 与 :21/:543-580 dblclick 链**——与 src 删除原子同步）、`editor.js`（规整层（**含 ④⑤ textarea/数组**）+ 内容区矩形定位（**switch/textarea 高度分支**）+ **link 移出 NON_EDITABLE_TYPES + textarea 编辑器与提交矩阵（text/link 缺省判定用 `_resolveMaxLines(record)` 行级求值，评审 6 P6）** + bordered + 死代码清理 + 头注）、组件壳全部接线（props/emits/expose、树接线与 watch 三 prop + **themeWatcher 契约⑤（重估逻辑在壳 onChange 处理器，theme.js 仅信号——评审 6 P9）**、几何与锚定与模式升级接线、**treeIndents(colIndex, row) 组装（P8）**、measure/wrapCache 注入、**paintState 组装扩展（displayRows/flatInfo/...）**、click 单一入口（**含 dots 命中**）、hover 感知（**resolveCursor 调用传 context（:455，P3）**）、watch 扩展、**startResize 传参 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`（:628，评审 6 P2）**）；同步 `self-checks/interactions.js`（**删 dblclick 断言组与 import → click 语义组**，03-review-4 问题 1；**新增 cellX/槽内槽外/context cursor/resolveResizeWidth+resolveTypeMinWidth 组合断言**——评审 6 P2/P3）、`self-checks/editor.js`（规整 + 定位断言（含固定列横向滚动 + switch/textarea 分支 + 数组开值/提交）+ 旧口径文案含 :363）、demo 两页夹具（`main-view.vue` 树（含开关/treeProps 切换控件 + 树形列长文本）/多行（**maxLines/maxItems/数组值/DOM 风格兼容（含函数 lineClamp）/link 三态**）/新列型/**全类型默认宽页签**/固定列组合/**DOM 参照段 link 对象数组回归** + editable 页单击/border/**textarea 验证区**，含前轮夹具保留） | `src/components/canvas-table/interactions.js`、`canvas-table.vue`、`editor.js`、`demo/src/data/canvas-table/self-checks/interactions.js`、`self-checks/editor.js`、`demo/src/data/canvas-table/main-view.vue`、`demo/src/data/canvas-table-editable/main-view.vue` | G2（painter/layout 接口）、G1-a（tree.js）、G1-b | 自检全绿（含 interactions click 语义组——**ESM 无缺失导出**；cellX/cursor context/resize clamp 新断言）；两 demo 页夹具渲染正确（树/多行/新列型/默认宽可见）；编辑规整断言（前轮全集 + textarea/数组）通过 |
| S1（集成验证） | 按测试计划全量执行：两 demo 页 playwright 全表（#3–#15）+ 自检面板（9 组）+ `npm run build`（写共享 `dist/`，全流程仅此单次）+ stylelint | 无新文件 | G1-a、G1-b、G2、G3 | 测试计划全表通过 |
| R1（人工 3 缺陷修复） | 05-verify-2 PASS 基线上的定向修复，单步原子完成（改动清单「缺陷修复 R1」表 6 文件）：① painter.js（paintCellRange bandToX 行背景带扩展 + hover 描边 EDITOR_GAP 矩形）；② editor.js（EDITOR_GAP 导出 + computeEditorStyle 统一公式重写 + 头注/死常量清理）；③ canvas-table.scss（__editor padding-left calc / borderless 去掉 padding 覆盖 / textarea padding calc）；④ demo main-view.vue（grip 三角 + 窄列夹具场景）；⑤ self-checks/painter.js（行背景带宽度断言组 + 描边采样点更新）；⑥ self-checks/editor.js（computeEditorStyle 新口径断言重写）。**白名单仅限上述 6 文件**（超范围即 BLOCKED 回报，不静默扩面） | `src/components/canvas-table/painter.js`、`editor.js`、`canvas-table.scss`、`demo/src/data/canvas-table/main-view.vue`、`demo/src/data/canvas-table/self-checks/painter.js`、`demo/src/data/canvas-table/self-checks/editor.js` | S1（已 PASS，工作区现状即基线） | 自检面板全绿（143 项基数上 painter/editor 两组断言更新后仍 0 ✗——组数不变无注册改动）；playwright #16 三缺陷断言通过；#7/#12 新口径子项复验（浮层 rect/textarea 高/两态左缘）通过；#4/#6/#11/#14 关键回归抽查（整幅绘制统计、调宽、树、条目）不回归；`npx stylelint src/components/canvas-table/canvas-table.scss --fix` 无错误；`npm run build` exit 0（本轮单次） |

并行组划分：**G1-a 与 G1-b 文件集不相交且互不依赖，为并行组**（G1-a 纯新文件 + 自检 + index 注册，G1-b 仅 theme + 自检）；G2 依赖两者（几何接口与快照字段）串行；G3 依赖 G2 串行；S1 集成。**interactions.js 的 `resolveCellDblclick` 删除与 canvas-table.vue:80 import 删除、self-checks/interactions.js 断言组替换三者在 G3 内原子完成**（03-review-4 问题 1 建议归 G2，但 canvas-table.vue（import 消费方）在 G3——跨步删除导出会使 G2 完成态的 demo ESM 断链、G2 判据不可执行；归组调整不改变改动内容，文件集仍两两不相交）。**共享文件 `link.js`/`link.scss` 归 G2 单步内原子（评审 6 P1）：cell-painters 的 link 绘制与 self-checks/cell-painters 的 LinkColumn 断言依赖其产物，与 cell-painters.js 同步落地——不跨并行组（G2 为单步），无跨步文件集冲突**。`npm run build` 全部归 S1（写共享 `dist/`）；各步判据依赖 rollup watch 常驻热编译的 demo 自检与 playwright 断言。除 G2 内的 link.js/link.scss 外无其他共享/生成文件改动（组件注册与 demo catalog 均已就位；`self-checks/index.js` 为 G1-a 专属）。**R1（人工 3）：主实施后的定向修复单步，串行于 S1 之后，不再划分并行组**——6 文件内三处缺陷修复互为同基线小改动（painter.js 同时承载意见 1/2 两处），拆分无收益；R1 白名单与 G1–G3 各步文件集的关系为交集（painter/editor/scss/main-view/self-checks 均为既有文件的就地修订），无新增共享/生成文件，`self-checks/index.js` 不动（R1 不加新断言组，painter/editor 组内更新）。

## 未解问题

1. 【实施期待用户确认】文档三处同步（skills/mussel-ui/references、docs/quick-reference_*.md、docs-site）的启动时机——项目规约「完成代码实现后，未经用户确认，不更新文档」（范围边界 #15）。本轮新增 API 面（tree/editing UI/新列型/变高）较大，实施后文档同步范围同步扩大，仍需用户确认启动。
2. 【不阻塞，实施期实证】树 + 排序组合的父级侧最佳实践（排序后同父兄弟顺序如何保持树展示合理）——组件侧行为已定义（DFS 按新出现序，A2.4），使用方模式（如排序时保持 parentKey 连续段）属文档/示例范畴，实施期在 demo 树页签补一个排序示例后回注。

## 评审回应（第 1 轮）

输入：`03-review-1.md`（VERDICT: REVISE）。全部条目的事实主张当轮已逐一核对源码确认属实。

| # | 严重度 | 结论 | 处理 |
|---|--------|------|------|
| 1 | major | 接受 | 已核对 input.js:119 `clear(v = null)`、input.vue:7 clear 按钮、combo-wrapper.vue:105-108 `model.value = null`——null 清空路径属实。A5 伪代码①②均加 `value == null → null` 且明确先于 `Number()` 判定；规则要点新增「null 直通（清空语义）」条（引上述证据）；自检加 null 两分支用例（含 enum + rawValue number + value null → null）；demo 数值列（price）加 `clearable`；风险表新增该路径行；测试计划加「clear 图标提交 null」「null 开值无编辑失焦提交仍为 null（非 0）」两条断言 |
| 2 | major | 接受 | 已核对 main-view.vue:295/:341 两处 check 列均无 `disabled`、05-verify-2.md:13 遗留记录属实。改动清单新增 demo check 列 disabled 夹具；check disabled 底衬像素断言基于该夹具（本轮已并入 G2/G3 与测试计划 #8） |
| 3 | major | 接受（评审给的二选一取后者：外部断言） | 已核对 painter.js:694-697 为 `draw` 返回 `paint()` 统计、无 rowCount 比较/throw（唯一 throw 在 :755）。全文统一「painter 外露绘制统计 + 外部断言」表述；库内 throw 方案理由补入被拒绝备选 #6 |
| 4 | minor | 接受 | 已核对目录实为 9 文件（当时口径）。统一「9 文件 = 8 个 js/vue + 1 个 scss」表述（本轮起 12 文件口径见 A7） |
| 5 | minor | 接受 | 夹具改 `records: records.value`（解包 Ref），测试计划注明 |
| 6 | minor | 接受（保留 editorType 闸门） | 伪代码 `editorType === 'input'` 闸门为准；数值列显式 `editor.type:'select'` 走 select 规则；自检补组合断言 |
| 7 | minor | 接受 | 断言上界统一 `ceil(viewH/rowH) + OVERSCAN + 1`（+1 = 非行对齐上缘跨行） |
| 8 | minor | 接受 | bgStrong 加入 colorKeys 计数公式，detail 文案同步 |
| 9 | minor | 接受 | build 验证移至 S1 单次执行；并行组判据不依赖 build |
| 10 | minor | 接受 | 调宽手段改 `browser_run_code_unsafe` + `page.mouse` |
| 11 | minor | 接受 | 测试计划补打开后 `document.activeElement` 断言 |

## 评审回应（第 2 轮）

输入：`03-review-2.md`（VERDICT: REVISE）。三个问题的事实主张当轮已逐一核对源码确认属实，全部接受。

| # | 严重度 | 结论 | 处理 |
|---|--------|------|------|
| 1 | major | 接受 | disabled 底衬断言改**合成色口径**：self-checks/cell-painters.js THEME 补 bgStrong + 固定底色填充后 drawCell 盒中心合成值断言（blendColor 同法本地实现）；测试计划 #8 明确采样点（禁用行、未勾选、盒中心、同行实测行底色、鼠标移开、±2 容差）。评审备选「canvas 与 DOM 版 table 像素自动并排比对」未采纳，**未采纳理由本轮已修正（03-review-3 问题 2）：原表述「DOM table 与 canvas-table 不在同一 demo 页」不成立（10 万行页 main-view.vue:151-164 同页并有 DOM 版参照段）；修正后的理由为跨实现逐像素对齐需处理抗锯齿、字号继承与绘制次序差异，对齐成本高于收益，而合成色口径已直接机器可查；DOM 并排比对保留为可选人工项** |
| 2 | minor | 接受 | MuInput type='number' 事实修正（Vue vModelText looseToNumber）：差距 #1 表述、A5 规则要点、demo 夹具（stock 显式文本输入 / price clearable）、测试计划主/次/回归断言分层全部按核实结论重写 |
| 3 | minor | 接受 | A7 文件树与四维表「lastPaint 断言」残句统一为「lastPaint 统计外露（外部断言来源）」；self-checks/editor.js 旧口径同步列入改动清单（本轮范围扩至 :363，见评审回应人工 1 意见 7） |

## 评审回应（人工 1）

输入：`03-human-1.md`（6 条：1/2/3/4/5/7）+ `03-review-3.md` minor 6 条 + 本设计前版未解 2 条。人工意见逐条按 blocker 对待，全部接受；无可行性障碍，无「不可行」标注。涉及源码事实本轮已复核（tree.vue/default-options.js/tree.scss、input.scss、select.js/option.vue、root.scss、tag.scss/link.scss、canvas-table 全部 9 文件）。

| 意见 | 结论 | 处理 |
|------|------|------|
| 1 tree（props.tree + key/parentKey） | 接受 | 新模块 `tree.js`（A2.4）：平铺 records + `treeProps: { key, parentKey }`（字段可配置对齐 tree 组件 DEFAULT_DATA_PROPS 模式，tree.vue:23-40、default-options.js:1-10）→ childrenMap + 迭代 DFS 展开序平铺（显式栈防爆栈、visited 防环、孤儿挂根）；props `tree`/`treeProps`/`treeExpandedKeys`/`defaultExpandLevel` + 事件 `update:tree-expanded-keys` + 方法 `expandAll`/`collapseAll`/`getTreeExpandedKeys`（A1）；树形列缩进 16px（镜像 tree.scss:3，该变量在 .mu-tree 作用域探针不可达故取常量）+ 箭头绘制与命中（A3.4/A4.3）；**与虚拟滚动交互（与意见 5 交叉，用户点名）**：展开/收起 → 平铺重建 → 行高缓存按 record 引用复用 → 几何 rebuild O(n) → spacer 同步 → 滚动锚定补偿 + scrollTop clamp + editor.commit（A2.4 流程图）；树行为高走同一估高/精算管线。自检 self-checks/tree.js + 测试计划 #11（含锚定不跳动断言） |
| 2 编辑 UI（单击进编辑/hover 感知/边框与边距） | 接受 | **单击进编辑**：A5.2 冲突矩阵逐项分析——与点击选中（同一次 click 先发完整选中链再开编辑，A4.3 序 4）、dblclick（浮层 @dblclick.stop 挡格 → 路径不可达 → 整体删除，被拒绝备选 #11）、列宽拖拽（手柄在表头 + clickGuard 吞拖后 click）、排序点击（isHeader 分区）、check 翻转（NON_EDITABLE_TYPES）全部无冲突或已有机制覆盖；编辑中点他格 = 提交+选中+开新格一步完成（现状行为组合）。**hover 感知**：cursor `text`（resolveCursor 扩展）+ 1px 主色 0.45 内描边（paintOverlay 扩展，hoverMode none 时不画），A5.3。**边框与边距**：浮层改内容区矩形定位，`column.editor.border`（缺省 true）两态均达成「单元格与内容边距一致」：border 态浮层 left = padding−1 + 边框 1px = 文本左缘恰为 padding；borderless 态 transparent 边框 + padding:0 = 精确 padding（A5.4 推导）；scss `__editor--borderless` 白名单覆盖（不触 clear/下拉）；测试计划 #12（事件顺序、两态边距 ≤1px 断言、cursor、回归 clearable/select） |
| 3 预设列类型默认宽度 | 接受 | `TYPE_DEFAULT_WIDTHS`（layout.js 常量，14 类型 + 自定义回退 80，A3.2 表）；作为**弹性列初始宽**参与剩余宽均摊（与 COL_FALLBACK 同位替换，显式 width 仍为硬宽——与现状 solveWidths 语义完全兼容）；不改 table/column-types 注册表（会改变现有 DOM table 默认列宽，被拒绝备选 #9）；测试计划 #13 |
| 4 链接/进度/多按钮/多标签列（颜色可定义） | 接受 | **progress** 新类型（progressOption.color/showText，轨道 bgStrong + 填充 colors[color] + 百分比文本）；**button** 新类型（buttons 数组/函数，tag 同构轻量按钮 17 色 translucent/color 双形态，色体系全复用 tag.scss/root.scss 变量）；**link** 多条 + danger/disabled 变体落地 + multiline 竖排；**tag** 17 色落地（drawTag 解析 mu-tag--{color}）；颜色统一经 theme 快照 `colors` 动态 map（readSnapshot 增 colorNames 参数，root.scss 明暗双态全定义已核）【勘误（评审 4 问题 4）：colors 已改为固定 17 色全量读取、无 colorNames 参数，见 A6.1/被拒绝备选 #14】；**交互**：painter itemHits 命中矩形收集 + click 反查 → 新增 `cell-item-click` 事件（前范围边界 #3 废止）【勘误（评审 4 问题 3）：该事件 DOM 版 table 已有，canvas 为补齐且 payload 键名对齐、tag 亦发，见 A1】；测试计划 #14 |
| 5 多行文本 + 变高行虚拟滚动重设计 | 接受 | **架构重设计**（A2.2/A2.3）：行几何策略模式（uniform O(1) 快速路径保留 + variable 变高模式按列 multiline 自动启用）【勘误（评审 4 问题 7）：模式判定已扩为「multiline 标记或数组值检测（hasArrayValues）」双输入，数组值自动多行无需显式标记，见 A2.2/A3.5】；**行高缓存结构** = Float64Array heights + Fenwick 树前缀和索引（选中前与分段树、朴素前缀和数组三方案对比：更新/查询/定位复杂度 + 代码量 + stk 双文件实证，A2.3 表 + 被拒绝备选 #7/#8）；**脏行标记与按需测量** = `measured` 标记（Uint8Array 语义）+ 准备期全量快速估高（数组值 length 真值 + 字符数短路单行真值 + 长文本 1 行下界估值，无 measureText）+ 进窗 ensureRowMeasured 精算（wrapLines 贪心折行，"仅测量更长的字段"经 estimateLineCount 短路实现）+ wrapCache/measureCache 双缓存；**可视区窗口计算** = visibleRange（offsetToRow 定位起点 + 逐行累加覆盖 viewH ± OVERSCAN）；**滚动锚定与 totalHeight 维护** = 精算/树 toggle 后锚行上方 Δ 补偿 scrollTop、spacer = totalHeight 同步、单调不回缩（渐进精算固有行为入范围边界 #20，全量预计算拒绝 #10）。**与意见 1 交互**：树 toggle 的几何 rebuild/锚定/行高复用（A2.4）。数组值直接多行按行数计高（意见 5 明文，A3.5）；测试计划 #15（窗口断言/滚动条单调/锚定一致性行高公式） |
| 7 遗留问题（review-3 minor 6 + 未解 2） | 接受 | **minor 1**（bgStrong 回退口径不一致）：统一为带回退 `theme?.bgStrong \|\| theme?.hoverBg`——改动清单 cell-painters 行、A6.2 表、风险表、G2（原 G1-b 并入）四处同口径。**minor 2**（第 2 轮回应 #1 未采纳理由事实错误）：保留历史表原文 + 行内勘误括注（DOM table 与 canvas-table 实同页并存 main-view.vue:151-164，理由修正为跨实现对齐成本论），评审回应第 2 轮 #1 行已更新。**minor 3**（概括「number 或 null」与细则矛盾）：方案概述增量 1 与 A1 update:cell-value 行均补「非数值输入保留原字符串、交由 validate 拦截」。**minor 4**（self-checks/editor.js:363 旧口径未列入同步）：G3（原 G1-a 扩容）旧口径同步范围明确扩至 :363（含 :8/:176/:375）。**minor 5**（e2e 像素读取无 dpr 换算）：测试计划 #8 写明 `dpr = canvas.width / getBoundingClientRect().width`、`getImageData(x*dpr, y*dpr)` 口径。**minor 6**（git stash -u 会移走 untracked 基线）：风险表回滚行改为 `cp -r`/robocopy 备份三目录到 .pipeline 外，删除 stash 建议。**未解 1**（文档三处同步）：不可自决（项目规约「未经用户确认不更新文档」），保持未解 #1 + 范围边界 #15，注明本轮 API 扩大后同步范围随之扩大。**未解 2**（MuSelect 下拉高亮相等语义）：本轮核实关闭——单选 MuSelect `provide('select')` 不含 selectedValues（select.js:95-99 仅 mountOption/unmountOption/toggleOption），MuOption `selected = selectedValues?.value.has(...)`（option.vue:26）单选恒 undefined（面板本无选中高亮机制）；multi-select 的 Set.has 严格语义不涉及编辑器；open 字符串化对显示路径宽松命中无害且必要。原「未解问题 2」条目删除，处置记录保留于方案概述遗留段 |

## 评审回应（评审 4）

输入：`03-review-4.md`（VERDICT: REVISE；blocker 2 / major 7 / minor 5）。全部 13 条接受，其中问题 1 的**归组**按可实施性约束微调（改动内容与评审建议一致，见该行）。03-human-1.md 六条人工意见方案零回退；本轮调整中与人工意见相关的两处（tag 点击发事件、数组值多行脱离 multiline 门控）均为**加强**人工意见的满足度，理由见对应行。涉及源码事实本轮已复核（self-checks/interactions.js:23/:361-395、self-checks/index.js:15-29、canvas-table.vue:80、layout.js:70-79/:84-105、table.vue:90、link.js:33-60、tag.js:49-60、painter.js:74-87/:311/:543-572、theme.js:52-72/:136-151、root.scss:46/:55/:101/:111、check.js:3-5、record-number.js:3、tree.scss:35/:74、docs-site/components/table.md:220）。

| # | 严重度 | 结论 | 处理 |
|---|--------|------|------|
| 1 | blocker | 接受（归组微调） | `demo/src/data/canvas-table/self-checks/interactions.js` 列入改动清单（新行）：:23 `resolveCellDblclick` import 删除、:361-395 断言组改写为 `resolveCellClickOpen`/click 语义断言（表体可编辑格 openEditor、表头/列越界/缺省不开）、模块头注释 :8「dblclick 门控」同步，并新增 resolveTreeToggle（hasChildren）/resolveCursor 树槽 pointer/resolveItemClick 断言。`canvas-table.vue` 改动行明确删 :80 import（与 :21/:543-580 一并）。实施步骤：**三处（src interactions.js 删导出、canvas-table.vue 删 import、self-checks 断言组替换）在 G3 原子完成**——评审建议 self-checks/interactions.js 归 G2，但 import 消费方 canvas-table.vue 在 G3，跨步删除导出会使 G2 完成态的 demo ESM 断链（rollup watch 编译失败）、G2 判据不可执行；归组调整不改变任何改动内容，G2/G3 文件集仍两两不相交。风险表「删除 dblclick」行补该同步项。测试计划自检回归行注明 |
| 2 | blocker | 接受 | `TYPE_DEFAULT_WIDTHS` 接入位置重写（改动清单 layout.js 行、A3.2）：**定宽链 `widthOverrides ?? col.width ?? type.width`（layout.js:70-72）完全不动**——check/rec_no（type.width 50px）保持定宽；仅 `px == null` 的弹性分支初始宽由 COL_FALLBACK 换为 `TYPE_DEFAULT_WIDTHS[type] ?? COL_FALLBACK`（layout.js:76-78 else 分支同位替换）。check/rec_no 移出 TYPE_DEFAULT_WIDTHS 表（其宽走 type.width，与现状一致）。测试 #13 按评审建议重写：宽容器逐列 **≥** 默认宽（均摊拉伸）；容器宽 = Σ 时相等；窄容器 = 默认宽 + 横向滚动（现状 solver remain ≤ 0 不拉伸不收缩）；**回归断言「未配 width 的 text 列在宽容器被拉伸」+「check/rec_no 恒 50px」**。self-checks/layout 断言同步（type.width 优先、弹性基线）。风险表新增回归行 |
| 3 | major | 接受 | A1 `cell-item-click` 行重写：标注「**DOM 版 table 已有（table.vue:90），canvas 版本期补齐**」；payload 对齐 DOM 版键名——link 列 `{ record, column, link }`（link.js:60）、tag 列 `{ record, column, tag }`（tag.js:60）、button 列 `{ record, column, button }`（canvas 扩展），`recordIndex` 为 canvas 附加键（不破坏既有处理器迁移）；**tag 点击与 DOM 版一致发事件**（修订前稿「tag 不发」废止，A3.3/A4.3/A8 #3 同步）；`'...'` 超限省略条目不命中（DOM 版 dots 无 events.click，link.js:38-44/tag.js:50-53）；disabled 不发。测试 #3/#14 同步（tag payload 键名、dots 只发 cell-click）。与人工意见 4 不冲突且加强一致性（意见 4 只要求呈现与颜色，点击行为以 DOM 版为准是任务约束 1 的直接要求） |
| 4 | major | 接受 | `colors` 来源与刷新契约重设计（改动清单 theme.js 行、A6.1、被拒绝备选 #14）：**固定读取全 17 色**（12 基础 + 5 语义，每色 color + translucent 双形态，34 次 getComputedStyle 一次探针批次完成）——记录级色（tag.js:53 `tag.color`）与 `(record)=>` 配置（buttons/progressOption）在列准备期不可见，收集式动态 map 必然漏色；固定全量使记录级色名即时可用。`readSnapshot(probe)` 签名不变（无 colorNames 参数）；colors 随任何一次 readSnapshot（挂载/暗色切换/DPR/refreshTheme）一并重读，无 columns/records 触发刷新的需求（`getThemeSnapshot().colors` 恒不过期）。非法色名改绘制期查表回退（tag 灰底/progress/button primary），风险表该行重写。self-checks/theme 断言固定 17 色；测试 #8 同步；#14 补记录级色断言 |
| 5 | major | 接受 | theme 快照固定字段 19 → **21**：`textColorMuted: readVar('--mu-text-color-muted')`（root.scss:46/:101）、`bgDisabled: readVar('--mu-bg-disabled')`（root.scss:55/:111）——A6.1 表、A1 getThemeSnapshot、A6.2（link/button disabled 色改引快照字段）、改动清单 theme.js/cell-painters.js 行、G1-b 判据、self-checks/theme 计数与 detail、测试 #3/#8/#14（disabled 底 bgDisabled、文字 textColorMuted 像素断言）全链同步 |
| 6 | major | 接受 | `demo/src/data/canvas-table/self-checks/index.js` 列入改动清单（新行）：import 并注册 text-wrap/row-geometry/tree 三组（index.js:15-29 现状 6 组 → 9 组），模块头注释同步；归 G1-a 文件集；G1-a 完成判据改为可观察（面板出现三组组名并全绿）；测试计划 #15/自检回归行注明 9 组 |
| 7 | major | 接受 | **数组值自动多行定为无条件行为**（意见 5 原文「若字段值是数组，直接渲染成多行，按行数计算高度」）：A3.5 重写——两种触发互相独立（显式 multiline 管字符串换行；数组值自动多行无需任何标记，`_isArrayLines` 逐行判定即实现「无条件」）；**variable 模式判定扩为 `_multiline` 存在或估高扫描 `hasArrayValues`**（A2.2：computeRowHeights 全量估高遍历顺便产出，准备期先于几何创建故初始判定正确；后续变更引入数组值 → 该行重估发现 → 升级 variable + 全量快速重估 + rebuild + 锚定；**模式只升不降**避免抖动）；「其他类型忽略」与「任何文本呈现列均可 multiline」的矛盾消除——统一为：文本呈现列可 multiline/数组多行，图形条目列（check/tag/img/progress/button）单行高、数组值走 items 语义。A2.2 数据变更契约①②补升级路径；风险表新增模式升级行；测试 #15 补「未配 multiline 的数组值列」与「编辑提交引入数组值」用例。比修订前更贴合人工意见 5 的字面要求，非回退 |
| 8 | major | 接受 | 测量与折行消费链闭环（改动清单 text-wrap/row-geometry/theme/painter/cell-painters 行、A2.2、A7）：**theme.js 新导出 `createTextMeasurer()`**（离屏 canvas 2d ctx + 现有 `createMeasureCache`（theme.js:136-151，painter.js:74-87 现状消费方）包装 → `measure(text, font)`）；组件壳创建单实例，注入 row-geometry（computeRowHeights/ensureRowMeasured 增 `measure`/`wrapCache` 参数）与 painter state；**text-wrap 为纯函数模块（measure 为参数，零 canvas 依赖）**，A7 例外补记：row-geometry 与 cell-painters import text-wrap（纯函数引用，同 layout import table utils 先例）；painter 私有 `measureText` 单行测量不动。行高计算与 drawText 用**同一 wrapLines + 同一 wrapCache**——行数单一事实源，高度与绘制必然一致。self-checks「注入计数 measure」经参数注入即可成立（text-wrap/row-geometry 两断言文件注明） |
| 9 | major | 接受 | itemHits 修正（改动清单 painter.js 行、A3.3、风险表、self-checks/painter、测试 #14）：**粒度改 (row, col) 二级 Map**（外层 Map<row, Map<col, Array<{kind, index, rect}>>>，内层按 (row,col) 整组替换）——全幅/脏区绘制的滚动区与固定列两次 pass（painter.js:568-572/:311、:543-548）写不同 col 键不互覆；**每次绘制批次结束按当前窗口行 [start, end) 裁剪**，Map 大小 O(窗口行 × item 列)，长滚有界；click 先判行在窗口内。验证：self-checks/painter 断言双 pass 后两区条目并存 + 连续滚动绘制后行集合 ⊆ 最新窗口（内存约束以模块级断言落地——比 e2e 内存采样可精确判定）；e2e #14 增「固定列 + 非固定列 link/button 分居两区均命中」用例（demo 夹具新增 fixedLeftColumns ≥ 1 组合）；风险表该行按新口径重写 |
| 10 | minor | 接受 | `buildFlatRows` 产出增 **`hasChildren` 平行数组**（tree.js 行、A2.4、A3.4）：树形列绘制（父行箭头/叶行空槽）、`resolveTreeToggle`（`hasChildren[row]` 判定）、`resolveCursor`（箭头槽 `pointer`，A5.3 补承诺）三消费方统一来源，免 O(n) 反查；tree.scss 引用修正为 :35（`pointer-events: auto`）/ :74（disabled `none`）；self-checks/tree 补 hasChildren 断言、self-checks/interactions 补箭头 cursor/叶行不 toggle 断言；测试 #11 补叶行空槽 cursor 断言 |
| 11 | minor | 接受 | 改动清单 editor.js 行的 `computeEditorStyle` 简写统一为 A5.4 完整表达式（`left = colLefts[i] − (i < fixedCount ? 0 : scrollLeft) + (border ? padding − 1 : padding)`）；self-checks/editor.js 新增固定列 + 横向滚动用例（`i < fixedCount` 不减 scrollLeft，scrollLeft > 0 两态对照，G3 步骤注明）；测试 #12 补「固定列编辑浮层横向滚动后不错位」断言 |
| 12 | minor | 接受 | 行高公式补 **multiline link 分支**（A2.2 lines(row)、row-geometry computeRowHeights）：行数 = render 求值后条目数（含 `max` 截断 '...' 合并计数，A3.3），估高期真值（render 为轻量数组构造，与绘制期同款调用，行高缓存按 record 引用复用）；A3.3 link 行同步「行数 = render 条目数」；测试 #15 补 multiline link 行高断言；self-checks/row-geometry 补 items 计数断言 |
| 13 | minor | 接受 | **watch 契约补三 prop**（改动清单 canvas-table.vue 行、A2.4）：`tree` 切换 → displayRows 切换 + 几何 rebuild + spacer + 锚定 + 整幅重绘（关→开展开集保留）；`treeProps` 引用变化 → 展开集语义失效清空 + defaultExpandLevel 重解析 → childrenIndex/displayRows 全链重建；`treeExpandedKeys` 引用变化覆盖内部 Set → 重建（既有描述明确入 watch 表）。demo 树页签加 tree 开关/treeProps 切换控件；测试 #11 补两组切换断言 |

## 评审回应（评审 5 + 人工 2）

输入：`03-review-5.md`（VERDICT: REVISE；blocker 2 / major 7 / minor 6，共 15 条）+ `03-human-2.md`（人工意见 4 条，每条按 blocker 对待）。**15 条评审问题全部接受（问题 1/5 经人工 2 意见直接解决，其余按评审建议或其等价方案处理）；人工 4 条全部接受、无"不可行"项**。03-human-1.md 六条人工意见方案零回退（确认段见本节末）。涉及源码事实本轮已复核（layout.js:53-108/:139-146、interactions.js:38-60、painter.js:110-127/:594-596、canvas-table.vue:1-56/:285-345、editor.js:43-160/:189-206、input-types.js:3、form-field.vue:12/:61-80、input.vue:6、input.scss:12-30/:90-110/:176-185、root.scss:1-9/:33-40/:92-95、tag.scss:28-45、link.js:26-63、tag.js:26-63、text.js:3-34、tree.vue:25-40、tree-node.vue:100-106、form/index.js 导出名全集）。

### 03-review-5.md 15 条

| # | 严重度 | 结论 | 处理 |
|---|--------|------|------|
| 1 | blocker | 接受（人工 2 意见 1 直接解决） | `TYPE_DEFAULT_WIDTHS` 升级为**每类型 `{ width, minWidth }` 双值**（A3.2 表）；弹性分支改 `clamp(base.width, col.minWidth ?? base.minWidth, max)`——**同位替换初始宽基线与 layout.js:77 的 `col.minWidth == null ? COL_FALLBACK` 80px 隐式下限**（bool 60 生效）；`typeNameOf(col)`：字符串 type（含 undefined/空串）→ type 名（**无 type 回退 'text'，与 resolveColumnType(undefined) 回退 TextColumn（index.js:33）一致，A3.2 表 text 行注明**）；对象/函数 → `_fallback`（80/40）。定宽分支 min（`col.minWidth ?? 0`）不动。调宽下限缺省同步取类型最小宽（A4.1）。self-checks/layout 补 bool 60/无 type 160/minWidth 覆盖断言；test #13 重写；风险表该行扩最小宽口径。**人工 2 意见 1 原文即要求"同时指定最小列宽（列定义可覆盖）"**——col.minWidth 显式值覆盖类型最小宽为指定语义 |
| 2 | blocker | 接受（取评审建议 B，经人工 2 意见 2 重构后自然消解） | canvas 多行入口改为 **`maxLines`**（人工 2 指定字段）：用户不再需要 DOM 风格 `multiline`+`lineClamp` 组合即可多行（TextColumn 无 multiline 时返回 `{ text: value }`（text.js:5-6）直走 drawText，无 items 分支问题）；**DOM 风格兼容路径仍闭环**：`multiline+lineClamp` 配置经等效映射 `_maxLines = lineClamp ?? 10`（A3.5），TextColumn 该组合返回的单 `line-clamp` item（text.js:19-29）由 **drawCell 识别"单 item + line-clamp class"形态改道 drawText 多行**（评审建议 B——保留 enum/date 等格式化 render，绕开 items 路径）；self-checks/cell-painters 补 maxLines 钳制与 line-clamp 改道断言；test #15 补 DOM 风格兼容列断言 |
| 3 | major | 接受（评审建议 A：rowGeometry 缺省回退） | `layout.js` 的 `computeViewRows`/`rowAt`/`relayout` 的 `rowGeometry` 参数改**可选**：未传时经新导出 `resolveRowGeometry({ rowGeometry, rowHeight, rowCount })` 构造 uniform 几何（等高算式恒等）——G2 完成态组件壳（canvas-table.vue:293-305/:332-337 现行调用传 rowHeight/rowCount）行为不变，demo 绘制/命中可用，**G2 判据"dblclick 链保持现状可用"恢复成立**；G3 接线真实几何。self-checks/layout 补"未传 rowGeometry 回退等高"断言；风险表新增 G2 中间态行；G2 判据原文补该保证 |
| 4 | major | 接受 | **dots `'…'` 条目改为命中发事件**，payload 值 = `'…'`——已核对 DOM 版 `events.click` 绑定在 dots/常规条目 if/else 之后、对全部条目生效（link.js:46-47 `item.text = link = '...'` 后 :59-60 绑定；tag.js:46-47/:59-60 同款；table-row.vue:18 `v-on="item.events"` 全量绑定）。A1/A3.3/A4.3/改动清单（cell-painters 回报、interactions 命中、painter 收集）全链同步；前稿引证 link.js:38-44/tag.js:50-53"dots 无 events.click"废止；test #14 改为断言 dots 命中发事件 + 值 `'…'`【勘误（评审 6 P4）：dots 字符已统一为三点 `'...'`（DOM link.js:47/tag.js:46 字面值），本行 `'…'` 口径废止，现行口径见 A1/A3.3/A4.3/test #14】；self-checks/painter 补 dots 收集断言。**disabled 条目维持"只续链不发"**（canvas 避免禁用项误触；DOM 版 disabled 链接仍绑定 click——该差异明示于 A1 与 A8 #12 注，非隐藏行为） |
| 5 | major | 接受（人工 2 意见 2 直接解决） | **link 列定为条目列，从"文本呈现列"列表排除**（A3.5 列分类——评审建议方案一）：数组值（字符串/对象）→ items 竖排每条一行，行数 = `min(render 条目数, _maxItems)`（A2.2 行高公式 link 分支唯一化，删除"文本呈现列数组值→value.length"对 link 的适用）；单值 → 1 行；单条 caption 不换行。绘制路径 = drawItems 竖排（cell-painters link 分支）；测试 #15 补 link 数组行高断言、self-checks/row-geometry 补 link min(count, maxItems) 断言。与人工 2 意见 2"text/link 列数据支持数组 + link 字符串/对象数组"一致——text 列走文本呈现规则、link 列走条目规则，双列各自唯一归属 |
| 6 | major | 接受 | **canvas 专属类型表分发**：`CANVAS_ONLY_TYPES = { progress, button }` 在 `resolveColumnType` 之前查询（cell-painters prepareColumn），返回 `{ canvasKind, value | buttons }`；drawCell 按 canvasKind 分发 drawProgress/drawButton——**不再被 column-types/index.js:33 回退 TextColumn 绘制文本**。取值定义：progress `value = _value(record) ?? record[field]` 钳制 [0,100]、progressOption ensureFn；button `buttons = ensureFn(column.buttons)(record)`、条目 color/disabled。button 条目矩形回报 itemHits（kind:'button' 可点击）；progress 不回报、单行高。**"items 7 类"表述修正**为"绘制类别 = 文本 + items 四类（check/link/tag/img）+ canvas 专属分发（progress/button）"（A3.1 差异 ②、A7、A8 #12）。self-checks/cell-painters 补 canvasKind 断言；test #14 补"render 产物为进度条绘制（非文本）" |
| 7 | major | 接受 | `computeRowHeights`/`ensureRowMeasured` 签名增 **`treeIndents(row)` 回调**（无树传 null）：树形列 contentWidth = 列宽 − `(16 × level + 16)`（A2.4 树+多行组合、A2.2 行高公式注明）；组件壳组装回调传入（改动清单 canvas-table.vue 行）。self-checks/row-geometry 补 inset 扣减断言；test #11 补树形列长文本行高断言；demo 夹具补树+maxLines 组合；风险表新增该行 |
| 8 | major | 接受 | `defaultExpandLevel` 语义定为 **0-based `nodeLevel <= defaultExpandLevel`，对齐 tree 组件**（tree.vue:3 根 `:level="0"`、tree-node.vue:100-106 `props.level <= level` 且 `expandLevel ?? -1`——本轮已核对）；缺省 0 = **展开根层级**（显示一级子节点），-1 = 全收起。A1 prop 行、A2.4、tree.js resolveInitialExpandedKeys、self-checks/tree（0/1/-1 三态断言）、test #11（defaultExpandLevel 边界断言）五处同口径；A1 旧表述"0 = 全收起"废止（该 prop 为本期新增，无既有使用方可回归） |
| 9 | major | 接受 | `cellRectAt`（painter.js:120-127）height 改 `rowGeometry.heightAt(row)`、`paintCellRange` 每格 rect.height 同源、`paintCellRegion` 裁剪高由 `layout.rowHeight + 1`（painter.js:594-596）改 `heightAt(row) + 1`——等高下恒等（改动清单 painter.js 行明列）。self-checks/painter 补变高 cellRectAt/裁剪断言；test #15 变高行条目居中经 getCellRect（height = heightAt）覆盖；A1 getCellRect 行同步 |
| 10 | minor | 接受 | colors 计数与引证修正（A6.1、遵循约定节、self-checks/theme、theme.js 改动行）：**17 色 = 12 彩色基础（排除 gray）+ 5 语义**，色名集合与消费先例引 **tag.scss:28-45**（gray 为回退不入 map）；root.scss:1-6 `$BASE_COLORS` 实为 13 色（含 gray）的表述修正；translucent 引证修正：基础色 :33-35（`.mu-root,.mu-light` 块定义、暗态继承该定义），语义色明态 :37-40 + 暗态覆盖 :92-95（前稿"root.scss:33-40/:92-95 明暗双态全定义"含混表述废止）。test #8/#14 与 self-checks 的 17 色断言口径同步"12 彩 + 5 语义" |
| 11 | minor | 接受 | A2.5 断言口径改**"最近一次整幅绘制"**：明确 lastPaint = 最近一次绘制调用（整幅或脏区，painter.js:675/:678/:680-687 分支返回）——脏区 rowCount 为脏区行数；test #4 断言前先触发整幅（`recordsVersion++`/`refreshTheme()`）再读取；painter 改动行注释同步（A2.5 已重写） |
| 12 | minor | 接受 | **`hitTest` 返回值增 `x, y`**（interactions.js:38-60 现状返回 `{ isHeader, colIndex, rowIndex, resizeCol }` 无坐标——透传输入指针坐标，零成本）；`resolveTreeToggle` 用 `hit.x`（树槽判定）、`resolveItemClick` 用 `hit.x/hit.y`（矩形反查）——改动清单 interactions.js 行、A3.4、A4.3 写明；self-checks/interactions 补 hit.x/y 断言 |
| 13 | minor | 接受 | **paintState 契约明列**（改动清单 painter.js 行、canvas-table.vue 行、A2.1）：`displayRows`（树开 = 平铺行数组 / 树关 = records 原序——painter/interactions/editor 全消费方经此取行）、`flatInfo: { levels, hasChildren }`（树关 = null）、`expandedKeys`、`tree`、`isCellEditableFn`、`editable`、`measure`、`wrapCache`——`flatInfo.hasChildren[row]` 的数据来源（canvas-table.vue:203-221 现状 state 契约扩展）与自检夹具同步列明 |
| 14 | minor | 接受 | `computeEditorStyle` 高度公式按编辑器类型分支（A5.4）：**switch `editorH = controlHeight`（无 border 2px 加成）且 `bordered = false`**——"border 字段忽略"具体化为高度与形态两处；textarea 分支（占满内容区高 + clamp 上限）同节定义。self-checks/editor 补 switch 高度断言（editor.js:189-206 现状 style 仅定位的证据已核）；test #12 补 switch/textarea 浮层高断言 |
| 15 | minor | 接受 | **契约⑤扩容**（A2.2 数据变更契约⑤、A6.1、改动清单 theme.js/canvas-table.vue 行）：行高失效维度增"主题/字号/行高变量刷新（themeWatcher onChange/refresh，theme.js:158-175/:209-214 现状回调链）"——快照 font/lineHeight 变化 → wrap 缓存 key 含 font 自动失效 → 全量快速重估 + rebuild + 窗口重精算 + 锚定；test #8 补"根字号/--cell-line-height 覆盖后 variable 行高重估跟随"断言 |

### 03-human-2.md 4 条（按 blocker 对待）

| 意见 | 结论 | 处理 |
|------|------|------|
| 1 默认类型列宽 + 最小列宽 | 接受 | `TYPE_DEFAULT_WIDTHS` 每类型 `{ width, minWidth }` 双值（A3.2 表 13 行，含 img/image 别名与 `_fallback`）；接入 solveWidths 弹性分支同位替换初始宽与 80px 隐式下限（layout.js:77）；`col.minWidth` 显式值覆盖（"列定义可覆盖"）；无 type 列回退 text 条目（160/80）；调宽下限缺省同步（A4.1）。已同时关闭 03-review-5 问题 1（blocker）。测试 #13、self-checks/layout、风险表同步 |
| 2 text/link 数据形态 + maxLines/maxItems + textarea 编辑 | 接受 | **数据形态**：text/link 列 value/字段值支持文本、数字、数组（数字 String 化显示）；link 支持字符串数组与对象数组（`{ caption, color, danger, disabled }`——对象设置链接颜色等，A3.3/A3.5）。**maxLines**（1–10，缺省 1）：字符串值换行、超限末行 '…'（wrapLines 内钳制 + 末行收缩复测，text-wrap.js）；**maxItems**（1–10，缺省 10）：数组/条目超出时第 maxItems 项 '…'（对齐 DOM link.js/tag.js dots 语义）。**行高/绘制/编辑统一**：A2.2 行高公式（文本呈现列 vs link 条目列分支）、A3.5 规则、drawText/drawItems 路径、编辑器映射（open 数组或 maxLines>1 → textarea）四处一致（关闭 03-review-5 问题 2/5）。**textarea 核实结论**（意见原文要求核实）：mussel **无独立 textarea 组件**——form/index.js 导出全集 17 项无 textarea、MuInput 模板硬编码单行 `<input>`（input.vue:6）；库内既有多行输入约定 = form-field `INPUT_TYPES.memo`：原生 `<textarea class="mu-input">` + v-model（input-types.js:3、form-field.vue:12/:61-80 `:is` 挂载原生标签）——**编辑浮层复用该约定**（`EDITOR_COMPONENTS.textarea = 'textarea'` + 浮层 scss 覆盖高度/resize），v-model 接口与 MuInput 同为 vModelText 语义，提交矩阵 Enter 换行/Ctrl+Enter 提交/Esc/blur 兜底（A5.5）；**数组值编辑 = 换行分割成数组**（开值 join('\n')、提交 split('\n')，规整层 ④⑤）；link 列移出 NON_EDITABLE_TYPES（可编辑，对象数组开值取 caption、提交字符串数组——属性不保留入 A8 #21）。测试 #7/#15、self-checks（text-wrap/row-geometry/cell-painters/editor）、demo 夹具（textarea 验证区/link 三态）同步 |
| 3 各处颜色支持内置色板 | 接受 | **内置色板 = 17 色（12 彩色基础 + 5 语义），经核实**：root.scss `$BASE_COLORS` 13 色（含 gray）+ `$SEMANTIC_COLORS` 5 色；消费先例 tag.scss:28-45 色类体系 = 12 彩色 + 5 语义（gray 为回退）——colors 快照固定 17 色全量读取（A6.1，03-review-4 问题 4 既定方案，本轮修正计数与引证=03-review-5 问题 10）。**适用面**：`progressOption.color`、`buttons[].color`、`tag.color`/`tagOption.color`、**`link.color`/`linkOption.color`（本期新增字段）**、link `danger` 变体——全部绘制期按名查表（记录级 `(record)=>` 与条目级配置即时可用），未知名回退（tag 灰底 / progress/button/link 缺省 primary）。测试 #14（17 色抽样 + 记录级色）、self-checks/theme（17 色形态断言）同步 |
| 4 其余问题按建议或自行查证的更佳方案 | 接受 | 03-review-5 全部 15 条逐条关闭（见上表）：问题 1/5 由意见 1/2 直接解决；问题 3 取评审建议 A（rowGeometry 缺省回退——比"组件壳最小接线并入 G2"改动面更小且 G2 判据恢复成立）；问题 2 取评审建议 B（line-clamp item 改道 drawText——比"resolveCellContent 前绕过 render"保留 enum/date 等格式化能力）；问题 4/6/7/8/9/10/11/12/13/14/15 均按评审建议落地（问题 4 的 disabled 条目差异明示为已知差异，dots 部分与 DOM 逐字对齐） |

### 03-human-1.md 六条不回退确认

本轮（人工 2 修订 + 评审 5）对人工 1 六条的调整均为**强化满足或按用户后续指令演进**，无回退：

- **意见 1 tree**：无回退。新增细化：defaultExpandLevel 语义修正为对齐 tree 组件 0-based（A1 旧表述"0=全收起"自相矛盾的修正，非能力缩减）；树+多行行高经 treeIndents 计入缩进（评审 5 问题 7，强化）。
- **意见 2 编辑 UI**：无回退。新增：switch/textarea 编辑器高度分支（A5.4 精化）；textarea 为**新增**编辑器形态（人工 2 意见 2），单击进编辑/hover 感知/边距一致均保持。
- **意见 3 默认宽度**：无回退，**强化**（人工 2 意见 1）：默认宽之上叠加类型最小宽 + 列定义覆盖 + 80px 隐式下限修正 + 无 type 回退。
- **意见 4 新列型与颜色**：无回退，**强化**（人工 2 意见 3）：颜色统一 17 色板（含 link.color 新字段）；dots 条目点击对齐 DOM 发事件（评审 5 问题 4，修正前稿与 DOM 的不一致，更贴合"与现有 table API 一致"约束 1）；progress/button 经 canvas 专属分发真实绘制（评审 5 问题 6，前稿"仅 drawProgress/drawButton 无分发"的补全）。
- **意见 5 多行与变高**：无回退，**按人工 2 意见 2 演进**：多行门控从 multiline/lineClamp 改为 maxLines/maxItems（用户指定新 API，DOM 风格配置经等效映射兼容——能力覆盖面不减）；"数组直接渲染成多行、按行数计高"原文语义保留并扩展（数字数组、maxItems 上限）；高性能测量方案（短路 + 按需精算 + 缓存 + Fenwick + 锚定）全部保留；多行编辑从"未来扩展"升级为本期 textarea（强化）。
- **意见 7 遗留问题**：无回退。本轮处置的 15 条评审问题全部关闭，未新增遗留；前轮未解 2 条维持（未解 #1 文档同步待用户确认；未解 #2 已于前轮核实关闭）。

## 评审回应（评审 6）

输入：`03-review-6.md`（VERDICT: REVISE；blocker 1 / major 5 / minor 5，共 11 条，定向修订）。**11 条全部接受，无"不接受"、无"不可行"项**；blocker 1 按评审建议①扩改动面至 table 共享文件（link.js + link.scss），其余按评审建议或等价方案处理。03-human-1/2 人工意见方案零回退（确认段见本节末）。涉及源码事实本轮已复核（link.js 全文（:9-15 valueToLinks 包 caption、:18 linkOption 解构、:50 item 解构、:46-47/:59-60 dots 与绑定）、link.scss 全文、tag.scss:28-45、text.js:13-17/:19-29、interactions.js:14-15/:38-60/:70-75/:221-226、canvas-table.vue:455/:604-630、layout.js:53-108、form/index.js 全文（20 项导出）、input.scss:180-181/:248-252）。

| # | 严重度 | 结论 | 处理 |
|---|--------|------|------|
| 1 | blocker | 接受（评审建议①：改 link.js，扩展为 link.js + link.scss 双文件） | **改动清单新增"共享文件（2）"表**：`src/components/table/column-types/link.js`——① `valueToLinks`（:9-15）数组元素 `el != null && typeof el === 'object'` 原样保留（现状包 `{ caption: el }` 令对象元素 caption 为对象，DOM 渲染 `[object Object]`），字符串/数字仍包 `{ caption: el }`；② `linkOption` 解构（:18）增 `color: _color`；③ item 构造（:50）解构增 `color = _color`，`if (color) itemClass.push('mu-link--' + color)`（tag.js:49-56 同款机制）。`src/styles/link.scss`——增 16 新色类（4 语义 `var(--mu-{v}-color)` + hover `--mu-{v}-color-4`、12 彩色 `var(--mu-{v})` + hover 同色，@each 对齐 tag.scss:28-45）+ danger 既有规则（:13-19）保留，合计 17 色全覆盖。**danger 不入 @each**：重复生成会同特异性后定义胜出，把既有 hover 变浅（`--mu-danger-color-4`，:17）覆盖为同色（DOM 版 `linkOption.danger` 既有列回归）；语义色 hover 用 `-4` 的依据 = root.scss:23-25 语义色 0–9 数字谱系全定义（初稿"仅 primary 有 `-4` 先例（:8）"经本轮复核不准——:8 与 :17 两处先例，12 彩色确无数字变体）。**canvas 取色路径 = drawItems 解析 item `attrs.class` 的 `mu-link--{color}` 名 → 快照 colors 查表**（与 drawTag 解析 `mu-tag--{color}` 同款）——三层路径（link.js 解析 → class 产出 → canvas 查表/DOM scss）写入 A3.3 link 行。**DOM 版兼容策略**：改动为纯增量 + 坏行为修复——未配对象数组/color 的既有列零变化（字符串/数字/单值、linkOption.max/danger/disabled、class/style、showTitle、events.click 逐行保持）；对象数组从 `[object Object]` 修复为 caption 文本（`isValidLink` 对象元素有 caption 即有效）；色类为新 class 名无既有使用方（danger 不新写，既有规则保留不动）。**回归断言三层**：self-checks/cell-painters 的 LinkColumn compile 产物断言（模块级，对象数组 caption/class/dots '...'/字符串数组不变/linkOption.color 落 class）；demo DOM 参照段（main-view.vue:151-164）link 对象数组 + color 列 e2e（getComputedStyle 色 = 色类值）；`demo/src/data/table/`、`table-advanced/` 现有 link 用例目测。影响面入 A8 #22；风险表新增专项行；回滚行补 `git checkout --` 两文件（git 已跟踪且工作区干净）；G2 文件集并入（与 cell-painters 断言原子，见并行组划分段）。评审建议②（canvas 专属适配）列为被拒绝备选 #18（丢 DOM 管线复用 + DOM 版坏显示不修 + 双实现漂移）。test #14 补对象数组像素断言与 DOM 参照回归；A1 payload 补对象形态（link 值 = 条目对象） |
| 2 | major | 接受（评审建议第二项：壳传入） | 真实 clamp 位置核实 = `resolveResizeWidth`（interactions.js:221-226 `minWidth ?? RESIZE_MIN_WIDTH`），`findResizeColumn` 仅命中检测——前稿"改 findResizeColumn"表述废止。**接入 = layout.js 新导出 `resolveTypeMinWidth(col) = TYPE_DEFAULT_WIDTHS[typeNameOf(col)]?.minWidth` + 组件壳 `startResize` 传参（canvas-table.vue:628 现状 `minWidth: getPixelNumber(col.minWidth)`）改 `getPixelNumber(col.minWidth) ?? resolveTypeMinWidth(col) ?? RESIZE_MIN_WIDTH`**；`resolveResizeWidth`/`RESIZE_MIN_WIDTH` 不动（40 兜底仍由其承接）。改动清单 layout.js/interactions.js/canvas-table.vue 行、A3.2 语义段、A4.1 全部改写为该口径；self-checks/interactions 补 resolveResizeWidth + resolveTypeMinWidth 组合 clamp 用例（text 80/bool 40/col.minWidth 优先）、self-checks/layout 补 resolveTypeMinWidth 断言；G2（导出）+ G3（传参）分步落地；风险表新增接线遗漏行；测试 #6 拖拽下限断言保持 |
| 3 | major | 接受（评审建议第一项：hit 增 cellX） | **`hitTest` 返回值增 `x, y, cellX`**——cellX = `x − (colLefts[colIndex] − (colIndex < fixedLeftColumns ? 0 : scrollLeft))`（colIndex ≥ 0 时，否则 null；colLefts/scrollLeft/fixedLeftColumns 均为 hitTest 现有入参，零新增输入）；**`resolveTreeToggle({ hit, columns, flatInfo })` 判定改 `hit.cellX`**（`cellX < flatInfo.levels[hit.rowIndex] × 16 + 16` 槽内且 hasChildren——前稿 `hit.x − 列左` 在纯函数内无布局上下文不可实现，废止）；**`resolveCursor` 签名扩第三参 `context = { flatInfo, editable, isCellEditableFn }`**（context 缺省时行为与现状一致——回归安全）。A3.4/A5.3/改动清单 interactions.js/canvas-table.vue 行（:455 调用传 context）写明签名；self-checks/interactions 补槽内/槽外/父行/叶行/cursor context/cellX 固定列与滚动区两态断言；测试 #11 补槽位精确断言（槽内 toggle、槽外走选中链） |
| 4 | major | 接受（统一为 DOM 的 `'...'`） | DOM 实际赋值核实（link.js:47 `item.text = link = '...'`、tag.js:46 同款，三点 ASCII）。**条目级 dots 全文统一 `'...'`**：A1（payload 值）、A3.3/A3.4/A4.3、改动清单（cell-painters 回报/painter 收集/interactions 命中）、test #3/#14、风险表 dots 行、self-checks/painter（收集断言固定字符）、self-checks/cell-painters、self-checks/interactions 同步。**canvas 自己的 maxItems 路径同字符**（不另造）——两条路径（DOM option.max 截断与 canvas maxItems 截断）产出一致，断言统一。**文本视觉省略（wrapLines 末行收缩、单行超宽省略）保持 `'…'`（U+2026，cell-painters.js:41 ELLIPSIS 现状常量，CSS ellipsis 视觉同款）**——"数据条目字面文本 `'...'`（payload 回传值）与视觉省略号 `'…'` 两类字符二分"在 A3.5 明确（防实施者混淆）。评审 5 历史回应表 #4 行按先例保留原文 + 行内勘误括注 |
| 5 | major | 接受（复用已解析 min 的等价写法） | 伪代码修正为 `clamp(base.width, col.minWidth == null ? base.minWidth : min, max)`——`min = getPixelNumber(col.minWidth) ?? 0` 为 layout.js:62 循环头部现状已解析值，`col.minWidth` 存在但不可解析时按现状语义（:77 `col.minWidth == null ? COL_FALLBACK : min`）用 0；与评审建议 `getPixelNumber(col.minWidth) ?? base.minWidth` 的差异仅在"存在但不可解析"分支（评审写法回退 base.minWidth、本写法回退 0）——取现状语义保持（不可解析字符串本属配置错误，现状行为 0 即无下限，不为配置错误引入新回退链）。A3.2 伪代码/改动清单 layout.js 行/方案概述条目 3 改写；self-checks/layout 加 `'80px'` 字符串用例（断言结果为 Number 非 NaN）；测试 #13 补字符串 minWidth 断言；风险表 TYPE_DEFAULT_WIDTHS 行扩该口径 |
| 6 | major | 接受（评审建议"按 record 求值"路径） | prepareColumn 改挂 **`_resolveMaxLines(record)` 闭包**：`col.maxLines != null` → 常量 clamp；否则 `col.multiline` → `clamp(ensureFn(col.lineClamp)(record) ?? 10, 1, 10)`（与 text.js:13-17 render 内求值同款 ensureFn 语义）；其余 → 1——**不在列准备期求值函数列**（无 record，函数形态只得 undefined 回退 10，前稿 `legacyFallback = ensureFn 求值 col.lineClamp ?? 10` 表述废止）。三消费方同源：drawText（含 line-clamp item 改道路径——与 render 内 `--line-clamp` 求值同函数恒等，不读 item style 以保持单一事实源）、computeRowHeights/ensureRowMeasured（经内部列消费闭包）、editor textarea 判定（A5.1/A5.5）。**模式判定**（A2.2/A3.5）改 `columns.some(col => col.maxLines > 1 || (col.multiline && col.lineClamp != null))`——配置存在即入候选，不求具体值。`_maxLines` 常量标记保留（col.maxLines 显式时，供快速路径）。self-checks/cell-painters + row-geometry 补函数形态用例（`(record)=>record.deep?3:1` 两条 record）；demo 夹具补函数 lineClamp 列；测试 #15 补断言；风险表新增求值不一致行 |
| 7 | minor | 接受（records/keyOf/parentKeyOf 列入输入 + BFS 计层） | `resolveInitialExpandedKeys` 签名扩为 `{ treeExpandedKeys, defaultExpandLevel, records, keyOf, parentKeyOf, childrenIndex }`——**level 来源 = 函数内部从根集（parentKey 空/孤儿）迭代 BFS 计算 `levelsByKey: Map<key, level>`**（前稿"level 来源 = levels 数组"废止：展开集是 buildFlatRows 的输入（鸡生蛋），且全收起时深层节点不在平铺中）；收集 `level <= defaultExpandLevel && childrenIndex.hasChildren(key)`；`treeExpandedKeys` prop 非空时直接返回（受控优先）。tree.js 改动清单行、A2.4、G1-a 同步；self-checks/tree 断言（0/1/-1 三态）保持并注明 BFS 起点 |
| 8 | minor | 接受（回调按列返回） | `treeIndents` 签名改 **`treeIndents(colIndex, row)`**：仅树形列返回 `16 × level + 16`、其余列 0——组件壳组装 `(colIndex, row) => tree && colIndex === treeColIndex ? 16 * levels[row] + 16 : 0`。前稿单参 `treeIndents(row)` 签名废止（computeRowHeights 遍历全部多行候选列，单参无法区分列，会低估非树形多行列行高）。row-geometry.js 改动清单行、A2.2 行高公式、A2.4、canvas-table.vue 行、风险表该行同步；self-checks/row-geometry 加"树形列 + 非树形多行同表"用例 |
| 9 | minor | 接受 | **theme.js 职责收缩为快照读取与变更信号**（onChange/refresh 通知通道现状已有，零改动）；"wrap 缓存失效 + 全量快速重估 + rebuild + 锚定"（契约⑤）全部落在组件壳 onChange 处理器（relayout 前）——theme.js 无 records/rowGeometry，几何消费归壳（A7 模块隔离）。改动清单 theme.js 行删重估职责表述（前稿"回调链增重估步骤"废止）、canvas-table.vue 行明确实施位置、A6.1 末段与 A7 注释同步；**G1-b 的"onChange 链变高行重估挂点"描述删除**（theme.js 无对应改动，重估归 G3 壳侧） |
| 10 | minor | 接受 | 遵循约定节 textarea 段改"form/index.js 导出 **20 项 = 17 个输入组件 + MuForm/MuFormRow/MuFormField 3 个容器组件**，无 textarea"（本轮逐行核实 form/index.js:1-21）；"无 textarea"结论不变 |
| 11 | minor | 接受（行号按本轮实读更新，其中一处与评审读数不同） | A5.4 引证 `input.scss:178` → **`:181`**（`border: 1px solid var(--border-color)`）；`:249-253` → **`:248-252`**（`&:focus-within` 块 :248 起，box-shadow 在 :251——评审给 :253，本轮实读为 :251，以实读为准）；A6.2 编辑浮层边框行同步。边距推导结论不变（评审确认成立） |

### 03-human-1/2 意见不回退确认（评审 6 修订后）

本轮定向修订对人工意见全部为**加强满足或缺陷修复**，零回退：

- **人工 2 意见 2（link 对象数组设置颜色）**：P1 修复了前稿的实现缺口（前稿假设"对象数组元素原样透传"与 link.js 现状不符，对象颜色必然失败）——本轮改 link.js 数据层 + link.scss 色类层 + canvas class 查表三层落地，"对象数组用于设置链接颜色"在 DOM 与 canvas 双侧成立（加强）。
- **人工 2 意见 1（最小列宽）**：P2 补齐拖拽下限的真实接线（前稿缺口使 text 仍可拖到 40）、P5 修复字符串 minWidth 的 NaN 回归（加强）。
- **人工 2 意见 2（maxLines/maxItems/textarea）**：P4 统一 dots 字符与 DOM 逐字一致、P6 修复函数形态 lineClamp 的行高/绘制/编辑器三处分裂（加强）。
- **人工 1 意见 1（tree）**：P3 补树槽命中的坐标来源（cellX）、P7 补初始展开集的层级来源（BFS）——均为可实现性补全，能力不变（加强）。
- **人工 1 意见 4/5、意见 7**：无涉及本轮的调整（P9/P10/P11 为文档精度修正）。

## 评审回应（人工 3）

输入：`03-human-3.md`（检查点 5，VERDICT: REVISE——用户 3 条 UI 缺陷，decisions.md 记录每条按 blocker 对待）。**3 条全部接受、无"不可行"项**；修复设计 = 改动清单「缺陷修复 R1」表 + A2.1/A5.3/A5.4/A6.2 现行文本 + 实施步骤 R1 + 测试计划 #16。本设计前轮人工 1/2 意见方案零回退（确认段见本节末）。涉及源码事实本轮已实地复核（行号见文档头部本轮复核清单）。

| 意见 | 结论 | 方案与证据 |
|------|------|-----------|
| 1 行背景未充满表格宽度（striped/hover/选中） | 接受 | **现状核实**：行背景（普通/斑马/选中三态经 `rowBackground`，painter.js:210-215）在分区 1 `paintCellRange` 内按"所绘列区间"绘制——`fillRect(x0, y, x1 − x0, rowHeight)`，x0/x1 取自 cols 区间（:285-290）；容器宽 > ΣcolWidths 时（发生条件 = 全部列定宽：solveWidths 只把剩余宽摊给未定宽列，layout.js:95-98），画布 [Σ, W) 区域经整幅 clearRect（:827）后保持透明——striped/选中行背景止于 Σ。hover 行带本就全宽绘制（paintOverlay `fillRect(0, y, W, h)`，:615-616），但 hoverBg 为半透明 `--mu-gray-translucent`（theme.js:109），在透明画布上直接合成与列区内（叠在不透明行底色上）颜色不一致——同一缺陷的第二表现。**修复口径**（A2.1）：`paintCellRange` 增第 5 参 `bandToX`，行背景带右缘 = `max(所绘列右缘 x1, bandToX ?? x1)`；滚动区五调用点（整幅 :828/行横带 :693/列竖带 :726/单格 :758/调宽竖带 :797——后三者 clip 收敛，扩展被裁剪无害且必要）传 `layout.stickyWidth`（= 容器 clientWidth，layout.js:461）；**固定列 pass（paintFixedArea :400 内调用）不传**——固定 pass 若同扩带会用行底色覆盖已绘滚动区单元格内容（分区 1 先绘、分区 3 后绘），固定列遮挡关系本就由分区顺序 + 整高不透明重绘（:396-400）承担。**取值推导**：Σ < W → bandRight = stickyWidth（充满至视口右缘）；Σ ≥ W → x1 ≥ W，fillRect 越界部分画布自然裁剪 → 实际绘制恒 ≤ 视口右缘、不超真实内容宽（横向滚动约束满足）。**口径一致性**：行网格线本就全宽（paintGridlines 行线 `fillRect(0, y, W, 1)`、maxWidth = stickyWidth，:371-374/:829），列线止于真实列缘不变；表头底色/底边框本就整宽（paintHeader :516-517/:544-545）；y-scrolled 投影条为 DOM `__header-shadow`/`__bottom-shadow`（width:100%，canvas-table.scss:60-79）本就全宽无需改；hover/滚动触发的行横带脏区（组件壳 `invalidate({rows})` → paintRowBand，clip 全宽 + erase 后重走分区 1）经同一修复自动覆盖。测试：self-checks/painter 新断言组 + e2e #16① |
| 2 hover 内边框与编辑态输入框位置一致 + 4px 间距 | 接受 | **现状核实**：hover 描边贴格缘——`strokeRect(x + 0.5, y + 0.5, colWidth − 1, heightAt − 1)`（painter.js:636-638），与单元格边框间距 0；编辑浮层 inset = `bordered ? padding − 1 : padding`（editor.js:391）= 7/8px、浮层高 per-type（input 34 垂直居中于 36 行 → 上下 1px）——两套口径位置与间距均不一致，且与用户要求的 4px 均不符。**修复口径**（A5.3/A5.4 重写）：① editor.js 新导出 `EDITOR_GAP = 4`，`computeEditorStyle` 重写为**统一等距内缩矩形**（left/top = 格原点 + 4、width/height = 格宽高 − 8；删 per-type editorH 分支 :380-388、inset :391、居中式 :395——矩形中心恒 = 格中心，垂直对齐自动成立；theme 不再参与定位）；② painter hover 描边改用 `cellRectAt` 内缩 `EDITOR_GAP` 同一矩形（import 常量单一事实源，A7 例外）——hover 描边 = 编辑浮层矩形逐边相等、与单元格边框四周 4px。**受影响表达式清单**：editor.js `computeEditorStyle` 返回四值 + 头注；painter.js :629-639 描边矩形；canvas-table.scss `__editor > .mu-input` padding（0 → `0 0 0 calc(var(--cell-padding, 8px) - 5px)`）、`--borderless > .mu-input` 删自身 padding 覆盖（防同特异性后定义胜出清掉左缘补偿）、`> textarea.mu-input` padding（3px 10px → `calc(var(--cell-padding, 8px) - 5px)`）。**约束 5 重新推导成立**：文本左缘 = EDITOR_GAP 4 + 边框 1（input.scss:181；borderless 态 transparent 边框宽仍 1px）+ padding-left (cellPadding − 5 = 3) = 格左 + 8 = 非编辑态文本左缘（`--cell-padding` 覆盖时经 calc 同步成立）；textarea 首行顶 = 格顶 + 8 = drawText 多行首行顶（A3.5）——**顺带修复现状偏差**：现状 textarea `padding: 3px 10px` + inset 7 → 文本左缘格左 + 18、首行顶格顶 + 11，与实施约束 5"textarea 左缘一致"不符（self-checks/editor.js:483-488 仅断言 computeEditorStyle 输出 left、未覆盖 scss 实际 padding，故未拦截）。**断言同步**：self-checks/editor :416-501 组按新公式重写（含 theme 不再消费、三类型同矩形）；self-checks/painter :723-750 描边采样点更新；测试 #7（rect 口径/textarea 高）、#12（同矩形断言/描边 4px/两态左缘）、#16②。**已知几何代价**：36px 行下输入框高 28px（非标准控件高 32）——4px 间距的必然结果，MuInput 盒模型（border 1 + flex 居中，内容 26px > 内部 input 20px）无裁剪，风险表已记 |
| 3 右下角缩放 grip 改右下三角 | 接受 | **现状核实**：该元素非组件库能力，为 demo 夹具 `.ct-resize-handle`——模板 main-view.vue:47-50（`<div class="ct-resize-handle" title="拖拽调整容器尺寸" @pointerdown="onStageResizeStart" />`，挂 `.ct-stage` 容器拖拽调整表格容器尺寸）+ 样式 :1139-1148（`position:absolute; right:0; bottom:0; width/height:16px; cursor:nwse-resize; background: var(--mu-primary-color); opacity: 0.5`）——主色半透明 16×16 实心方块即用户所见"浅蓝色方框"；色取 `--mu-*` 变量（非硬编码），缺陷仅形状。canvas-table-editable 页无同款元素（grep 核实）。**修复**（A6.2/改动清单 R1 表）：元素本体改透明（背景移除），视觉改 `::after` 伪元素右下三角——`position:absolute; inset:0; background: var(--mu-primary-color); opacity: 0.5; clip-path: polygon(100% 0, 100% 100%, 0 100%)`（直角在右下、斜边自右上至左下，经典 resize grip 形态）；**命中区不变** = 元素本体 16×16 全方形（clip-path 直接挂在元素上会同步裁剪指针命中区，伪元素方案避免——被拒备选见下）；色仍 `var(--mu-primary-color)` 无硬编码；模板与拖拽逻辑（onStageResizeStart :845）零改动。测试：e2e #16③（computed style 本体透明 + ::after clip-path/background + 右下角 pointerdown 拖拽仍触发） |

### 意见 3 实现方式的被拒备选

- **clip-path 直接作用于 `.ct-resize-handle` 元素本体**（不引入伪元素）：更少一行选择器，但 clip-path 同时裁剪元素指针命中区——命中区从 16×16 方形缩为三角形（上半区点击落空），违背"命中区不变"取径；伪元素方案视觉与命中区解耦，拒绝本体方案。

### 人工 1/2 意见不回退确认（人工 3 修订后）

本轮修复对前轮人工意见全部为**缺陷修复或满足度加强**，零回退：

- **人工 1 意见 2（编辑 UI）**：hover 描边与编辑浮层从"两套几何口径"收敛为同一矩形（用户本轮意见 2 即对该意见 2 落地质量缺陷的追修——边框可见性与位置一致性更强）；单击进编辑/约束 5 左缘一致（含 textarea 实际对齐）均加强。
- **人工 2 意见 2（textarea）**：首行顶/左缘与绘制文本精确对齐（现状 +10px/+3px 偏差闭合）；高度公式简化为 heightAt − 8，多行占满语义不变。
- **意见 1/3/4/5/7（行背景相关项为组件既有渲染质量，非前轮意见引入）**：无回退；行背景带扩展不改变列宽求解（意见 3 的 TYPE_DEFAULT_WIDTHS 与均摊语义）与任何列型绘制（意见 4/5）。
