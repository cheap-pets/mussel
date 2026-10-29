# 验证报告（轮 2，复验）— mu-table-ex 合并单元格实施

VERDICT: PASS

## 上轮问题核对（第 2 轮起）

上轮唯一失败项：验收 1 之 spans 自检 5「重叠丢弃警告带坐标」断言期望 `(1, 3)`，实现输出声明锚格 `(0, 3)`。

| 项 | 结论 | 证据 |
|---|---|---|
| 修复落地 | **已解决** | `demo/src/data/table-ex/self-checks/spans.js:207-208`：断言改为 `m.includes('重叠') && m.includes('(0, 3)')` + 坐标口径注释（声明锚格）；全文件 `(1, 3)` 已不存在（grep 0 命中） |
| 浏览器自检面板复验 | **已解决** | headless Edge `--dump-dom`（demo/dist main.js 18:04:39，含修复后断言）：`自检结果（185/185 通过）`、面板 `ct-check-item--fail` 0 处、spans 模块 13/13 条 PASS、自检 5 状态 pass |
| 「实现零改动」声明核实 | **属实** | `src/components/table/ex/spans.js`：659 行（与轮 1 一致）、L113 警告文案与 L101/294/330/400/401 五个锚点行（含注释）与轮 1 读取逐字相同；上轮与本轮 104KB dump-dom 归一化 diff 仅 6 处且全部落在自检 5 的摘要计数/class/标记/detail（修复本身），demo bundle（打包全部库源码）无任何其他可见变化 |
| 修复轮构建抽查 | 通过 | `npm run build` 产物 dist/ 四段齐全（mussel.js/.min.js/ex.js/ex.min.js 均含 .map/.css，mtime 18:04:37–39）；demo `main.js` 18:04:39，面板实测即该产物 |

裁定采纳（04-impl-修复-1.md）：`(1, 3)` 在「声明锚格」与「首个相交格」两种口径下均不成立，系编写期笔误；修复修断言不修实现，符合设计 §2.3/§3.2/§7 坐标语义。

## 沿用轮 1 结论（未重验项）

以下轮 1 PASS 项本轮未重验，结论沿用（demo bundle 除修复外零 diff 佐证其行为面未变）：

- 验收 2：既有 self-checks 全量回归（本轮 185/185 中既有模块仍全过，与轮 1 一致）。
- 验收 3：tree.js parentKeys 断言（本轮面板仍 PASS）。
- 验收 4：demo 14–20 场景交互断言（轮 1 CDP 证据；本轮面板零 diff）。
- 验收 5：npm run build 双版本（轮 1 全量验证；本轮抽查 18:04 产物齐全）。
- 验收 6：范围限 §11 清单、null 分支 paintCellRange/paintBodyRow 逐字保留（spans.js 内容级零变化进一步支持）。
- 验收 7：skills/、docs/、docs-site/ 未动（本轮修复轮亦未触碰）。
- 需人工 2 项维持待人工：demo 17 视觉细目（截图 evidence/spans-scene.png / spans-scrolled.png）、demo 15 img 异步 onload 重绘链路。

## 范围核对（修复轮增量）

- 修复声明改动：`demo/src/data/table-ex/self-checks/spans.js`（mtime 15:33，仅断言两行 + 注释，已核实）。
- mtime 变化但内容零变化的文件：`src/components/table/ex/{table-ex.vue, spans.js, editor.js, cell-painters.js}`（16:12–16:32）——锚点行/行数/bundle diff 三重证据均无内容变化（疑似编辑器或工具 touch/同内容重写），不计为改动。
- **设计外改动（无法区分归属，如实上报）**：两轮之间工作区出现另一条独立工作线——`src/components/tag/{tag.vue,tags.scss}`、`src/components/badge/badge.vue`、`src/styles/{tones.scss,atomic.js,typography.scss,background.scss}`、`D src/styles/tag.scss`、`M todo.md`（mtime 17:18–18:00，git status 由 60 行增至 69 行）。均不在本任务设计清单与修复记录声明中；内容为 tag/badge 组件与全局样式体系（与 table-ex 合并单元格无关），且 demo bundle diff 为零证明未影响本任务验证面。按「工作区叠加」原则判定为并行工作而非本任务改动，不影响本轮判定；归属（用户/其他会话/实施者顺带）由协调者裁定。
- 验证产物：`evidence/self-checks-dom-r2.html`、`evidence/self-checks-console-r2.log`（本轮新增）。

## 测试质量问题

无新增。修复补注的坐标口径注释（声明锚格）提升了断言可读性。

## 需人工检查

同轮 1 两项（demo 17 视觉细目、img 异步重绘链路），非代码失败项。

## 环境阻塞

无。headless Edge 本轮用后未留驻（--dump-dom 单进程退出模式，无常驻 PID）；demo watch 服务（PID 19789）为既有常驻。

## 失败项

无。
