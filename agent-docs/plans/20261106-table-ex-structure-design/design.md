# table-ex 代码结构优化设计

> 目标：提升 agent 对 table-ex 的功能检索与影响面分析效率。基准数据见 [structure-map.md](./structure-map.md)。
> 原则：小步可验证、不重写可工作代码、每批独立可交付。本项目重构须走行为冻结探针基线（见知识库 table-ex-refactor-frozen-probe）。

## 1. 评估结论总览

| 维度 | 结论 | 关键证据 |
|---|---|---|
| 目录划分 | 大体合理（8 目录职责清晰），但 4 处目录语义与内容错位 | layout.js 含命中检测；editor.js 含共享几何；interactions.js 含非指针逻辑；命名成对文件分居两目录 |
| 文件拆分 | 粒度适中（中位数 ~230 行），但 4 个文件职责混杂 | use-cell-click 393 行 19 函数 6 类职责；paint-overlay 7 特性；interactions 6 类关注点；editor 三类职责 |
| 函数拆分 | 良好——决策/绘制/几何大量纯函数化、单向数据流；遗留 6 组逐字同源重复代码 | 描边三函数 15 行同链、背景带 14 行、isSame×3、锚定补偿×2、cell-tooltip 复刻绘制分支序 |
| 参数设计 | 最大短板。三种传参风格混用，超大打包对象与超长位置参数并存，`ctx` 三义 | drawCell 19 字段、computeEditorStyle 17、hitTest 12；drawCellClipped 12 参、drawHeaderText 12 参；paintState 31 字段隐式贯穿 |
| 对 agent 检索的影响 | import 图 ≠ 依赖图是根因级问题：3 处 re-export 层 + host 袋运行时解析 + paintState 隐式贯穿，使静态依赖分析失真 | 见 §2 P1/P2 |

## 2. 问题清单（按对 agent 效率的影响排序）

### P1 import 图 ≠ 依赖图 [致命]

**现象**：
1. 三处 re-export 聚合层：`cell-painters.js` 尾部 re-export 8 符号（来自 4 文件）、`editor.js` re-export `editor-resolve` 全部 9 符号、`interactions.js` re-export `schedulers` 2 符号。
2. composable 间依赖全部经 host 袋运行时解析：`use-cell-click` 读 20 个 ctx 键，其中约半数由其他 composable 回填（hitAt←usePointer、clearCellSelection←useCellSelect、applyTreeToggle←useTreeRows…），静态 import 关系完全不可见。
3. `paintState`（31 字段）被 6+ composable 共享引用，靠每次绘制前 `syncPaintState()` 手动同步。

**影响**：agent 用 import 关系推断影响面时系统性失真——查"改 resolveCellContent 影响谁"会漏掉经 cell-painters 转引的全部消费方；查"改 host.invalidate 影响谁"静态分析完全无法回答。必须通读文件体才能确认依赖。

### P2 `ctx` 三义 [警告]

**现象**：同名标识符三种语义——
1. canvas 2D context（42 个绘制函数首参）；
2. host 袋（10 个 composable 的参数名 `ctx`，~40 键）；
3. spans 构建共享对象（`applySpanMethod(ctx, index, occupied)`，10 字段）。
另 `layout` 同为 shallowRef 名、模块名、22 字段快照类型名。

**影响**：`ctx` 无检索区分度；阅读函数签名时 `ctx` 指什么须靠文件上下文推断；跨文件追踪一个调用（如 `ctx.invalidate` vs `ctx.fillRect`）需人工区分。

### P3 目录语义错位 [警告]

| 位置 | 问题 | 检索后果 |
|---|---|---|
| `geometry/layout.js` 的 `colAt/rowAt/findResizeColumn` | 命中检测，唯一消费方是 `interactions.hitTest` | 找"点击命中逻辑"会搜 interaction/ 而漏 |
| `editing/editor.js` 的 4 个几何函数 | `editButtonRectOf` 被 interaction/edit-button 与 paint-overlay 消费，是跨模块共享原语 | 找"编辑按钮矩形"定位到 editing 后，读到的却是 418 行状态机文件 |
| `interactions.js` 的 `resolveOrderByNext`/`isCheckHeaderColumn` | 排序三态与 check 判定，非指针逻辑 | 关键词"排序"命中 interaction 文件，语义噪音 |
| `composables/use-cell-click` | 393 行混事件派发+payload 重建+浮层 style+px 转换+DOM 聚焦+veil watch | 单文件命中过多关键词，检索信噪比低 |

### P4 参数设计不一致 [警告]

- 超大打包对象：drawCell 19、computeEditorStyle 17、hitTest 12、relayout 11、columnLineCount 11、drawButton 12、drawItems 11、ensureRowMeasured 10 字段——前两者横跨多个语义域无分组。
- 超长位置参数：drawCellClipped 12、drawHeaderText 12、paintBodyRow/Spans 10、textLineCountOf 9 参——位置参数无法从调用点看出实参含义，agent 读调用点必须回跳签名。
- 同层同类函数风格不一：`drawItems`(打包 11) vs `itemsStartX`(位置 7)；`spanRectOf`(位置 4) vs `buildSpans`(打包 8)。
- 高频字段反复组包：`theme/measure/padding`、`centerY/rightInset`、`onImageLoad/row/colIndex` 三元组在 cell-paint 各文件重复出现。
- `hitTest` JSDoc 只列 7 字段、实际签名 12 字段——agent 依赖文档时会拿到错数据。

### P5 同源重复代码 [警告]（影响面分析高危）

1. paint-overlay 描边三函数（paintHoverEditorStroke/paintHoverPlainStroke/paintCellSelection）各含逐字相同 15 行矩形链（注释自认"逐字同源"）。
2. paintBodyRow / paintBodyRowSpans 背景带段逐字重复 ~14 行。
3. isSameCell/isSameHover/isSameHoverItem 三份近同构。
4. 锚定补偿（offsetToRow→topAt→变更→computeAnchorShift→回写 scrollTop）在 applyTreeToggle 与 onThemeChange 两处同构。
5. `(props.recordsOffset || 0) + row + 1` 4 处。
6. cell-tooltip.js 复刻绘制分支序（注释自述"drawContentItems 同分支序""drawButton 逐 pill 累加等价式"）——绘制口径变更须双处同改，漏改即 tooltip 溢出判定与实际绘制不一致。

**影响**：agent 修改命中其一以为全部；review/检索时同源代码互相干扰。

### P6 状态生存期不可从位置推断 [小问题]

模块级缓存三类生存期混杂：进程级跨实例（paint-header `measureCached`、cell-text `textAnchorCache`、icon-image `imageCache`）、帧级单例（paint-body `spanKeepRows`）、实例级（paintState/itemHits/controller 闭包）。分析"缓存何时失效/是否跨实例污染"须逐个读实现。

### P7 已知潜在缺陷 [疑问]

- `fenwick.rebuild` 更换 tree 不复算 `power`（倍增下降步长按初始 n 定死），行数跨 2 幂边界后 `findRowAtOffset` 可能定位失准。需实验确认是否实际可触发。
- demo self-checks 直引 ex/ 内部模块（12 文件），任何移动/改名须同步——本次优化各批次均受此约束。

## 3. 优化设计

### O1 消除 re-export 间接层（批次 1，高收益纯机械）

- 删除 `cell-painters.js` 尾部 4 行 re-export；消费方（table-ex.vue、use-cell-click、use-cell-tooltip、paint-overlay、paint-body、demo self-checks）改直引 `cell-content` / `icon-image` / `item-painters` / `cell-tooltip` 源文件。
- `editor.js` 对 editor-resolve 的 re-export 随 O4 一并处理（几何函数拆出后，剩余 resolve 消费方仅 use-cell-click，直引 editor-resolve）。
- `interactions.js` 的 `createClickGuard/createFrameScheduler` re-export 删除；use-relayout、use-column-resize 直引 `interaction/schedulers.js`。
- 影响面：demo self-checks 12 文件 import 同步（知识库已有条目）。
- 收益：import 图 = 依赖图；符号检索一跳到定义；codegraph/fff 结果不再指向聚合壳。

### O2 ctx 消费面声明（批次 1，零行为风险）

- 10 个 composable 文件头统一格式注释块（机器可 grep）：

  ```js
  /**
   * @ctx-reads props, layout, spans, getPainter, …
   * @ctx-writes hover, cursor, …        // 经 Object.assign 并入的成员
   * @ctx-calls ctx.invalidate …          // 跨 composable 运行时调用（标注提供方）
   */
  ```

- `createRowGeometryController` 的 14 getter 注入、`buildSpans` 的 8 字段入参同格式补声明。
- 收益：agent 读文件头即得依赖面，不必通读函数体反推；依赖审计可脚本化（grep `@ctx-reads` 与函数体实际读取比对）。

### O3 命名消歧（批次 1）

- composable 参数 `ctx` → `host`（10 文件；与 table-ex.vue 内变量名对齐，canvas ctx 不动——canvas 生态惯例）。
- spans 构建共享对象 `ctx` → `spanCtx`（spans-method/spans-auto 的 3 参签名）。
- `interactions.resolveCursor(hit, columns, context)` 第三参 → `deps`（与 edit-button 的 `deps` 对齐）。
- 收益：`ctx` 只余 canvas 一种语义；grep host 即 composable 依赖面。

### O4 共享几何归位：拆 `editing/editor-geometry.js`（批次 2）

- `editorRectOf` / `editorGridlineFlagsOf` / `editButtonRectOf` / `computeEditorStyle` 4 个纯函数（零 vue/form 依赖）拆至 `editing/editor-geometry.js`。
- 消费方 paint-overlay、interaction/edit-button、use-cell-click 改引新文件。
- 收益：paint 层与 interaction 层不再经 import 拖入编辑状态机 + `form/index.js` 组件链（editor.js → editor-resolve → form 是模块内最重的依赖边）；editor.js 收敛为状态机单一职责；§6.3 反向依赖边 1、2 消除。

### O5 同源代码提取单一事实源（批次 2，须探针基线）

| 提取 | 位置 | 形态 |
|---|---|---|
| `cellFrameOf(state, row, col)` | paint-overlay | 15 行矩形链（regionAt→spanRectOf→editorGridlineFlagsOf→editorRectOf），三描边函数共用 |
| `paintRowBandBackground(...)` | paint-body | 背景带 14 行，paintBodyRow/Spans 共用 |
| `isSamePoint(a, b)` | shared（或就地集中） | isSameCell/isSameHover/isSameHoverItem 归一 |
| `withAnchorPreserved(fn)` | use-relayout 或 rowGeometry | 锚定捕获→变更→补偿→回写，applyTreeToggle/onThemeChange 共用 |
| `recordNumberOf(state/host, row)` | shared 或 host 方法 | recordsOffset 偏移计算 4 处归一 |

- 验证：重构前后探针基线逐字比对 + demo self-checks 像素断言（知识库流程）。
- 收益：改动影响面从"N 处同源"收敛为 1 处；重复代码不再污染检索结果。

### O6 interactions.js 语义拆分（批次 3，可选）

- 拆为 `interaction/hit-test.js`（hitTest + 与命中直接相关的谓词）与 `interaction/click-policy.js`（resolveHeaderClick/resolveCellClick/resolveOrderByNext/isCheckHeaderColumn/resolveItemClick/resolveCellClickOpen）；cursor/tooltip 门控谓词随 hit-test。
- 438 行 12 导出 → 2 文件各 ~200 行；5 个 composables 消费方 import 更新。
- 收益：关键词"排序/check/点击事件"不再命中指针命中检测文件。若扰动嫌大，降级方案：仅把 `resolveOrderByNext`/`isCheckHeaderColumn` 移至 click-policy 语义的独立小文件，其余不动。

### O7 参数收敛（长期渐进，不做一次性大改）

- 规则化（新代码/接触时执行）：
  1. 位置参数 >5 → 打包对象；
  2. 打包对象 >10 字段 → 按语义域分子对象；
  3. 高频三元组（`onImageLoad/row/colIndex`）提供组包帮助函数（如 `itemHooksOf(state, row, col)`）。
- 首个示范点：`drawCell` 19 字段 → `eval{col,record,recordNumber,emit}` / `paint{theme,measure,wrapCache,placeholder}` / `geo{rect,centerY,rightInset,regionHeight}` / `interact{hoverItem,onItemRect,onImageLoad,row,colIndex,flatInfo,expandedKeys,recordKey}` 四分组。
- `hitTest` JSDoc 补全 12 字段（批次 1 顺手）。
- 收益：调用点自解释；字段归属域可从签名读出，agent 不必逐字段溯源。

### O8 结构图数据维护约定

- `structure-map.md` 随重构批次更新（层级表/依赖图/链路）。
- 状态生存期语义在源文件头用一行标注（`// cache: process-scope | instance-scope | frame-scope`），配合 O2 的消费面声明构成 agent 可读的元数据面。

## 4. 实施批次

| 批次 | 内容 | 风险 | 验证 |
|---|---|---|---|
| 1 | O1 + O2 + O3 + hitTest JSDoc | 低（机械改动+注释） | build + demo self-checks 全量 + 探针基线比对 |
| 2 | O4 + O5 | 中（等价提取） | 探针基线逐字比对 + self-checks 像素断言 + demo 交互抽验 |
| 3（可选） | O6 + O7 渐进 | 中 | 同批次 2 |

每批独立提交；demo self-checks 12 文件 import 同步进同批。

## 5. 明确不做

- **layout.js 拆分/命中函数迁移**：colAt/rowAt/findResizeColumn 留在 geometry，仅在 structure-map §6.3 记录语义——import 链扰动大、检索收益已被文档化覆盖。
- **paint-utils.js 拆分**：杂物层但均为小纯函数，检索影响小。
- **canvas `ctx` 改名**：42 函数签名扰动，canvas 惯例优先。
- **cell-tooltip 与绘制口径同源化**（共享布局测量中间层）：理想解但改动大，登记为长期项；短期靠 P5-6 的注释互指（"改此分支须同步 cell-tooltip"）防线。
- **host 袋架构重造**（依赖注入框架化）：当前 O2 声明式方案已覆盖 agent 检索需求，重造违反范围克制。

## 6. 预期效果

| 场景（agent 任务） | 现状 | 优化后 |
|---|---|---|
| 定位符号定义点 | re-export 层二跳 | 一跳（O1） |
| 判断"改 X 影响谁" | 通读函数体 + 运行时 host 调用不可见 | import 图 + `@ctx-*` 声明静态可得（O1/O2） |
| grep `ctx` | 三义混杂 | 单义（O3） |
| "编辑按钮/命中/排序在哪" | 目录语义错位，多轮确认 | 目录语义对齐（O4/O6） |
| 改绘制口径/背景带/描边 | N 处同源代码，漏改风险 | 单一事实源（O5） |
| 读大参数调用点 | 回跳签名逐字段比对 | 分组自解释（O7） |
