VERDICT: PASS

验证性质：整体验证（第 1 轮实施后，全部验收标准亲自重验，未采信实施者自检）。独立验证：未读取 04-impl.md。

## 上轮问题核对（第 2 轮起）

本轮为首验，无上轮报告。

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| `npx eslint --ext .js,.vue src demo/src` | exit 0 | 1 warning（非 error，不影响退出码）：`src/components/table/ex/cell-paint/cell-tooltip.js 216:8 warning Function 'resolveCellTooltip' has a complexity of 12. Maximum allowed is 10 complexity`（真值矩阵重写新增分支所致，设计逐字代码即如此，非偏离） |
| `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"` | exit 0 | 无输出 |

设计完成判据 grep（补充命令证据）：

- `grep -n "title === false" src/components/table/ex/interaction/hit-test.js` → 命中 1 处门控行（:185）+ JSDoc（:172）✓
- `grep -n "title !== false" src/components/table/ex/table-ex.vue` → :461 命中 1 处 ✓
- `grep -n "raw !== true && raw != null" src/components/table/ex/cell-paint/cell-tooltip.js` → :225 命中 1 处 ✓
- `grep -n "if (!raw) return null" src/components/table/ex/cell-paint/cell-tooltip.js` → 0 命中（旧分支已删）✓
- `grep -rn "无 title" demo/src/data/table-ex/self-checks/` → 0 命中（旧口径断言/注释改净）✓

## 验收标准核对

手段均为 playwright mcp（browser_run_code_unsafe：`page.mouse.move` + `page.evaluate` DOM 断言，URL 带 cache-bust，面板可见性用 computed display，未用 offsetParent）。原始断言数据存 `evidence/verify1-browser-results.json`。

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| A1 溢出 hover 出 tooltip（完整文本）/ 未溢出不出 | 浏览器 | 默认场景 `?bust=20261110-verify1`：hover `getCellRect(1,4)` 中心 600ms → `.mu-tooltip-panel` display `block`，textContent = `极长文本夹具：用于验证单元格文字溢出时悬停自动显示完整内容提示`；先移出等 800ms 收起（display none 实测）后 hover `getCellRect(0,4)`（短文本）700ms → display `none` | PASS |
| A2 tag/button 条目溢出出 tooltip / 未溢出不出 | 浏览器 | items 场景 `?scene=items&bust=20261110-verify1-a2`：场景生效（`getLayoutInfo().colWidths` 长度 13、前三位 `[120,150,150]`）；hover `(1,1)` 600ms → display block + textContent = `溢出标签1；溢出标签2；溢出标签3；溢出标签4；溢出标签5；溢出标签6；溢出标签7；溢出标签8`（8 项 `'；'` join）；hover `(1,2)` 600ms → display block + `短；这是一条超长按钮文字标题溢出提示夹具`；hover `(0,1)`、`(0,2)` 各 700ms → display `none` | PASS |
| A3 `title === false` 列溢出不出 | 浏览器 | 默认场景新开页 `?scene=default&bust=20261110-verify1-a3`：hover `getCellRect(1,5)` 600ms → 面板 absent；同页 hover `(1,4)` 600ms 出面板（block + 完整文本）→ 移 `(1,5)` 中心 800ms → display `none` | PASS |
| A4 自检不回归 | 浏览器 | 默认场景与 items 场景各一次（均 onMounted 自动运行，未点「重跑自检」）：`.ct-check-item--fail` 数量 0，头部文案均 `自检结果（243/243 通过）` | PASS |
| A5 eslint + stylelint | 命令 | 两条命令 exit 0（eslint 带 `--ext .js,.vue`、目录限 src demo/src；stylelint glob 加引号）；eslint 1 warning 见「命令结果」 | PASS |

## 范围核对

`git status --short` + `git diff --stat` 与 02-design.md 改动清单（8 文件）逐一对照，diff 内容逐块核对：

- 设计改动清单 8 文件全部在改动中且与设计逐字一致：`hit-test.js:185` 门控、`cell-tooltip.js:222-225` 真值矩阵（`raw === false || raw === '' || raw === 0` → null；`raw !== true && raw != null` → 自定义路径）、`table-ex.vue:461` `some(col => col?.title !== false)` + :466 devWarn 文案与设计给定全文一致、`use-cell-tooltip.js` / `cell-content.js` 纯注释（无行为改动）、两块自检断言同批改写（含新增 `title:''` 放行断言与「未设置默认开启」正反断言）、`main-view.vue` 夹具（longText 字段、默认场景列序 4/5 两列、items row1/row2 `tagsOverflow`/`buttonsOverflow`、itemColumns 列序 1/2 两列）。
- 基线排除项：`demo/src/form/form/main-view.vue`（+2/−1）——decisions.md [实施r1校验] 记录的用户本人调试改动，按派发指令排除，不计入越权。
- 任务目录产物：`agent-docs/plans/20261110-table-ex-overflow-tooltip/`（未跟踪目录，流水线文档 + evidence/），排除。
- 验证产物：无混入（`.playwright-mcp/` 已被忽略，不出现在 git status）。
- 无法区分：无。设计外改动（未记录）：无。

## 测试质量问题

无。新增自检断言均断言具体行为值，非"不抛错"：`interactions.js` 断言门控放行 `[3,0]` / `[3,4]` 与 `title:false → null`；`cell-painters.js` 断言未设置 title 短文本 `content === '甲'` 且 `overflow === false`、长文本（20 字 ×9px = 180 > 144）`overflow === true`，并保留 `title:false/''/0/函数返回空串 → null` 旧口径断言。

## 需人工检查

无（A1-A5 全部自动化验证通过）。

## 验收入口（PASS 时必填）

前置：demo 服务常驻中（`http://localhost:3000` 已探活 HTTP 200；若不通先 `npm run demo:build` 等重建）。

1. A1 + A3 — 打开 `http://localhost:3000/data/table-ex/?scene=default&bust=1`，等自检面板出现；鼠标悬停第 2 行「长文本（溢出提示）」列 → 出现完整长文本 tooltip；悬停第 1 行同列（短文本）→ 无（先移出面板再进入）；悬停第 2 行「长文本（title:false）」列 → 无。
2. A2 — 打开 `http://localhost:3000/data/table-ex/?scene=items&bust=2`，悬停第 2 行「标签（溢出）」列 → tooltip 显示 8 个标签全文（`；` 分隔）；「按钮（溢出）」列 → 显示两按钮标题全文；第 1 行同两列 → 无。
3. A4 — 任一 table-ex 页面底部自检面板显示 `自检结果（243/243 通过）`，无红色失败行（勿点「重跑自检」，预热后重跑恒败为已知行为）。
4. A5 — 项目根执行 `npx eslint --ext .js,.vue src demo/src` 与 `npx stylelint "src/**/*.scss" "demo/src/**/*.scss"`，退出码均 0。

## 环境阻塞

无。

## 失败项（FAIL 时）

无。

---

## 观察记录（非失败项，不影响判定）

1. [疑问] tooltip 面板遮挡相邻格（既有行为）：从溢出格 `(1,4)` 直接垂直移到相邻上方未溢出格 `(0,4)` 中心时，面板（placement `top`，实测 rect x447 y60 w320 h38.7，`pointer-events: auto`）物理覆盖 `(0,4)`，`document.elementFromPoint` 命中面板内 SPAN，canvas 收不到 pointermove，面板带旧内容保持 >1700ms。按知识库 `playwright-delay-hide-popup-testing`（移出再移入）操作则正常收起。显示/收起路径本任务零改动（`use-cell-tooltip.js:147-168` 既有逻辑：未溢出走 `hideTooltip`），属既有 tooltip 面板交互语义，非本任务引入。涉及 `src/components/table/ex/composables/use-cell-tooltip.js:150-155`、`src/components/tooltip/tooltip-panel.vue`。
2. [小问题] `resolveCellTooltip` 复杂度 warning（12 > 10）：`cell-tooltip.js:216`，设计逐字代码即如此，eslint 仍 exit 0。如需消除须后续重构（本任务不改）。
3. demo 既有 console error `Failed to load resource: net::ERR_INVALID_URL @ data:image/png;base64,AAAA1`（夹具无效 data URI，非本任务改动文件引入，A4 自检全过）。
