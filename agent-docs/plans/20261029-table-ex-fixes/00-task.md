# 任务简报：table-ex 组件三项问题检查与修复

流水线：bugfix-verify（定位 → 修复方案 → 实施 + 验证）

## 目标

三个问题（用户原文要点）：

1. **文本垂直不居中**：标签、按钮、进度等图形组件（table-ex 单元格内渲染）中文本位置偏上，未垂直居中。期望：文本垂直居中。
2. **格线未重绘**：table-ex demo 页面，夹具（fixture）从「默认」切换为「多行文本」时，单元格格线未重新绘制，格线位置未变化。需分析什么情况下触发重新绘制，并修复。
3. **树节点 isLeaf 分级加载**：参考 Tree 组件的 isLeaf 属性设计：当节点 isLeaf 明确为 `false` 且没有下级节点时，需显示展开三角，并在点击展开时 emit 展开事件，用于树节点数据分级（懒）加载。

## 验收标准

本项目无测试框架（AGENTS.md：通过 demo 页面验证组件行为），回归验证以 demo 页面 + playwright DOM 断言代替：

1. demo 页面单元格内 tag/button/progress 等图形列型文本垂直居中（canvas 列型以实际存在者为准；「badge」为调度者转写误加，已去除）。
2. demo 页面夹具切换为「多行文本」后，格线随行高变化正确重绘；重绘触发条件的分析结论记入产物。
3. 树数据节点 `isLeaf: false` 且无 children 时显示展开三角；点击时 emit 展开事件（事件名以设计为准），外部加载子节点后可正常展开。
4. `npm run build` 通过；stylelint 无新增错误。

## 验证命令

- `npm run build`（构建库，dev + prod）
- demo 页面 playwright 验证（优先 DOM/可访问性快照断言）

## 验证环境

- rollup watch 站点 `http://localhost:3000/`（调度者两次复测 HTTP 200，运行中；B1 探索者环境未达属其沙箱限制）。demo 页面路径：demo/src 下 table-ex demo（见 01-explore.md）
- 项目不使用 agent-task-report 上报

## 基线

- 分支：`mussel-table`，HEAD `1c8f326`，`git status --short` 干净（2026-10-29）

## 开关状态

- 并发数：1（bugfix-verify 规定串行；三问题集中于同一 table 模块，文件重叠，实施串行）
- 实施循环上限：3 轮；回方案上限：2 次
- 评审方式：无独立评审（bugfix-verify 不含）

## 角色映射

| 角色 | agent | 说明 |
|---|---|---|
| explorer | pipeline-explorer | 副本校验通过（仅 frontmatter 差异） |
| designer | pipeline-designer | 同上 |
| implementer | pipeline-implementer | 同上，含 Edit |
| verifier | pipeline-verifier | 同上 |
