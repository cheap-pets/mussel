# 任务简报：table-ex 交叉优化设计与实施

流水线：design-review（交叉，修订轮数 2）→ impl-verify（实施循环上限 2）接力。用户已在请求中预授权：设计完成后实施并验证、完成后更新文档。

## 目标

对上轮修复后的 table-ex 模块（当前 worktree 未提交改动为基线内产物）：

1. **交叉优化设计**（重点：性能、代码复杂度、可读性），最多两轮交叉（X 审改 + R 修订）。
2. **清除所有 eslint 报错**：项目已有 `.eslintrc` + `.eslintignore`（隐藏文件），按既有配置执行，不新增依赖。
3. **demo**：保留 `demo/src/data/table-ex/` 自检/验证页面；新增从简单到复杂的正式 TableEx demo 页面。
4. 设计完成后实施（≤2 轮）并独立验证；完成后更新文档（skills/mussel-ui/references/、docs-site、docs/quick-reference_*.md，用户已授权）。

## 验收标准

1. `npx eslint`（按 .eslintrc）检查 src/ 与 demo/ 零 error；warning 政策由设计定并留痕。
2. 设计所列优化项落地且无回归：demo 自检全绿（上轮 187/187 基线）、`npm run build` 通过、`npx stylelint "src/**/*.scss"` 零报错；性能须有可验证口径（参照知识库 table-ex-performance-profiling 条目，不劣化于当前）。
3. `demo/src/data/table-ex/` 自检页保留可用；新增正式 demo 页（数量与结构由设计定，从简单到复杂），`:3000` 可访问。注意：新增 demo 目录须重启 `npm run demo:build`（rollup input 启动时枚举，知识库已有条目）。
4. 文档三处同步：`skills/mussel-ui/references/components/`（agent 参考）、`docs-site/`（组件页 + 涉及的 guide）、`docs/quick-reference_*.md`；须补上轮新增 API（`treeProps.isLeaf` 映射、`tree-expand` / `tree-collapse` 事件）。

## 验证命令

- `npx eslint "src/**/*.{js,vue}" "demo/**/*.{js,vue}"`（以 .eslintrc 实际可运行口径为准，由探索确认）
- `npm run build`；`npx stylelint "src/**/*.scss"`
- demo 页 playwright 验证（DOM/可访问性快照断言优先）

## 验证环境

- rollup watch 站点 `http://localhost:3000/`（调度者 2026-10-30 复测 `/data/table-ex/` HTTP 200，存活）；demo 页 URL 前缀 `/data/`；新增 demo 目录须 catalog.js 登记 + 重启 demo:build（01-explore 已证实入口枚举自 catalog 非文件扫描）

## 基线

- 分支 `mussel-table`，HEAD `1c8f326`；工作区含上轮任务链未提交改动（src/components/table/ex 六文件、demo/src/data/table-ex 四文件、知识库与 plans 文档），均为基线内产物

## 开关状态

- 评审方式：交叉（designer A = GLM-5.3，design-amender C = deepseek-flash，模型不同已确认）
- 修订轮数：2（用户指定"最多两轮"）
- 实施循环上限：2（用户指定"最多两轮实施并验证"）
- 检查点：预授权续接 impl-verify；若末次交叉存在未解决重大异议则停下汇报
- 并发数：1（design-review 与 impl-verify 均规定串行）

## 角色映射

| 角色 | agent | 说明 |
|---|---|---|
| explorer | pipeline-explorer | 续用上轮实例（已有 table-ex 上下文） |
| designer (A) | pipeline-designer | 副本校验通过；续用上轮实例 |
| design-amender (C) | pipeline-design-amender | 副本校验通过；deepseek-flash，与 A 模型不同 |
| implementer | pipeline-implementer | 副本校验通过；续用上轮实例 |
| verifier | pipeline-verifier | 副本校验通过；续用上轮实例 |
