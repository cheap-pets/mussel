# 任务：table column-types 新增 button 列类型

## 目标

在 table 的 column-types 中新增 button 列类型：支持定义多个按钮（数据结构沿用 table-ex 现有 button 列实现）；link 形态由 `column.link: Boolean` 控制（与 table-ex 现有定义一致）；dom 模式定义参照 tag 列相关实现；table 与 table-ex 统一使用 column-types 中的 button 定义。

## 基线（git）

- branch: dev @ 0836783（2026-11-05）
- status: `M demo/src/data/table-ex-basic/main-view.vue`（处理方式见 decisions.md 启动确认记录）

## 验收标准

1. `type: 'button'` 在 column-types 注册生效，注册无废弃警告。
2. button 列支持多个按钮定义，字段结构与 table-ex 现有 button 列一致（沿用现有字段名与回调签名）。
3. `column.link: true` 时按钮为 link 形态，行为与 table-ex 现有 button 列 link 形态一致。
4. dom 通道产物参照 tag 列 dom 模式（is/class/style/events 协议），消费端兼容 items 协议 events 可选约定。
5. table 不再保留自有 button 列定义（如有），统一走 column-types 的 button。
6. table-ex 原 button 列实现替换为 column-types 的 button 定义，行为不回退（含 canvas 通道与列对齐协议）。
7. `npm run build` 通过；demo 页可验证 button 列渲染与点击事件（页面与断言由设计阶段「测试计划」确定）。

## 约束

- 纯 JavaScript，Composition API；CSS 走 `--mu-*` 变量，BEM `mu-` 前缀。
- 不新增依赖。角色不执行改状态 git 命令；不 commit。

## 验证命令与环境

- `npm run build`；eslint（口径 src 与 demo/src，全局 8.57.0）。
- demo dev server 常驻 3000 端口，URL 前缀 `/data/<name>/`；watch 重建会清空 demo/dist，勿放临时资产。
- 浏览器验证：playwright mcp（先直接访问，不必每次打包）。

## 流水线与开关

- 临时组合（design-review 交叉变体 → impl-verify 整体），用户指定序列：
  design(D1) → amender 交叉修订(X1) → design 最终修订(R1) → 确认门 → (impl → verify) * n（n ≤ 2）
- 预设 standard：规范审查关、TDD 关、并发 1；评审方式：交叉（用户指定）；确认门：自动（R1 后直接实施，用户已确认）。
- 设计阶段无自动 X 复审（R1 后直接进实施；末次 X 改动未经 A 复核的风险随实施记录）。

## 槽位映射（内部）

- designer → pipeline-designer（GLM-5.3，Primary）
- design-amender → pipeline-design-amender（deepseek-flash，Peer）→ 评审模型：异构
- implementer → pipeline-implementer（GLM-5.3-Flash，Primary）
- verifier → pipeline-verifier（GLM-5.3-Flash，Fast；独立实例，与实施同模型）

## 知识输入

- `agent-docs/knowledge/INDEX.md` 相关条目（按需读取）：table 列类型体系 v2（`project/table-column-types-v2.md`）、compile(column, dom) 双通道协议、TagColumn 颜色协议、table-ex 条目列对齐协议、items 协议 events 可选、demo 页 URL 前缀 /data/、demo watch 新增页面需重启。

## 预算

- 预估派发：5（设计 3：D1+X1+R1；实施 2：I1+终验）
- 派发上限：8（ceil(5×1.5)）
- 设计修订 k/N：N=1（按用户序列固定一轮 R）；修复轮：键「整体/终」R=1；回设计/回方案上限 2。
