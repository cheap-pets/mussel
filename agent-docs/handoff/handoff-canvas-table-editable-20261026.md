# Handoff

## Goal

mussel 高性能可编辑表格：对比 stk-table-vue / kaka-grid-next / mussel 自有 table 与 canvas-table 后，完成 canvas-table 组件的演进设计并实施验证（tree 模式、单击编辑、变高虚拟滚动、富列类型等）。design-review + impl-verify 双流水线已全部完成。

## Current State

- **已完成**：设计（canvas 选型 + 优化现有 canvas-table 路线）、实施（G1-a/G1-b/G2/G3/S1 + tag.js 续做 + R1 三缺陷修复含续做）、验证（I2 第 2 轮 PASS；R1 专项 05-verify-3 PASS）。
- **未提交**：全部改动在工作区（分支 mussel-table），本交接文档生成后用户要求提交推送。
- **无进行中任务**；流水线无未决 blocker（最终复审 blocker 0，major/minor 残留已按评审建议并入实施约束并验证通过）。

## Key Context

- **流水线产物**：`.pipeline/20261025-editable-table/`（00-task 含实施约束 11 条；decisions.md 22 条决策；01-explore-{stk,kaka,mussel}；02-design 全量设计；03-review-1..7；03-human-1/2/3；04-impl-*；05-verify-1..3；run.log 全程派发记录）。`02-design.md` 是组件当前行为的权威描述。
- **选型结论**：canvas 优于 DOM（性能/资源/开发便利），DOM 唯一优势（单元格内容扩展性）已被列类型管线 + 编辑 DOM 浮层覆盖；路线 = 优化现有 canvas-table 而非重构。对比依据见 `01-explore-*.md` 三份报告。
- **用户偏好**（后续同类需求遵循）：溢出/省略字符一律 `'...'` 三个半角点（不用 `'…'`）；颜色设置一律支持内置 17 色板（12 彩色 + 5 语义，gray 为回退）；多行用 `maxLines:Number`（上限 10）、数组条目用 `maxItems`（上限 10）；用户授权后可连续推进流水线不回检查点。
- **角色通道限流经验**：pipeline-* 子智能体（bigmodel-start-plan 通道）频繁 `model concurrency limit exceeded`——改用 general-purpose 兜底（prompt 开头读 `C:\Users\scrol\.zcode\skills\dev-pipeline\agents\<角色>.md` 协议补丁）稳定可用；5 小时用量上限会整段阻断（重置时间在报错码中），挂 run_in_background sleep 计时器到点自动续。
- **变高行核心机制**（排查问题先看）：theme.js `snapshotsEqual` 门控防滚动状态 class 触发伪主题刷新；canvas-table.vue WeakMap 按 record 引用缓存已精算行高（签名失效判定：列宽/字号/行高/padding 维度），保证 scrollHeight 单调不回缩。
- **几何口径**（易错点）：编辑浮层与 hover 描边共用 `EDITOR_GAP = 4`（editor.js 导出）等距内缩矩形；文本左缘一致性 = `padding-left: calc(var(--cell-padding) - 5px)`（scss），禁止模板内联 padding 覆盖（已删过一次残留）；树形列行高 contentWidth 需扣 `2×padding + (16×level + 16)`。
- **需人工 4 项**（05-verify-1/2/3 沿用）：①选型结论性判断用户终审；②10 万行帧感需前台手感复核（后台页 rAF 停发测不了）；③编辑器视觉观感（focus 光环/暗色浮层）；④**文档三处同步（skills/mussel-ui、docs/quick-reference、docs-site）未启动——按项目约定待用户确认**。
- demo watch（:3000）由实施过程后台启动，可能仍在运行；自检面板 9 组 144 断言在 `/data/canvas-table/` 页内。

## Changed Files

- 新增：`src/components/canvas-table/text-wrap.js`、`row-geometry.js`、`tree.js`
- 修改（组件）：`src/components/canvas-table/` 下 canvas-table.vue、painter.js、layout.js、cell-painters.js、interactions.js、editor.js、theme.js、canvas-table.scss
- 修改（共享，DOM 版 table 回归已断言）：`src/components/table/column-types/link.js`、`tag.js`；`src/styles/link.scss`
- demo：`demo/src/data/canvas-table/`（main-view + self-checks 9 组）、`demo/src/data/canvas-table-editable/`、`demo/src/catalog.js`、`src/components/index.js`、`.gitignore`
- 本交接文档：`agent-docs/handoff/handoff-canvas-table-editable-20261026.md`

## Next Steps

1. 提交并推送（用户已指令；建议拆 ✨ 特性 + 📝 交接文档两个 commit，遵循项目 emoji 规范）。
2. 文档三处同步（等用户确认后）：skills/mussel-ui/references/components/ 增 canvas-table 册、docs/quick-reference_components 补条目、docs-site components/*.md 新页。
3. 用户终审选型结论；前台复核滚动帧感与编辑器视觉观感。

## References

- `.pipeline/20261025-editable-table/`（全套流水线产物，见 Key Context 首条）
- `agent-docs/knowledge/INDEX.md`（playwright 后台页陷阱、demo watch 陷阱等）
- 前序任务：`.pipeline/20261023-canvas-table/`（canvas-table 初版设计/实施/验证）

## Suggested Skills

- project-knowledge（任务结束若产生新可复用知识，按 AGENTS.md 时机沉淀）
- dev-pipeline（后续增强/修复沿用 impl-verify 或 bugfix-verify；角色限流时按 Key Context 兜底法）
