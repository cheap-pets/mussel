# table-ex 结构重构（code-reforge 完整通道 × 用户自定义流水线）

## 目标
对 src/components/table/ex/（约 40 文件 / 10.4k 行）做行为不变的结构重构（code-reforge 判据）：
提高 agent 静态检索（功能在哪）与影响面分析（改这里影响谁）效率，且用户能审查结果。

## 流水线（用户指定）
1. primary designer：code-reforge 步骤 1–3（测绘 → 问题清单 → 优化设计）
2. primary design-amender（全新独立实例）：code-reforge 步骤 4（设计核验与修订，共写 02-design.md）
3. 确认门：用户确认设计后才实施（code-reforge 硬要求）
4. (fast implementer → fast verifier 独立实例) × n，n ≤ 2；第 2 轮仍 FAIL → 停，汇报用户

## 基线（建目录时 git status --short 快照）
- M agent-docs/knowledge/project/table-ex-performance-profiling.md
- M todo/misc.md
- ?? agent-docs/plans/20261107-refactor-skill/、20261107-refactor-summary-refine/、20261107-table-ex-estimate-opt/*、table-ex-structure-refactor-summary.md（均文档）
- src/ 无未提交改动 → 源码区干净，无需行级避让

## 约束
- 行为不变（R4：基线先于改码，行为变化即停）；既有自检与探针基线只读冻结
- 纯 JS + Composition API；CSS BEM / --mu-* 变量禁硬编码；不安装依赖
- 角色不执行改变工作区状态的 git 命令（提交策略见 decisions.md）；不嵌套派生
- table-ex 结构任务先读 agent-docs/knowledge/project/table-ex-structure-map.md；重构完成后须同步更新该文件
- ex/ 文件移动须同步 self-checks import（INDEX-table：canvas-pixel-assert-anchor-drift）

## 验收标准
- code-reforge 判据：agent 仅凭静态手段可定位功能与影响面
- 每个 P 有对应 O 或不做条目（R5 同权重）；每批独立可提交、可验证
- 最终验证组合全过；每批附审查摘要，用户可按摘要审查 diff

## 验证命令与环境
- npm run build；eslint（口径限 src 与 demo/src，勿拾取 demo/dist）；stylelint 错误先 --fix
- demo 页 http://localhost:3000/（若 404 试 /data/ 前缀），playwright mcp，DOM 断言优先
- 探针基线口径：table-ex 重构行为冻结（警告原文序列/构建序逐字比对）+ 自检双安全网

## 预设与开关（用户自定义，覆盖三档默认）
- 设计修订 N=0（修订由 design-amender 单轮完成，属流水线固定阶段）
- 实施→检验循环 n≤2（等价修复轮「整体」R=1）；回设计/回方案 j≤2；确认门=停
- 规范审查=关；TDD=关；并发=1

## 槽位映射
- designer / design-amender / implementer → pipeline-primary（用户指定；amender 与 verifier 均全新独立实例）
- verifier → pipeline-fast（默认即 fast）
- 评审模型：同模型（用户指定 primary 承担设计+修订）；验证：独立实例

## 预算
- 预估派发 6（设计 1 + 修订 1 + 实施 1 + 检验 1 + 修复轮 2）；上限 9
- 设计修订 k/N：0/0；回方案 j/2：0/2；修复轮「整体」k/R：0/1；派发 d/9：0/9
- 收尾项（终验 PASS 后）：02-map.md 改写现状导航 + structure-map 知识同步（另行派发）
