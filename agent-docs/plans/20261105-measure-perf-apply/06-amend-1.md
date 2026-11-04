VERDICT: AMENDED

## 检查项结论（每项一行）

1. **覆盖**：B1~B5 均有设计/验证对应；新增/修改的测试载体（3 个 self-checks 文件、index 注册、main-view 夹具）已全部进入 §5 与 §7（原缺 main-view.vue，已补）。
2. **事实一致**：行号/符号逐一核对通过（controller:65/100-109/113-119/258-281/312-317/351-396/403-416/420-422；row-geometry.js:27-29/61-68/79-93/113/116/298/340-342/361/380-420/429/454-458；cell-painters.js:230-236/558/394-410/656-659；text-wrap.js:48-97/79-88/119-126/150-158；table-ex.vue:246-259/532-538/1528-1549；list.js:117-118；use-tree-rows.js:55-68/109-118；main-view.vue:355/399-489/438-461/1115/1220-1232）。原设计三处论据不成立，已直接改：①`recordsVersion` 在 relayout 前清空缓存与 controller:13-15 单调不变量冲突（树模式版本号重建 flatRows，见 use-tree-rows.js:55-68）；②可见计数列的 `__valueCalls` 帧增量不可能为 0（绘制侧每帧 `_value`）；③默认场景 memo 列未配 multiline，recordsVersion 冒烟观察不到行高变化。
3. **约定一致**：改动仍落在 ex/ 消费侧，不触碰 column-types/cell-painters；新增 ctx getter 与现有 getter 风格一致；纯 JS、无新增依赖、无样式改动。
4. **影响面**：P1 失效维度补 `recordsVersion`（快照）与树缩进（快照），并明示 `recordNumber`/`recordsOffset` 不进入行高（list.js:117-118）；测试与夹具同步补齐。
5. **可实施**：§7 步骤 0（夹具+基线）→ 1~4 有序且每步可自检；controller 自检夹具明确到 fake ctx 字段、可变 levels、buildSpans 真实索引，可直接实现。
6. **风险与回滚**：无单向门（纯代码内缓存/跳过逻辑，回滚即恢复原逐帧重算）；爆炸半径限 table-ex ex/ 控制器与估高侧 + demo 夹具；P1 粘性契约（recordsVersion 为唯一通知）已显式标注。
7. **范围**：无超出 B1~B5 的改动；main-view 夹具默认关闭、不改既有场景与 DOM 参照表。

## 改动台账（仅本轮直接改入设计文档的项）

| # | 位置 | 改前 → 改后 | 原因与证据 | 实质（是 / 否） |
|---|---|---|---|---|
| 1 | §3 P1 缺口/改法/伪代码 | "`invalidateMeasuredHeights()` + relayout 前整体清空、跳过判据只看几何值" → "缓存条目 `{ height, indent, recordsVersion }`，三条件跳过；`mergeMeasuredHeights` 取 `.height`；ctx 注入 `getRecordsVersion`；新增树缩进快照（`needIndent` 仅树开且存在变高候选列时生效）" | 树模式下 `childrenIndex` 显式依赖 recordsVersion（use-tree-rows.js:55-68），版本变化重建 flatRows → 重扫 rebuild；relayout 前清空使 merge 无旧真值，几何回落估高下界、totalHeight 回缩，违反 controller:13-15 的 #15 单调不变量且无 scrollTop 补偿。树缩进（tree 开/关、treeProps）不在任何失效维度，精算宽度含 inset（row-geometry.js:454-458）、估高恒 1 行（:90），P1 会冻结旧折行高度；`treeIndentsOf` 读 `flatRows.levels`（use-tree-rows.js:109-118）。 | 是 |
| 2 | §3 P1 正确性论证/粘性契约/风险 | 失效链列表改为"快照维度完备"；补 `recordNumber` 不影响行高的证据；粘性契约明确版本快照为唯一通知；风险改指版本+缩进快照 | 与 #1 同步，保持论证与实现一致；`recordNumber` 仅透传 render，link/list compile 签名 `({ record, value, emit })` 不消费（list.js:117-118） | 是 |
| 3 | §5 改动文件清单 | controller 行改快照描述；table-ex.vue 行由"合并 watch 调用 invalidateMeasuredHeights"改为"ctx 注入 getRecordsVersion"；controller 自检行改断言集合；新增 `demo/src/data/table-ex/main-view.vue` 夹具行 | 与 #1/#4 一致；原清单缺 B3/B4 所需夹具文件 | 是 |
| 4 | §6 控制器自检设计 | 断言 2 改为 recordsVersion 快照失配（不再用 invalidateMeasuredHeights）；夹具补 getRecordsVersion/可变 treeIndents/3 列（含多行树形列、专用计数列）；新增断言 7（缩进快照）、断言 8（重扫 rebuild 后 totalHeight 不回缩） | 覆盖 #1 的两个新维度与 merge 不变量；夹具字段对应 controller 实际 ctx（table-ex.vue:265-281） | 是 |
| 5 | §6 基线采集/指标 | 稳态指标改为"计数列列尾追加 width 4000、初始水平视口外（前序列宽和≈1944px > 舞台 960）、重置计数后同 scrollTop 派发 5 帧"；首扫改 3 次重载取中位；recordsVersion 冒烟改用 multiline 场景（改 long10 + 通知按钮） | 绘制侧 `resolveCellContent` 每帧调用 `_value`（cell-painters.js:230-236），可见计数列帧增量不可能为 0；默认场景 memo 列未配 multiline（main-view.vue:438-461），既有 onAsyncMutate 只改短 memo（:1220-1232），均无法观察行高变化 | 是 |
| 6 | §7 实施顺序 | 新增步骤 0：先落 demo 夹具、采集并留存基线（不改 src），未采到基线不得进入 src 改动 | B4 需要"改动前"基线；不允许 git 切换 worktree/stash，只能在改 src 前采集 | 是 |
| 7 | §3 P2-2 / P2-4 | 补"P2-4 落地后估高不再经 textLineCountOf/宽计算，P2-2/P2-3 成为防御性等价改写"说明 | 原设计同时宣称 P2-2/P2-3 省回调与 P2-4 内联收敛，二者口径重叠，需说明避免重复计收益 | 否 |
| 8 | §3 P4 tokenize | 补"空白/CJK 集合重叠（U+3000 同属 CJK 区间），判定顺序必须空白优先" | 现实现先判 `/\s/` 再判 CJK（text-wrap.js:63-66），码点化后若换序会改变 U+3000/全角空白的分词 | 否 |
| 9 | 文档头 | 新增"交叉审改修订（2026-11-05）"块 | 记录本轮修订来源与要点 | 否 |

## 未解决异议（累计）

（无）
