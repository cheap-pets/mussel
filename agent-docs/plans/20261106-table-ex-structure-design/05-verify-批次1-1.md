VERDICT: FAIL

片验证（批次 1：O1①② + O3 + O2 + O7-JSDoc），第 1 轮。环境：HEAD 工作区含批次 1 改动 + 前任务（20261106-ex-fixed-select-hover-span）未提交改动；demo 服务由本轮自启（`npm run demo:build`，PID 15468，验证后已关闭，端口 3000 已释放）。判定说明：派发 5 项验证全部通过、失败项 0；唯一 FAIL 驱动为验收标准 2（探针基线逐字比对）UNVERIFIED——设计手段（§4.4-②，批次前采集基线）前置条件缺失且不可回溯，按角色契约「环境阻塞导致的 UNVERIFIED → FAIL」判定。

## 上轮问题核对（第 2 轮起）

不适用（第 1 轮，无上轮验证报告）。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npm run build`（项目根，独立重跑） | PASS（exit 0） | build:base + build:ex 共 4 段 vite build 全部 `✓ built in 477–517ms`；`dist/mussel.ex.min.js 332.60 kB`；日志 evidence/build.log，后台 stdout `BUILD_EXIT=0` |
| `grep -rn "\bctx\b" src/components/table/ex/composables/` | PASS（0 命中） | 输出空。O3 判据 |
| `grep -rn "\bctx\b" src/components/table/ex/spans/` | PASS（0 命中） | 输出空。O3 判据；`spanCtx` 落点 11 处（spans.js:90/103/105、spans-method.js:242/243、spans-auto.js:32/33/55/119/120/121），与 04-impl 一致 |
| `grep -c "\bcontext\b" interactions.js` | PASS（0 命中） | resolveCursor 第三参 `context` 残余 0 |
| cell-painters 已删 8 符号残留 import 扫描（src/ + demo/src/） | PASS | 全仓引 `cell-paint/cell-painters` 的 import 仅 3 处且均为自身定义符号：paint-body.js:2（drawCell）、paint-overlay.js:2（drawTreeArrow）、demo self-checks/cell-painters.js:42（drawCell） |
| createClickGuard/createFrameScheduler import 点扫描 | PASS | 仅 `../interaction/schedulers`（use-column-resize.js:22、use-relayout.js:22）与 demo interactions.js:35（`@/components/table/ex/interaction/schedulers.js`）；schedulers.js:12/48 为自身定义 |
| `interactions.js` 剩余消费方核对 | PASS | use-cell-tooltip.js:26（resolveTooltipTarget）、use-cell-click.js:20（5 决策函数）、use-pointer.js:17（resolveCursor/hitTest/resolveItemClick/resolvePointerdown）、use-column-resize.js:21（resolveResizeWidth/RESIZE_MIN_WIDTH）——均为自身导出；demo interactions.js 主 import 12 符号均自身导出 |
| demo 自检页断言（playwright，`http://localhost:3000/data/table-ex/`） | PASS | `自检结果（232/232 通过）`；.ct-check-item 232、`--fail` 0、✗ 0、/FAIL/i 0。证据 evidence/selfcheck-dom.txt |
| table-ex 三页 console 检查 | PASS（1 既有夹具 error） | /data/table-ex/: 1 error = `data:image/png;base64,AAAA1` 无效 URL——cell-painters.js:774 故意无效图片夹具（失败路径测试），该文件本批 diff 单 hunk（42–51 import 块）未触及 :774，非本批引入；43 warnings = Canvas2D willReadFrequently×41 + 图标夹具×2；`v-on with no argument`/`ReferenceError`/`is not defined`/`Cannot find` 0 命中。/data/table-ex-basic/、/data/table-ex-scene/: 0 error 0 warning。证据 evidence/console-table-ex.log |
| `git diff -- src/components/table/ex/table-ex.vue` | PASS | 仅 2 hunk：`:81 import prepareColumn → './cell-paint/cell-content'` + `:337 增 1 行 @getters 指向注释`；diff 中 `defineProps|defineEmits|defineExpose` 0 命中。证据 evidence/table-ex-vue.diff |
| 机械归一 diff 全量审计（17 个批次 1 src 文件） | PASS（补充证据） | 归一映射（composables ctx→host / spans ctx→spanCtx / interactions context→deps）后多重集比对：267 对改动行全部机械等价，residue 0 的文件 16/17；唯一残差 use-pointer.js 28 行全部归属前任务特性（colBandRegionsOf 新函数、hoverRegions 4 参扩形、:165 `host.spans.value` 实参=前任务 :154 `ctx.spans.value` + 本批改名）及块注释续行，无不可归因行。证据 evidence/diff-audit.txt |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 每批 `npm run build` 通过 + self-checks 全量像素断言通过 | 命令 + 浏览器 | build exit 0（4 段 ✓）；232/232 通过、0 fail（evidence/selfcheck-dom.txt、build.log） | PASS |
| 2 探针基线与重构前逐字比对（知识库 table-ex-refactor-frozen-probe） | 命令（探针） | 前置条件缺失：批次前未在 demo 自检加临时探针采集基线（04-impl 自检节明示未运行；run.log 第 1–4 步无探针记录；前任务终验 05-verify-2.md 像素项亦 UNVERIFIED，无可借用的批次前快照）。基线须于重构前采集，工作区为未提交状态、无法回溯重构前行为。补充证据（非替代）：机械归一 diff 审计证明本批 src 改动 267 对全部为纯改名等价替换 + 注释/JSDoc/import（evidence/diff-audit.txt），叠加 232/232 像素断言全绿 | UNVERIFIED |
| 3 demo self-checks import 与源码移动/改名同批同步 | 命令 + 浏览器 | 本批受影响 4 文件 diff 全部仅 import 行：cell-painters.js（单 hunk 42–51，7 符号分拆 5 行，drawCell 保留原引）、painter.js（行 27 拆分）、spans.js（1 行）、interactions.js（2 行）；改引目标模块存在且页面实际执行（232 checks 含该 4 模块断言，console 无 undefined import 类错误） | PASS |
| 4 不改变组件对外 API | 命令 | evidence/table-ex-vue.diff：仅 import 行 + 注释行，props/emits/defineExpose 零触碰 | PASS |

## 范围核对

`git status --short`（evidence/git-status.txt）25 M + 3 ??；`git diff --stat` 25 文件 +798/-347。

- **基线排除项**（前任务遗留，非本批）：agent-docs/knowledge/INDEX.md、agent-docs/knowledge/project/table-ex-overlay-clip-body-area.md（M）；?? table-ex-hover-span-region.md、20261106-ex-fixed-select-hover-span/、20261106-table-ex-structure-design/（计划产物）。`paint-gridlines.js`：diff hunk 老行 65/75（§4.0 记录的 65–79 区内），内容 grep `ctx|host|import` 0 命中 → 纯前任务改动，§4.0「全批次禁触」已遵守。
- **其他片文件**：无（批次 2A 未实施）。
- **无法区分**（基线脏 ∩ 本批白名单，git diff 无法按任务切分，已做 hunk 级内容归因）：
  - `use-pointer.js`：批 1 = 整文件 ctx→host token 替换（审计 267 对内）+ @host-* 块；前任务 = colBandRegionsOf/hoverRegions 扩形 hunks（与 §4.0 记录一致）。无越权。
  - `paint-overlay.js`：批 1 = 仅 import hunk `@@ -2 +2,2`（drawIconGlyph→icon-image，drawTreeArrow 保留）；其余 hunks（57–98、122、152、189 区）均为前任务 hover 带特性（正文含「追加轮 2 需求 B」注释）；diff 内 `@host-|host` 0 命中。未提交区 57–231 禁触已遵守（批 1 未改任何函数体）。
  - `demo/.../painter.js`：批 1 = 仅行 27 import 拆分；`buildSpans` import（老 29→31）及其夹具/断言 hunks（87–99、1401–1661）内容明标「20261106-ex-fixed-select-hover-span 断言 D/E/F」→ 前任务改动；断言区未触。
- **设计外改动（白名单 22 文件之外的新脏文件）**：无。25 M = 22 白名单 + 3 基线知识文件 + paint-gridlines（前任务）。注：00-task 基线快照中未列 paint-gridlines.js，其脏状态系基线快照后前任务继续产生（§4.0 已按「基线快照后改动又扩大」记载），不计本批设计外。
- **验证产物**：dist/（build）、demo/dist/（watch 重建，gitignore 内）；agent-docs/plans/20261106-table-ex-structure-design/{05-verify-批次1-1.md, evidence/}。
- **并发片**：无并发。

## 测试质量问题

无新增测试（本批为改名/改引重构批）；既有 self-checks 232 断言为像素/行为级断言（非"仅不抛错"），覆盖通过。

## 需人工检查

设计未标"人工"项。可选复核：/data/table-ex/ 页面视觉走查（hover/选中描边在固定列与合并单元格场景的表现）——前任务遗留的像素级项（其 05-verify-2 UNVERIFIED），不属本批验收。

## 验收入口（PASS 时必填；本轮 FAIL，仍给出供复核）

1. 标准 1/3 — 终端执行 `cd D:\workshop\cheap-pets\mussel && npm run demo:build`（watch 进程需手动 Ctrl+C 结束），浏览器访问 `http://localhost:3000/data/table-ex/`，调试面板应显示「自检结果（232/232 通过）」且列表无 ✗。
2. 标准 4 — 终端执行 `git diff -- src/components/table/ex/table-ex.vue`，确认仅 import 行与注释行改动。
3. 标准 1（build）— 终端执行 `cd D:\workshop\cheap-pets\mussel && npm run build`，退出码 0。

## 环境阻塞

1. **探针基线缺失（影响验收标准 2，唯一 FAIL 驱动）**：缺「批次前」临时探针采集的行为快照（警告消息原文序列、regions 构建序等）。04-impl 自检节明示未运行且称「按派发属验证员职责」——验证员无法在重构后回溯采集重构前基线（工作区未提交、无 stash/commit 分界），属实施侧前置步骤错位。过程修复建议：批次 2A 开始实施前，由实施者先加探针采集基线（知识库 table-ex-refactor-frozen-probe 流程），验证员只做比对；若用户裁决本批以 diff 机械等价审计（evidence/diff-audit.txt：267 对全等价、0 不可归因残差）+ 232/232 像素断言替代接受标准 2，则本批可改判 PASS。

## 失败项（FAIL 时）

无代码缺陷。FAIL 仅由「环境阻塞 1」导致的标准 2 UNVERIFIED 驱动（角色契约判定规则），不指向任何源码位置。
