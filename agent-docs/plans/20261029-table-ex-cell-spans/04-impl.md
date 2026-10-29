# 实施记录 — mu-table-ex 合并单元格（P0 + P1 全量）

设计输入：`02-design.md`（v2 终版）。基线 `eeec1fd`（mussel-table），工作区 57 个既有未提交文件按叠加处理，未提交/未暂存/未还原。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/table/ex/spans.js` | §3 新模块 | buildSpans（spanMethod 声明流：key 优先→field 多列/无匹配警告、number/对象/'rest' 值形态、树形/check 列丢弃、重叠整条丢弃、越界截断、跨度 < 2 静默丢弃、异常按 null 行处置；autoRowSpan 三形态 + Object.is 键比较 + 空值边界 + 级联分段 + 树父链切断 + 占用格切断 + true 形态警告 + 接管 info + orderBy 警告）；SpansIndex（anchors/covered/regions/rowRegions，region 含 rowFrom/rowTo/colFrom/colTo/row/col/rowspan/colspan）；resolveSpanCell（浅拷贝仅改 rowIndex/colIndex）；spanRectOf / spanRegionRect；regionsForRows；spanHeightRoleOf（行高分层）；dev 警告经 `(row, col, 原因)` 构建内去重 + utils/warn 跨构建去重，支持自检注入捕获 |
| `src/components/table/ex/tree.js` | §5.7 | buildRootStack/pushChildren 栈项补 parentKey；buildFlatRows 产出 `parentKeys` 平行数组（根行/孤儿 null，与 rows/levels 同序） |
| `src/components/table/ex/use-tree-rows.js` | §5.7 | flatRows 直通 buildFlatRows 产物（parentKeys 自动透出），JSDoc 契约更新 |
| `src/components/table/ex/cell-painters.js` | §11（prepareColumn/drawCell 行） | prepareColumn 挂 `_autoRowSpan`；drawCell 增 `regionHeight` 入参：centerY = rect.y + ROW_TOP_INSET + (regionHeight − ROW_TOP_INSET)/2（单行退化与原式一致）、行数上限 min(maxLines, floor((regionH − padding×2)/lineHeight))，maxLines 改由 drawCell 求值后传入 drawContentItems/drawDisplayText |
| `src/components/table/ex/painter.js` | §5.1/§5.2/§5.3 | paintCellRange null 分支逐字保留（paintBodyRow 原函数未动），spans 分支两遍式：paintBodyRowSpans（①全行背景 + 非 span 格内容 + covered 格清残留 itemHits 组）→ paintSpanRegions（②region pass：rows 相交经 rowRegions + cols 过滤分区，锚行背景铺区域包围盒 → 主格内容，regionHeight/区域末列 rightInset/itemHits 收集/veil/keepRows 采集）；网格线分段（行线 rowRegions O(1) 定位、列线一次遍历分组，无相交区域走原整条路径）；hover cell 模式/可编辑描边/编辑按钮矩形换 spanRectOf（row/column/cross 物理矩形不动）；editorGridlineFlagsOf 传区域 rowFrom/colTo；invalidate 入口 prepareSpansRegion（归一 covered → 扩展 {cell}/{rows} 到区域包围盒 → 先于 isRegionPaintable 校验；{cols}/{header}/{colFrom} 不扩展）；trimItemHits 增 keepRows（模块级 spanKeepRows，与 itemHits 收集同遍历产出） |
| `src/components/table/ex/editor.js` | §5.5 | editorGridlineFlagsOf 增可选 rowFrom/colTo（缺省回退 rowIndex / colIndex + 1，与现行行为逐位等价）；computeEditorStyle 增可选 cellRect（区域矩形来源，editor.js 不 import spans.js，模块隔离保持）与 rowFrom/colTo 透传 |
| `src/components/table/ex/row-geometry.js` | §5.6 | computeRowHeights / ensureRowMeasured 增可选 spans 入参：'excluded'（covered / rowspan>1 主格）整格 continue（数组值不得触发 hasArrayValues）；rowspan===1 的 colspan 主格按区域宽（regionWidthOf）参与 |
| `src/components/table/ex/row-geometry-controller.js` | §4 | ctx 增 getSpans（缺省 null 容错）；isScanDirty 增 spans 身份；estimateColumnSignature 增 `_autoRowSpan` 标记（函数形态记 'fn'）；spans 引用变化即清空精算缓存（lastSpansRef）；rescanRowHeights / remeasureVisibleRows / remeasureVariableRow 传 spans；remeasureUniformRow 不传（单行数组下标与真实行号错位，误升级由随后的全量 relayout 纠正，注释写明） |
| `src/components/table/ex/interactions.js` | §11（注释） | hitTest JSDoc 增合并归一契约说明（归一在壳侧 hitAt 出口） |
| `src/components/table/ex/table-ex.vue` | §4/§5.4/§5.5/§5.8 | `spanMethod` prop；`spans` computed（依赖 displayRows/wiredColumns/spanMethod/recordsVersion/orderBy，经 buildSpans + devWarn）；syncPaintState 注入 paintState.spans、flatInfo 补 parentKeys；rowGeometry ctx.getSpans；hitAt 出口 `resolveSpanCell` 归一（返回 `{ point, hit, rawHit }`，resolveTreeToggle 用 rawHit，其余消费点用归一 hit）；isEditorButtonHit / openEditorAt 换 spanRectOf + 区域 rowFrom/colTo；watch：recordsVersion → relayoutAndRedraw、[spanMethod, orderBy] → relayoutAndRedraw（orderBy 移出渲染 props 组 watch）；watch(selectedKey) 增覆盖行受控选中 dev 警告（covered.has(row)，utils/warn 一次） |
| `demo/src/data/table-ex/self-checks/spans.js` | §9 自检 1–13 | 新增 13 条断言（见「自检」） |
| `demo/src/data/table-ex/self-checks/tree.js` | 任务验收 3 | 补 buildFlatRows parentKeys 平行数组断言（含全收起全 null、孤儿 null） |
| `demo/src/data/table-ex/self-checks/index.js` | §9（注册） | 注册 spans 模块（偏离 1） |
| `demo/src/data/table-ex/main-view.vue` | §9 demo 14–20 | 场景新增「合并单元格」：spanColumns（分类/子类/名称三列 autoRowSpan + 标签列 true 形态 + 名称 sortable/editable）+ spanRecords（2 分类 × 2 子类 ×（7 条目 + 1 小计），小计行 cat/sub 置空隔离 + isTotal，img/link/tag 条目齐备，组长 8 行可滚出锚行）；spanSpanMethod（isTotal → `{ summary: { colspan: 'rest' } }`）；`:span-method` / `:hover-mode` 绑定 + hoverMode 五态控件；固定区强制 ≥1；「选中覆盖行（受控警告）」按钮；树场景数量列加 autoRowSpan（demo 19） |

## 偏离

1. **设计 §11 文件清单外 +1**：`demo/src/data/table-ex/self-checks/index.js`。§9 验收要求自检 1–13「全部断言通过」，spans 模块不注册聚合入口不会运行；§9 标题「及同步」判为覆盖此接线。仅加 import 与 moduleChecks 一行 + 头注一行。
2. **设计 §4「与既有 relayout 触发点同批次，不新增独立 watch」的落地方式**：`watch(recordsVersion)` 由 redraw 升级为 relayoutAndRedraw（行高分层需重扫）；orderBy 从渲染 props 组 watch（redraw）移出，与 spanMethod 合并为一条 `watch([spanMethod, orderBy]) → relayoutAndRedraw`。共改动两条既有 watch、新增一条合并 watch，无 spans 专用 watch。
3. **§7「列级接管 info」走 warn 通道**：项目 warn 工具仅 console.warn 一档，接管 info 消息以「（info）」前缀区分（§7 级别 info vs warn 的通道区分在现有工具面无对应设施）。
4. 自检 1 夹具期望修正：分类列 B×2 两行同样成段，区域总数为 4（分类 2 段 + 子类 2 段），非 3——编写期修正，断言语义不变（级联分段仍以子类 S1 跨分类两段为核心断言）。
5. 自检 10 covered 行断言修正：colspan 区域不产生纵向覆盖，covered 行夹具改用独立纵向区域（`{ b: 2 }`）——同上，编写期修正。

以上均为判定「设计内隐含 / 编写期修正」，非设计缺口，不构成 BLOCKED。

## 自检

- `npm run build`：通过（mussel dev/prod + mussel.ex dev/prod 四段构建，0 error）。
- demo 构建（`npx vite build --config vite.demo.config.js` 单次非 watch）：通过（`demo/dist/data/table-ex/main.js` 产出；3000 端口 watch 服务在运行，已验证监听）。
- Node 冒烟（临时脚本 /tmp/spans-smoke.mjs，esbuild 打包 spans/cell-painters/row-geometry/tree 源码后断言，不在仓库）：14 项全 PASS——覆盖 §9 自检 1–8、10–12 的等价断言 + tree parentKeys + §7 列级接管 info；其中自检 9 的 `cellRectAt` 对照与自检 13（editorGridlineFlagsOf）依赖 painter/editor 的 .vue 链，仅浏览器侧可验（留 verifier）。
- 冒烟曾暴露并修复：buildSpans ctx 漏传 `spanMethod`（applySpanMethod 拿到 undefined，被异常处置逻辑掩盖为逐行警告）——已修复并复验。
- 浏览器侧（demo 页自检面板 console、demo 14–20 交互断言）：未执行，按派发由 verifier 负责。

## 遗留

1. drawCell 行数上限（§5.1）作用于 maxLines 文本折行路径；数组值/link 条目仍按 maxItems 截断（设计公式即 maxLines 语义，数组值的区域高钳制设计未定义，维持原语义）。
2. hover 'cell' 模式下编辑按钮区矩形换为 spanRectOf，但 editorButtonRectOf 的垂直锚仍按主题 rowHeight（按钮属锚行交互，设计仅要求矩形来源替换）。
3. `remeasureUniformRow` 不传 spans（单行数组行号错位），极端场景可能误升级变高模式，随后全量 relayout（带 spans）自愈；已注释写明。
4. spanMethod 声明值非对象非数字（如字符串）静默忽略（设计未定义该形态，未加警告）。
5. 文档三处同步（skills/docs/docs-site）按设计 §10 留待用户确认后进行，本轮未动。
6. 浏览器侧 demo 14–20 场景与既有 9 个自检模块的全量回归，待 verifier 在 `http://localhost:3000/data/table-ex/` 执行（自检结果面板 + console）。
