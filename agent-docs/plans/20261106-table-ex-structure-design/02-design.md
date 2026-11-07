# table-ex 代码结构优化设计

> 目标：提升 agent 对 table-ex 的功能检索与影响面分析效率。基准数据见 [structure-map.md](./structure-map.md)。
> 原则：小步可验证、不重写可工作代码、每批独立可交付。本项目重构须走行为冻结探针基线（见知识库 table-ex-refactor-frozen-probe）。

## 1. 评估结论总览

| 维度 | 结论 | 关键证据 |
|---|---|---|
| 目录划分 | 大体合理（8 目录职责清晰），但 4 处目录语义与内容错位 | layout.js 含命中检测；editor.js 含共享几何；interactions.js 含非指针逻辑；命名成对文件分居两目录 |
| 文件拆分 | 粒度适中（中位数 ~230 行），但 4 个文件职责混杂 | use-cell-click 393 行 18 函数 6 类职责；paint-overlay 7 特性；interactions 6 类关注点；editor 三类职责 |
| 函数拆分 | 良好——决策/绘制/几何大量纯函数化、单向数据流；遗留 6 组逐字同源重复代码 | 描边三函数各 14 行同链、背景带 16 行×2、isSamePoint 2 处逐字相同 + isSameHoverItem 扩展、锚定补偿×2、cell-tooltip 复刻绘制分支序 |
| 参数设计 | 最大短板。三种传参风格混用，超大打包对象与超长位置参数并存，`ctx` 三义 | drawCell 19 字段、computeEditorStyle 17、hitTest 12；drawCellClipped 12 参、drawHeaderText 11 参；paintState 31 字段（30 组装 + painter 注入 onImageLoad）隐式贯穿 |
| 对 agent 检索的影响 | import 图 ≠ 依赖图是根因级问题：3 处 re-export 层 + host 袋运行时解析 + paintState 隐式贯穿，使静态依赖分析失真 | 见 §2 P1/P2 |

## 2. 问题清单（按对 agent 效率的影响排序）

### P1 import 图 ≠ 依赖图 [致命]

**现象**：
1. 三处 re-export 聚合层：`cell-painters.js` 尾部 re-export 8 符号（来自 4 文件）、`editor.js` re-export `editor-resolve` 全部 9 符号、`interactions.js` re-export `schedulers` 2 符号。
2. composable 间依赖全部经 host 袋运行时解析：`use-cell-click` 读 23 个 ctx 键，其中约半数由其他 composable 回填（hitAt←usePointer、clearCellSelection←useCellSelect、applyTreeToggle←useTreeRows…），静态 import 关系完全不可见。
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
- 超长位置参数：drawCellClipped 12、drawHeaderText 11、paintBodyRow/Spans 10、textLineCountOf 9 参——位置参数无法从调用点看出实参含义，agent 读调用点必须回跳签名。
- 同层同类函数风格不一：`drawItems`(打包 11) vs `itemsStartX`(位置 7)；`spanRectOf`(位置 4) vs `buildSpans`(打包 8)。
- 高频字段反复组包：`theme/measure/padding`、`centerY/rightInset`、`onImageLoad/row/colIndex` 三元组在 cell-paint 各文件重复出现。
- `hitTest` JSDoc 只列 7 字段、实际签名 12 字段——agent 依赖文档时会拿到错数据。

### P5 同源重复代码 [警告]（影响面分析高危）

1. paint-overlay 描边三函数（paintHoverEditorStroke/paintHoverPlainStroke/paintCellSelection）各含结构相同的 14 行矩形链（113–126 / 155–168 / 201–214 行，regionAt→spanRectOf→editorGridlineFlagsOf→editorRectOf；三处仅坐标变量名 `hover.*` / `selected.*` 不同，注释自认"逐字同源"；hover 两处上游 112 / 154 为解构行、选中处上游 194 已有同句）；20261106 未提交改动后，三函数尾部裁剪段（clipX0 判式 + withClip + strokeRect，134–142 / 173–181 / 223–231，各 9 行）亦结构相同（同上坐标变量名差异；strokeStyle/lineWidth 与注释行不参与提取）——hover 两描边与选中描边同裁固定列区，三处仅 strokeStyle 与前置守卫不同（见 O5 知识库约束）。
2. paintBodyRow / paintBodyRowSpans 背景带段逐字重复 16 行（80–95 / 130–145 行）。
3. isSameCell/isSameHover 逐字相同（2 字段比较）；isSameHoverItem 额外比 kind/index/disabled（5 字段），不可并入 2 字段谓词。
4. 锚定补偿（offsetToRow→topAt→变更→新旧 topAt 差→回写 scrollTop；与 row-geometry.computeAnchorShift 同式，但两处均为内联求差）在 applyTreeToggle 与 onThemeChange 两处同构。
5. recordNumber 同式 `(recordsOffset || 0) + row + 1` 共 10 处 / 6 文件（见 O5）。
6. cell-tooltip.js 复刻绘制分支序（注释自述"drawContentItems 同分支序""drawButton 逐 pill 累加等价式"）——绘制口径变更须双处同改，漏改即 tooltip 溢出判定与实际绘制不一致。

**影响**：agent 修改命中其一以为全部；review/检索时同源代码互相干扰。

### P6 状态生存期不可从位置推断 [小问题]

模块级缓存三类生存期混杂：进程级跨实例（paint-header `measureCached`、cell-text `textAnchorCache`、icon-image `imageCache`）、帧级单例（paint-body `spanKeepRows`）、实例级（paintState/itemHits/controller 闭包）。分析"缓存何时失效/是否跨实例污染"须逐个读实现。

### P7 已知潜在缺陷 [疑问]

- `fenwick.rebuild` 更换 tree 不复算 `power`（倍增下降步长按初始 n 定死），行数跨 2 幂边界后 `findRowAtOffset` 可能定位失准。需实验确认是否实际可触发。
- demo self-checks 目录 12 文件，其中 11 个直引 ex/ 内部模块（index.js 仅聚合），任何移动/改名须同步——本次优化各批次均受此约束（受影响 5 / 不动 6，见 §4.5）。

## 3. 优化设计

### O1–O8 结论（本轮审改）

| 项 | 结论 | 本轮处理 |
|---|---|---|
| O1 | 修改 | 三处 re-export 分层列实际消费方（含 demo self-checks 文件级清单）；editor 部分改归批次 2A；剔除误列的 paint-body |
| O2 | 修改 | 元数据标签 `@ctx-*` → `@host-*`（与 O3 改名一致，避免重新引入 ctx 歧义） |
| O3 | 补充 | 补 10 composable / 3 spans / 1 interactions 的文件级清单；resolveCursor 仅改内部形参名 |
| O4 | 修改 | 补 3 个 demo self-checks 消费方与 table-ex.vue（isCellEditable→editor-resolve）；补 editor.js 保留面 |
| O5 | 修改 | recordNumber 实际 10 处 / 6 文件（非 4 处），助手签名改 `(recordsOffset, row)`；isSamePoint 仅覆盖 2 函数；锚定补偿策略参数化。本轮（input-code-delta-1）：描边链行号漂移且裁剪段转为三处同源、锚定补偿行号微调、recordNumber 站点 292→392 修正；按槽位容量拆批次 2A/2B（§4.2 / §4.2B），描边链提取显式引用知识库两条约束为等价性校验点 |
| O6 | 修改 | 拆分清单补 resolveTreeToggle / resolveResizeWidth / RESIZE_MIN_WIDTH / resolvePointerdown；明确删除 interactions.js |
| O7 | 修改 | drawCell 分组剔除派生值 centerY（geo 3 字段）；明确 2 个调用点与批次归属 |
| O8 | 保留 | 不变，仅补新增文件同步要求 |

无删除项、无新增重构项；全部改动限于既有 O1–O8，不扩大到 §5「明确不做」之外。

### O1 消除 re-export 间接层（① ② 批次 1；③ 随 O4 进批次 2A）

三处 re-export 层按符号直引源文件，删除聚合语句：

**① `cell-painters.js` 尾部 4 行 re-export（299–302，8 符号）— 批次 1**

| 消费方 | 现引符号 | 改后源 |
|---|---|---|
| `table-ex.vue:81` | prepareColumn | `./cell-paint/cell-content` |
| `composables/use-cell-click.js:11` | resolveCellContent | `../cell-paint/cell-content` |
| `composables/use-cell-tooltip.js:18` | resolveCellTooltip | `../cell-paint/cell-tooltip` |
| `table-paint/paint-overlay.js:2` | drawIconGlyph（同语句 drawTreeArrow 为 cell-painters.js:256 自身定义而非 re-export，保留原引） | `../cell-paint/icon-image` |
| `demo/.../self-checks/cell-painters.js:42–51` | prepareColumn / resolveCellContent / resolveCellTooltip / getImageEntry / requestIconImage / drawIconGlyph / linkHoverColorOf | cell-content / cell-tooltip / icon-image / item-painters |
| `demo/.../self-checks/painter.js:27` | prepareColumn / requestIconImage | 同上 |
| `demo/.../self-checks/spans.js:21` | prepareColumn | `cell-content` |

`paint-body.js:2` 引用的 `drawCell` 为 cell-painters 自身定义，不属 re-export，**不改**。

**② `interactions.js:438` re-export（2 符号）— 批次 1**

| 消费方 | 改后源 |
|---|---|
| `composables/use-column-resize.js:13`（createClickGuard） | `../interaction/schedulers` |
| `composables/use-relayout.js:9`（createFrameScheduler） | `../interaction/schedulers` |
| `demo/.../self-checks/interactions.js:20–36`（两符号） | `schedulers.js` |

**③ `editor.js:21–31` 对 `editor-resolve` 的 9 符号 re-export — 批次 2A（随 O4）**

剩余消费方共 3 文件（非仅 use-cell-click）：

| 消费方 | 改后源 |
|---|---|
| `table-ex.vue:82`（isCellEditable） | `./editing/editor-resolve` |
| `composables/use-cell-click.js:10`（resolveEditorType） | `../editing/editor-resolve`（computeEditorStyle 改引 editor-geometry，见 O4） |
| `demo/.../self-checks/editor.js:34–50`（9 符号） | `editor-resolve.js` |

影响面：demo self-checks 受影响文件共 5 个（批次 1：cell-painters / painter / spans / interactions；批次 2A：+ editor）；其余 6 个直引文件（layout / row-geometry-controller / row-geometry / text-wrap / theme / tree）与 index.js 不动。收益：import 图 = 依赖图；符号检索一跳到定义；codegraph/fff 结果不再指向聚合壳。

### O2 host 消费面声明（批次 1，零行为风险）

- 10 个 composable 文件头统一注释块（机器可 grep），标签统一 `@host-*`——O3 后 `ctx` 只指 canvas，元数据不得再用 ctx 前缀：

  ```js
  /**
   * @host-reads props, layout, spans, getPainter, …
   * @host-writes hover, cursor, …        // Object.assign 回填的成员
   * @host-calls invalidate（提供方 use-paint-state）, clearCellSelection（提供方 use-cell-select）, …
   */
  ```

- `geometry/row-geometry-controller.js` 文件头以 `@getters` 单行列出 14 个注入 getter（getRows / getColumns / getTreeIndents / getRecordsOffset / getRecordsVersion / getTheme / getMeasure / getWrapCache / getColumnKey / getSpans / getScrollEl / getLayout / setLayout / relayout），table-ex.vue:337–355 调用点注释指向该声明。
- `buildSpans` 的 8 字段入参沿用 `spans/spans.js:55–63` 现有 `@param` 声明，核对字段顺序与解构一致（已覆盖，无需新增格式）。
- 收益：agent 读文件头即得依赖面，不必通读函数体反推；依赖审计可脚本化（grep `@host-reads` 与函数体实际读取比对）。
- 落笔顺序：批次 1 内部先 O1（import 改引）→ O3（改名）→ O2（按改名后状态写声明），避免声明与实际标识符不一致。

### O3 命名消歧（批次 1）

- composable 参数 `ctx` → `host`：10 文件（use-cell-click / use-cell-select / use-cell-tooltip / use-column-resize / use-paint-state / use-pointer / use-relayout / use-table-api / use-table-instances / use-tree-rows），含 `ctx.` 引用与 JSDoc `@param {Object} ctx host 袋`；与 table-ex.vue:226 `const host = {` 对齐，canvas ctx 不动。
- spans 构建共享对象 `ctx` → `spanCtx`：`spans/spans.js:90`（buildSpans 内构造）及 `spans-method.js:242`、`spans-auto.js:119` 形参/解构；`spans-auto.js:32` 内部 `collectAutoRowSpanColumns(ctx)` 及其调用（:55、:121）同改（3 文件；改后 `grep -n "\bctx\b" src/components/table/ex/spans/` 零命中）。
- `interactions.js:137` `resolveCursor(hit, columns, context)` 第三参 → `deps`（含内部 isEditableCell 同名形参）；调用点 use-pointer 按位置传参不变，与 `edit-button.js:16` 的 `deps` 对齐。
- 收益：`ctx` 只余 canvas 一种语义；grep host 即 composable 依赖面。

### O4 共享几何归位：拆 `editing/editor-geometry.js`（批次 2A）

- 从 editor.js 拆出 4 个纯函数：`editorRectOf`（61）、`editorGridlineFlagsOf`（78）、`editButtonRectOf`（94）、`computeEditorStyle`（114）→ 新文件 `editing/editor-geometry.js`。依赖仅 `../shared/constants`（CELL_PADDING_FALLBACK / ROW_TOP_INSET / ROW_HEIGHT_FALLBACK / EDIT_BUTTON_AREA）与函数间互调，无 vue / form / mappings 依赖。
- 消费方 7 文件（6 改引新文件 + 1 归 editor-resolve 直引，见 O1③）：
  - `table-paint/paint-overlay.js:3`（editorRectOf / editorGridlineFlagsOf / editButtonRectOf）
  - `interaction/edit-button.js:7`（editButtonRectOf）
  - `composables/use-cell-click.js:10`（computeEditorStyle；同语句 resolveEditorType 改引 editor-resolve）
  - `demo/.../self-checks/editor.js:34–50`（editorRectOf / editButtonRectOf / computeEditorStyle）
  - `demo/.../self-checks/painter.js:25`（editButtonRectOf）
  - `demo/.../self-checks/spans.js:29`（editorGridlineFlagsOf）
  - `table-ex.vue:82`（isCellEditable → editor-resolve）
- editor.js 保留：状态机 `createEditorController`、DROPDOWN_PANEL_SELECTOR、isInDropdownPanel、resolveBlurFallback；`../shared/constants` import 随 4 函数移出后整体删除（4 常量仅被这 4 个函数使用，editor.js:6–9）；editor-resolve 的 import 仅保留自用 6 符号（EDITOR_COMPONENTS / isCellEditable / normalizeCommitValue / normalizeEditorOpenValue / resolveEditorProps / resolveEditorType），NON_EDITABLE_TYPES / usesDerivedOptions / resolveSelectOptions 随 re-export 删除。
- 收益：paint / interaction 层 import 不再触达 editor.js → editor-resolve → `form/index.js` 组件链（editor-resolve.js:5）；editor.js 收敛为状态机单一职责；structure-map §6.3 反向依赖边 1、2 消除。

### O5 同源代码提取单一事实源（拆批次 2A / 2B，须探针基线）

| 提取 | 落点 | 形态与边界 | 批次 |
|---|---|---|---|
| `cellFrameOf(state, row, col)` | paint-overlay.js 局部 | regionAt→spanRectOf→editorGridlineFlagsOf→editorRectOf 矩形链（113–126 / 155–168 / 201–214 三处，各 14 行；hover 两处上游 112 / 154 为 `const { layout, spans } = state`，选中处上游 194 已有同句，helper 内统一；行号按当前工作区核实）；只返回 rect，strokeStyle 与前置守卫留调用方。**等价性校验点（知识库，提取时逐字保持）**：① `table-ex-hover-span-region`——链内 `regionAt(spans, row, col)` 与 `spanRectOf(layout, row, col, spans)` 的实参与求值顺序不得改动（hover 带与脏区同批按合并区域联动的绘制侧口径）；② `table-ex-overlay-clip-body-area`——尾部 `clipX0 = col < fixedCount ? 0 : fixedWidth` 与 withClip 矩形 `[clipX0, headHeight, stickyWidth - clipX0, stickyHeight - headHeight]` 三处逐字保持（20261106 后 hover 描边与选中描边同裁固定列区），且不得把描边的固定列裁剪套用到 hover 带（hover 带刻意横穿固定列，两种口径并存）。裁剪段（clipX0+withClip+strokeRect）三处同源，可一并提取 `strokeCellFrame(...)` 或留调用方，实施时以探针基线逐字比对收口 | **2B** |
| `paintRowBandBackground(ctx, state, r, x0, bandEnd, rowHeight)` | paint-body.js 局部 | 提取体 82–95 / 132–145 两段逐字相同（含选中行 cap + 延伸区补底）；`bandEnd = x0 + bandWidth` 求值留调用处（:80 / :130），作实参传入 | 2A |
| `isSamePoint(a, b)` | 新文件 `shared/cell-identity.js` | 仅归一 isSameCell（use-cell-tooltip.js:37）与 isSameHover（use-pointer.js:70）两个逐字相同实现（已核实未漂移）；isSameHoverItem（use-pointer.js:158–168）比 kind/index/disabled 5 字段，保留独立实现，不得替换（否则 hoverItem 脏区行为改变） | 2A |
| `withAnchorPreserved(...)` | `geometry/row-geometry.js` 导出 | 捕获 offsetToRow/topAt → fn → 新几何 topAt 补偿回写；签名须接受 `resolveAnchorRow` 吸收两处差异：applyTreeToggle（use-tree-rows.js:145–182，捕获 150–155 / 补偿 169–177）按 record 反查行号、onThemeChange（use-table-instances.js:29–56，捕获 35–39 / 补偿 47–51）用稳定行号。不落 use-relayout：composable 互相 import 会新增横向依赖边，与 P1/O1 目标相悖 | **2B** |
| `recordNumberOf(recordsOffset, row)` | 新文件 `shared/cell-identity.js` | `(recordsOffset || 0) + row + 1`；实际 10 处 / 6 文件（git grep 核实）：use-cell-click.js:95,200、use-cell-tooltip.js:108、paint-body.js:101,151,207、row-geometry-controller.js:392,419（392 为 `ctx.getRecordsOffset() || 0` 归一行、419 为使用点，两行形态，助手只替换 419 表达式）、cell-selection.js:43、spans-method.js:120。签名取数值偏移（调用侧有 props / state / 参数三形态，纯函数模块无 host） | 2A |

- 新文件 `shared/cell-identity.js` 零内部依赖（L4）。
- 验证：重构前后探针基线逐字比对 + demo self-checks 像素断言（知识库 table-ex-refactor-frozen-probe 流程）。
- 收益：改动影响面从"N 处同源"收敛为 1 处；重复代码不再污染检索结果。

### O6 interactions.js 语义拆分（批次 3，可选）

- 拆为两文件并删除 `interaction/interactions.js`（不保留聚合壳，否则与 O1 目标冲突）：
  - `interaction/hit-test.js`：hitTest、resolveCursor、resolveTooltipTarget、resolvePointerdown、resolveResizeWidth、RESIZE_MIN_WIDTH（+ 内部谓词 isTreeArrowSlot / isSortableHeader / isEditableCell / contentRightEdgeX）；
  - `interaction/click-policy.js`：resolveHeaderClick、resolveCellClick、resolveOrderByNext、isCheckHeaderColumn、resolveItemClick、resolveCellClickOpen、resolveTreeToggle。
- 覆盖 12 个函数导出 + 1 常量（schedulers 的 2 符号已在批次 1 移交）；438 行 → 各 ~200 行。
- 消费方 5 composable + 1 demo：use-cell-click → click-policy；use-cell-tooltip → hit-test；use-pointer → hit-test（hitTest / resolveCursor / resolvePointerdown）+ click-policy（resolveItemClick）；use-column-resize → hit-test（resolveResizeWidth / RESIZE_MIN_WIDTH；createClickGuard 批次 1 已改 schedulers）；use-relayout 批次 1 已不依赖本模块；`demo/.../self-checks/interactions.js` → 两文件 + schedulers。
- 收益：关键词"排序/check/点击事件"不再命中指针命中检测文件。若扰动嫌大，降级方案：仅把 `resolveOrderByNext` / `isCheckHeaderColumn` 移至独立小文件，其余不动（interactions.js 保留）。

### O7 参数收敛（规则长期，示范点批次 3）

- 规则化（新代码/接触时执行）：
  1. 位置参数 >5 → 打包对象；
  2. 打包对象 >10 字段 → 按语义域分子对象；
  3. 高频三元组（`onImageLoad/row/colIndex`）提供组包帮助函数（如 `itemHooksOf(state, row, col)`）。
- 首批落地两处：
  - `hitTest` JSDoc（批次 1，interactions.js:29–55）：补 headHeight / scrollTop / scrollLeft / colWidths / fixedLeftColumns 5 个缺失 `@param`（现列 7 / 实参 12）；返回对象 8 字段已与实现一致。
  - `drawCell` 19 字段四分组（批次 3 示范）：`eval{col,record,recordNumber,emit}` / `paint{theme,measure,wrapCache,placeholder}` / `geo{rect,rightInset,regionHeight}` / `interact{hoverItem,onItemRect,onImageLoad,row,colIndex,flatInfo,expandedKeys,recordKey}`（4+4+3+8=19；centerY 为函数内派生值，非入参）。调用点 2 处同批改：`paint-body.js:317`（drawCellClipped 内）与 `demo/.../self-checks/cell-painters.js:134`。
- 收益：调用点自解释；字段归属域可从签名读出，agent 不必逐字段溯源。

### O8 结构图数据维护约定

- `structure-map.md` 随重构批次更新（层级表/依赖图/链路），新增文件 `editing/editor-geometry.js`、`shared/cell-identity.js`、`interaction/hit-test.js`、`interaction/click-policy.js` 同步进 §1 分层表与 §2 依赖图。
- 状态生存期语义在源文件头用一行标注（`// cache: process-scope | instance-scope | frame-scope`），配合 O2 的消费面声明构成 agent 可读的元数据面。

## 4. 实施批次

### 4.0 未提交改动的行级避让（实施前按表执行）

基线快照后 use-pointer / paint-overlay / demo painter 改动又扩大，另 paint-gridlines.js 出现新改动；hunk 行区按当前工作区 `git diff -U0` 核实：

| 文件（未提交 hunk 行区） | 本流水线触及点 | 冲突判定 | 避让策略 |
|---|---|---|---|
| `composables/use-pointer.js`（7、90–122、138、154） | 批次 1 O3 全文件 `ctx`→`host` + `@host-*`；批次 2A 改 70–74（isSameHover） | **可安全实施**——未提交新增代码体（colBandRegionsOf 95–116、hoverRegions 122–140、:138 调用）内部零 `ctx` 引用；唯一重叠为 :154（前一任务新增 `ctx.spans.value` 实参），该行仅替换标识符 `ctx.`→`host.`，逻辑一字不动 | 批次 1 按整文件机械改名执行，不阻塞、无需用户裁决。改名用逐 token 替换（禁止整段重排或格式化）；:154 改名后与前一任务语义 diff 同处一行，属标识符差异，可接受。探针基线取当前工作区 |
| `table-paint/paint-overlay.js`（57–98、130–231） | 批次 1 仅 import 行 2；批次 2A 仅 import 行 3；批次 2B 描边提取 105–232 | 批次 1 / 2A 无冲突（触及行均不在未提交 hunk 内）；批次 2B 完全落在未提交区 | 批次 1 / 2A 只动 import 行，**57–231 行区禁触**；批次 2B 以叠加后（或已提交）代码为源实施 |
| `table-paint/paint-gridlines.js`（65–79） | 批次 1 / 2A / 2B / 3 均不触及 | 无冲突 | 全批次禁触（不得顺手改） |
| `demo/.../self-checks/painter.js`（30、89–101、1416–1676） | 批次 1 仅 import 行 27；批次 2A 仅 import 行 25 | 无冲突（import 行不在未提交 hunk 内） | 只动 import 行，**断言区 89–101 / 1416–1676 禁触** |

commit 纯净度提示：上表任一文件保留未提交改动时，触及该文件的批次 commit 会一并包含前一任务 diff（实施不受影响）。若需前一任务与各批次 commit 各自纯净，可先提交前一任务，再开始批次 1——此为清理偏好，非前置条件。

待用户决定的追加点（均不阻塞批次 1 / 2A）：
1. 批次 2B 是否追加：见 §4.2B，批次 2A 验证通过后由用户决定。
2. 批次 3 是否执行：O6 + O7 示范为可选项，由用户决定。

批次严格串行（文件集合相交，禁止并发或交错提交）；每批独立 commit、独立验证。

### 4.1 批次 1：O1①② + O3 + O2 + O7-JSDoc

行为判据：`npm run build` 通过；self-checks 全绿（受影响 4 个 demo 文件 import 已改）；探针基线与重构前逐字一致；table-ex.vue 的 props / emits / defineExpose 零改动。

改动清单（文件级，18 个源文件 + 4 个 demo 文件；全部本批执行，无顺延）：

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/components/table/ex/cell-paint/cell-painters.js` | 删 299–302 re-export |
| 2 | `src/components/table/ex/interaction/interactions.js` | 删 438 re-export；hitTest JSDoc 补 5 参；resolveCursor `context`→`deps` |
| 3 | `src/components/table/ex/table-ex.vue` | prepareColumn 改引 cell-content |
| 4 | `src/components/table/ex/composables/use-cell-click.js` | resolveCellContent 改引；ctx→host；@host-* 声明 |
| 5 | `src/components/table/ex/composables/use-cell-tooltip.js` | resolveCellTooltip 改引；ctx→host；@host-* |
| 6 | `src/components/table/ex/table-paint/paint-overlay.js` | drawIconGlyph 改引 icon-image（仅 import 行 2；未提交区 57–231 禁触，见 §4.0） |
| 7 | `src/components/table/ex/composables/use-column-resize.js` | createClickGuard 改引 schedulers；ctx→host；@host-* |
| 8 | `src/components/table/ex/composables/use-relayout.js` | createFrameScheduler 改引 schedulers；ctx→host；@host-* |
| 9 | `src/components/table/ex/composables/use-cell-select.js` | ctx→host；@host-* |
| 10 | `src/components/table/ex/composables/use-paint-state.js` | ctx→host；@host-* |
| 11 | `src/components/table/ex/composables/use-pointer.js` | ctx→host；@host-*（整文件机械改名；未提交新增代码体零 ctx 引用，仅 :154 单行重叠、只替换标识符，见 §4.0） |
| 12 | `src/components/table/ex/composables/use-table-api.js` | ctx→host；@host-* |
| 13 | `src/components/table/ex/composables/use-table-instances.js` | ctx→host；@host-* |
| 14 | `src/components/table/ex/composables/use-tree-rows.js` | ctx→host；@host-* |
| 15 | `src/components/table/ex/spans/spans.js` | ctx→spanCtx；buildSpans JSDoc 核对 |
| 16 | `src/components/table/ex/spans/spans-method.js` | ctx→spanCtx |
| 17 | `src/components/table/ex/spans/spans-auto.js` | ctx→spanCtx |
| 18 | `src/components/table/ex/geometry/row-geometry-controller.js` | @getters 14 项声明（O2） |
| 19 | `demo/src/data/table-ex/self-checks/cell-painters.js` | 7 符号改引源文件（drawCell 保留 cell-painters 原引） |
| 20 | `demo/src/data/table-ex/self-checks/painter.js` | prepareColumn / requestIconImage 改引（仅 import 行 27；断言区 89–101 / 1416–1676 禁触，见 §4.0） |
| 21 | `demo/src/data/table-ex/self-checks/spans.js` | prepareColumn 改引 |
| 22 | `demo/src/data/table-ex/self-checks/interactions.js` | createClickGuard / createFrameScheduler 改引 schedulers |

回滚：单 commit revert；双向门（内部路径与内部签名，无外部 API、无持久化、无构建产物）。

### 4.2 批次 2A：O4 + O5 低风险提取（轮 2 槽位）

> **槽位现实收敛**：预算 (fast 实施 → fast 验证)×2 共两轮实施容量，第 2 轮还须预留吸收第 1 轮修复的余量。原批次 2（O4+O5 全量，19 文件、5 项提取，其中描边提取完全落在未提交改动区且受知识库双约束校验）超出 fast 单会话现实负荷，拆为 2A（本轮）+ 2B（§4.2B，用户追加步骤）。裁剪依据：2A 的 4 项提取均为"逐字重复 → 单一事实源"的机械归一（isSamePoint / recordNumberOf / 背景带）或纯函数搬移（editor-geometry 拆分），无签名设计新决策、无未提交区重叠；2B 两项分别需知识库双约束逐字校验（cellFrameOf）与参数化签名设计（withAnchorPreserved），探针不一致时定位成本高，独立成批隔离风险。**轮 2 容量裁定（终审）**：轮 2 = 2A 全部，2B 不并入、2A 不再裁剪——2B 完全落在未提交区且需知识库双约束逐字校验，与 2A 机械归一不同风险级；再裁 2A 任何一项都需第 3 轮实施，超出 00-task 预算。轮 1 验证失败时按 00-task 预算第 2 轮改为修复，2A 顺延用户追加步骤。

行为判据：build 通过；self-checks 全绿；探针基线逐字一致；`editor.js` 不再被 paint / interaction 层 import（`grep -rn "editing/editor.js" src/components/table/ex/table-paint src/components/table/ex/interaction` 为空——模式须含 `editor.js` 字面，否则误命中 `editor-geometry.js`）；对外 API 零改动；use-pointer.js 的 O3 已在批次 1 完成，本批仅改 isSameHover 实现。

改动清单（2 新建 + 11 修改 + 3 demo，共 16 文件；#6 仅保留 import 改引）：

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/components/table/ex/editing/editor-geometry.js` | 新建：4 个几何纯函数 |
| 2 | `src/components/table/ex/shared/cell-identity.js` | 新建：isSamePoint / recordNumberOf |
| 3 | `src/components/table/ex/editing/editor.js` | 删 4 函数 + 9 符号 re-export；import 收敛 6 符号 |
| 4 | `src/components/table/ex/table-ex.vue` | isCellEditable 改引 editor-resolve |
| 5 | `src/components/table/ex/composables/use-cell-click.js` | computeEditorStyle → editor-geometry；resolveEditorType → editor-resolve；recordNumber 2 处 |
| 6 | `src/components/table/ex/table-paint/paint-overlay.js` | editor 几何改引 editor-geometry（仅 import 行 3；未提交区 57–231 禁触，描边提取属 2B） |
| 7 | `src/components/table/ex/interaction/edit-button.js` | editButtonRectOf 改引 editor-geometry |
| 8 | `src/components/table/ex/table-paint/paint-body.js` | paintRowBandBackground 提取；recordNumber 3 处 |
| 9 | `src/components/table/ex/composables/use-pointer.js` | isSameHover（70–74，未提交区外）→ isSamePoint（O3 / @host-* 已在批次 1 完成） |
| 10 | `src/components/table/ex/composables/use-cell-tooltip.js` | isSameCell → isSamePoint；recordNumber 1 处 |
| 11 | `src/components/table/ex/geometry/row-geometry-controller.js` | recordNumber 2 处（:392 归一行保留，:419 使用点改助手） |
| 12 | `src/components/table/ex/interaction/cell-selection.js` | recordNumber 1 处 |
| 13 | `src/components/table/ex/spans/spans-method.js` | recordNumber 1 处 |
| 14 | `demo/src/data/table-ex/self-checks/editor.js` | import 三分拆（editor / editor-geometry / editor-resolve） |
| 15 | `demo/src/data/table-ex/self-checks/painter.js` | editButtonRectOf 改引（仅 import 行 25；断言区禁触） |
| 16 | `demo/src/data/table-ex/self-checks/spans.js` | editorGridlineFlagsOf 改引 |

回滚：单 commit revert；双向门。O5 等价提取若探针基线不一致，按 commit 内文件回退该提取项，不整体回退。

### 4.2B 批次 2B：O5 深水区提取（留待用户追加步骤，不占本轮 (fast×2) 预算）

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/components/table/ex/table-paint/paint-overlay.js` | cellFrameOf（+可选 strokeCellFrame）提取：矩形链 113–126 / 155–168 / 201–214（各 14 行）、裁剪段 134–142 / 173–181 / 223–231（各 9 行）；以叠加后（或已提交）代码为源；等价性校验点见 O5 表知识库两条约束（hover-span-region / overlay-clip-body-area） |
| 2 | `src/components/table/ex/composables/use-tree-rows.js` | applyTreeToggle（145–182）锚定补偿 → withAnchorPreserved |
| 3 | `src/components/table/ex/composables/use-table-instances.js` | onThemeChange（29–56）锚定补偿 → withAnchorPreserved |
| 4 | `src/components/table/ex/geometry/row-geometry.js` | 新增导出 withAnchorPreserved（签名含 resolveAnchorRow） |

行为判据：build；self-checks；探针基线逐字一致（重点：hover 带合并区域联动 + 描边固定列裁剪两口径）；对外 API 零改动。触发条件：批次 2A 验证通过后用户追加步骤指令。回滚：单 commit revert；双向门。

### 4.3 批次 3：O6 + O7 示范（可选）

行为判据：build；self-checks；探针基线；对外 API 零改动；`grep -rn "interaction/interactions" src demo/src` 为空。

改动清单（2 新建 + 1 删除 + 6 修改 + 2 demo）：

| # | 文件 | 改动 |
|---|---|---|
| 1 | `src/components/table/ex/interaction/hit-test.js` | 新建 |
| 2 | `src/components/table/ex/interaction/click-policy.js` | 新建 |
| 3 | `src/components/table/ex/interaction/interactions.js` | 删除 |
| 4 | `src/components/table/ex/composables/use-cell-click.js` | import → click-policy |
| 5 | `src/components/table/ex/composables/use-cell-tooltip.js` | import → hit-test |
| 6 | `src/components/table/ex/composables/use-pointer.js` | import → hit-test + click-policy |
| 7 | `src/components/table/ex/composables/use-column-resize.js` | import → hit-test |
| 8 | `src/components/table/ex/cell-paint/cell-painters.js` | drawCell 四分组 |
| 9 | `src/components/table/ex/table-paint/paint-body.js` | drawCell 调用点 |
| 10 | `demo/src/data/table-ex/self-checks/interactions.js` | import → 两文件 |
| 11 | `demo/src/data/table-ex/self-checks/cell-painters.js` | drawCell 调用点 |

回滚：单 commit revert；双向门。O6 与 O7 可拆成两个 commit 独立回滚。

### 4.4 验证、回滚与合并风险

- 每批验证顺序：① `npm run build`；② 探针基线（批次开始前在 demo 自检加临时探针采集基线，结束前删除探针并复验 self-checks 计数回到基线）；③ demo self-checks 全量；④ 对外 API 冻结：`git diff -- src/components/table/ex/table-ex.vue` 核对 props / emits / defineExpose / 事件时序；⑤ 各批行为判据中的 grep 断言。
- 回滚：每批一个 commit，`git revert <sha>` 即可；各批（1 / 2A / 2B / 3）均为双向门（内部模块路径与内部函数签名，无外部 API、无持久化数据）。
- 合并风险：批次间文件集合相交（composables / paint-overlay / demo self-checks 跨批修改，paint-overlay 在 2A（import 行）与 2B（描边提取）两批触及），必须串行，不可并行或交错提交。
- 爆炸半径：`src/components/table/ex/` 内部 + `demo/src/data/table-ex/self-checks/`；docs / docs-site / 对外组件 API 不受影响（`src/components/table/ex/index.js` 仅导出 table-ex.vue）。

### 4.5 验收标准归属

| 00-task 验收标准 | 归属 |
|---|---|
| 1 build + self-checks 全量 | 每批；终验批次 3（不做 3 则 2B，不做 2B 则 2A） |
| 2 探针基线逐字比对 | 每批 |
| 3 demo self-checks import 同批同步 | self-checks 目录 12 文件（11 个直引 ex/，index.js 仅聚合）：受影响 5 个——批次 1：cell-painters / painter / spans / interactions；批次 2A：+ editor；批次 3：interactions / cell-painters（drawCell 调用点）；2B 无新增 import 变更。其余 6 个直引文件（layout / row-geometry-controller / row-geometry / text-wrap / theme / tree）与 index.js 不动 |
| 4 对外 API 不变 | 每批 diff 核验；终验同上 |

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
| 判断"改 X 影响谁" | 通读函数体 + 运行时 host 调用不可见 | import 图 + `@host-*` 声明静态可得（O1/O2） |
| grep `ctx` | 三义混杂 | 单义（O3） |
| "编辑按钮/命中/排序在哪" | 目录语义错位，多轮确认 | 目录语义对齐（O4/O6） |
| 改绘制口径/背景带/描边 | N 处同源代码，漏改风险 | 单一事实源（O5） |
| 读大参数调用点 | 回跳签名逐字段比对 | 分组自解释（O7） |
