# 任务：修复 table / table-ex 代码层问题（注释优化批次发现）

## 目标

注释优化批次（commit 0ef008b 前置审查）发现 7 项代码层问题，逐项核实后修复确认的缺陷。问题清单：

1. `[致命候选]` src/components/table/base/table.vue internalColumns：`fixedLeftColumns: N` 时 `idx === N` 列也拿 `_fixed` + `fixed-col`(sticky) + left 定位并计入 fixedColumnsWidth，实际钉住 N+1 列；文档口径"固定左侧 N 列"（docs-site/components/table.md:279、demo/src/data/table-advanced）。
2. `[警告]` src/components/table/base/table.vue setColHoverIndicator：`offset` 恒取 `scrollLeft`，实际遮挡量为 `fixedWidth + scrollLeft - cellLeft`，仅对紧邻固定区的首个非固定列正确；深滚动下后续列指示条错位且过窄（已实验证实）。
3. `[警告]` src/components/table/ex/table-paint/paint-body.js L48-54 trimItemHits：`row >= end && keepRows.has(row)` 豁免分支不可达（区域锚行恒 `< viewRows.end`）；合并区域锚行滚出窗口上方（`row < start`）后区域内 link/tag/button 点击悬停命中丢失。疑似修复：`(row < start || row >= end) && !(keepRows && keepRows.has(row))`。
4. `[小问题]` src/components/table/ex/composables/use-column-resize.js:55 `spacerWidth: Math.max(colsWidth, base.stickyWidth)` 与 geometry/layout.js relayout 内同名公式两处手工同步，漏改风险。
5. `[小问题]` src/components/table/ex/editing/editor.js:180 `rawWasArray` 死字段，全项目无消费方。
6. `[疑问]` src/components/table/column-types/bool.js:16 空值返回非空产物 `{ text: null }`，与 text/enum/icon 落占位链（返回 null/undefined）协议不一致。
7. `[疑问]` src/components/table/ex/spans/spans-method.js:259 `typeof declared !== 'object'` 放行数组形态 spanMethod 返回值，Object.keys 取索引串走"无匹配列"警告，文案误导。

## 基线

git 基线快照见 run.log 头部注记；src/components/table 提交 0ef008b 后干净，工作区另有 skills/、agent-docs/、demo/src/data/table-ex/self-checks/、src/styles/background.scss、todo/misc.md 等任务外未提交改动，本任务不得触碰。

## 验收标准

1. 7 项逐项给出结论：确认缺陷（修复）/ 有意行为（不改代码，记录依据）/ 存疑（列明待决点）。
2. 修复项行为正确、改动最小化，注释随行为同步更新。
3. `npm run build` 通过。
4. 修复项对应 demo 页面行为无回归（:3000 demo，已运行 watch；playwright 先直接访问）。
5. 不扩大范围：仅改核实为缺陷项涉及的文件。

## 验证命令

- `npm run build`
- demo 页 playwright 验证（页面在 `/data/<name>/` 前缀下；浏览器访问加 cache-bust 参数）

## 约束

- 纯 JS（无 TS）；Vue 3 Composition API；改动风格随文件既有惯例。
- demo/src/data/table-ex/self-checks/ 有未提交任务外改动，涉及自检断言修改时只做本任务必需的最小增量，不重排他人改动。
- 未经调度者同意不改 src/components/table 之外的库源码。

## 流水线（用户指定编排：临时组合）

primary 核实+方案 → peer 审核 → primary 终审实施 → fast 检验 → (fast 修复 → fast 检验)×n，n≤2

| 步 | 角色（契约文件） | 槽位 agent | 产物 |
|---|---|---|---|
| P1 | designer | pipeline-primary | 02-design.md |
| P2 | design-reviewer | pipeline-peer | 03-review-1.md |
| P3 | implementer | pipeline-primary | 04-impl.md + 源码 |
| P4 | verifier | pipeline-fast | 05-verify-1.md |
| R1a/R1b… | implementer 修复 / verifier | pipeline-fast | 04-impl-修复-N.md / 05-verify-N+1.md |

## 预算

- 预估派发数：8（P1-P4 = 4；修复循环每轮 2 次 × 上限 2 轮 = 4）
- 派发上限（断路器）：12
- 修复轮：`整体 k / 2`（用户指定 n≤2）
- 设计修订 N：0（用户编排无 designer 修订步；peer 意见直接进 P3 终审）
- 回设计/回方案上限：1（超出即停，按「必须停下」汇报）
