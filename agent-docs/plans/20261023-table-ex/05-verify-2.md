VERDICT: PASS

第 2 轮验证。输入：00-task.md、decisions.md、02-design.md、04-impl-集成.md、04-impl-修复-1.md、05-verify-1.md。范围：先复验上轮 2 个代码 FAIL，再抽关键回归（自检面板全绿、build、stylelint、A1–A7 中与修复关联的滚动定位与调试面板/主题快照断言）；上轮已 PASS 且与修复无关的项未重跑，沿用 05-verify-1.md 结论。

## 上轮问题核对（第 2 轮起）

| 上轮条目 | 复验证据 | 结论 |
|----------|---------|------|
| 失败项 1：scrollToRecord 目标行被表头遮挡 | 源码 `src/components/canvas-table/canvas-table.vue:723` 已为 `Math.max(row * cur.rowHeight, 0)`（`cur.headHeight +` 已移除，注释同步更正）；实测（playwright，首挂载后）：`scrollToRecord(5000)` 返回 true，scrollTop **179964 = 4999×36**（修复前 180000）；settle 150ms 后 `getLayoutInfo().viewRows.start=4999`、`lastPaint.rowStart=4999`（视口首行即目标行 id 5000，修复前 5000）；canvas 像素 y=10/34（表头带）=[236,238,239]（表头底色）、y=54/62/70（目标行带）=[246,246,246]、y=90（下一行）=[255,255,255]——目标行完整可见于表头下方，无遮挡 | **已解决** |
| 失败项 1 边界（上轮对照项） | scrollToRecord(0)→scrollTop 0；(99999)→clamp 3599620 = contentHeight−clientHeight（=spacer 高）；不存在 key→false | 通过 |
| 失败项 2：demo 调用未定义 pollThemeSnapshot | 源码 `demo/src/data/canvas-table/main-view.vue:543/:548` 已改 `pollDebugPanel()`（:580 定义），全文件 `pollThemeSnapshot` 引用 0 处；served bundle（demo/dist/data/canvas-table/main.js，mtime 本轮构建时间）grep 同样 0 处；点击「refreshTheme()」「打印主题快照」两按钮：**本 session console error 0**（修复前 ReferenceError 累计 4 次），两条 logEvent 均落日志（`refreshTheme（调试按钮）`、`打印主题快照（调试按钮）`），快照面板渲染 17 字段 JSON | **已解决** |
| 失败项 2 强断言（按钮路径驱动快照更新） | 切 mu-dark（挂组件根）→ 点「打印主题快照」→ 还原后点「refreshTheme()」：`getThemeSnapshot().bgNormal` 依次 rgb(255,255,255)→rgb(7,8,8)→rgb(255,255,255)，面板 JSON 同步变为暗色值（textColor rgb(201,205,209) 等），全程 0 error | 通过 |
| 测试质量 1：disabled check demo 缺夹具 | 本轮未补（04-impl-修复-1.md 遗留 2 明示不在修复范围）；模块级覆盖（[interactions]/[cell-painters] 自检）仍在，77/77 含相关断言 | 未处理（维持建议，不判 FAIL） |
| 测试质量 2：A3 rowCount 口径 +1 偏差 | 非缺陷（测试计划口径与实现口径偏差，G1-b 已预告），本轮按 +1 口径复测通过（13/13/11） | 维持原结论 |
| 测试质量 3：eventLogs unshift 方向 | 本轮按最新在前方向查找，无影响 | 维持原结论 |
| 测试质量 4：img 自检重跑必 fail 1 条 | 本轮以首挂载结果判定：首挂载 77/77 全绿，未触发 | 维持原结论（首挂载为准） |
| 附：瞬时 TypeError（editor onEsc） | 本 session console error 0，未复现 | 维持原判（非缺陷） |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|------|------|------------------|
| `npm run build` | exit 0 | dev+prod 两次构建均成功：288 modules transformed；dist/mussel.js 511.72 kB / mussel.min.js 256.60 kB（产物含 scrollToRecord） |
| `npx stylelint "src/components/canvas-table/*.scss" --fix` | exit 0 | 无错误无输出；复跑（不带 --fix）亦 exit 0，确认零问题零改动 |
| `curl http://localhost:3000/data/canvas-table/`（页面 / main.js） | 200 / 200 | 实施者遗留的 demo watch 进程在跑（04-impl-修复-1.md 遗留 3），直接复用，未另启服务 |
| served bundle 新鲜度 | 确认 | demo/dist/data/canvas-table/main.js：`pollThemeSnapshot` 0 处、`pollDebugPanel` 5 处（构建于修复后） |
| demo 自检面板（playwright 首挂载） | 77/77 | 「自检结果（77/77 通过）」，console error 0（session 全程 20 条消息中 Errors: 0） |

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|------|------|------|------|
| A1 ⑦ scrollToRecord（上轮失败项 1） | 浏览器 | 见「上轮问题核对」失败项 1 行：scrollTop=179964=4999×36、viewRows.start=4999、目标行 y=36..72 可见、边界 3 例通过 | PASS（已解决） |
| A1 ⑧ refreshTheme 按钮路径（上轮失败项 2） | 浏览器 | 见「上轮问题核对」失败项 2 行：两按钮 0 error、logEvent 落日志、快照打印 17 字段 JSON、mu-dark 切换经按钮路径快照白→[7,8,8]→白 | PASS（已解决） |
| A1 其余子项（事件/受控/空态等） | — | 上轮实测 PASS；本轮修复仅触 scrollToRecord 与两按钮处理器，无关联 | 沿用 PASS |
| A2/A4/A5/A6 | — | 与两处修复无交集，上轮实测 PASS | 沿用 PASS |
| A3 虚拟滚动（与滚动修复关联，抽回归） | 浏览器 | 3 处跳跃滚动 scrollTop 0 / 1800000 / 底部（3599964→clamp 3599620）：lastPaint.rowCount 13/13/11 ≤ viewRows+OVERSCAN+1，`viewRows.start === lastPaint.rowStart` 逐站成立（0/50000/99989）；spacer 高不变 | PASS |
| A7 主题快照（与调试按钮关联） | 浏览器 | 失败项 2 强断言覆盖（mu-dark 挂组件根 → 按钮路径 → bgNormal 三段变化与实例一致）；暗色像素/行高/字号用例上轮 PASS 无关联改动 | PASS（视觉并排比对仍需人工） |
| A8 文件结构 | 命令 | `ls src/components/canvas-table/` = 9 文件与设计 A8 一致；`npm run build` exit 0 | PASS |
| A9 范围边界 | 人工 | 无关联改动，沿用上轮「需人工」 | 需人工 |
| 构建/风格 | 命令 | 见「命令结果」前两行 | PASS |

## 范围核对

- 基线：分支 mussel-table，HEAD `04e157d`（与 00-task.md 基线一致），未发生 commit。
- `git status --short`：`M demo/src/catalog.js`、`M src/components/index.js`、`?? demo/src/data/canvas-table/`、`?? src/components/canvas-table/`、`?? .pipeline/` —— 与上轮完全一致；修复两文件（canvas-table.vue、main-view.vue）均在既有未跟踪目录内，属设计改动清单。
- `git diff --stat`：catalog.js +5、components/index.js +2（共 7 行新增），与设计改动清单一致。
- 基线排除项：`.pipeline/`。验证产物：dist/、demo/dist/ 被 .gitignore 忽略未入库。无法区分：无。
- 设计外改动：无（未记录 0、已记录-未覆盖 0）。

## 测试质量问题

1. 沿用上轮 4 条：disabled check demo 夹具缺（建议，模块级已覆盖）；A3 rowCount +1 口径偏差（非缺陷）；eventLogs 方向（备查）；img 自检重复执行 fail（首挂载判定规避）。均不阻塞判定。

## 需人工检查

1. **A2 浏览器缩放 DPR 端到端**：人工浏览器缩放 150%，检查 `canvas.width/getBoundingClientRect().width ≈ 1.5`、线条文字无模糊；跨屏迁移后自动重绘。（dpr=1 基线 ratio=1 上轮已实测，代码路径由 [painter] 自检覆盖。）
2. **A7 视觉并排比对**：主表与 DOM 版 mu-table 并排（同列同数据前 20 行），人工比对表头底/网格线/选中/hover 色值与整体观感（含 `--mu-shadow-float` 单变量投影差异项）。
3. **A9 范围边界**：对照 02-design.md A9 清单 12 条逐条确认无对应能力。
4. **A3 滚动流畅（人工）**：滚轮/触控板连续滚动手感。

## 环境阻塞

无。demo watch 服务（实施者遗留后台任务）全程可用，未发生中断；playwright DPR 限制为已知需人工项，非新阻塞。

## 失败项（FAIL 时，不含环境阻塞）

无。
