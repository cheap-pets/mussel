# 验证报告（终验 第 1 轮 · 整体实施）

VERDICT: FAIL

FAIL 唯一成因：环境阻塞（本环境无 playwright MCP，测试计划中全部 `浏览器` 手段不可执行 → 相关标准 UNVERIFIED）。所有可自动化验证（命令 / Node 直跑 / 构建产物 / 源码审计）全部通过，未发现实现缺陷；范围核对无设计外改动。

验证者与 implementer 独立：未采信 04-impl.md「自检」节任何结果，全部命令亲自重跑；04-impl.md 仅用于读取改动文件清单与偏离记录。

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `node evidence/verify-1/run-self-checks.mjs`（Node ESM 直跑 self-checks/text-wrap.js + row-geometry.js + row-geometry-controller.js 全部断言，stub：~icons/.vue/.scss + `@` alias + 目录导入；验证环境独立搭建，脚本见 evidence/verify-1/） | 通过（exit 0） | `TOTAL: 43 pass, 0 fail`——text-wrap 14（含 LRU 新断言）、row-geometry 18（含 count 通道 + 免取值 fast path 新断言）、row-geometry-controller 11（含表级短路 / 条件破坏四路径 / 升级路径完整新断言）；既有断言无回归。日志：evidence/verify-1/self-checks-run.log |
| `node evidence/verify-1/probe-count-and-lru.mjs`（verifier 补充探针） | 通过（exit 0） | `PROBE TOTAL: 8 pass, 0 fail`——count 产物语义 6 项 + LRU 淘汰重算逐字节一致 2 项。日志：evidence/verify-1/probe-run.log |
| `npx stylelint "src/**/*.{scss,css,vue}" --fix`（00-task 指定） | 通过（exit 0） | 运行后 `git diff --stat` 仍为 530 insertions / 14 deletions，与运行前一致 → 零差异 |
| 构建产物核对 | 通过 | `demo/dist/assets/catalog.js`（共享 chunk，mtime 2026-11-07T13:26:07 ≥ 最晚源文件 mtime 13:21:26）含四项优化编译段：短路谓词 `if (mode === "uniform" && !spans && columns.every((col) => !isEntryColumn(col) && !((col._maxLines ?? 1) > 1) && !col.multiline))`、`render.count` 挂载、`typeof col._render?.count === 'function'` 消费、`const flat = metrics.rowHeight >= metrics.padding * 2 + metrics.lineHeight`、createWrapCache LRU。摘录：evidence/verify-1/bundle-catalog-extracts.txt |
| `demo/dist/data/table-ex/main.js` 内容核对 | 通过 | 含 4 个 self-check 文件全部新增断言串（「表级短路：全确定单行列」「升级路径完整」「LRU 逐条淘汰」「count 计数通道」「免取值 fast path」）与 `single` 场景载体（`SCENE_WHITELIST`、`singleLineColumns`） |
| HTTP 探活 | 通过 | `GET http://localhost:3000/data/table-ex/` → 200；`GET http://localhost:3000/data/table-ex/?scene=single` → 200（dev 服务在跑，页面与场景可载入） |
| 语法 | 通过 | 3 个 self-check 模块 + src 全依赖链经 Node ESM import 成功执行 43 项断言（强于 `node --check`） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 确定单行表 scanCount=0、行为一致 | 自检 + `浏览器` | 自检（Node 直跑 PASS）：首扫 `scanCount=0`、`rebuild=false`、mode 保持 uniform、rows 引用替换后仍 0；四条条件破坏路径（加条目列 / `_maxLines>1` 候选 / spans 非 null / mode 已 variable）均恢复全量扫 `scanCount=6`。源码审计：短路返回 `resolveGeometry(rows, theme)`（controller:347）与常规路径出口（:359）同源，写回 `lastScan*` 四字段（:341-344）与 `rescanRowHeights` 写回（:178-181）逐字段一致；谓词与设计逐字一致（controller:336-340）。`浏览器`（playwright：`?scene=single` 载入断言 `lastRelayout.scanCount===0`、`getCellRect` 行高与优化前基线逐值对比、滚动不跳） | UNVERIFIED——`浏览器`手段不可执行（环境阻塞）。自检 + 审计部分 PASS |
| 2 计数通道、交互不变 | 自检 + `浏览器` | 自检（Node 直跑 PASS）：带 `.count` 夹具估高/精算 render 主体零调用（spy）、count 每格恰 1 次、`maxItems` 钳制 4 行 88、无 `.count` 回落全产物 3 行 70。verifier 探针 PASS（6/6）：canvas 挂 count / dom 不挂 / 非数组·对象·空数组 0 / 空 label 过滤 / max=3、-1、2.5、'2'、0、undefined 下 `count ≡ 渲染 items.length`（同 slice 表达式）/ LinkColumn 委托（单值 1、数组过滤 2、linkOption.max 截断）。源码审计：count 与渲染共享 `getItems`/`normalizeEntries`/`max` 闭包，`shown` 表达式逐字同源（list.js:118 与 :155）；渲染主体、item-painters、use-cell-click 零改动（diff 审计）→ 点击/hover/命中区链路未触碰。`浏览器`（items 场景 cell-item-click 日志 / hover 命中区 / dots payload） | UNVERIFIED——`浏览器`手段不可执行（环境阻塞）。自检 + 探针 + 审计部分 PASS |
| 3 数据单行行为不变 | 自检 + `浏览器` | 自检（Node 直跑 PASS）：flat 夹具（36/8/18）`_value` spy 0 次、heights 全 36、hasArrayValues false；非 flat 夹具（rowHeight 30）逐格取值每行 1 次、34/30 行高差保留。源码审计：`flat` 取自 `rowMetricsOf(theme)`（row-geometry.js:342、:352），与 `rowHeightOf` 同源；精算链 `ensureRowMeasured`/`mergeMeasuredHeights` 零改动（diff 审计）。`浏览器`（multiline 首屏行高快照、深滚锚定、`__ctStage().records[i]` 就地改值 + recordsVersion 通知后行高更新） | UNVERIFIED——`浏览器`手段不可执行（环境阻塞）。自检 + 审计部分 PASS |
| 4 wrapCache LRU 逐字节一致、命中 | 自检 | 自检（Node 直跑 PASS）：limit=3 填 5 → size 3、存活 3 条命中免测量、最旧条目重算触发测量、get 触碰改变淘汰序（甲存活乙被淘汰）、`createWrapCache(0)` 不挂死 size ≤ 1。测试计划中「同一输入淘汰重算前后 lines/lineCount 逐字相等」断言未在 self-checks 落地（见「测试质量问题」），由 verifier 探针补验 PASS：200 组随机冷键（变长/变宽/变 maxLines）超限逐条淘汰后重算，`JSON.stringify({lines, lineCount, clamped})` 逐字节相等（mismatches=0）；命中路径 / 淘汰重算路径 / 冷算路径三路比对一致 | PASS（含探针补验） |
| 5 自检全过 + playwright DOM/a11y | `浏览器` | 自检部分：可 Node 直跑的 3 模块 43/43 全绿（含 4 个改动文件全部新增断言）；其余 8 个模块（tree/spans/theme/layout/cell-painters/painter/interactions/editor）为 canvas/DOM 依赖，Node 无法直跑。playwright DOM/可访问性断言 | UNVERIFIED——环境阻塞（自检面板 11 模块全绿需浏览器执行） |
| 6 10 万行可交互 + 分场景 scanCount | `浏览器` | `?scene=single` 与 default 场景 HTTP 200 可载入；场景载体与 `lastRelayout.scanCount` 断言通道均在编译产物中（bundle 核对）。`浏览器`交互无卡死与 scanCount 分场景断言（default 首绘 100000 / 替换列 100000 / single 0） | UNVERIFIED——环境阻塞 |

## 范围核对

`git status --short` + `git diff --stat` 对照设计改动清单（9 文件）：

- 9 个改动文件全部在场，与 02-design.md 改动清单逐一对应，无缺漏：`src/components/table/ex/shared/text-wrap.js`（26 行）、`src/components/table/column-types/list.js`（29 行）、`src/components/table/ex/geometry/row-geometry.js`（24 行）、`src/components/table/ex/geometry/row-geometry-controller.js`（29 行）、`demo/src/data/table-ex/main-view.vue`（17 行）、4 个 self-checks 文件（56/124/197/39 行）。合计 530 insertions / 14 deletions。
- 基线排除项：`todo/misc.md`（基线脏文件，decisions.md 已确认与本任务无关）。
- 验证产物：`agent-docs/plans/20261107-table-ex-estimate-opt/`（任务目录本身，未跟踪，含本轮 evidence/verify-1/ 共 6 文件）；`demo/dist/**` 与 `dist/**` 均被 .gitignore 忽略（git status 不显示，本轮验证触发的构建产物已忽略）。
- 无法区分：无。
- 设计外改动：**无**（除基线排除项与任务目录外，git status 无任何其他条目）。

## 行为冻结审计（派发约束 4 专项）

**uniform→variable 升级路径——原样保留：**

- `row-geometry-controller.js` 全文件 diff 仅 2 个 hunk（import `isEntryColumn` + 短路块 :327-351）。以下符号零触碰（均不在 hunk 内，path:line 为当前行号）：`upgradeToVariable`（:126-131，升级第一动作 `lastScanRows = null`）、`remeasureUniformRow`（:211-222，`hasArrayValues` → `upgradeToVariable()` + `ctx.relayout()`）、`remeasureRow` 入口（:444）、`isScanDirty`（:147-152）、`rescanRowHeights`（:177-202）。
- 短路不截断升级路径的两重保证（源码审计 + 自检双重证据）：① 升级后 `mode === 'variable'` 使谓词恒假；② `upgradeToVariable` 置 `lastScanRows = null` 使 `isScanDirty` 必真。自检「升级路径完整」Node 直跑 PASS：`remeasureRow(1)` → 升级 variable + 壳 relayout 恰 1 次 → 重扫 `scanCount=4` / `rebuild=true` / 行 1 高 70（3 条目真值）。

**recordsVersion 通道——原样保留：**

- `measuredSnapshot`（controller:255 `recordsVersion: ctx.getRecordsVersion?.() ?? 0`）与 `remeasureVisibleRows` 快照匹配（:401-406 `cached.recordsVersion === version`）零改动；scan 签名不含 recordsVersion 的既有语义未变。既有 check「recordsVersion 快照失配」Node 直跑 PASS：bump 后重算、rows 引用不变不重扫（`scanCount 0`）。

**spans 分层——原样保留：**

- `spans.js` / `spanHeightRoleOf` 零改动（不在改动清单，git status 无此文件）。短路谓词保守要求 `!spans`（controller:337），spans 非 null 一律走原路径。自检条件破坏 ③ 以 `buildSpans` 真实 SpansIndex 断言恢复全量扫 PASS。spans 缓存重置（:310-313）与 `syncMeasuredHeightCache`（:315）在短路判定之前照常先行（位置审计）。

**wrapCache LRU 与整体清空策略的逐字节一致性验证方式（在报告中给出）：**

1. 结构论证：`git diff` 显示 `wrapLines` 折行主体零改动，仅 `createWrapCache` 函数体变化；缓存值 = `computeWrap` 结果，key = `text\0font\0maxWidth\0maxLines`，`measure` 对同参数返回同宽（theme.js createMeasureCache 保证）→ 值是 key 的纯函数，LRU 淘汰仅导致重算，不改变任何折行结果。
2. 逐字节验证（verifier 探针，evidence/verify-1/probe-run.log）：注入固定 measure（10px/字），200 组随机冷键（长度 1–25、宽 40–90、maxLines 0–3）依次写入 limit=5 缓存触发逐条淘汰，再以全新缓存对同输入冷算，`JSON.stringify({lines, lineCount, clamped})` 逐字节比对 `mismatches=0`；另验「首算 → 被挤出 → 重算」三态与冷算逐字一致。自检侧另覆盖 get 触碰改变淘汰序与 `limit=0` 单步淘汰（不挂死）。
3. 消费方零改动：row-geometry 精算 / cell-text 绘制 / cell-tooltip 对 `{ get, set, size }` 接口的使用不受影响（接口签名未变，diff 审计）。主题切换整体重建 wrapCache（use-table-instances.js:50 onThemeChange）的失效链不在 diff 中，未触碰。

## 测试质量问题

1. [小问题] `demo/src/data/table-ex/self-checks/text-wrap.js`：测试计划 AC4 列有「同一输入在淘汰重算前后 lines/lineCount 逐字相等（冷键加随机小数防预热）」断言，实施的 LRU check 仅断言「最旧条目重算触发测量」（`hitCounter.calls > 0`），未对重算结果值与原结果做逐字比对。影响：LRU 重算结果漂移该断言不报错（现实现为纯函数故无漂移，verifier 探针已独立补验通过）。建议后续补一行结果比对断言（非阻塞，不构成 FAIL）。
2. [小问题·已知] `window.__valueCalls` 性能计数列在 scan 期随免取值变为 0（仅精算期有值）——设计「遵循约定」节已预述的语义变化，repo 内无断言消费；profiling 知识页口径更新留任务收尾按用户确认处理（04-impl.md 遗留 2 一致，无冲突）。

## 需人工检查

（无「人工」手段标准；以下为环境阻塞解除后的浏览器执行项，与 UNVERIFIED 标准一一对应）

1. AC1（AC6 部分）：载入 `http://localhost:3000/data/table-ex/?scene=single`（100000 行新实例）→ 读 `getLayoutInfo().lastRelayout`（先复位触发源、两 tick、有效性判据）断言 `scanCount === 0`、`rowGeometryMode === 'uniform'`；切数据规模 few/empty 再回 full 仍 0；行高与优化前基线（推导值 36）逐值一致、滚动不跳。
2. AC2（AC6 部分）：items 场景——list/link 点击 `cell-item-click` 日志、hover 命中区（pill 区非整格）、dots 截断条目点击 payload 值 `'...'`。
3. AC3：multiline 场景首屏多行行高 > 36（`getCellRect`）；深滚 scrollTop 无跳变；`__ctStage().records[i]` 就地改长文本 + 通知 recordsVersion → 行高更新。
4. AC5：自检面板 11 模块全绿 + DOM/可访问性快照断言（不截图）。
5. AC6：default 场景（100000 行）加载可交互（事件日志可响应）；`scanCount` 分场景断言——default 首绘 = 100000、点「替换列」= 100000、`?scene=single` 首绘/换行数 = 0。

## 验收入口（PASS 时必填；本轮 VERDICT=FAIL，仍附供环境解除后使用）

1. 标准自检总入口（AC5，部分自动化）：`node agent-docs/plans/20261107-table-ex-estimate-opt/evidence/verify-1/run-self-checks.mjs` → `TOTAL: 43 pass, 0 fail`（约 10 秒）。
2. AC1/AC6 浏览器项（需 playwright MCP 或手动浏览器）：访问 `http://localhost:3000/data/table-ex/?scene=single` → 控制台执行读取 `lastRelayout` 的既有约定断言 `scanCount === 0`；再访问 default 场景断言首绘 `scanCount === 100000` 且滚动/点击可交互。
3. AC2/AC3 浏览器项：同页切 items / multiline 场景按「需人工检查」2–3 步骤操作。

## 环境阻塞

1. 缺 playwright MCP（本验证环境工具集无浏览器自动化）：影响测试计划中全部 `浏览器` 手段——AC1 的场景载入/行高基线对比、AC2 的交互回归（点击/hover/命中区）、AC3 的行高快照/锚定/recordsVersion 联动、AC5 的自检面板 11 模块全绿 + DOM/a11y 断言、AC6 的 10 万行交互与分场景 scanCount。共 5 条标准整体或部分 UNVERIFIED。不代验、不推定为过。
2. Node 直跑覆盖边界：8 个浏览器-only 自检模块（canvas/DOM 依赖）无法在 Node 执行——其新增断言（cell-painters count 产物断言）的语义本体已经 verifier 独立探针在 Node 覆盖（对 `ListColumn.compile`/`LinkColumn.compile` 直验 6/6），但「自检面板全绿」本身仍需浏览器。

## 失败项（FAIL 时；不含环境阻塞）

无。全部可自动化验证通过，无实现缺陷，无设计外改动。VERDICT=FAIL 仅由上述环境阻塞的 UNVERIFIED 构成（按角色契约「环境阻塞导致的 UNVERIFIED → FAIL」判定；00-task 无「环境豁免」标注）。
