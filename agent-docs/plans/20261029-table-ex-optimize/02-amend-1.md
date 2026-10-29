# 修订回应（R 阶段，第 2/2 次修订）

对 06-amend-1.md（VERDICT: AMENDED，改动台账 13 条、异议 0）的回应。实质改动 7 处（台账 #2/#3/#4/#5/#6/#7/#8）逐条回应如下；非实质 6 处（#1/#9/#10/#11/#12/#13）按角色规则无需回应，仅附核对备注。审改人无异议项；残留表态 #6/#7/#8 见文末。

## 实质改动逐条回应

| # | 改动（摘要） | 回应 | 独立验证与整合 |
|---|---|---|---|
| 2 | relayout 次数判据由 repaintCount/lastRelayout 改为临时 `console.count('relayout')` + 同批 `$nextTick` wall-clock，并注明前两者不可用的原因 | **接受** | 复核属实：`pollDebugPanel`（main-view.vue:1262-1282）200ms 轮询、仅 lastPaint JSON 键变化才 +1，数的是绘制快照变化非 relayout 次数；`lastRelayout` 每次 relayout 整体覆盖（table-ex.vue:518）；`redraw()` 同步整幅（:425-428）——同批两次 relayout 只留最后一次痕迹，原判据确实不可验证，属原设计缺陷。整合已完成（审改人改入 C 线表、表下注、测试计划 2④、步骤 2/4，各处口径一致：步骤 2 加埋点、步骤 4 末尾删除 + `git diff` 无残留判据齐备） |
| 3 | 「冻结的可验证性」补 5 个未覆盖警告分支、去重键不可观测、regions 顺序无断言，加临时探针前后逐字比对后删除 | **接受** | 复核属实：self-checks/spans.js grep 证实已断言警告仅「无匹配列/重叠/夹紧」等（:206/:208/:253），台账所列 5 分支（spans.js:225/:240/:283/:347/:361，行号逐一比对源码无误）无任何断言；`createWarner`（spans.js:48-59）只把 message 交注入出口、key 不可观测；regions 仅条数/坐标断言无序断言。原设计「自检断言按键捕获」表述有误（按键捕获的是消息子串而非键）。探针方案（临时 check → 基线序列 → 逐字比对 → 删除，交付 diff 仅含 quotes --fix）已整合于 B 线「冻结的可验证性」+ 步骤 3 + 测试文件节 |
| 4 | applySpanMethod 分解增 `buildSpanInfo`（spanMethod(info) 载荷构造），目标 `<10` 改 `≤10` | **接受** | **独立复测通过**：以全局 eslint v8.57 `--no-eslintrc --rule '{"complexity":[1,10]}'` 跑分解骨架——applySpanMethod 主循环恰为 **10**（≤10 通过）；对照组 `?.` 不计数、`&&`/`??`/三元各 +1，与台账计数口径一致；「只做两项抽取时 13」的算术亦复证（主循环 10 + 载荷构造 3 = 13）。整合补充：正文 applySpanMethod 条目追加「R2 独立复测：恰为 10，零余量通过，主循环不得再保留额外分支；超限继续抽取不得豁免」——零余量是实测发现的新约束，防止实施变体（如 orderBy 警告留在主循环）顶到 11 |
| 5 | applyAutoRowSpan 分解增 `advanceSegment(seg, key, row, segStartByCol, colIndex)`（seg 每列一次） | **接受** | **独立复测通过**：同法实测分解骨架主循环恰为 **10**（close 箭头函数 1，各抽取函数均 ≤5）；`seg` 每列一次分配与「行循环零新增分配」红线一致。正文 applyAutoRowSpan 条目同加零余量警示与「两个 continue 分支已计入该 10」注记 |
| 6 | `normalizeSpanValue(raw)` → `(raw, row, colIndex, emitWarn)`，由 `parseSize(raw, row, colIndex, emitWarn)` 组合 normalize+validate | **接受** | 复核属实：值形态无效警告文案含 `(${row}, ${colIndex})`（spans.js:225），原签名 `(raw)` 发不出该警告、会丢分支。接口节三层签名（parseSize 组合层保持调用点不变 + normalize/validate 分层）自洽，无需再整合 |
| 7 | 文档变更追加 `docs-site/components/table-ex.md:191` 树模式正文（同页第三处 tree-props 描述） | **接受** | 复核属实：`:191` 正文现写 `{ key, parentKey }`，同页 `:244` 属性表、`:248-254` 事件表为另两处——只改表格确实留下同页自相矛盾。改动清单 docs-site 行三处分列与测试计划 4 的正文检查已一致 |
| 8 | 步骤 1 完成判据的 warning 余量改为「complexity ×9 + max-len ×10，步骤 3 后降至范围外 ×2」 | **接受** | 逻辑复核无误：步骤 1 时 B 线未实施、9 条 complexity 告警全在，原判据（范围外 ×2）在步骤 1 必然不成立。测试计划第 1 行保持终态口径（范围外 ×2 + max-len ×10）正确，两处不冲突 |

## 残留表态回应（台账文末）

- **#6（--fix 全量）维持**：接受。补充核对其证据链成立——212 条均为 newline 类（首尾换行），Vue condense 编译不改渲染文本，三道把关（build/自检/冒烟）在测试计划中齐备。
- **#7（树 watch 不并入 P1）维持**：接受，含其修正证据（tree `use-tree-rows.js:211` 带 `immediate: true`、treeProps `:218` 带 resolveInitialExpansion，已逐一核对源码）与补充口径「tree + records 同批属 P1 范围外，验证中出现 ≥2 次 relayout 只记录、不判 P1 退化」——该口径已写入未解问题 7，接受。
- **#8（两页内容可微调）维持**：接受。其收紧（不得删 isLeaf 懒加载与 tree-expand/tree-collapse 活样例、catalog 条目与 path 不动）与验收标准 4 的样例来源绑定，合理。

## 本次 R2 对 02-design.md 的整合改动

1. B 线 `applySpanMethod` 条目：追加 R2 独立复测值（主循环恰 10）与零余量实施约束（不得保留额外分支、超限继续抽取不得豁免）。
2. B 线 `applyAutoRowSpan` 条目：同上复测值与约束（两个 continue 分支已计入该 10）。
3. 被拒绝备选 A3：`11→<10` 措辞改 `11→≤10`（与 ≤10 阈值口径一致）。
4. D 线 guide 行：`\install.md` 笔误修正为 `guide/install.md`（并独立核实：`docs-site/guide/install.md:31` 为 guide 下唯一 MuTableEx 提及，链接到组件页、无 tree/事件内容，「本轮不改」结论成立）。

## 非实质项核对备注（无需回应，抽查结果）

- #1（五 watch 语句/六源，行号 1305/1315/1323/1328/1370）：`:1305` 与 `:1370` 逐一 grep 复核实属，表述已与代码一致。
- #9（测试计划 4 反引号包裹 grep 模式）：合理——`tree-expanded-keys` 含 `tree-expand` 子串，裸词假阳性（data.md:256 等既有 API）。
- #10（`__version__` 注入来源补 `vite.config.js:55-56`、src/env.js:1 先例、.eslintrc JSON 注释可行性）：与「库构建亦注入」事实一致，接受其表述。
- #11/#12/#13：行号与措辞修正，抽查（use-tree-rows.js:211/:218/:226、tree.js:135 `hasKids || isLeafOf?.(record) === false`）属实。

## 结论

7 处实质改动全部接受，0 处不接受，0 处不可行；设计正文无遗留不一致。设计可交 impl-verify（预授权已生效，decisions [前置]2）。
