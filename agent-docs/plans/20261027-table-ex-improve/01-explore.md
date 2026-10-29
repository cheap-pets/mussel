# 探索报告

任务：table-ex 改进（8 项问题清单）。基线 `mussel-table` @ `3d41296`，工作区干净（仅本任务目录未跟踪，已核实）。
调研范围：`src/components/table-ex/` 全部 16 文件（约 7489 行）+ `demo/src/data/table-ex/`（main-view.vue 1331 行 + self-checks 9 模块）。decisions.md 仅 1 条（.pipeline 不 gitignore），无实现约束。

## 问题清单 8 项逐项事实

### 问题 1：内容垂直居中偏上；水平居中核查；多行首行 top 对齐

现状机制（单行文本）：
- `drawCell` 统一设 `ctx.textBaseline = 'middle'`（src/components/table-ex/cell-painters.js:268），单行锚点 = `rect.y + rect.height / 2`（cell-painters.js:469）。rect = 整格矩形（painter.js:162-169 `cellRectAt`；paintBodyRow 内 rect 构造 painter.js:290-295）。
- 行格线绘制：`paintRowGridlines` 对每行 r≥1 在 `viewportRowY(layout, r)`（= 该行矩形顶部，painter.js:157-159）画 1px（painter.js:374-379）——即**行线占用下一格矩形顶部 1px**。因此除首行外每格「不含边线的内容区」几何中心 = `rect.y + (height + 1) / 2`，比绘制锚点（`rect.y + height/2`）低 0.5px，文字相对内容区**偏上 0.5px**。与用户「偏上了一点，可能计算空间包括了单元格边线」方向一致。
- 水平居中（同类问题存在）：列线画在列右缘内 1px（`paintColGridlines`，painter.js:382-395：`viewportColX(c) + width - 1`），水平锚 `rect.x + rect.width / 2`（`textAnchorX` center 分支，cell-painters.js:399-405）含右线 1px → 文字相对内容区**偏右 0.5px**。首行格顶部无行线（首行顶线由表头底边框承担，painter.js:407 注释）、末列右缘无列线（painter.js:386-387）。
- 附加事实：canvas `textBaseline='middle'` 锚在字体 em 框中点，与字形光学中心存在字体度量内偏差（此为 baseline 语义事实；是否为主要偏移来源归设计者判断）。

多行首行 top 对齐现状：
- 块顶 = `multilineBlockTop(rect, blockHeight, padding) = rect.y + Math.max(padding, (rect.height - blockHeight) / 2)`（cell-painters.js:413-415）；首行基线 = 块顶 + lineHeight/2（cell-painters.js:447；数组路径 488；link 竖排 881）。lineHeight = 快照 `--cell-line-height`（theme.js:117；回退 18，cell-painters.js:57）。
- n=1 时块顶 = `rect.y + (h - lineHeight)/2`（≥ padding 时），首行中心 = `rect.y + h/2` 与单行路径一致（cell-painters.js:407-411 注释声明此对齐）；**n>1 时块整体居中，首行中心高于格中心**，首行 glyph top = 首行中心 − ascent，与「同格单行文本的 top」（= `rect.y + h/2` − ascent）不相等，差值 = `(h − lineHeight)/2 − max(padding, (h − n·lineHeight)/2)`。三处多行路径（wrapLines 折行 / 数组值 / link 竖排）同用 `multilineBlockTop`，口径一致。
- 表头文字垂直居中：`centerY = headHeight / 2` + baseline middle（painter.js:537, 530），表头内部无横线，不受行线影响。

### 问题 2：顶部滚动阴影位置

现状机制：
- 阴影是 DOM 元素 `.mu-table-ex__header-shadow`，位于 `.mu-table-ex__overlay` 内（table-ex.vue:24）；overlay `position:absolute; inset:0` 覆盖整个 `__sticky`（= 表格视口，table-ex.scss:45-56）。
- 阴影定位 **`top: 0`**（table-ex.scss:73-75），显示条件 `.mu-table-ex--y-scrolled`（scrollTop > 0.5，table-ex.vue:456-459, 513-515；table-ex.scss:81-83），box-shadow = `--mu-shadow-float`。
- 表头由 canvas 绘制在画布顶部 `headHeight` px 区域（`paintHeader` painter.js:666-683），headHeight = 探针读 `--head-row-height`（theme.js:115；组件根声明 36px，table-ex.scss:8），表头底边框画在 `headHeight - 1`（painter.js:682）。
- **根因事实**：阴影元素锚点为 overlay 顶部（= 表格顶部，覆盖 header 上沿），而非 header 下沿（应 = `top: headHeight`）。

### 问题 3：可编辑格 hover 边框/输入框与单元格的间距

现状机制：
- hover 描边与编辑浮层共用单一事实源 `editorRectOf`：格矩形四周内缩 **`EDITOR_GAP = 4`**（editor.js:92 常量、editor.js:117-124 函数）；上/右格线占用本格矩形的 1px 各再扣（editor.js:120-122，`gridlineShows` editor.js:98-100）。
- hover 描边绘制：`paintHoverEditorStroke`（painter.js:770-788），1px 主色 0.45 透明 strokeRect，import 同一 `editorRectOf`（painter.js:70）。
- 编辑浮层定位：`computeEditorStyle`（editor.js:397-436）产出数值矩形 → 壳转 px 串（table-ex.vue:885-906, 945-947）→ `.mu-table-ex__editor` absolute 定位（table-ex.scss:109-119）。
- 文本左缘补偿：容器内 `.mu-input` `padding: 0 0 0 calc(var(--cell-padding, 8px) - 5px)`（table-ex.scss:126-130）、textarea 四边 `calc(var(--cell-padding, 8px) - 5px)`（scss:136-148）；**5 = EDITOR_GAP(4) + 边框 1**（scss:121-125 注释）。去掉 gap 改重叠后此补偿基数需联动（事实，方案归设计）。
- 浮层容器：`background: var(--mu-bg-normal)`、`overflow: hidden`、flex 垂直居中（scss:109-119）；`.mu-input` width/height 100%（scss:126-130）。
- **根因事实**：4px 等距内缩是 A5.4 R1 既定设计；自检断言已固化该值——self-checks/painter.js:757-791（描边内缩 4px 像素断言）、self-checks/editor.js:422-436（`assertEqual(EDITOR_GAP, 4)`、三类型同矩形）。改动需同步修改这些断言。

### 问题 4：部分列类型不可编辑（链接、按钮、标签、进度等）

现状机制：
- 只读判定 `isCellEditable`（editor.js:147-155）：表格级 editable !== false && 列级 editable !== false && `column.editor != null` && 列类型不在排除清单。
- 排除清单 `NON_EDITABLE_TYPES = ['rec_no', 'img', 'image', 'tag', 'check']`（editor.js:63）。**tag 已在清单；link 不在**——editor.js:60 注释「link 本期起可编辑——人工 2 意见 2」（上轮人工决定）；demo 链接列配 `editable: true, editor: true`（demo/src/data/table-ex/main-view.vue:585-592）。
- `button` / `progress` 为 canvas 专属类型（`CANVAS_ONLY_TYPES`，cell-painters.js:66），不在排除清单；若配 editor，`resolveEditorType` 未知类型回退 `'input'`（editor.js:184-197）→ 可进入 input 编辑。demo 现未给 button/progress 配 editor，故未触发。
- **根因事实**：清单相对本次要求缺 `'link'`（现状为有意可编辑，与本次要求冲突，见未解问题 2）、`'button'`、`'progress'`。

### 问题 5：列定义自定义编辑按钮（仅图标、仅一个、hover 显示）

- **未找到**：`src/components/table-ex/` 与 `src/components/table/` 无 editorButton/editButton/editor.button 等任何相关定义（grep 0 命中）；列准备链 `prepareColumn`（cell-painters.js:151-191）不消费此类字段。纯新增能力。
- 可复用现状事实：
  - 条目命中矩形集合 itemHits 已按 (row,col) 收集 link/tag/button 矩形（cell-painters.js:679-686 `reportHitRect` 报 tag/link；drawButton cell-painters.js:1004 报 kind 'button'；收集管线 painter.js:329-365, 235-253），但当前只用于 click 命中（`resolveItemClick` interactions.js:373-381），**无格内条目级 hover 事件通道**——hover 载荷仅 `{ row, col }`（table-ex.vue:578-583）。
  - 覆盖层绘制入口 `paintHoverOverlay`（painter.js:791-807）可承载新绘制；hover 脏区已按格重绘（hoverMode 'cell' 或行带，table-ex.vue:607-640）。
  - 图标来源：table-ex 未引入 `src/icons/`（仅 index.js + tabler-icons.js，供 DOM mu-icon 体系），**canvas 侧无现成图标绘制通道**（需 path 绘制或字符方案，归设计）。
  - 点击回调通道：现有 `cell-item-click` emit 模式（table-ex.vue:808-859）可参照。

### 问题 6：布尔值编辑开关的白色背景

现状机制与根因：
- 编辑容器 `.mu-table-ex__editor` 恒有 `background: var(--mu-bg-normal)`（table-ex.scss:119），铺满整个编辑矩形（= 格内缩 4px）。MuSwitch 控件本身仅 40×20（switch.scss:17-21），不铺满容器 → 容器白色矩形可见。**根因 = 编辑容器背景**，非开关组件（MuSwitch 轨道 `var(--mu-gray)`、球 `#fff`，switch.scss:25, 41）。
- `--borderless` 类只清 `> .mu-input` 的边框/底色（table-ex.scss:155-158）；switch 的根类是 `.mu-switch` 非 `.mu-input`（EDITOR_COMPONENTS editor.js:73-79），规则不命中，容器背景不受影响。容器背景存在的理由是遮蔽 canvas 单元格内容防叠影（scss:106-108 注释）。
- 其他组件同类问题核查事实：MuInput/MuSelect/MuDateInput 自身底色 `--bg: var(--mu-bg-normal)`（form/input.scss:3, 183）属输入控件设计底色；但 **borderless 形态（editor.border:false）下容器背景未被清除**（scss:155-158 白名单仅覆盖 input 底色，不含容器）→ borderless 编辑同样显示整格白色矩形，属同类问题（事实）。

### 问题 7：按钮、链接 hover 样式与光标

现状机制：
- canvas 侧**条目无 hover 态、无 pointer 光标**：`resolveCursor`（interactions.js:137-144）仅 col-resize / 表头可排序 pointer / 树箭头槽 pointer / 可编辑格 text / default，不消费 itemHits → 悬停画布上的 link/button 光标为 default。绘制层 `paintHoverOverlay`（painter.js:791-807）只画行/列/格高亮 + 可编辑描边 + 树箭头主色，link/button 颜色恒定（`linkTextColorOf` cell-painters.js:589-600；`drawButtonPill` cell-painters.js:1032-1063）。
- DOM 版参照（hover 目标样式来源）：`.mu-link` cursor:pointer、hover 变浅色（`--mu-*-color-4`）+ underline（src/styles/link.scss:1-11, 25-33）；danger hover（link.scss:13-19）；disabled pointer-events:none（link.scss:49-52）。check 方框 cursor:pointer（table/column-types/style.scss:2）。
- 复刻所需数据事实：主题快照 `readSnapshot`（theme.js:96-120）**无 `-4` 浅色变体字段**（仅 17 色 color/translucent，theme.js:60-93）——canvas 若复刻「hover 变浅」需扩快照。itemHits 矩形（link/tag/button）可作条目级 hover 命中数据源（见问题 5）。

### 问题 8：树排序未生效 + 排序成本

排序数据流（现状完整链路）：
1. 列头点击：`resolveHeaderClick` 对 `column.sortable` 列 emit `update:order-by(next)`（interactions.js:210-214；next 由 `resolveOrderByNext` 无→asc→desc→无，interactions.js:155-163）。
2. demo 父级：`onOrderByChange` 写 `orderBy` ref（main-view.vue:947-950）。
3. demo 排序仅接默认场景：`sortedRecords` computed 按 orderBy 排 `records`（main-view.vue:713-726）→ `displayRecords`（main-view.vue:755-759）→ `stageRecords` **default 分支**才消费（main-view.vue:789-798）。
4. **组件自身不排序**：`orderBy` prop 仅两处消费——排序图标方向 `sortDirectionOf`/`drawSortIcon`（painter.js:202-208, 476-493）与 paintState 透传（table-ex.vue:328, 371）。读行集合 `displayRows` = 树开 ? `flatRows.rows`（DFS 展开序）: `records` 原序（use-tree-rows.js:76）。
- **根因事实（demo 侧）**：树场景 `stageRecords` `case 'tree': return treeRecords`（main-view.vue:791）不经过 `sortedRecords` → orderBy 变化对树场景完全无作用。「树排序未生效」的直接事实 = 树场景数据源未接排序；组件层无任何树内排序实现。
- 若父级对平铺 records 排序后的行为（机制事实）：`buildChildrenIndex` 同父子级按 records 出现序收集（tree.js:41-65，注释「同父按 records 出现序」）；`buildFlatRows` DFS 按根序 + 子序展开（tree.js:107-134）。平铺数组整体排序后，根与各级子节点各自继承排序序，DFS 重组保证**同级内有序、不跨节点混排**。成本事实：childrenIndex O(n) + 排序 O(n log n) + 平铺 O(n)；树场景 n = 10003（2000 根 + 8000 叶 + 3 深层，main-view.vue:435-473）。watch(records) 引用变化会触发滚动复位 + relayout + 整幅重绘（table-ex.vue:1098-1103）。
- 排序箭头现状：`drawHeaderCell` 仅按 `col.sortable` 画箭头（painter.js:539, 541, 573-575），**无树态判定**；命中判定 `isSortableHeader` 同样无树态判定（interactions.js:112-114）。树场景「名称（树形列）」配 `sortable: true`（main-view.vue:476）→ 树下箭头显示、点击发 orderBy。
- 性能验证方法沉淀：`agent-docs/knowledge/patterns/table-ex-performance-profiling.md`（lastRelayout/lastPaint 计时、measureText 劫持计数、props 直替注入）。

## 相关代码（模块地图）

- src/components/table-ex/table-ex.vue — 组件壳：props/emits、paintState 组装、事件接线、编辑器打开/聚焦、树/几何/调宽三个 composable 接线、watch 重绘表（1098-1145）
- src/components/table-ex/painter.js — 绘制管线（5 分区 + 脏区调度）：格矩形 cellRectAt:162、格线:374-395、表头:534-683、排序图标:476-493、hover 覆盖层:697-820、编辑描边:770-788
- src/components/table-ex/cell-painters.js — 单元格内容绘制：列准备 prepareColumn:151、文本居中/多行:398-497、树箭头:506-548、items:608-749、link 竖排:870-905、progress/button:917-1063
- src/components/table-ex/editor.js — 编辑状态机：EDITOR_GAP:92、editorRectOf:117、NON_EDITABLE_TYPES:63、类型映射:127-135、isCellEditable:147、computeEditorStyle:397、控制器:497
- src/components/table-ex/interactions.js — 交互决策纯函数：hitTest:57、resolveCursor:137、表头点击/排序:197-217、树槽:329、item 点击:373、clickGuard/rAF:414-474
- src/components/table-ex/layout.js — 纯函数布局：列宽求解 solveWidths:156、类型默认宽:34-49、可视窗口、relayout:436
- src/components/table-ex/row-geometry.js / row-geometry-controller.js — 行高估高/精算与 uniform/variable 几何（Fenwick）
- src/components/table-ex/tree.js / use-tree-rows.js — 树纯函数（childrenIndex/flatRows/展开集）与树接线（displayRows:76、toggle 锚定:128-160、三条 watch:190-215）
- src/components/table-ex/theme.js — 变量探针、快照 readSnapshot:96、测量工厂:207、主题观察:268
- src/components/table-ex/text-wrap.js — 折行/省略纯函数（wrapLines:262、ellipsize:145、cellFontOf:29）
- src/components/table-ex/table-ex.scss — 尺寸变量镜像:3-8、overlay:45-56、阴影:60-91、编辑浮层:104-158
- src/components/table-ex/constants.js — 跨模块镜像常量（TREE_INDENT/CELL_PADDING_FALLBACK/CHECK_*/ELLIPSIS）
- src/components/table-ex/use-column-resize.js — 列宽拖拽（widthOverrides、clickGuard）
- demo/src/data/table-ex/main-view.vue — demo 舞台：场景/数据源接线:755-803、排序:713-726, 947-950、树数据:435-481、调试句柄 window.__tableEx:313
- demo/src/data/table-ex/self-checks/*.js — 9 模块断言 + index.js 聚合（runChecks + dataChecks）
- 参照样式：src/styles/link.scss（DOM link hover/cursor）、src/components/form/switch.scss、src/components/form/input.scss、src/components/table/column-types/style.scss

## 现有约定

- 分层：壳（table-ex.vue，持有状态/事件/DOM 接线）+ 纯函数模块（layout/interactions/text-wrap/tree/row-geometry）+ 有状态模块（painter/editor/theme/use-*-rows）。决策函数纯函数化、emit 执行在壳。
- 模块隔离硬约定：editor.js 不 import layout/theme/cell-painters（editor.js:30-33）；cell-painters 不 import theme/layout（cell-painters.js:21-23）；例外 = painter→editor 单向 import `editorRectOf`（描边与浮层同源，painter.js:70）。新增共享几何须沿用「单一事实源 + 单向依赖」模式。
- 坐标口径：x/y 相对 canvas 视口；内容坐标 = 视口 + scroll 偏移；固定列不随滚动（`viewportColX`/`viewportRowY` painter.js:152-159）。格线画在格矩形内（行线 = 下一行顶 1px、列线 = 本列右缘 1px）。
- 脏区重绘：region 形状 `{rows|cols|cell|header|colFrom}`（painter.js:58-66, 996-1011）；壳侧 `invalidate` 恒 immediate（table-ex.vue:386-390）；hover/选中变化只脏带重绘。
- 镜像常量收拢 constants.js（DOM 规格镜像值不散落）；主题色/尺寸经探针快照，禁止 canvas 侧硬编码色值。
- 自检：无测试框架，断言按源码模块一一对应放 `demo/src/data/table-ex/self-checks/<module>.js`，index.js `runChecks` 聚合 + 页面 dataChecks（'data' 模块）；像素断言用 getImageData 数暗像素（知识沉淀：agent-docs/knowledge/patterns/table-ex-performance-profiling.md）。
- 文档三处同步（AGENTS.md 约定）：`skills/mussel-ui/references/`、`docs/quick-reference_*.md`、`docs-site/`——问题 4/5 改列定义 API 触发；「完成代码实现后，未经用户确认，不更新文档」。
- eslint 基线 0 error / 0 warning（上轮已清零）。

## 约束与风险

- **问题 4 与既有决定冲突**：editor.js:60 注明「link 本期起可编辑——人工 2 意见 2」（上轮可编辑表格任务的人工决定），本次要求 link 不可编辑 = 推翻该决定；decisions.md 未记录该项，冲突需在设计/确认门指出，不自行取舍。
- EDITOR_GAP=4 与「描边=浮层矩形」等式被自检断言固化为像素级断言（self-checks/painter.js:757-791、editor.js:422-436）；问题 3 改动必须同步改断言，否则 A9 回归不过。
- 编辑容器背景（问题 6）存在的设计理由是遮蔽 canvas 内容防叠影（table-ex.scss:106-108 注释）；去掉/收窄背景需处理 switch 等小控件下的叠影问题（事实性约束，方案归设计）。
- 多行居中对齐（问题 1）三处绘制路径共用 `multilineBlockTop`，且行高公式 `max(rowHeight, padding*2 + lines*lineHeight)`（row-geometry.js:135-137）与绘制锚点强耦合；改对齐口径须保持「行高公式 = 绘制占位」一致性，否则出现内容溢出/裁剪。
- 树排序（问题 8）：排序为父级职责的受控契约（orderBy prop 仅显示意图）——若改为组件内实现树排序属契约变更；若维持父级排序，demo 修复点在 main-view.vue 而非组件。
- records watch 引用变化会滚动复位到顶（table-ex.vue:1098-1103）：树场景接排序（父级每次排序产出新数组）后，点击排序会重置滚动位置（现状行为事实）。
- 杂散未跟踪文件 `agent-docs/handoff/.!42003!...` 与本任务无关勿动（00-task.md 基线声明，本次 git status 未见，已不存在的可能性高）。

## 验证方式

- lint：`npx eslint src/components/table-ex/ demo/src/data/table-ex/`（基线 0/0）
- 构建：`npm run build`
- 浏览器：demo watch 已在 3000 端口外部运行（不得启停）；页面 http://localhost:3000/data/table-ex/；自检面板显示 passed/total 与逐条结果（main-view.vue:226-246）；调试句柄 `window.__tableEx`（scrollToRecord/refreshTheme/getLayoutInfo/getThemeSnapshot/getCellRect/expandAll/collapseAll/getTreeExpandedKeys，table-ex.vue:1084-1093）；canvas 像素断言可在页面 JS 上下文执行 getImageData。
- 自检断言静态计数：模块断言 143 条（interactions 17 / editor 14 / cell-painters 28 / row-geometry 12 / text-wrap 10 / painter 18 / layout 21 / tree 8 / theme 15，按 `fn:` 计）+ 页面 dataChecks 4 条 = 147 条，与任务声明的基线 144 不一致（见未解问题 1）。
- 树排序性能评估方法：agent-docs/knowledge/patterns/table-ex-performance-profiling.md。

## 未解问题

1.（验证基线）自检断言静态计数 147 ≠ 任务基线 144——需运行时打开自检面板确认当前真实总数后再定新基线口径。
2.（用户决策）问题 4 要求 link 不可编辑，与上轮人工决定「link 本期起可编辑」（editor.js:60 注释、demo 链接列 editable 夹具）冲突：确认推翻或保留（涉及 demo 夹具是否同步摘除 editor 配置）。
3.（设计补探索）问题 5「仅支持图标」的图标来源与 canvas 绘制方式（SVG path 内联 / icon 字体字形 / 字符）：table-ex 无图标通道，src/icons 仅服务 DOM mu-icon。
4.（设计口径）问题 1「多行首行与居中单行文本 top 对齐」的确切口径：与「同格若为单行时的文字 top」对齐（= 放弃块居中、块锚定单行位）还是与「相邻单行格的文字 top」对齐（= 维持块居中即可达到）——两种口径实现不同。
5.（设计口径）问题 8 若放弃树排序支持：「树状态」禁排范围 = props.tree 为 true 时全列禁排（含箭头隐藏），还是仅树形列禁排、其余列照常排序。
6.（设计补探索）问题 7 canvas 复刻 DOM hover 变浅色需 `--mu-*-color-4` 谱系变量，当前主题快照未读取该组变量（theme.js:96-120）——扩快照字段或改用其他 hover 表达（如下划线）由设计定。
