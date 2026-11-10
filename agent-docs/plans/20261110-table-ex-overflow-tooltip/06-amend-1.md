# 设计审改记录（第 1 轮）

任务目录：`agent-docs/plans/20261110-table-ex-overflow-tooltip/`
审改对象：`02-design.md`（table-ex 文字溢出自动 tooltip / title 协议默认开启）
证据基线：工作区 HEAD 634e947，实读代码与命令输出；探针命令均只读（grep / eslint / stylelint）。

VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：A1~A5 均有设计归属与可执行检查方式；改动的两个自检文件已列入改动清单（片1 步骤 1.2）与终验——通过。本轮补齐 A2 场景切换手段、A1/A3 断言时序与精确字面、A5 的 .vue 覆盖。
2. **事实一致**：三处门控（`hit-test.js:185`、`cell-tooltip.js:220-226`、`table-ex.vue:461/466`）、注释点（`use-cell-tooltip.js:50/150`、`cell-content.js:77-78`）、两块自检（`interactions.js:783-822`、`cell-painters.js:1993-2012`）、demo 夹具锚点全部实读核对存在且语义一致；`ensureFn`（`src/utils/type.js:80-83`）、`TOOLTIP_SHOW_DELAY=300`（`src/components/tooltip/tooltip-core.js:10`）、`--cell-padding: 8px`（`src/components/table/ex/table-ex.scss:5`）、自检 `tooltipOf` 默认 contentWidth=144 + fakeMeasure 9px/字（`cell-painters.js:349-360`）均核实。行号小偏差 2 处（`:176`→`:177`、`:384-406`→`:386-406`）已直接改。
3. **约定一致**：纯 JS、注释中文、无 CSS 改动；DOM `base/table*` 与 column-types compile 的 `title === true` 语义保留（`base/table-row.vue:76/82-83`、`column-types/{tag,button,text,list,icon}.js` 各处 `=== true`），ex canvas 侧仅三处门控消费 `column.title`；文档延后符合 00-task 与项目 AGENTS.md「实现后经用户确认再更文档」。
4. **影响面**：改动限 table-ex tooltip 触发链 + demo 自检/夹具；grep `src/components/table/` 全量核对 `_title`/`col.title`/`column.title`，ex 侧消费点仅三处门控 + `_title`（无遗漏），`column-types/*` 的 `title === true` 属 DOM 通道不随之翻转；`dataChecks`（`main-view.vue:1474-1540`）只查固定 11 字段，新增 `longText`/`tagsOverflow`/`buttonsOverflow` 不破坏；自检模块与 demo 夹具相互独立（`self-checks/index.js` 只 import src 函数）。
5. **可实施**：1.1 → 1.2 → 2.1/2.2 → 终验 依赖有序、各步有独立判据。原 1.1 完成判据 `grep "title === false" ... table-ex.vue` 必 0 命中（改后为 `title !== false`），会致误判失败——已改为按文件分别 grep。
6. **风险与回滚**：双向门、爆炸半径 = tooltip 触发链，回滚 = revert 8 文件；本轮新增「验证依赖」风险（`$mussel.tooltip` 缺失即 `use-cell-tooltip.js:55` 短路、页面必须来自 demo:build 而非 dist）与排查步骤；补记 canvas 默认开启 / DOM 默认关闭的已知语义分叉（范围外）。
7. **范围**：仅协议翻转 + 注释同步 + 自检断言 + demo 夹具；devWarn 文案属必要同步；无 docs/docs-site/skills 改动、无新依赖、无新文件。
8. **切片**：片1（src + 自检，判据=自检全绿）、片2（demo 夹具，判据=A1/A2/A3）、终验（A5 + 全量复验）；A1-A3 归片2、A4 归片1+终验、A5 归终验；片2 依赖 1.1；两片文件集不相交（src+self-checks vs main-view.vue），无环。

## 改动台账（本轮直接改入 02-design.md）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | 方案概述·触及边界 | 「3 个 src 门控点 + 1 处注释」→「3 个门控点 + 4 处注释/JSDoc（含 2 文件内联）」并列出 `:50`/`:150`/`:77-78` | 原计数与改动清单不符：`use-cell-tooltip.js:50`（"无 title 目标"）、`:150`、`cell-content.js:77-78` 均随之失效 | 否 |
| 2 | 现状·自检漂移（cell-painters 行） | 增「内联注释 :1995」与「逐块 grep 核对」 | `cell-painters.js:1995` 注释「falsy 不生效…」随默认翻转失真；grep 确认其余 `tooltipOf` 列 fixture 全部带 `title: true`，仅 falsy 块漂移 | 否 |
| 3 | 现状·demo 夹具 | 补 `?scene=<value>` URL 直载（`main-view.vue:1020-1023`）、舞台 960×420（`:1214-1215`）、列 0-5 累计宽 ≈664、`createRecords` 锚点 `:384-406`→`:386-406` | main-view.vue 实读；`scene` 由 `URLSearchParams` 初始化，验证可不点 radio | 否 |
| 4 | 现状·自检面板 / dataChecks | 「页面坐标」→「视口坐标（getBoundingClientRect 基准）」；`:1502-1526`→`:1474-1540`；`:1546-1550`→`:1546-1553` | `use-table-api.js:107-124` 返回 `base.left + cell.x`（视口坐标，可直接喂 page.mouse）；dataChecks 实范围 :1474-1540 | 否 |
| 5 | 遵循约定与复用 | 等待口径「≥500ms」→「显示 600ms / 收起 700~800ms」；lint 条补「.vue 须 `--ext .js,.vue`」 | `TOOLTIP_SHOW_DELAY=300`（tooltip-core.js:10）+ `HIDE_DELAY=300`、`doExit` 等过渡（common/popup.js:7、66-79）；eslint 8 目录参数默认只扫 .js | 否 |
| 6 | 改动清单（5 行锚点/注释点） | hit-test JSDoc → 块 `:170-181`（描述 `:171-173`、columns `:177`）；cell-tooltip 增「内联注释 `:222-223`」；use-cell-tooltip 增 `:50`；cell-painters 增 `:1995` | hit-test.js:170-181 实读；cell-tooltip.js:222-223 即旧 falsy 注释两行 | 否 |
| 7 | 接口 / 数据结构 | 增「另两处门控替换行」代码块 + 「边界清单」8 条 | 弱模型仅凭设计稿即可逐字实施；边界逐条对应代码（`hit-test.js:183-184`、`use-cell-tooltip.js:55/150-155`、`cell-tooltip.js:229-247`） | 否 |
| 8 | 风险与回滚 | 行为扩面补「canvas 默认开启 / DOM 默认关闭为已知分叉、范围外」；新增「验证依赖」风险条 | `base/table.vue:195` + `base/table-row.vue:82-83` 仍为 truthy 口径；`use-cell-tooltip.js:55` 控制器缺失直接短路（A1-A3 会全假阴性） | 是 |
| 9 | 测试计划 A1 | 重写为 3 步：`?scene=default`、`getCellRect(1,4)` 600ms、精确 textContent 字面、`getCellRect(0,4)` 700ms 断言无面板 | 00-task A1；坐标来自 `getCellRect`（视口坐标）；面板 `v-show`（`tooltip-panel.vue:5`）；精确字面取自 step 2.1 夹具 | 是 |
| 10 | 测试计划 A2 | radio 点击 → `?scene=items` URL 直载；增场景生效判据 `colWidths` 长 13 且前三位 `[120,150,150]`；补两条精确期望串 | `SCENE_WHITELIST`（main-view.vue:1020-1023）含 `items`；itemColumns 现有 11 列（:781-813）+ 新 2 列 = 13；名称 120、新列各 150（`:782` + 新夹具）；弱模型点击 radio 时序不稳 | 是 |
| 11 | 测试计划 A3 | 拆两步并补「移出后等 800ms 再断言」 | 收起链路 = `delayHide`（HIDE_DELAY 300，common/popup.js:7）+ 退场过渡（`doExit` :66-79，`transition-duration:.1s`）；沿用 `playwright-delay-hide-popup-testing` | 是 |
| 12 | 测试计划 A4 | 增「只认 onMounted 首次自动运行、不点重跑」；判定收紧为「任何 fail 即不通过、如实上报」 | 预热后重跑恒败（INDEX-table `table-ex-counter-assert-warm-cache`）；不点重跑避免假阴性；不豁免失败以保持 00-task A4 口径 | 是 |
| 13 | 测试计划 A5 | `npx eslint src demo/src` → `npx eslint --ext .js,.vue src demo/src`；注明工具为全局安装、勿装依赖 | 本轮实测：无 `--ext` 时 eslint 8 目录参数只扫 .js（本任务改动的 `table-ex.vue`/`main-view.vue` 不被覆盖）；带 `--ext` 基线 exit 0；`which eslint/stylelint` = 全局 /d/npm/global，`node_modules/.bin` 无此 bin | 是 |
| 14 | 验证环境要点 | 全量改写：src 与 demo/src 都由 `npm run demo:build` watch 重建（vite.demo.config.js 别名 `mussel`→src/index.js、`./components/index.js`→index.ex.js）；所有 Edit 文件 touch；面板可见性断言口径（computed display / getClientRects，禁 offsetParent；root pointer-events:none）；坐标越界先 scrollIntoView 并重取；`.playwright-mcp/.gitignore` 已存在 | vite.demo.config.js 实读；tooltip-panel.scss:10（pointer-events:none）、tooltip-panel.vue:5（v-show）；项目根 `.playwright-mcp/.gitignore` 实读 | 是 |
| 15 | 实施步骤 1.1 | 补逐字替换 5 条；完成判据改为分别 grep：hit-test `title === false` 1 处、table-ex `title !== false` 1 处、cell-tooltip `raw !== true && raw != null` 1 处、`if (!raw) return null` 0 处；eslint 加 `--ext` | 事实错误修正：改后 table-ex.vue 含 `!==`，原 `grep "title === false"` 会对该文件 0 命中 → 实施者误判失败 | 是 |
| 16 | 实施步骤 1.2 | 补可照抄断言代码（interactions：`[3,0]` 未设置放行、`[3,4]` 空串放行；cell-painters：短文本 content/overflow + 长文本 overflow）；补内联注释 `:1995`、块名/返回串/模块头新文案；标注 helper 锚点 `:349-360`/`:362-379` | 原表述「断言返回 {content,...}」无法直接执行（`assertEqual` 对对象永不相等），弱模型易写成错断言；`assertArray` 为 interactions 块既有 helper（`interactions.js:52`） | 是 |
| 17 | 实施步骤 2.1 / 2.2 | 字面修正（longText 31 字、按钮 caption 18 字，实测 length）；内容宽 134 注明来源（`--cell-padding 8`×2）；2.2 增验证入口 URL | 实测字符串长度；table-ex.scss:5；vite 别名下 demo 消费 src 源码 | 否 |
| 18 | 终验 + 实施注意 | 精确 lint 命令；A1-A4 复验编排（scene=default/items）；touch 全量改动文件、坐标实时重取、不点重跑自检 | 同上（知识条目 `demo-watch-agent-edit-cache-bust`、`table-ex-demo-interaction-verify`） | 是 |
| 19 | 未解问题 → 裁决记录 | 2 项选择裁定：① `title: null` 归默认开启；② devWarn 保留扩面、仅更新文案 | ① decisions.md [启动] 与 A3 只定义 `false` 抑制，新增 null 抑制值超出验收口径；`prepareColumn` 对 null 走常量函数（cell-content.js:79）② `warn` 全局 once + dev-only（src/utils/warn.js:4-19），成本为每 dev 会话最多一条 warn；demo 完整 install 有控制器（tooltip/index.js:6），验证环境不触发 | 是（关闭未决项） |

## 未解决异议（累计）

无（0 条，争议 0 条）。原设计「未解问题」2 项已由本轮裁决关闭，结论写入 `02-design.md` 的「裁决记录」。
