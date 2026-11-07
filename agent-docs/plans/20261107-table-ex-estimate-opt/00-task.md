# table-ex 首绘性能优化：估高扫描短路 + 计数通道 + wrapCache LRU

## 目标

降低 table-ex 大数据量（10 万行级）首次绘制前 JS 成本，基于会话已确认的发现做完整设计与实现：

1. 全部单行列场景跳过 O(n×cols) 估高扫描（表级短路）
2. link/list 列估高/精算走计数通道，不建条目对象
3. wrapCache 超限由整体清空改逐条 LRU 淘汰

## 背景（会话已确认的发现，须读源码逐一复核）

- 首绘链：onMounted nextTick → relayoutAndRedraw → rowGeometry.resolveForRelayout（`src/components/table/ex/geometry/row-geometry-controller.js`）→ 首次必 scanDirty → `computeRowHeights` O(n×cols)（`geometry/row-geometry.js`）
- uniform 模式下 heights 无人消费；`hasArrayValues` 唯一生产者 `indicatesVariableMode = isLinkColumn(col) && count > 1`
- link/list 列估高走 `col._render` 完整执行（`linkItemCountOf`）产物仅取 `items.length`；进窗精算再一次、绘制再一次（共三次）
- wrapCache：`shared/text-wrap.js createWrapCache`，`size >= 2000` 整体 `clear()`
- `remeasureVisibleRows` uniform 早退、绘制 O(视口) 已虚拟化——不在本次范围
- totalHeight 采样修正（滚动条跳动）不纳入本次（另案提案）

## 单行列分类（用户指定设计要求）

- 确定单行列：列定义注定单行（`GRAPHIC_ITEM_TYPES` 图形列；无 multiline / maxLines>1 / `_resolveMaxLines` 的文本类列）
- 数据单行列：列定义允许多行（变高候选列），但实际数据全单行
- 两类性能收益若有差异须区分设计；全部单行列有明显优势时做表级针对性短路

## 基线

- git：dev @ 57c8fc0；`git status --short`：`M todo/misc.md`（与本任务无关）

## 约束

- 项目根 `D:\workshop\cheap-pets\mussel\AGENTS.md` 全部适用（不提交、未确认不更新文档、stylelint --fix、demo 验证流程）
- table-ex 任务先读 `agent-docs/knowledge/INDEX-table.md` 与其指向的 `table-ex-structure-map.md`
- 行为冻结：优化不得改变可观测行为（行高、绘制、命中、事件）；自检（self-checks）是安全网，断言漂移须同批修
- spans（spanMethod/autoRowSpan）开启时估高分层数据链（spanHeightRoleOf）语义不得破坏

## 验收标准

1. 全确定单行列表（无 link/list 列、无变高候选列、无 spans）：首次 relayout `scanCount = 0`（不执行 `computeRowHeights`），行高/绘制/滚动行为与优化前一致
2. 含 link/list 列：估高与精算阶段不执行完整条目构建（计数通道）；绘制、点击、hover 与命中区行为不变
3. 数据单行列（变高候选列 + 全单行数据）：行高、进窗精算、滚动锚定行为不变
4. wrapCache LRU：折行/截断结果与整体清空策略逐字节一致；重复折行命中缓存
5. demo table-ex 页自检（self-checks）全过；playwright DOM/可访问性断言通过
6. 10 万行级 demo 场景可交互、无卡死；按场景断言 scanCount

## 验证命令 / 环境

- dev 服务已运行：rollup watch + `http://localhost:3000/<name>/`（先直接访问，不重新打包）
- demo 目录 `demo/src/table-ex/`（自检入口在页面内）
- 验证优先 playwright MCP DOM/可访问性快照断言，非必要不截图
- lint：`npx stylelint "src/**/*.{scss,css,vue}" --fix` 范围内文件

## 预设与开关

用户自定义流水线（standard 变体）：

```
D1 designer(primary) → X design-amender(peer) → R designer(primary) 终订
→ ( I1 implementer(fast) → I2 verifier(fast) ) × n，n ≤ 2
```

- 评审方式：交叉（单轮 X→R，R 后不再派 X 复审——用户裁剪，设计以 R 终订版为准）
- N=1；修复轮 R=1（第二轮实施-检验即修复轮）
- 实施粒度：整体

## 槽位映射

- designer → `pipeline-primary`
- design-amender → `pipeline-peer`
- implementer → `pipeline-fast`（用户指定，覆盖默认 Primary）
- verifier → `pipeline-fast`（默认；与 implementer 独立实例）

## 预算

- 设计修订 k/N：0/1
- 修复轮 整体 k/R：0/1
- 派发 d/上限：0/8（预估 5：D1+X+R+I1+I2）
