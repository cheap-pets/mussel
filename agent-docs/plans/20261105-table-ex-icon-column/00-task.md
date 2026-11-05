# 任务：table-ex icon 列设计修订（icon 收敛 / button 图标 / editButton 改造）

## 目标

按用户修订要求修订 02-design.md（icon 列类型设计），扩展覆盖：icon 列收敛、button 列图标按钮、editButton 改造。经三轮修订（primary → peer → primary）后提交人工审核，通过后实施。

## 修订要求（用户原文逐字）

1. icon 列只支持一个图标，且只支持 icons 中已经注册的图标显示，不支持 img，支持 color 设置图标颜色。
2. button 列也需支持图标按钮
3. column 的 editButton 也改为只支持已注册图标，顺便把其 onClick 属性，改为类似于 links item click 的 emit 方式。
4. 需充分考虑性能与 api 方便程度

## 基线

git status --short（2026-11-05）：

```
?? agent-docs/plans/20261105-table-ex-icon-column/
```

## 约束

- 项目代码约定见根 AGENTS.md（纯 JS、Composition API、BEM/`--mu-*` 变量等）。
- 设计须覆盖双通道协议（canvas compile + dom compile）。
- 修订允许重构原设计相应章节，不限于增量补丁。
- 已裁决项（decisions.md D1–D3）与新要求冲突处按新要求处理，冲突点在修订产物中列出（decisions.md 由调度者更新）。
- 实施阶段：demo 验证走 rollup watch + 3000 端口，playwright 优先 DOM/可访问性快照断言。

## 验收标准（设计阶段）

- 最终设计覆盖：icon 列单图标 + 仅注册图标 + color；button 列图标按钮；editButton 仅注册图标 + onClick → emit（links item click 同构）。
- 性能与 API 便利性有明确权衡说明。
- 未解问题单列成节，供人工确认。
- 人工审核通过后进入实施。

## 流水线（用户指定临时组合）

primary 修订原始设计 → peer 修订设计 → primary 修订设计 → 暂停（设计疑问确认，人工放行）→ (fast 实施 + fast 验证) × n（n ≤ 2）

- 槽位映射：primary = pipeline-primary（designer），peer = pipeline-peer（design-amender），fast = pipeline-fast（implementer/verifier）
- 评审模型：异构；验证：独立实例

## 预算

- 预估派发：3（设计修订轮）+ 2~4（实施 + 验证，n ≤ 2 轮）= 5~7
- 派发上限 d = 11
- 三轮修订为用户固定流程，不占设计修订 k/N；实施阶段修复轮键：整体 k/R（R=2）

## 二轮设计调整（2026-11-05 用户裁决，见 decisions.md）

1. button pill 高度 = `--mu-control-height-small`。
2. button 不支持图标与文本并存，有文本文本优先（icon+caption 形态删除）。
3. 图标按钮宽高一致 = `--mu-control-height-small`，图标水平垂直居中。
4. 顺带修复遗留缺陷：ellipsizeButton 裁剪检查顺序（05-verify-终-2.md 失败项 1）。

二轮流水线：primary 调整 → peer 修订 → primary 修订 → (fast 实施 + fast 验证) × n（n ≤ 2），无确认门。
二轮预算：预估 5~7，阶段上限 d = 11（前阶段已用 10，总计 ≤ 21）；修复轮键 `终` k/R（R=2）。

## 验证命令

- self-checks：node 纯逻辑断言（demo/src/data/table-ex/self-checks/）
- demo 页：http://localhost:3000/data/table-ex/
