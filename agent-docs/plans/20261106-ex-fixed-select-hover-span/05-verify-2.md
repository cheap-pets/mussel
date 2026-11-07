VERDICT: FAIL

终验重验（第 2 轮）。本轮唯一目标：playwright mcp 像素级验证上轮「需人工检查」4 项。第一步探测结果：playwright mcp 在本 agent 工具集不可用（本会话 MCP 工具仅 codegraph / fff / semble / web_reader，无任何 `mcp__playwright__*` 浏览器导航/快照/截图工具；工具清单即证据）。按派发约束：不降级、不改用 npx / 内置浏览器 / 代码走查，其余 4 项全部不验证。环境：HEAD a4460ce（= 基线），demo 服务 http://localhost:3000/data/table-ex/ 常驻（派发声明，本轮未访问——浏览器手段不可用）。证据文件：无（mcp 不可用，未产生截图/trace 类证据）。

## 上轮问题核对（第 2 轮起）

上轮（05-verify-1.md）判定 PASS，无失败项；遗留 4 项「需人工检查」+ 1 项环境阻塞，即本轮验证清单。逐项核对：

| 上轮遗留项 | 本轮结论 |
|---|---|
| 1. 验收 1 像素级（固定列组合场景，选中描边不压固定列） | 未解决：playwright mcp 不可用，UNVERIFIED |
| 2. 验收 2 像素级 + 残影动态（合并单元格场景，row/column/cell 三模式） | 未解决：同上，UNVERIFIED |
| 3. 自检面板全绿（断言 A/B/D/E/F 五个新增项） | 未解决：同上，UNVERIFIED |
| 4. 验收 3 目测回归（默认场景 hover/选中行为不变） | 未解决：同上，UNVERIFIED |

## 命令结果

| 命令 | 状态 | 关键输出（≤15 行） |
|---|---|---|
| playwright mcp 工具探测 | 不可用 | 本会话工具列表无 `mcp__playwright__*`（仅 codegraph/fff/semble/web_reader）；按派发「不可用 → 立即写报告，不降级」终止，未执行浏览器验证 |
| `git rev-parse --short HEAD` + `git status --short` | PASS（只读确认） | HEAD `a4460ce`（= 基线）；修改 5 文件：paint-overlay.js、use-pointer.js、self-checks/painter.js（= 派发所述 3 源码文件）+ `agent-docs/knowledge/INDEX.md`、`agent-docs/knowledge/project/table-ex-overlay-clip-body-area.md`；未跟踪：`agent-docs/knowledge/project/table-ex-hover-span-region.md`、`agent-docs/plans/20261106-ex-fixed-select-hover-span/` |

本轮未运行 `npm run build` / eslint：派发限定本轮唯一目标为 mcp 像素验证且不可用即终止；上轮（05-verify-1.md）已验 PASS，且源码 3 文件自上轮后未变（diff 清单见「范围核对」），无重跑触发条件。

## 验收标准核对

| 标准 | 手段 | 证据 | 结果 |
|---|---|---|---|
| 1 固定列覆盖（像素级：选中描边不覆盖固定列区 + 固定列格选中照常） | 浏览器（playwright mcp 截图取色） | 环境阻塞：mcp 不可用，未执行（场景与期望色口径见 02-design 测试计划 / 05-verify-1「需人工检查」1） | UNVERIFIED |
| 2 合并 hover（像素级：row/column/cell 三模式区域覆盖 + 移出无残影） | 浏览器（同上） | 同上（见 05-verify-1「需人工检查」2） | UNVERIFIED |
| 3 自检面板全绿（断言 A/B/D/E/F） + 回归目测（默认场景行为不变） | 浏览器（同上） | 同上（见 05-verify-1「需人工检查」3/4） | UNVERIFIED |

按契约判定规则「其他一律 FAIL（含环境阻塞导致的 UNVERIFIED）」→ VERDICT: FAIL。

## 范围核对

HEAD a4460ce = 00-task 基线。对照基线与 02-design 改动清单：

- 源码改动 3 文件（paint-overlay.js / use-pointer.js / self-checks/painter.js）与设计改动清单逐一对应，与派发声明一致。
- 任务目录产物：未跟踪 `agent-docs/plans/20261106-ex-fixed-select-hover-span/`（按 `.pipeline/` 同类排除）。
- 与上轮相比新增（05-verify-1 时不存在）：修改 `agent-docs/knowledge/INDEX.md`、`agent-docs/knowledge/project/table-ex-overlay-clip-body-area.md`，未跟踪 `agent-docs/knowledge/project/table-ex-hover-span-region.md` —— 均为 agent-docs/ 知识沉淀文档，非 src/demo 源码；产生者非本轮验证范围（推测为上轮后 project-knowledge 沉淀步骤，UNVERIFIED）。不属设计外源码改动。
- 验证产物：无（本轮未运行构建，dist 无新产物）。
- 设计外改动：无（源码侧）。

## 测试质量问题

本轮未运行/新增测试，无新证据；沿用上轮结论「无」（05-verify-1.md 已核：A/B/D/E/F 为真像素断言，非"不抛错"）。

## 需人工检查

与上轮 4 项完全相同（本轮未执行，清单原样保留，出处 05-verify-1.md「需人工检查」，步骤口径以该节为准）：

1. 验收 1 像素级：固定列组合场景 → 选中 col 2 行 0 → 横向滚动至最右 → 选中描边不压左侧两条固定列；固定列自身格选中描边照常。
2. 验收 2 像素级 + 动态：合并单元格场景 → row / column / cell 三 hoverMode → 高亮覆盖整个合并区域；快速移出无残影残带。
3. 自检面板全绿：新增 5 项（断言 A/B/D/E/F）全绿，既有断言无红。
4. 验收 3 目测回归：默认场景 row 行带 / cell 单格 / 选中描边与修复前一致。

## 验收入口

无：VERDICT FAIL（验收入口仅 PASS 必填；可复用 05-verify-1.md「验收入口」节的 3 条动作，约 3-5 分钟）。

## 环境阻塞

1. playwright mcp 在本 agent 工具集不可用 → 影响验收 1/2 的像素级验证、验收 3 的自检面板执行与回归目测，共 4 项全部 UNVERIFIED（本轮全部验证清单）。对 `npm run build` / eslint / HTTP / 代码走查类手段无影响（上轮已验部分维持）。按派发约束未降级为其他手段。

## 失败项

无非环境阻塞失败项。VERDICT: FAIL 仅由上述环境阻塞导致（契约：环境阻塞导致的 UNVERIFIED → FAIL）。
