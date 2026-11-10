# 任务：table-ex tag 列溢出 +n 汇聚 tag

## 目标

table-ex（canvas）tag 类型列：标签过多显示不下时，末尾显示一个 `+n` tag（灰色），n 为溢出未显示的标签数量；hover 该 `+n` tag 时，tooltip 显示对应剩余项的内容。

## 基线

- git：dev 分支 @ 634e947 + 工作区含上一任务未提交改动（table-ex 溢出 tooltip 8 文件 + 用户保留的 form 调试 2 文件 + agent-docs）。本任务叠加在其上，见 `decisions.md` 与快照。

## 验收标准（可验证）

- A1 tag 列标签过多溢出时，末尾渲染一个 `+n` 灰色 tag，n 等于未显示的标签数量（逐一数清，含 pill 绘制区 8px 间隙语义）
- A2 hover `+n` tag → tooltip 展示被折叠的剩余项全文（多项分隔格式与设计稿一致）
- A3 标签全部显示得下（未溢出）→ 无 `+n` tag
- A4 与既有溢出 tooltip 协议共存不冲突：`title: false`、文本单元格 tooltip、tag/button 溢出 tooltip 行为不回归
- A5 现有 table-ex 自检不回归（self-checks 全过）；eslint（限 src、demo/src，glob 加引号，--ext .js,.vue）+ stylelint exit 0
- 验证方式：playwright DOM/可访问性断言（URL 加 cache-bust），不可用时 Edge headless 兜底

## 验证环境

- demo：serve :3000 常驻；先探活，不通则后台 `npm run demo:build` 等重建
- 页面前缀 `/data/table-ex/`；改 demo/src 后如页面仍旧 bundle 须 touch 源文件 + cache-bust
- playwright mcp；新建 .playwright-mcp 须写入 .gitignore（`*` / `!.gitignore`）
- 自检面板勿点「重跑自检」（预热后重跑恒败为已知行为）

## 约束

- 纯 JS；Composition API；BEM `mu-` 前缀；颜色/间距/z-index 一律 `--mu-*` 变量，禁硬编码
- 须先读：
  - `agent-docs/knowledge/INDEX-table.md`（按需展开条目：条目列对齐协议、结构图、溢出 tooltip title 协议等）
  - `agent-docs/knowledge/project/table-ex-structure-map.md`（结构任务必读）
  - 上一任务设计终稿 `../20261110-table-ex-overflow-tooltip/02-design.md`（溢出 tooltip 链路与验证场景）
- 不 commit、不 push、不 npm pub、不装依赖
- 不更新 docs / docs-site / skills 文档
- 已知且勿动：`src/components/form/form-field.vue`、`demo/src/form/form/main-view.vue` 为用户本人调试改动，范围核对时排除
- 不走 mussel-ui skill；本项目不用 agent-task-report

## 流水线（用户指定，同上一任务）

```
primary 设计 → peer 修订 → (free 实施 → free 验证) × n，n ≤ 2
```

- 第 1 轮实施+验证；FAIL 且 n<2 时进第 2 轮（修复+验证）；2 轮后仍 FAIL → 停下汇报
- 实施与验证为不同独立实例（free，同模型，用户知情指定）

## 槽位与角色映射

| 角色 | 契约文件（skill agents/） | agent 类型（槽位） |
|---|---|---|
| designer | pipeline-designer.md | pipeline-primary（primary） |
| design-amender | pipeline-design-amender.md | pipeline-peer（peer） |
| implementer | pipeline-implementer.md | free（fast 等效） |
| verifier | pipeline-verifier.md | free（独立实例） |

## 预算

- 预估派发：6（设计 1 + 修订 1 + 实施/验证 2 轮 × 2）
- 派发上限：9（ceil(6×1.5)）
- 实施验证修复轮键 `整体 k/2`
