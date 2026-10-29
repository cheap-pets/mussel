# table-ex 排序模式与 recordsVersion（2026-10-30 会话分析）

来源：2026-10-30 会话讨论——排序模式可行性分析、recordsVersion 机制澄清、refresh() 方案权衡。
与 `table-ex-20261030.md`（plan 文档遗留项汇总）互补；树排序成本测量结论见该文件「四、已核实闭环」末条。

## 一、排序模式（待办：内部排序）

### 现状：外部排序已完整，无需开发

table-ex 为纯受控外部排序（v-model:order-by + 消费端自行排序），基础设施已就绪：

- 列级 `sortable` → 表头命中/pointer 光标：`src/components/table/ex/interactions.js:112`
- 点击循环解析（无 → asc → desc → 无）：`resolveOrderByNext`，`interactions.js:155`
- 表头点击发 `update:order-by`（header-click 照发兼容）：`interactions.js:196-216`
- 排序图标绘制（orderBy 驱动）：`painter.js` `drawSortIcon` / `sortDirectionOf`
- orderBy 变化 → spans 重算 + relayout 完整管线（含可视行精算三连）：`table-ex.vue:1317` 合一 watch
- 行高几何缓存键 = record 引用 → 行序重排廉价
- autoRowSpan 与 orderBy 冲突 dev 警告：`spans.js:389`
- 消费范式参考：`demo/src/data/table-ex/main-view.vue:849` `applyOrder`

### 内部排序改动清单（推荐方案：表级 sort-mode 开关）

| 改动点 | 内容 | 量级 |
|---|---|---|
| API | 表级 prop `sort-mode: 'external'(默认) / 'internal'`，默认值保持现有行为 | 小 |
| 内部态 | `innerOrderBy` ref + effectiveOrderBy，接入 4 个消费点：spans computed、`paintState.orderBy`、`resolveHeaderClick` 调用、relayout watch 源数组 | 小 |
| 排序视图 | 非树：`sortedRecords` computed（拷贝排序）插入 displayRows 派生链；树：`use-tree-rows` 的 `buildChildrenIndex`/`buildFlatRows` 源换成排序后副本 | 中 |
| 默认比较器 | 字符串 localeCompare / 数值 / 布尔；列级 `sortMethod` 比较器钩子 | 小-中 |

核心约 200 行内，集中在 `table-ex.vue` + `use-tree-rows.js` + comparator 模块。
最小集 1 天内；含列级 sortMethod、映射列策略、demo 场景、三处文档同步约 2-3 天。

替代方案（已论证不推荐）：列级 `sortable: true / 'custom'`（Element/Ant 惯例）——现有 sortable 为 Boolean，改语义有兼容风险，且与受控 prop 风格不一致。

### 决策点与坑（实施前逐条确认）

1. **recordsVersion 依赖**：排序 computed 必须显式 `void props.recordsVersion`，否则树懒加载就地 push（`recordsVersion++` 通道）、批量就地改值后不重排。先例：spans（`table-ex.vue:226`）、childrenIndex（`use-tree-rows.js:58`）。
2. **recordIndex 语义**：事件中 recordIndex = 显示行序（painter recordNumber 同口径，`recordsOffset + r + 1`），内部模式下 ≠ 用户 records 数组下标。推荐文档化（record 引用已随事件透传）；或映射回源下标。
3. **树排序语义**：同级子节点内排序、不跨节点——复用「排序扁平源 + buildChildrenIndex 收集序 + DFS 重组」trick（demo 注释已验证）。
4. **映射列排序取值**：tag/status 等映射列默认按原值排序（推荐），`sortMethod` 覆盖。
5. **排序后滚动位置**：几何缓存使内容高度不变，保持 scrollTop 成本低；或对齐 records 替换行为复位顶部。二选一。
6. **编辑中排序**：编辑提交改值后不自动重排（避免行跳走），下次点表头才重排——文档化。与第 7 节「组件不更新 recordsVersion」天然自洽。

## 二、recordsVersion 机制备忘

- **作用**：Vue 按引用追踪，records 就地修改（push / splice / `record[field] = v`）不换引用则组件失明；Number prop 由消费端手动 `++` 作为失效信号。
- **消费点仅 3 处**：spans computed（`table-ex.vue:225-238`）、树 childrenIndex/flatRows（`use-tree-rows.js:53-90`）、relayout 合一 watch（`table-ex.vue:1304-1338`）。
- **组件不更新、也无法更新它**（prop 单向）。组件内部操作各有独立通道：单格编辑提交走 `onCommit` → nextTick `remeasureRow` + `invalidateRow`（`table-ex.vue:585-588`）；树展开/选中/hover 各自 watch/invalidate。
- **消费端判断规则**：换了引用 → 永远不用；就地改 + 单格编辑提交事件 → 不用；其余一切就地改（树结构、跨行、合并、行高、批量）→ 必须 ++。拿不准时 ++ 无害（估高缓存按 record 引用命中，成本低）。
- **不 ++ 的症状**：数据变了界面不更新（合并块不重算 / 树新子级不出现 / 行高停在旧值），直到下一个 relayout 源变化才顺带刷新。

## 三、refresh() 方案（已定：双入口收敛，待实施）

- **方案**：recordsVersion 与 refresh() 并存，内部收敛单一事实源——`innerVersion` ref；watch recordsVersion 变化 → `innerVersion.value++`（递增，禁止赋值：赋值与 refresh 的递增序列交错会值碰撞吞信号，如 recordsVersion=5/innerVersion=5 → refresh→6 → 父级 recordsVersion=6 → 值未变 watch 不触发）；refresh() = `innerVersion.value++`。消费点（spans / childrenIndex / relayout watch 源数组）从 `void props.recordsVersion` 机械替换为 innerVersion，仅 3 处。
- 同 tick 双通道触发合帧一次 relayout；挂载前调用安全（首帧 nextTick 全量 relayout 覆盖），无需 immediate。
- **文档口径**：双入口等价。默认 refresh()（就近直白）；数据修改拿不到 ref（深层组件/组合式）或需一个状态源广播失效给多组件时用 recordsVersion。
- 优势：消解 recordsVersion 认知成本（"何时 ++"退化为"二选一姿势"），recordsVersion 不删向下兼容，内部单一代价 +1 ref +1 watch +expose 一行。
