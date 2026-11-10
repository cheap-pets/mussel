# 设计：table-ex 文字溢出自动 tooltip（title 协议默认开启）

## 方案概述

核心结论：**溢出 tooltip 全链路已存在**（20261030 "title 列协议"任务落地），当前默认关闭——须列显式 `title: true` 才开启。本设计只翻转默认值，不新增机制：

- 未设置 `title`（undefined/null）→ 视同 `true`：溢出才显示全文 tooltip（A1/A2 的"自动"）
- `title: false` → 显式抑制（既有行为，保留，A3）
- `title: ''` / `0` → 维持现状"不提示"（防 `String(0)` 幻影，不因默认翻转而改变）
- `title: String/Function` → 恒显示自定义文本（既有行为，不变）

文本、tag/button 条目、link/list 竖排的溢出判定与 tooltip 求值/显示路径**零改动**（已实现且自检覆盖）。

触及边界（3 个 src 门控点 + 4 处注释/JSDoc（含 2 个文件内联注释措辞），2 块自检同批改写，1 个 demo 夹具文件）：

1. `interaction/hit-test.js` `resolveTooltipTarget` 门控：`!col.title` → `col.title === false`
2. `cell-paint/cell-tooltip.js` `resolveCellTooltip` 真值矩阵：未设置归入自动路径
3. `table-ex.vue` `tooltipEnabled` computed（+devWarn 文案）；`use-cell-tooltip.js`（:50、:150）/`cell-content.js`（:77-78）注释措辞同步
4. demo 自检 `interactions.js` / `cell-painters.js` 各 1 块断言同批改写（默认开启导致断言漂移）
5. demo `main-view.vue` 加 A1/A2/A3 验证夹具（长文本列 ×2、tag/button 溢出列 ×2）

不动：DOM 版 `base/table*`（原生 title 路径）、column-types compile、绘制管线、`use-cell-tooltip` 编排时序、tooltip 组件本体。

## 现状（代码调研结论）

基线 git clean @ 634e947（dev 分支），以下均为工作区实读。

### title 协议现状（默认关闭）

- 列准备保留原始 `col.title` 并产 `col._title = ensureFn(column.title)`：`src/components/table/ex/cell-paint/cell-content.js:77-79`（`ensureFn(undefined)` → `() => undefined`，`src/utils/type.js:80-83`）
- 三处门控（本设计全部触及）：
  1. `tooltipEnabled`：`wiredColumns.value.some(col => Boolean(col?.title))` — pointermove 短路开关，`src/components/table/ex/table-ex.vue:461`；仅消费于 devWarn（控制器缺失提示，`table-ex.vue:464-468`）与 `use-pointer.js:285` 调度前置判断
  2. `resolveTooltipTarget`：`if (!columns?.[hit.colIndex]?.title) return null` — `src/components/table/ex/interaction/hit-test.js:185`（JSDoc :171-173）
  3. `resolveCellTooltip`：`const raw = col.title; if (!raw) return null; if (raw !== true) return resolveTooltipCustomTitle(col, record)` — `src/components/table/ex/cell-paint/cell-tooltip.js:220-226`
- 溢出判定已全覆盖（无需改）：文本单行/多行 `resolveTooltipText`（:124-146）、横排条目（tag/check/img）`horizontalItemsOverflowOf`（:55-64）、link/list 竖排 `resolveTooltipItems`（:165-192）、button 组 `buttonsOverflowOf`（:89-119，含 link 形态与 icon-only 哨兵）。全文 = 逐项 `String` 化后 `'；'` join（:23-25）
- 自检现状矩阵断言（默认翻转后漂移，须同批改写）：
  - `demo/src/data/table-ex/self-checks/interactions.js:807`："无 title 列不触发"（col `{}` → 现将返回 `{row,col}`）；块头/返回串 :784/:820；模块头注释 :17-18
  - `demo/src/data/table-ex/self-checks/cell-painters.js:1997`："无 title 应返回 null"（`{field:'v'}` + 短文本 → 现将返回 `{content,overflowOnly:true,overflow:false}`）；块头 :1993、内联注释 :1995、返回串 :2011、模块头注释 :32-34。其余 tooltip 块均显式 `title: true`（逐块 grep 核对：`tooltipOf` 的列 fixture 一律带 `title: true`，仅本 falsy 块例外），不受影响

### tooltip 复用路径（canvas 命中 → 面板坐标，零改动，列出供实施者核对）

- 控制器：`$mussel.tooltip`（inject，`use-cell-tooltip.js:36-38`），API `show/hide/delayHide/clearHideTimer/updatePosition/isAnchorIn`：`src/components/tooltip/tooltip-core.js:133-144`；`TOOLTIP_SHOW_DELAY = 300`：`tooltip-core.js:10`
- 命中→坐标链：`usePointer.hitAt`（`canvasEl.getBoundingClientRect()` 差值，`use-pointer.js:31-35`）→ `hitTest` → `resolveSpanCell` 归一 → `scheduleCellTooltip` 格身份去重 + 300ms 延迟（`use-cell-tooltip.js:54-78`）→ `spanRectOf` 命中格视口矩形（:102）→ `placeTooltipAnchor` 命令式写合成锚点 style（:121-128）→ `tooltipController.show + updatePosition`（:160-165）→ 面板 fixed 定位 `src/components/tooltip/tooltip-panel.vue:112-171`
- 求值复用绘制同源测量（measure/wrapCache/resolveCellContent），绘制热路径零改动：`cell-tooltip.js:15-18`

### demo 夹具现状

- 页面：`demo/src/data/table-ex/main-view.vue`（1760 行），URL `http://localhost:3000/data/table-ex/`；舞台列 `stageColumns` 按夹具场景切换（:1083-1103），场景可经 URL `?scene=<value>` 直载（`SCENE_WHITELIST` 含 `default`/`items` 等，:1020-1023）——**验证场景切换首选 URL，不点 radio**（弱模型下 radio 点击时序易失稳）。默认场景 = `createDefaultColumns()`（:415-507）+ `createRecords()` 100k 行（记录字面量 :386-406）；items 场景 = `itemColumns`（:781-813）/`itemRecords`（:688-779）。舞台尺寸 960×420（:1214-1215），默认场景列 0-5 累计宽 ≈664px，初始视口内可 hover
- 现有 title 夹具：名称列 `title: true`（:428）、状态列函数 title（:439）、list/link 列 `title: true`（:785-792）——默认翻转后行为不变
- 缺口：默认场景无溢出长文本列、无 `title: false` 列；items 场景 tag 列（宽 210）row4 已 12 标签溢出但 button 列（宽 180）无溢出用例，且两列位于列序 5/7（初始视口 ~960px 外，hover 需横滚）——A1/A2/A3 需补夹具
- 自检面板：onMounted 自动 `runSelfChecks()`（:1546-1553），结果渲染 `.ct-self-checks`（`自检结果（N/N 通过）` + `.ct-check-item--fail` 失败行，:260-279）；实例暴露 `window.__canvasTable`（:1548），`getCellRect(row, col)` 返回**视口坐标**矩形（`getBoundingClientRect` 基准，`use-table-api.js:107-124`；layout 未就绪返回 null），可直接作为 `page.mouse.move` 入参
- `dataChecks` 页面级断言只查固定 11 字段存在与取值域（:1474-1540，抽查首/中/末行），新增记录字段不破坏

## 遵循约定与复用

知识库命中（INDEX-table.md / INDEX.md，直接采用）：

- `canvas-pixel-assert-anchor-drift`：行为变更与自检断言**同批改写**，grep 旧断言全扫 self-checks
- `table-ex-demo-interaction-verify`：坐标级交互经 `getLayoutInfo`/`getCellRect` 换算；浮层断言等显示延迟（本任务 TOOLTIP_SHOW_DELAY=300ms → 显示断言前等 600ms，收起断言前等 700~800ms）
- `demo-watch-agent-edit-cache-bust`：Edit 写入后 touch 源文件触发重建；访问加 cache-bust 参数
- `playwright-delay-hide-popup-testing`：hover→停留→断言须单次调用内完成，重开前先移出移入
- `fixed-popup-offset-parent-visibility`：面板为 fixed 元素，可见性断言勿用 offsetParent（用 computed display / getClientRects）
- `eslint-demo-dist-false-positives` / "lint exit 0 假阴性"：lint 限 src 与 demo/src（.vue 须 `--ext .js,.vue` 才纳入），stylelint glob 加引号

复用（不新建）：tooltip 控制器与面板（tooltip-core.js / tooltip-panel.vue）、`resolveCellTooltip` 求值族、measure/wrapCache 测量缓存、`spanRectOf`/`cellRectAt` 几何、`.mu-tooltip-panel` 面板（内容断言口）。命名沿用 "title 列协议" 术语，版本注记 v2（默认开启）。

约束遵循：不 commit/push、不装依赖、不更新 docs/docs-site/skills（任务 00-task.md 约束，实现完成经用户确认后另行处理——虽然 AGENTS.md 要求 API 变更同步三处文档，本任务以 00-task.md 为准延后）。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/interaction/hit-test.js` | `resolveTooltipTarget` 门控条件改 `title === false`；JSDoc（块 :170-181，其中 :171-173 描述、:177 columns 参数）同步 | 默认开启（门控点 2） |
| `src/components/table/ex/cell-paint/cell-tooltip.js` | `resolveCellTooltip` 头部真值矩阵重写（:220-226，含内联注释 :222-223）；文件头注释（:1）与 JSDoc（:201-215）同步 | 默认开启（门控点 3，真值单一事实源） |
| `src/components/table/ex/table-ex.vue` | `tooltipEnabled` computed 改 `some(col => col?.title !== false)`（:461）；devWarn 文案更新（:466）；区块注释（:460）同步 | 默认开启（门控点 1）+ 控制器缺失提示随默认扩面 |
| `src/components/table/ex/composables/use-cell-tooltip.js` | 注释措辞 :50（"无 title 目标" → "无 tooltip 目标")与 :150（"无 title" → "显式关闭/无文本源/未溢出"），无行为改动 | 注释与新门控语义一致 |
| `src/components/table/ex/cell-paint/cell-content.js` | 注释措辞 :77-78（"resolveTooltipTarget 按其真值做门控" → "按 title === false 显式关闭门控"），无行为改动 | 同上 |
| `demo/src/data/table-ex/self-checks/interactions.js` | `resolveTooltipTarget` 块（:783-822）断言/文案同批改写 + 补 `title:''` 放行断言；模块头 :17-18 | 断言漂移（anchor-drift 约定） |
| `demo/src/data/table-ex/self-checks/cell-painters.js` | `resolveCellTooltip` falsy 块（:1993-2012）改写 + 补"未设置默认开启"正反断言；内联注释 :1995；模块头 :32-34 | 同上 |
| `demo/src/data/table-ex/main-view.vue` | `createRecords` 加 `longText` 字段；`createDefaultColumns` 状态列后插 2 列（默认溢出 / title:false）；`itemRecords` row1/row2 加 `tagsOverflow`/`buttonsOverflow`；`itemColumns` 名称列后插 2 列 | A1/A2/A3 浏览器验证载体 |

无新增文件；无 scss 改动；无测试框架新文件（自检即测试，见上表）。

## 接口 / 数据结构

无新增接口/数据结构/props/events。唯一对外语义变化 = `column.title` 取值矩阵（title 列协议 v2）：

| `column.title` 取值 | 行为 |
|---|---|
| `undefined` / `null` / `true` | 溢出才显示单元格全文（**v2 起 undefined/null 为默认开启**） |
| `false` / `''` / `0` | 永不提示（`''`/`0` 维持旧口径，防 `String(0)` 幻影） |
| String / Function / 非 0 数字 | 恒显示自定义文本（不判溢出） |

三处门控的分工（实施口径）：

- `tooltipEnabled`（表级短路）：`wiredColumns.value.some(col => col?.title !== false)` —— 全列显式 false 才整体关停调度
- `resolveTooltipTarget`（格级门控）：仅拦 `columns?.[hit.colIndex]?.title === false` —— `''`/`0` 放行至求值层归一（不在门控层建第二套真值口径）
- `resolveCellTooltip`（求值层，真值单一事实源）：头部改写为——

```js
const raw = col.title

// title 协议 v2（默认开启）：未设置/true → 溢出才显示全文；false/''/0 → 不提示
// （''/0 维持旧口径，防 String(0) 幻影）；String/Function → 恒显示自定义文本
if (raw === false || raw === '' || raw === 0) return null
if (raw !== true && raw != null) return resolveTooltipCustomTitle(col, record)
// 以下自动路径不变（true 形态原逻辑）
```

另两处门控的替换行（逐字）：

```js
// hit-test.js:185
if (columns?.[hit.colIndex]?.title === false) return null
// table-ex.vue:461
const tooltipEnabled = computed(() => wiredColumns.value.some(col => col?.title !== false))
```

边界清单（实施与验证共同口径；逐条自检）：

- 空列数组：`some` → `false`，调度整体不启用（无格可悬停，无影响）
- `title: false`：gate 即拦（不进入 300ms 调度），求值层也返回 null（两层一致）
- `title: ''` / `0`：gate 放行、求值层返 null → 面板永不出现；去重键保留不重排定时器（use-cell-tooltip.js:150-155）
- `title` 为函数：`raw` 是函数 → 走自定义文本路径；函数返回 `''` → null（自检 :2000 覆盖）
- 编辑中格 / `hoverMode === 'none'` / 调宽拖拽中 / 表头 / 行列越界（含 beyondCols 的 col=-1）→ gate null（hit-test.js:183-184）
- 合并格：hit 已由 `resolveSpanCell` 归一为锚格，tooltip 按锚行记录 + 区域矩形求值（无需改动）
- `check` / `progress` / `img`（未加载无文本）/ 文本源为 null 或 `''` → null（求值层既有分支）
- 控制器缺失：调度短路（use-cell-tooltip.js:55）；demo 完整 install 已注册控制器（src/components/tooltip/index.js:6）

devWarn 文案（`table-ex.vue:466`）替换为：`单元格 tooltip 默认开启（title 列协议），但 $mussel.tooltip 控制器不存在（宿主未安装 mussel 或未走完整 install），功能已关闭；如需显式关闭请配置列 title:false`

## 被拒绝的备选

1. **新增独立开关**（如 `column.overflowTooltip` 或表级 `tooltip` prop）而非翻转 title 默认：拒绝——`title: true` 已实现全部溢出判定路径且自检/demo 基建齐备，新开关引入第二套语义；任务验收口径即 `title: false` 抑制。
2. **条目级（per-item）tooltip**（hover 单个 tag/button 才出该条目全文）：拒绝——`itemHits` 有 pill 矩形可反查，但验收只要求"条目文本溢出时出 tooltip"；格级 join 全文（现状实现）已满足，per-item 须改命中协议与锚点粒度，扩大改动面。
3. **绘制路径预计算溢出标记**（paint 时写 overflow map）：拒绝——现有触发期惰性求值复用绘制同源测量缓存（`cell-tooltip.js:15-18`），绘制热路径零改动；预计算增加每帧开销与缓存失效负担。

## 风险与回滚

- **行为扩面（任务目标本身）**：未显式配 title 的 table-ex 列，溢出时开始出 tooltip。属预期（"自动"）；显式关闭口径 `title: false` 已预留。DOM 版 mu-table 不受影响（base/table 路径未触及，原生 title 仍只对 truthy 生效）——**canvas 默认开启 / DOM 默认关闭的语义分叉为已知且属本任务范围外**（统一口径需另立任务，勿在本任务顺手改 base/table）
- **devWarn 扩面**：控制器缺失宿主（不完整 install）下，原仅配 title 才 warn，现默认即 warn（utils/warn once 去重，dev-only）。文案已指引关闭方式。
- **性能**：pointermove 每格变化重排 300ms 定时器（现状同款）；仅指针停留 300ms 后求值一次 resolveCellContent + 测量（走缓存）。无可感知增量。
- **合并风险**：全为既有文件局部条件/注释修改，无签名/数据结构/迁移变更——**双向门**。爆炸半径 = table-ex tooltip 触发链（3 个 src 文件）；demo 侧为自检断言与夹具。回滚 = revert 改动清单 8 文件。注意 `interactions.js`/`cell-painters.js` 为高频自检文件，与他任务并行时可能冲突。
- **验证依赖（易踩，先排查再改设计）**：A1-A3 依赖两点——① `$mussel.tooltip` 控制器存在：demo `install(app)` 完整注册（src/components/tooltip/index.js:6；table-ex 侧 use-cell-tooltip.js:55 首行 `if (!tooltipController) return` 短路，缺失即全假阴性）；② 页面来自 `npm run demo:build` 的 :3000（别名 `mussel` → src 源码），不是 `npm run build` 的 dist。面板始终不出现时先查这两点 + watch 是否重建，不要自行改设计。

## 测试计划

| 验收标准 | 归属片 | 手段 | 具体检查方式 |
|---|---|---|---|
| A1 长文本溢出出 tooltip / 未溢出不出 | 片2（步骤 2.1） | 浏览器（playwright mcp） | 1) 打开 `http://localhost:3000/data/table-ex/?scene=default&bust=<ts>`，等 `.ct-check-item` 出现且 `window.__canvasTable.getCellRect(1, 4)` 返回非 null（layout 未就绪时返回 null）；2) 单次调用内：`const r = await page.evaluate(() => window.__canvasTable.getCellRect(1, 4))` → `page.mouse.move(r.left + r.width / 2, r.top + r.height / 2)` → `page.waitForTimeout(600)` → 断言 `.mu-tooltip-panel` 存在、computed `display !== 'none'`、`textContent === '极长文本夹具：用于验证单元格文字溢出时悬停自动显示完整内容提示'`；3) 同页移到 `getCellRect(0, 4)`（第 1 行「短文本」）中心 → `waitForTimeout(700)` → 面板 `display === 'none'` 或不存在（不得早于 700ms 断言） |
| A2 tag/button 条目溢出出 tooltip / 未溢出不出 | 片2（步骤 2.2） | 浏览器 | 1) 打开 `?scene=items&bust=<ts>`（URL 直载场景，不点 radio；`SCENE_WHITELIST` 支持 `items`）；确认场景生效：`getLayoutInfo().colWidths` 长度 13 且前三位 `[120, 150, 150]`（名称 120 + 两个新列各 150）；2) `getCellRect(1, 1)` 中心 hover → 600ms → 面板 `textContent === '溢出标签1；溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8'`（8 项 `'；'` join）；3) `getCellRect(1, 2)` 中心 hover → 600ms → `textContent === '短；这是一条超长按钮文字标题溢出提示夹具'`；4) `getCellRect(0, 1)`、`getCellRect(0, 2)` 各 hover → 700ms → 无面板（row1 未溢出对照）。每段先移出表格（或整页重载）再进入，单次调用内完成 hover→停留→断言 |
| A3 `title === false` 列溢出不出 | 片2（步骤 2.1） | 浏览器 | 1) 默认场景新开页：`getCellRect(1, 5)`（「长文本（title:false）」列，同为 longText 溢出数据）中心 hover → 600ms → 面板 `display === 'none'` 或不存在；2) 同页先 `getCellRect(1, 4)` hover 600ms 确认出面板，再移 `getCellRect(1, 5)` 中心 → 等 800ms → 面板 `display === 'none'`（delayHide = HIDE_DELAY 300ms + 退场过渡 ~100ms；800ms 前不得断言） |
| A4 自检不回归 | 片1（步骤 1.2）+ 终验 | 浏览器 | 打开 `?bust=<ts>`，等 `.ct-check-item` 渲染完成：`document.querySelectorAll('.ct-check-item--fail').length === 0`（全绿），且 `.ct-self-checks` 头部文案匹配 `自检结果（N/N 通过）`（两数相等）。**只认 onMounted 首次自动运行结果，不点「重跑自检」**（预热后重跑恒败，见 INDEX-table 条目 `table-ex-counter-assert-warm-cache`）。判定严格：出现任何 fail 即 A4 不通过，如实上报失败模块/名称/错误（不得自行豁免；interactions / cell-painters 两块失败基本可断定为本改动引入） |
| A5 eslint + stylelint | 终验 | 命令 | `npx eslint --ext .js,.vue src demo/src` 退出码 0（`--ext` 必带：缺省 eslint 8 目录参数只扫 .js，本任务改动的 `table-ex.vue`/`main-view.vue` 不被覆盖；基线已验证 exit 0）；`npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` 退出码 0（glob 必须加引号，否则 Git Bash 单层展开假阴性）。eslint / stylelint 均为**全局安装**（node_modules 无此依赖、node_modules/.bin 无 bin），`npx` 直接可用，不要 npm i；输出中的 `npm warn/notice` 为噪声，只看退出码 |

验证环境要点（00-task.md + 本轮核对）：

- 先探活 `http://localhost:3000`，不通则后台起 `npm run demo:build`（watch 构建 demo/dist 并内置 :3000 静态服务）。demo 经别名 `mussel` → `src/index.js`、`./components/index.js` → `src/components/index.ex.js` 直接消费 src 源码（vite.demo.config.js 别名表），**src 改动与 demo/src 改动都靠这个 watch 重建**。
- **任何被 Edit 的文件（`src/**` 与 `demo/src/**`）改完都要 `touch <绝对路径>` 再等重建**（Edit 写入可能不触发 watch；重建未生效时重启 `npm run demo:build` 并等首屏构建完成），URL 一律加 cache-bust 参数。
- 面板断言口径：`.mu-tooltip-panel` 由 `v-show="popupStyle"` 控制显示（隐藏 = 内联 `display:none`，首次 show 前 Teleport 未挂载故节点不存在），root `pointer-events:none` 不挡鼠标；判可见用 computed `display` / `getClientRects()`，**不得用 offsetParent**（fixed 定位）。tooltip 文本渲染在面板内 `span`（`textContent` 即 content 原文）。
- 坐标须在视口内且为实时值：若 `getCellRect` 的 `left/top` 越出 `innerWidth/innerHeight`，先 `page.evaluate(() => document.querySelector('.ct-stage')?.scrollIntoView({ block: 'start' }))` 再重取坐标；任何时候不要复用滚动前的旧坐标（viewport 相对值随滚动变化）。
- playwright mcp 优先；不可用时 Edge headless `--dump-dom` 兜底（对 dump 出的 HTML 断言 `mu-tooltip-panel` 的内联 display 与文本）。
- `.playwright-mcp` 目录与 `.gitignore`（`*` + `!.gitignore`）已存在，无需新建。

## 实施步骤

### 片1：src 协议翻转 + 自检同批改写（逻辑层正确性）

- **1.1 src 三处门控翻转**
  - 文件：`hit-test.js`、`cell-tooltip.js`、`table-ex.vue`（+ 注释措辞：`use-cell-tooltip.js`、`cell-content.js`）
  - 内容（逐字替换，代码见「接口 / 数据结构」节）：
    1. `hit-test.js:185`：`if (!columns?.[hit.colIndex]?.title) return null` → `if (columns?.[hit.colIndex]?.title === false) return null`；JSDoc 块 :170-181 中 :171-173 的「命中列无 truthy title」改为「命中列显式 `title === false`」，:177 的 columns 参数说明可保留
    2. `cell-tooltip.js:220-226`：按「接口」节代码片段整段替换（含内联注释）——`if (raw === false || raw === '' || raw === 0) return null` + `if (raw !== true && raw != null) return resolveTooltipCustomTitle(col, record)`，删除旧注释「falsy（false/''/0/null/undefined）不生效…」；文件头 :1 改为 `/** 单元格 tooltip 求值（title 列协议 v2：默认开启，title:false/''/0 关闭） */`；JSDoc :201-215 的 @returns 说明改为「title:false/''/0、progress・check・img、全文为空 → null（未设置 title 视为默认开启）」
    3. `table-ex.vue:461`：`const tooltipEnabled = computed(() => wiredColumns.value.some(col => col?.title !== false))`；:460 区块注释改为「单元格 tooltip 开关（title 列协议 v2：默认开启，title:false 显式关闭）：依赖 wiredColumns，留 useTreeRows 之后」；:466 devWarn 文案替换为「接口」节给定全文
    4. `use-cell-tooltip.js:50`「无 title 目标（表头/越界/编辑中/none）」→「无 tooltip 目标（表头/越界/编辑中/none/title:false 列）」；:150「（无 title / 无文本源 / 未溢出 / 空串）」→「（显式关闭 / 无文本源 / 未溢出 / 空串）」
    5. `cell-content.js:77-78`「原始字段经 {...column} 保留，resolveTooltipTarget 按其真值做门控」→「原始字段经 {...column} 保留，resolveTooltipTarget 仅按 title === false 显式关闭门控」
  - 边界：`''`/`0` 在门控层放行、求值层归 null；`null` 视同未设置走自动路径；`tooltipEnabled` 空列数组 some → false（无格可悬停，无影响）
  - 完成判据（逐条执行，全部满足）：
    - `grep -n "title === false" src/components/table/ex/interaction/hit-test.js` 命中 1 处
    - `grep -n "title !== false" src/components/table/ex/table-ex.vue` 命中 1 处（注意：table-ex.vue 是 `!==`，用 `=== ` 的 grep 必然 0 命中，勿据此判失败）
    - `grep -n "raw !== true && raw != null" src/components/table/ex/cell-paint/cell-tooltip.js` 命中 1 处
    - `grep -n "if (!raw) return null" src/components/table/ex/cell-paint/cell-tooltip.js` 0 命中（旧分支已删）
    - `npx eslint --ext .js,.vue src` 退出码 0
  - 依赖：无
- **1.2 自检两块同批改写**
  - 文件：`demo/src/data/table-ex/self-checks/interactions.js`、`demo/src/data/table-ex/self-checks/cell-painters.js`
  - interactions.js（块 :783-822）：
    - fixture :786 改为 5 列：`const columns = [{}, { title: true }, { title: '提示' }, { title: false }, { title: '' }]`
    - :807 旧断言「无 title 列不触发」替换为（用块内已有的 `assertArray`）：
      ```js
      assertArray(
        (() => {
          const t = resolveTooltipTarget({ ...base, hit: { isHeader: false, colIndex: 0, rowIndex: 3 } })

          return [t.row, t.col]
        })(),
        [3, 0],
        '未设置 title 默认开启，门控放行'
      )
      ```
    - :808 保留 `resolveTooltipTarget(...colIndex: 3...) === null`，label 改 `'title:false 显式关闭不触发'`
    - 新增第 5 列断言（紧接 :808 后）：
      ```js
      assertArray(
        (() => {
          const t = resolveTooltipTarget({ ...base, hit: { isHeader: false, colIndex: 4, rowIndex: 3 } })

          return [t.row, t.col]
        })(),
        [3, 4],
        '空串仅由求值层归一，门控放行'
      )
      ```
    - 块名 :784 → `'resolveTooltipTarget：门控（none/拖拽/表头/越界/编辑格/title:false 列 → null；未设置/空串放行 → {row,col}）'`；返回串 :820 → `'正常格 {row,col}；表头/越界/none/拖拽/编辑格/title:false 列均 null；未设置与空串放行'`；模块头 :17-18 → `resolveTooltipTarget（title 列协议 v2，默认开启）：none/拖拽/表头/行列越界/编辑中格/title:false 列 → null，正常格（含未设置 title）→ { row, col }。`
  - cell-painters.js（falsy 块 :1993-2012；夹具 helper `tooltipOf` :349-360——contentWidth 默认 144、`fakeMeasure` CJK 9px/字、`assert`/`assertEqual` helper :362-379 可直接用）：
    - 内联注释 :1995 改为「false/''/0 维持旧口径不提示（防 String(false)/String(0) 幻影）；未设置/true → 溢出才显示全文」
    - :1997 旧断言「无 title 应返回 null」替换为：
      ```js
      // 未设置 title → 默认开启（v2）：短文本返回全文但不显示，长文本溢出
      const plain = tooltipOf({ field: 'v' }, { v: '甲' })

      assertEqual(plain?.content, '甲', '未设置 title 默认开启：短文本返回全文')
      assertEqual(plain?.overflow, false, '未设置 title 且短文本：overflow false（壳据此不显示）')
      assertEqual(
        tooltipOf({ field: 'v' }, { v: '一二三四五六七八九十'.repeat(2) })?.overflow,
        true,
        '未设置 title 且长文本：20 字 ×9px = 180 > 144 → overflow true'
      )
      ```
    - :1996/1998/1999/2000（false/''/0/函数返回空串 → null）原样保留
    - 块名 :1993 → `'resolveCellTooltip：默认开启与 falsy 抑制及无文本源类型（未设置/true 溢出才显示；title:false/空串/0/check/progress/img/null 文本）'`；返回串 :2011 → `'未设置默认开启（短文本 overflow:false / 长文本 overflow:true）；title:false/空串/0/空串返回/check/progress/img/null 文本源均返回 null'`；模块头 :32-34 → `resolveCellTooltip（title 列协议 v2，默认开启）：未设置/true → 溢出才显示全文，false/''/0 → null，自定义 String/Function title 恒显示；文本/横排条目（check/img/tag 计宽）/link·list 竖排/button 组溢出判定矩阵、maxLines 与 regionHeight 钳制、line-clamp 改道（A9 后无数组文本形态）。`
  - 改后自查：`grep -rn "无 title" demo/src/data/table-ex/self-checks/` 应 0 命中（旧口径断言与注释全部改净）
  - 完成判据：touch 两个自检文件 + 等重建；浏览器打开 `http://localhost:3000/data/table-ex/?bust=<ts>`，自检面板无 `.ct-check-item--fail` 且 `N/N 通过`（判定细则见测试计划 A4）
  - 依赖：1.1（默认开启前置；未做 1.1 时该两块断言必败）

### 片2：demo 夹具（A1/A2/A3 浏览器可验）

- **2.1 默认场景长文本夹具（A1/A3）**
  - 文件：`demo/src/data/table-ex/main-view.vue`
  - `createRecords`（记录字面量 :386-406）增字段：`longText: i % 2 === 0 ? '短文本' : '极长文本夹具：用于验证单元格文字溢出时悬停自动显示完整内容提示'`（长串 31 字 ≈ 403px > 内容宽 134；偶数行短文本对照）。新字段不影响 `dataChecks`（:1474-1540 只查固定字段清单）
  - `createDefaultColumns` 状态列（:429-440）之后插入两列（新列序 4/5；列宽 150 → 内容宽 134 = 150 − `--cell-padding` 8×2，table-ex.scss:5）：

    ```js
    // A1/A3 夹具（20261110-table-ex-overflow-tooltip）：未设置 title → 溢出自动
    // tooltip（奇数行长文本）；title:false 显式抑制对照列（同数据溢出不提示）
    { caption: '长文本（溢出提示）', field: 'longText', width: 150 },
    { caption: '长文本（title:false）', field: 'longText', width: 150, title: false }
    ```

  - 完成判据：A1、A3 浏览器断言过（见测试计划）；页面自检无 `.ct-check-item--fail`
  - 依赖：1.1（默认开启前置）
- **2.2 items 场景 tag/button 溢出夹具（A2）**
  - 文件：`demo/src/data/table-ex/main-view.vue`（与 2.1 同文件，串行执行）
  - `itemRecords` row1（id:1，:689-712）增：`tagsOverflow: ['短标', '甲']`、`buttonsOverflow: [{ caption: '短' }]`（两项/单 pill 合计远小于内容宽 134，未溢出对照）；row2（id:2，:713-735）增：`tagsOverflow: Array.from({ length: 8 }, (_, i) => \`溢出标签${i + 1}\`)`（8 项合计远超 134，必然溢出）、`buttonsOverflow: [{ caption: '短' }, { caption: '这是一条超长按钮文字标题溢出提示夹具' }]`（第二个 caption 18 字，远超首个按钮后的剩余宽，必然溢出）；其余行不配字段（undefined → 空内容，无 tooltip）
  - `itemColumns` 名称列（:782）之后插入两列（新列序 1/2，初始视口内；宽 150 → 内容宽 134）：

    ```js
    // A2 夹具（20261110-table-ex-overflow-tooltip）：tag 横排与 button 组
    // 溢出自动 tooltip（row2 溢出 / row1 未溢出对照）
    { caption: '标签（溢出）', field: 'tagsOverflow', type: 'tag', width: 150 },
    { caption: '按钮（溢出）', field: 'buttonsOverflow', type: 'button', width: 150, buttons: record => record.buttonsOverflow }
    ```

  - 验证入口：`http://localhost:3000/data/table-ex/?scene=items&bust=<ts>`（URL 直载 items 场景，不点 radio）；场景生效判据见测试计划 A2
  - 完成判据：A2 浏览器断言过（见测试计划）；items 场景既有夹具（链接三态/list/tag 彩色等）行为不变、自检无失败行
  - 依赖：1.1

### 终验：lint + 全量回归（集成片）

- **3 终验**：`npx eslint --ext .js,.vue src demo/src` 与 `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` 退出码均 0；A1-A4 全量复验一遍（新 cache-bust URL）：`?scene=default` 跑 A1/A3、`?scene=items` 跑 A2、自检面板跑 A4，确认无 `.ct-check-item--fail`。依赖：1.2、2.1、2.2。

实施注意（全部步骤适用）：

- **任何 Edit 过的文件（`src/**` 与 `demo/src/**`）改完都要 `touch <绝对路径>`**，等 watch 重建完成；重建未出现（页面仍是旧逻辑）时重启 `npm run demo:build`。
- 访问一律带 cache-bust 参数；每轮验证前重新取 `getCellRect`（layout 变化后旧坐标失效）。
- 不 commit、不 push、不装依赖（eslint/stylelint 用全局版，`npx` 直接调）。
- 自检面板只认 onMounted 首次自动运行结果，不点「重跑自检」。

## 裁决记录（原「未解问题」，design-amender 裁定，实施按此）

1. **`title: null` 归默认开启（维持设计口径，不改）**
   - 裁定：`null` 与 `undefined` 同义 → 视同未设置、默认开启；不新增 `null` 抑制口径。
   - 依据：验收标准 A3 与 decisions.md [启动] 只定义 `title === false` 为抑制；把 `null` 也当抑制会引入验收标准外的第二个抑制值。`prepareColumn` 对 `null` 走 `ensureFn` 常量函数（cell-content.js:79），求值层无文本源时本就返回 null，无额外风险。
   - 影响面：仅显式书写 `title: null` 的列（罕见），效果 = 默认开启；文档矩阵已写明（`undefined`/`null`/`true` 同档）。

2. **devWarn 随默认开启扩面（保留，仅更新文案）**
   - 裁定：保留「`tooltipEnabled` 为真且无控制器 → warn」逻辑，文案改为指引 `title:false` 关闭。
   - 依据：`warn` 为跨实例全局 once 去重（`src/utils/warn.js:4-19`，`warned` Set + `once: true` 默认）+ dev-only（`isDev` 守卫），扩面的实际成本 = 每个 dev 会话最多一条 console.warn；换来「默认功能被静默关闭」的可诊断性。demo 完整 install 已注册控制器（src/components/tooltip/index.js:6），验证环境不会触发该 warn。
   - 影响面：仅「未安装 mussel 或未走完整 install」的开发态宿主。
