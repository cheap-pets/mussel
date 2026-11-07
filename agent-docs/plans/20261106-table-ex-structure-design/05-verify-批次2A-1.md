VERDICT: FAIL

片验证（批次 2A：O4 + O5 三项机械提取），第 2 轮（轮 2）。环境：HEAD 工作区含批次 1 + 批次 2A + 前任务（20261106-ex-fixed-select-hover-span）未提交改动；demo 服务由本轮自启（`npm run demo:build`，实际监听 PID 3520，验证后已 taskkill，端口 3000 已释放复核）。判定：6 项派发验证中 5 项 PASS（含本轮主项探针基线逐字比对——页面加载口径与基线一致）；唯一失败项为静态扫描发现的 `use-cell-tooltip.js:141` 残留自由标识符 `isSameCell`（本批删除其局部定义时漏转换该调用点），经 hover 交互探针运行时实证（6 条 ReferenceError，tooltip 展示全断），属本批引入、破坏行为冻结 → FAIL。

## 上轮问题核对（第 2 轮起）

| 上轮（05-verify-批次1-1）项 | 本轮结论 |
|---|---|
| 唯一 FAIL 驱动：验收标准 2 UNVERIFIED（探针基线缺失，环境阻塞） | 已解决。decisions 落定「2A 实施前先采集基线」，probe-baseline-2A.md 于 2A Edit 前落盘（04-impl 基线采集节 + 基线文件元数据互证）；本轮按其采集方式复采并完成逐字比对，页面加载口径全一致（evidence/baseline-comparison-2A.md）。批次 1 豁免裁决（diff 机械等价审计替代）按 decisions 维持，未被推翻 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（独立重跑） | PASS（exit 0） | 4 段 vite build 全 `✓ built in 462–519ms`；ex 332 modules ×2；`dist/mussel.ex.min.js 332.49 kB`——与 04-impl 自检记录逐字一致 |
| `npm run demo:build`（后台，验证员自启） | PASS | `✓ 487 modules transformed`（基线 485，+2 = 2 个新建文件）；`built in 638ms`（基线 645ms）；table-ex 三页产物尺寸与基线逐字同值（454.30/12.86/8.41 kB）。日志 evidence/demo-build-verify.log |
| `grep -rn "editing/editor\.js" src/.../table-paint src/.../interaction` | PASS（0 命中） | 空。设计 §4.2 行为判据（R4 口径，未误命中 editor-geometry） |
| 全仓引 `editing/editor`（含无后缀）扫描 | PASS | 仅 2 处且均为状态机符号：table-ex.vue:82（createEditorController）、demo self-checks/editor.js:34（createEditorController/isInDropdownPanel/resolveBlurFallback） |
| 4 几何符号消费方扫描 | PASS | 6 处全改引 editor-geometry：use-cell-click.js:22（computeEditorStyle）、edit-button.js:7、paint-overlay.js:4（3 符号）、demo editor.js:35（3 符号）、demo painter.js:25、demo spans.js:29 |
| editor-resolve 消费方扫描 | PASS | 全部直引：table-ex.vue:83（isCellEditable）、use-cell-click.js:23（resolveEditorType）、editor.js:8–15（自用 6 符号）、demo editor.js:36–46（9 符号）；专属符号 NON_EDITABLE_TYPES/usesDerivedOptions/resolveSelectOptions 全仓仅 editor-resolve 自身与 demo editor.js（直引） |
| cell-identity 消费方扫描 | PASS | 7 src 文件与清单一致（use-cell-click:26 / use-pointer:20 / use-cell-tooltip:29 / row-geometry-controller:33 / cell-selection:7 / spans-method:1 / paint-body:16）；cell-identity.js 零 import |
| recordNumber 归一式残留扫描 `grep "|| 0) + "` | PASS（含 :298 核实） | 仅 4 处：cell-identity.js:14（注释）/:18（实现本体）；row-geometry-controller.js:298（偏离 1 所述漏计站点，见下）；painter.js:156 与 demo main-view.vue:526 为无关误命中（colWidths / 计数器） |
| `git diff -U0` row-geometry-controller.js hunk 核对 | PASS | 仅 3 hunk：`@@ -18,0 +19,5`（批次 1 @getters）、`@@ -27,0 +33`（2A import）、`@@ -419 +425`（2A 使用点）。:298（=HEAD:292 平移 6 行）不在任何 hunk 内，内容与 HEAD:292 逐字同文 → 偏离 1「确未动」核实成立 |
| `git diff -U0` 避让四文件归因 | PASS | paint-overlay.js：import hunk `@@ -2,2 +2,3`（批次 1 行 2 + 2A 行 4 两条改引）+ 其余 14 hunk 全为前任务 hover 带区（57–98 区 + 122/152/189 区，与批次 1 验证记录的前任务 hunk 清单吻合，仅 +1 行平移）→ 本批增量仅 import 行 4；paint-gridlines.js：2 hunk（65/75 区）内容为前任务「人工修订 2」注释 + `cols.to + 1`，批次符号 grep 0 命中 → 零触；demo painter.js：`@@ -25 +25`（2A editor-geometry）+ `@@ -27 +27,2`（批次 1）+ 其余 3 hunk 全为前任务（buildSpans import / 夹具 90 区 / 断言 1417 区「断言 D/E/F」）→ 断言区本批未触；use-pointer.js：`@@ -70,6 +81,0`（2A 删 isSameHover 6 行）+ import :20 + 其余全为批次 1 改名/前任务区 |
| `git diff` table-ex.vue + API 冻结 grep | PASS | 3 hunk：import 拆分（81–83）、注释 `ctx 载体`→`host 载体`（:223，偏离 5）、@getters 指向注释（:338，批次 1）；`defineProps\|defineEmits\|defineExpose` 0 命中 |
| playwright 三页复采 + 自检面板 | PASS | /data/table-ex/: 1 error + 43 warnings + 1 INFO，46 行归一化 diff 与基线仅 4 行 icon 夹具时间戳后缀差异（`noRegEntry${Date.now()}` 等，运行时生成）；面板 `自检结果（232/232 通过）`、232 项、fail 0、✗ 0、12 模块分布计数逐一吻合。basic/scene 两页 0 error 0 warning。明细 evidence/baseline-comparison-2A.md |
| hover 交互探针（补充） | **FAIL** | 滚动至顶部后对画布表体 12 个点位逐一 hover（每点停留 900ms）：console 新增 6 条 `ReferenceError: isSameCell is not defined at showCellTooltip (catalog.js:28215)`。批次前 HEAD 该函数有局部 isSameCell 定义（HEAD:37），不抛错。证据 evidence/console-hover-probe.log L47–L52 |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 build + self-checks 全量像素断言通过 | 命令 + 浏览器 | build exit 0（4 段 ✓）；232/232、fail 0、✗ 0（evidence/baseline-comparison-2A.md §2） | PASS |
| 2 行为冻结：探针基线逐字比对 | 浏览器（设计手段 = 页面加载口径，probe-baseline-2A.md §4）+ 补充交互探针 | 页面加载口径 PASS：三页 console 条数/文本/顺序逐字一致（仅时间戳、产物行号、夹具 Date.now() 后缀三类允许漂移）；但 hover 交互探针暴露 tooltip 展示路径行为破坏（6 条新 ReferenceError，批次前无）——行为冻结实质未达成 | **FAIL**（补充探针证据） |
| 3 demo self-checks import 与源码移动/改名同批同步 | 命令 | demo editor.js 三分拆（editor 3 符号 :34 + editor-geometry 3 符号 :35 + editor-resolve 9 符号 :36–46）；demo painter.js:25、demo spans.js:29 改引 editor-geometry；editor 模块 18 条断言全过（232 内） | PASS |
| 4 不改变组件对外 API | 命令 | evidence/table-ex-vue.diff：仅 import 行 + 2 注释行，props/emits/defineExpose 0 命中 | PASS |

## 范围核对

`git status --short`：31 M + 5 ??；批次 2A 增量（相对批次 1 验证时 25 M + 3 ??）= 6 M + 2 ??，全部落在 §4.2 清单 16 文件内（editor.js / edit-button.js / paint-body.js / cell-selection.js / spans-method.js / demo editor.js 六个新 M + editor-geometry.js / cell-identity.js 两个新 ??）。

- **基线排除项**（前任务遗留）：agent-docs/knowledge/INDEX.md、knowledge/project/table-ex-overlay-clip-body-area.md（M）；?? table-ex-hover-span-region.md、两个 plans 目录。
- **其他片文件**：无（批次 1 记录已并入工作区，批次 2B 未实施——paint-overlay 描边链/use-tree-rows/use-table-instances/row-geometry.js 的 2B 范围零触碰，与 04-impl 遗留节一致）。
- **无法区分**（基线脏 ∩ 本批白名单，git 不可分任务，已做 hunk 级内容归因）：use-pointer.js（批次 1 改名 + 2A isSameHover 块 + 前任务特性 hunks）、paint-overlay.js（批次 1/2A 各 1 import 行 + 前任务 hover 带区）、demo painter.js（批次 1/2A import 行 + 前任务夹具/断言区）、paint-gridlines.js（纯前任务，批次符号 0 命中）、table-ex.vue（import/注释均归属明确）。无越权行。
- **设计外改动**：无（31 M = 批次 1 的 18 src + 4 demo + 批次 2A 增量 6 M + paint-gridlines 前任务 + 2 知识文件；全部有归属）。
- **验证产物**：dist/、demo/dist/（构建产物，gitignore 内）；agent-docs/plans/20261106-table-ex-structure-design/{05-verify-批次2A-1.md, evidence/}（9 个文件）；.playwright-mcp/ 新增 console/page 快照（.gitignore 已含）。
- **并发片**：无。

## 测试质量问题

- self-checks 232 断言不覆盖 tooltip 展示路径：showCellTooltip 仅在「hover 有 tooltip 目标的格且定时器到期」时执行，页面加载型自检与探针基线均不触发——本缺陷因此连过实施自检（「1 error + 43 warnings 与基线同构」）与基线比对两道网。建议：后续批次（2B/3）探针基线采集追加最小交互步（hover 单个含溢出文本单元格 ≥1s 后读 console），冻结交互路径行为。

## 需人工检查

设计未标"人工"项。不适用。

## 验收入口（本轮 FAIL，仍给出供复核）

1. 标准 1/3 — 终端 `cd D:\workshop\cheap-pets\mussel && npm run demo:build`（watch 需手动 Ctrl+C），浏览器访问 `http://localhost:3000/data/table-ex/`，调试面板应显示「自检结果（232/232 通过）」。
2. 标准 2（失败项复现）— 同上启动后访问 `/data/table-ex/`，鼠标悬停任一有溢出文本的单元格 ≥1 秒，DevTools console 出现 `ReferenceError: isSameCell is not defined` 且 tooltip 不弹出——即本轮唯一失败项。
3. 标准 1（build）— 终端 `cd D:\workshop\cheap-pets\mussel && npm run build`，退出码 0。
4. 标准 4 — 终端 `git diff -- src/components/table/ex/table-ex.vue`，确认仅 import 行与注释行。

## 环境阻塞

无。playwright mcp 可用，服务自启/关闭正常（PID 3520 杀灭、端口释放复核）。

## 失败项

1. **标准 / 验证项**：验收标准 2（行为冻结）+ 派发验证项 4（cell-identity 提取核验：原散布站点应指向新模块）。
   **关键错误**：`ReferenceError: isSameCell is not defined at showCellTooltip`（hover 交互探针运行时 6 次；tooltip 展示路径全断）。
   **疑似位置**：`src/components/table/ex/composables/use-cell-tooltip.js:141`——批次 2A 删除局部 `isSameCell` 定义（HEAD:37）时仅转换 HEAD:64 去重点（现 :68 `isSamePoint`），漏转换 HEAD:137 过期守卫（现 :141）；全仓 `isSameCell` 定义 0 命中（grep 证据见命令结果行 7 下、evidence/console-hover-probe.log）。
   **归因**：本批引入（批次前 HEAD:137 所引局部函数存在且可用）；04-impl「删局部 isSameCell，调用点改 isSamePoint」表述漏计此调用点（原 isSameCell 调用点实为 2 处非 1 处）。
