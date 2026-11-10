# 任务：table-ex 文字溢出自动 tooltip

## 目标

table-ex（canvas 画布表格）中，文字被截断（溢出）时 hover 自动显示 tooltip：

1. 单元格文本溢出 → hover 显示完整文本 tooltip
2. tag、button 条目文本溢出 → 同样自动显示 tooltip
3. column 设置 `title: false` → 该列不显示 tooltip（即使溢出）
4. 未溢出 → 不显示

## 基线

- git：clean @ 634e947（dev 分支），2026-11-10 快照，无未提交改动

## 验收标准（可验证）

- A1 demo 页：长文本列溢出省略的单元格 hover 出现 tooltip，内容为完整文本；未溢出单元格 hover 无 tooltip
- A2 tag / button 条目文本溢出省略时同样出 tooltip；未溢出不出现
- A3 `column.title === false` 的列溢出也不出 tooltip
- A4 现有 table-ex 自检不回归（self-checks 相关断言全过）
- A5 eslint（限 src、demo/src，glob 加引号）+ stylelint 通过
- 验证方式：playwright DOM/可访问性断言（URL 加 cache-bust），不可用时 Edge headless `--dump-dom` 兜底

## 验证环境

- demo：rollup watch + serve :3000 常驻；验证前先探活 `http://localhost:3000`，不通则后台 `npm run demo:build` 并等待
- 页面 URL 实际前缀 `/data/<name>/`（AGENTS.md 中 `/<name>/` 表述已过时）
- 编辑工具写入可能不触发 watch 重建：改 demo/src 后须 touch 源文件；访问加 cache-bust 参数
- playwright 走 mcp；若新建 .playwright-mcp 目录须写入 `.gitignore`（`*` / `!.gitignore`）

## 约束

- 纯 JS 无 TS；Composition API `<script setup>`；CSS BEM `mu-` 前缀，颜色/间距/z-index 一律 `--mu-*` 变量
- 涉及 table-ex 绘制/几何，须先读：
  - `agent-docs/knowledge/INDEX-table.md`（table/table-ex 主题索引）
  - `agent-docs/knowledge/project/table-ex-structure-map.md`（结构图，结构任务必读）
  - 命中条目直接采用：溢出测量缓存（display:none 污染）、条目列对齐协议、绘制收口 cap、centeredTextAnchor、recordsVersion 契约、demo 交互验证方法
- 不 commit、不 push、不 npm pub、不装依赖
- 不更新 docs / docs-site / skills 文档（实现完成经用户确认后另行处理）
- 本任务不走 mussel-ui skill

## 流水线（用户指定，非预设）

```
primary 设计 → peer 修订 → (free 实施 → free 验证) × n，n ≤ 2
```

- 第 1 轮实施+验证；验证 FAIL 且 n<2 时进入第 2 轮（修复+验证）；2 轮后仍 FAIL → 停下汇报
- 实施与验证为不同独立实例（同模型 free，上下文隔离，用户已指定）

## 槽位与角色映射

| 角色 | 契约文件（skill agents/） | agent 类型（槽位） |
|---|---|---|
| designer | pipeline-designer.md | pipeline-primary（primary） |
| design-amender | pipeline-design-amender.md | pipeline-peer（peer） |
| implementer | pipeline-implementer.md | free（fast 等效，用户指定） |
| verifier | pipeline-verifier.md | free（fast 等效，独立实例，用户指定） |

## 预算

- 预估派发：6（设计 1 + 修订 1 + 实施/验证 2 轮 × 2）
- 派发上限：9（ceil(6×1.5)）
- 实施验证修复轮键 `整体 k/2`（对应 n≤2）
