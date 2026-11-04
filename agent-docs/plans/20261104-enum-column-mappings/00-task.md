# 任务简报：table-ex enum 列恢复并独占 mappings/options

## 目标

table-ex（增强表格）列类型调整：text 类型列现有的 mappings 特性过重（所有 text 列都走 map 过程），改为仅 enum 列支持 mappings；恢复 enum 列（代码未删、仅未注册）并用 createDisplayMapper 实现 mappings；text 列保留 color 选项能力；enum 列编辑态使用 select 下拉。

## 基线

- 分支 dev @ 72149a7，工作区 clean（2026-11-04 建目录时快照）

## 需求要点（用户原文归纳）

1. 恢复 enum 列（代码未删，只是未注册了）。
2. enum 列使用 createDisplayMapper 实现 mappings 过程。
3. 去掉 text 列的 mappings，但保留 color 选项能力。
4. 仅 enum 支持 mappings 选项，并兼容 options 选项；编辑时使用 select 下拉。
5. 其余类型列不支持设置 options，编辑不使用 select。

## 验收标准

- [ ] A1 enum 列类型已注册，`type: 'enum'` 列可正常渲染
- [ ] A2 enum 列设置 mappings 时按映射显示文本（经 createDisplayMapper 实现）
- [ ] A3 enum 列设置 options 时正常工作，与 mappings 兼容（可共存，优先级在设计文档中明确）
- [ ] A4 text 列不再走 mappings 映射；text 列 color 选项能力保持不变
- [ ] A5 enum 列编辑态渲染 select 下拉，选定后写入原始值
- [ ] A6 其余类型列设置 options 不产生效果，编辑态不出现 select

## 验证命令

- `npm run build`（构建通过）
- demo 页面行为验证：http://localhost:3000/ 下 table-ex 相关 demo（rollup watch 常驻，无需每次打包）

## 验证环境

- demo 站点 http://localhost:3000/<name>/（`demo/src/<name>/` 组织）
- 无测试框架；行为验证走 demo 页（DOM 断言优先，playwright 可用）

## 约束

- 纯 JavaScript、Composition API `<script setup>`、BEM `mu-` 前缀、`--mu-*` 变量（见项目 AGENTS.md）
- 不新增依赖；不 commit
- 代码实现完成、用户确认前，不更新文档（skills/docs-site/docs）

## 流水线与开关

- 流水线：自定义（用户指定）—— designer 设计 → design-amender 审改 → designer 交叉修订 → (implementer 实施 + verifier 检验) × n，n ≤ 2
- 预设：standard（未指定项取默认）；实施粒度：整体（用户流程为单一实施+检验组合）；修复轮上限 R = 1（由 n ≤ 2 推得）；规范审查：关；TDD：关
- 设计修订：X 一轮 + R 一轮（固定，非 N 循环）；R 回应后不再派 X 复审（用户流程未含）
- 评审方式：交叉（design-amender 直接改设计）

## 槽位映射

| 角色 | 槽位 | agent |
|---|---|---|
| designer | Primary | pipeline-primary |
| design-amender | Peer | pipeline-peer |
| implementer | Fast（用户指定） | pipeline-fast |
| verifier | Fast | pipeline-fast |

评审模型：异构（primary / peer 专用 agent）；验证：独立实例（与实施同为 fast 槽位，独立上下文）

## 预算

- 预估派发数：7（设计 1 + 审改 1 + 修订 1 + 实施 1 + 检验 1 + 修复循环 2）
- 派发上限：11（ceil(7 × 1.5)）
- 设计修订 k/N：用户固定流程，不适用 N 循环；回设计/回方案 j/上限：1（BLOCKED 时）
- 修复轮：`整体 k / R = 1`
- 派发 d / 上限：0 / 11
