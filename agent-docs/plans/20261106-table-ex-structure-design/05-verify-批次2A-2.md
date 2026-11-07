VERDICT: PASS

片验证（批次 2A：O4 + O5 三项机械提取）复验，第 3 轮（修复轮 批次2A 第 1 轮后）。派发为聚焦复验（5 项，不重复全量）。环境：HEAD a4460ce 工作区（批次 1 + 批次 2A + 修复 1 行 + 前任务未提交改动，无新提交）；demo 服务本轮自启（`npm run demo:build` 后台，首建 487 modules，监听 PID 7256，验证后 taskkill，端口 3000 释放复核通过）。判定：上轮唯一 FAIL 项已闭环（静态 + 运行时 + tooltip 正向弹出三重实证），前次 PASS 项抽验通过，行为冻结口径全达成 → PASS。

## 上轮问题核对（第 2 轮起）

| 上轮（05-verify-批次2A-1）项 | 本轮结论 |
|---|---|
| 唯一 FAIL：use-cell-tooltip.js:141 残留自由标识符 `isSameCell`，hover 时 6 条 `ReferenceError: isSameCell is not defined at showCellTooltip`，tooltip 展示全断 | **已解决**。三重实证：① 静态——:141 现为 `if (!isSamePoint(tooltipCell, cell)) return`，:29 `import { isSamePoint, recordNumberOf } from '../shared/cell-identity'` 存在（grep 证据，命令结果行 4）；全仓 `grep -rn isSameCell src/ demo/src/`（含未跟踪新文件）仅 cell-identity.js:4 注释（历史来源说明，非代码），自由标识符 0 残余，与 04-impl-批次2A-修复-1「同类漏网全量自查」一致。② 运行时——hover 探针（画布表体 12 点位 × 900ms 停留，滚动至顶部）0 新增 console error/warning，轮 1 的 6 条 ReferenceError 全部消失（evidence/reverify-dom-evidence.json）。③ 正向——tooltip 面板真实弹出：点位 (330,54)/(330,90) 显示「状态码：active」、(330,126) 显示「状态码：pending」（TOOLTIP_SHOW_DELAY=300ms 到期 → 过期守卫 isSamePoint 通过 → resolveCellTooltip → show 全链恢复，逐行内容正确）。修复轮改动面 = use-cell-tooltip.js 单行标识符替换，未扩面 |
| 上轮「测试质量问题」：232 断言与探针基线均不覆盖 tooltip 展示路径 | 本轮已按派发执行 hover 交互探针补上该盲区（PASS）。该建议本身（后续批次基线采集追加最小交互步）仍属验证方案改进项，留调度者/后续批次处理，不计失败 |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（独立重跑） | PASS（exit 0） | 4 段 vite build 全 `✓ built in 471–517ms`（base 285 modules ×2 + ex 332 modules ×2）；`dist/mussel.ex.min.js 332.48 kB`（04-impl-修复-1 自检记 332.49 kB，差 0.01 kB 属产物字节舍入，段数/模块数/无告警一致） |
| `npm run demo:build`（后台，验证员自启，PID 7256） | PASS | 首建 `✓ 487 modules transformed`（基线 485 + 2 个新建文件，与轮 1 同值）；`built in 625ms`（基线 645ms）；table-ex 三页产物与基线逐字同值：table-ex 454.30 / basic 12.86 / scene 8.41 kB。日志 evidence/demo-build-reverify.log。验证后 taskkill //F //PID 7256，`netstat` 复核 `PORT_3000_FREE` |
| `grep -rn "isSameCell" src/ demo/src/` | PASS（仅注释） | 唯一命中 `src/components/table/ex/shared/cell-identity.js:4`（注释「单一事实源：use-pointer.isSameHover（hover 高亮去重）与 use-cell-tooltip.isSameCell」）——历史来源说明，非代码；自由标识符 0 残余 |
| `grep -n "isSamePoint" src/.../use-cell-tooltip.js` | PASS | :29（import）/:68（去重点）/141（过期守卫，本轮修复行） |
| `grep -rnw "isSameHover" src/ demo/src/` | PASS（0 代码命中） | 仅 cell-identity.js:4 注释提及；use-pointer.js:164/200 为独立五字段谓词 `isSameHoverItem`（-w 不命中，cell-identity.js:5 明示不并入、04-impl 清单未迁移）——非漏网，与修复记录一致 |
| `git diff -- src/components/table/ex/table-ex.vue` + API 符号 grep | PASS | 3 hunk 与轮 1 逐字同态：import 拆分（prepareColumn→cell-content 为批次 1、editor/editor-resolve 拆分为 2A）、注释 `ctx 载体`→`host 载体`（:223）、@getters 指向注释（:338）；diff 中 `defineProps\|defineEmits\|defineExpose` 0 命中 |
| `git diff -- src/.../paint-gridlines.js` | PASS（零触复核） | 仅 2 hunk（:62–70 注释 + :79 `cols.to + 1`），内容为前任务「人工修订 2」；本批符号（isSamePoint/recordNumberOf/editor-geometry 等）0 命中、无 import 变更——批次 2A 零触碰成立 |
| `git status --short` + `git log --oneline -3` | PASS | 30 M + 5 ??（口径澄清见范围核对）；HEAD = a4460ce，无新提交（无违规 commit） |
| playwright 三页复采（页面加载口径） | PASS | /data/table-ex/：46 行 console = INFO 1 + WARNING 43（Canvas2D×38 + icon 夹具×5）+ ERROR 1（无效图片夹具），与基线同构；归一化逐字节比对 `NORMALIZED_IDENTICAL: 46 lines`（归一化仅剥离三类允许漂移：`[ Nms]` 时间戳、`main.js:N` 产物行号、`noRegEntryN`/`editGateProbeN`/`noRegEditN` 夹具 Date.now() 后缀；轮 1 报告的 4 行 icon 差异即此类后缀）。basic/scene 两页：均仅 1 条 INFO（Vue dev build，catalog.js:8839 锚点同基线），0 error 0 warning。原文 evidence/console-reverify-table-ex.log（46 行）/console-reverify-table-ex-basic.log/console-reverify-table-ex-scene.log；基线原文 `.playwright-mcp/console-2026-11-06T16-48-37-009Z.log` |
| playwright 自检面板 | PASS | `自检结果（232/232 通过）`；`.ct-check-item`=232、`--fail`=0、含 `✗`=0；12 模块分布与基线 §2 逐项相同：text-wrap 14 / layout 21 / row-geometry 16 / cell-painters 57 / row-geometry-controller 8 / painter 32 / tree 14 / interactions 19 / spans 13 / editor 18 / theme 16 / data 4（合计 232）。evidence/reverify-dom-evidence.json |
| hover 交互探针（上轮 FAIL 实证项复采） | **PASS** | 滚动至顶部后对画布表体 12 点位（x∈{30,150,330,510} × y∈{54,90,126}）逐一 hover、每点停留 900ms（> TOOLTIP_SHOW_DELAY=300ms）：探针期间新增 console = 0 条（`newConsoleDuringProbe: []`）；tooltip 面板 `.mu-tooltip-panel` 在「状态」列点位（box.x+330）真实可见且内容逐行正确。明细 evidence/reverify-dom-evidence.json |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 build + demo self-checks 全量像素断言通过 | 命令 + 浏览器 | `npm run build` exit 0（4 段 ✓）；面板 232/232、fail 0、✗ 0、12 模块分布一致（evidence/reverify-dom-evidence.json） | PASS |
| 2 行为冻结：探针基线逐字比对（含上轮 FAIL 的 hover 交互路径） | 浏览器（页面加载口径按 probe-baseline-2A.md §4 + hover 交互探针） | 三页 console 条数/文本/顺序归一化逐字节一致（仅三类允许漂移）；面板口径一致；hover 12 点位 0 新增 console 且 tooltip 正向弹出（「状态码：active/pending」逐行正确）——展示链路端到端恢复，行为冻结实质达成 | PASS |
| 3 demo self-checks import 与源码移动/改名同批同步 | 浏览器（232 断言全过佐证） | editor 模块 18 断言、spans 13（含 editorGridlineFlagsOf）、interactions 19（含 resolveTooltipTarget）等全在 232/232 内通过；fail 0 | PASS |
| 4 不改变组件对外 API | 命令 | `git diff` table-ex.vue 仅 import 区 + 2 注释行；API 符号 0 命中（命令结果行 6） | PASS |

## 范围核对

`git status --short`：30 M + 5 ??。**口径澄清（对轮 1 报告的勘误）**：轮 1 记「31 M + 5 ??、2A 增量 6 M」——经本次逐文件核对，spans-method.js 在批次 1 已 M（04-impl-批次1 改动表 #16，ctx→spanCtx），轮 1 将其重复计入「2A 增量 6 M」致总数多计 1；正确账目 = 批次 1 验证时 25 M + 2A 新增 M 5（editing/editor.js、interaction/edit-button.js、table-paint/paint-body.js、interaction/cell-selection.js、demo self-checks/editor.js）+ 新 ?? 2（editor-geometry.js、cell-identity.js）= 现 30 M + 5 ??。逐文件核对**无文件缺失、无新增设计外文件**，工作区状态与轮 1 时一致（差异仅 use-cell-tooltip.js 修复 1 行）——属轮 1 报告计数偏差，非工作区异常。

- **基线排除项**（00-task 基线 + 前任务遗留）：knowledge 2 M（INDEX.md、table-ex-overlay-clip-body-area.md）、?? table-ex-hover-span-region.md、两个 plans 目录；前任务代码 M：paint-gridlines.js（本轮零触复核见命令结果行 7）、paint-overlay.js / use-pointer.js / demo painter.js 的前任务 hunk（轮 1 已做 hunk 级归因，本轮状态未变）。
- **其他片文件**：无（批次 2B 未实施：paint-overlay 描边链 / use-tree-rows / use-table-instances / row-geometry.js 的 2B 范围零新增触碰）。
- **修复轮增量**：use-cell-tooltip.js 1 行（:141），该文件本在 §4.2 清单 #10 内，未越白名单。
- **验证产物**：dist/、demo/dist/（gitignore 内）；agent-docs/plans/20261106-table-ex-structure-design/{05-verify-批次2A-2.md, evidence/ 新增 5 文件}；.playwright-mcp/ 快照与 console 日志（.gitignore 已含）。
- **HEAD 完整性**：`git log --oneline -3` 首条 a4460ce（前任务之前的既有提交），无新 commit / stash（本角色禁令未触）。
- **并发片**：无。

## 测试质量问题

- 无新增。轮 1 建议维持：后续批次（2B/3）探针基线采集追加最小 hover 交互步（hover 单个含 title 列单元格 ≥1s 后读 console + 断言 `.mu-tooltip-panel` 可见），冻结交互路径行为——本轮复验已验证该探针步骤可稳定执行（evidence/reverify-dom-evidence.json 含可复用点位与判定式）。

## 需人工检查

设计未标"人工"项。不适用。

## 验收入口（PASS）

1. 标准 1/3 — 终端 `cd D:\workshop\cheap-pets\mussel && npm run demo:build`（watch 需手动 Ctrl+C），浏览器访问 `http://localhost:3000/data/table-ex/`，调试面板应显示「自检结果（232/232 通过）」。
2. 标准 2（上轮失败项的正面复现动作）— 同上启动后访问 `/data/table-ex/`，鼠标悬停表格「状态」列任意单元格 ≥1 秒：tooltip 弹出且内容为「状态码：active」或「状态码：pending」（随行值），DevTools console 无任何 `ReferenceError`。
3. 标准 1（build）— 终端 `cd D:\workshop\cheap-pets\mussel && npm run build`，退出码 0。
4. 标准 4 — 终端 `git diff -- src/components/table/ex/table-ex.vue`，确认仅 import 行与注释行、无 props/emits/expose 改动。

## 环境阻塞

无。playwright mcp 可用；服务自启/关闭正常（PID 7256 杀灭，3000 端口释放复核 `PORT_3000_FREE`）；后台任务退出码 1 为 taskkill 终止子进程的预期结果（首建已成功，日志 evidence/demo-build-reverify.log）。

## 失败项

无。
