# 设计

## 方案概述

两个缺陷、两处修复点，均在 overlay 绘制层与 hover 脏区层，不动 spans 构建与分区管线：

- **缺陷 1（固定列选中描边覆盖）根因**：`paintCellSelection` 无任何裁剪（paint-overlay.js:160-190；paintOverlay:256 注释称"自带表体区裁剪"与实现不符）。水平滚动走整幅 `paintFull`（use-relayout.js:133-137 → painter.js:215-226，无外层 clip），overlay（分区 5）后于固定列区（分区 3，painter.js:18-20）绘制，选中滚动区格滚入固定列覆盖区后描边直接压在固定列上方。**修复**：描边外包 `withClip` —— 滚动区格（`selected.col >= fixedCount`）裁掉 `[0, fixedWidth)`，所有格裁掉表头区（对齐 `paintHoverOverlay` 既有表体区 clip，paint-overlay.js:235）；固定列自身格天然在固定区内照常绘制。垂直方向（选中格滚入表头区）属同类实现缺口，经同一 clip 一并修复。
- **缺陷 2（合并 hover 未覆盖整个区域）根因**：`paintHoverRow`/`paintHoverCol` 恒画物理单行/单列（paint-overlay.js:58-76），row/column/cross 模式下 hover 命中 rowspan/colspan 区域（hitAt 已归一到锚格，use-pointer.js:52-56）时高亮仅锚行/锚列。cell 模式已用 `spanRectOf` 整体高亮（paint-overlay.js:87-91）。**修复**：行/列带几何取 hover 格的 `spanRectOf` 矩形（物理格退化为原式，区域格扩展为区域行/列区间），带语义不变（row=整行、column=整列）；脏区侧仅 column/cross 的列带需补区域扩展（行带经 painter `prepareSpansRegion` 对 `{rows}` 的既有区域并集扩展已覆盖，painter.js:334-345）。

触及模块边界：`src/components/table/ex/table-paint/paint-overlay.js`（overlay 私有绘制函数）、`src/components/table/ex/composables/use-pointer.js`（hoverRegions 私有函数）+ demo 自检。无导出接口变化。

## 遵循约定与复用

无探索报告，自行提取（证据为下列引用）：

- 复用 `spans.js` 既有查询：`regionAt`（spans.js:115-126）、`spanRectOf`（spans.js:204-217，普通格退化 = cellRectAt 同式）——任务约束指定优先复用；区域恒不跨固定列边界（spans-method.js:215-232 resolveDeclaredColspan 夹紧），区域矩形无横跨固定/滚动分区的复杂形态。
- 复用 `paint-utils.js`：`withClip`、`viewportRowY`、`contentRightXOf`、`contentBottomYOf`（paint-utils.js:26-61、109-116）。
- 色值一律 theme 快照字段（`hoverBg` = `--mu-gray-translucent` 半透明，shared/theme.js:121）；不新增色值、不硬编码。
- hover 状态口径：`state.hover` 为 hitAt 归一后锚格坐标（use-pointer.js:26-57、63-68）；`selectedCell` 为锚格坐标（use-cell-select.js:33-58）。
- 命名/注释：模块内私有小驼峰 `paintXxx`，注释中文并引用设计节号（paint-overlay.js 既有风格）。
- 自检约定：`demo/src/data/table-ex/self-checks/painter.js` 在位 canvas + `assertPixel`/`blendColor`/`colorBoundsOf` 像素断言（painter.js 自检 145-330 工具层）。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-overlay.js` | ① `paintCellSelection`：strokeRect 外包 `withClip`（x0 = `selected.col < layout.fixedCount ? 0 : layout.fixedWidth`，y 自 `headHeight`）② `paintHoverHighlight` 统一取 `cellRect = spanRectOf(...)`；`paintHoverRow`/`paintHoverCol` 增 `cellRect` 参，y/height 与 x/width 随区域扩展（null 回退原式）；cell 模式 fill 复用 `cellRect` | 验收 1（固定列遮挡）/ 验收 2（合并 hover 区域覆盖） |
| `src/components/table/ex/composables/use-pointer.js` | `hoverRegions` 增 `spans` 参数；column/cross 模式列带失效区间扩展为 `regionAt(spans, hover.row, hover.col)` 的 `[colFrom, colTo)`（无区域回退 `[col, col+1)`，去重）；row/cross 行带与 cell 模式不变；唯一调用点 `updateHover`（use-pointer.js:123）同步传 `ctx.spans.value` | 验收 2 脏区侧：列带扩展后 prev/next 变更需覆盖区域全部列，否则跨列区域高亮残影 |
| `demo/src/data/table-ex/self-checks/painter.js` | 补像素断言（A/B 与 D/E/F 各为独立检查项）：A 滚动区选中格滚入固定区后固定列区无 primaryColor 像素；B 固定列格选中描边可见；C 无 spans 行/列 hover 带与现状一致（复用既有 519/529-531 断言即可，不重写）；D rowspan 区域 row 模式区域行全高亮；E colspan 区域 column 模式区域列宽高亮；F cell 模式区域整体高亮（现状回归）。新增 `buildSpans` import 与 spans 夹具：`spanMethod` 行 0 `status` rowspan=3、行 3 `amount` colspan=2（该区域覆盖 check 列 col 4，该行勾选框按 covered 不绘制） | 验收 1/2 自动化判据 + 验收 3 回归载体 |

## 接口 / 数据结构

无导出接口变化，仅模块内私有函数签名调整（伪代码）：

```
// paint-overlay.js
paintHoverRow(ctx, layout, row, cellRect)   // cellRect: rect|null —— hover 格视口矩形
                                            // y/height 取 cellRect（区域=区域行区间）；null → viewportRowY + heightAt（原式）
paintHoverCol(ctx, layout, col, cellRect)   // x/width 取 cellRect（区域=区域列区间）；null → viewportColX + colWidths（原式）
paintHoverHighlight(ctx, layout, hover, mode, rowValid, colValid, spans)
  // cellRect = (rowValid && colValid) ? spanRectOf(layout, hover.row, hover.col, spans) : null
  // 行/列带宽/高 cap（contentRightXOf/contentBottomYOf）保持不变

paintCellSelection(ctx, state)              // 签名不变；strokeRect 包：
  // withClip(ctx, [x0, headHeight, stickyWidth - x0, stickyHeight - headHeight], stroke)
  // x0 = selected.col < layout.fixedCount ? 0 : layout.fixedWidth

// use-pointer.js
hoverRegions(prev, next, mode, spans)       // 增第 4 参（ctx.spans.value 传入）
  // column/cross：每 hover 格区间 = regionAt(spans, hover.row, hover.col)
  //   ? [region.colFrom, region.colTo] : [hover.col, hover.col + 1]（col<0 跳过，按区间去重）
  // 其余分支（rows/cell）不变
```

## 被拒绝的备选

1. **缺陷 1 备选：重排分区顺序（固定列区在覆盖层之后再重绘一次）** —— 拒绝：hover 行带/高亮刻意横穿固定列（`paintHoverRow` x=0 起画、`paintHoverOverlay` clip 全表体区，paint-overlay.js:58-62/235），全局重排改变所有覆盖层元素层级语义，爆炸半径覆盖全部 hover 行为；局部 clip 只影响选中描边一个元素。
2. **缺陷 2 备选：row/column 模式在物理带上叠加补画区域矩形** —— 拒绝：`hoverBg` 半透明（theme.js:121），与行带/列带交叠处两次混色变深，观感与 cell 模式不一致；带扩展（单一矩形）与既有 cell 模式 `spanRectOf` 口径一致，且行带脏区经 `prepareSpansRegion` 既有扩展天然对齐（painter.js:334-345）。

## 风险与回滚

- **门类型：双向门**（纯绘制/私有函数内部改动，无导出接口、无数据结构、无持久化；单 commit `git revert` 即回滚）。
- **爆炸半径**：`paintOverlay` 全部消费场景（hover 高亮、选中描边）。退化路径守卫：无 spans 时 `cellRect` = 物理格矩形（spanRectOf 普通格分支与 `paintHoverRow`/`paintHoverCol` 原式同源，spans.js:211-216 vs paint-utils.js:26-42）→ 由既有断言（painter.js 自检 519/526/530/531 行列带断言）覆盖回归；`fixedCount=0` 时 `x0=0`（clip 范围 = `paintHoverOverlay` 既有表体区 clip）与断言 B 的 `selected.col < fixedCount` 分支同为全宽 clip，由断言 B + 验收 3 目测覆盖。
- **垂直表头裁剪的行为变化**：选中格滚入表头区后描边不再压表头（现状会）。属对齐 `paintOverlay:256` 注释既有意图，如需保留旧行为删除 clip 的 y 分量即可。
- 合并风险：无并发改动。

## 测试计划

| 验收标准 | 归属 | 手段 | 检查方式 |
|---|---|---|---|
| 1 固定列覆盖 | 片 1 | 自检（浏览器）| 断言 A（独立检查项）：夹具 fixedCount=1、col=2（colLefts=200、宽 100）、`selectedCell={row:0,col:2}` + `scrollLeft=250`（x∈[-50,50)）→ `colorBoundsOf(canvas, 0, 58, 36, 252, primaryColor)` 返回 null；`scrollLeft=180`（x∈[20,120)）同断言，且 `colorBoundsOf(canvas, 60, 120, 36, 252, primaryColor)` 非 null（可见段未被过度裁剪）。断言 B（独立检查项）：`selectedCell={row:0,col:0}` → `colorBoundsOf(canvas, 0, 58, 36, 252, primaryColor)` 非 null（固定区格照常描边；参照 painter.js 自检 900-908 的 assertPixel(tolerance 2) 描边采样法） |
| 1 固定列覆盖 | 终验 | 浏览器 | demo `fixed` 场景（fixedLeftColumns=2、fixedWidth=230、列总宽 1040 > 舞台 960 → 滚动余量约 80，col 2 左缘 230→150 仅部分进入固定区，足以复现，main-view.vue:858-873）→ 点击 col 2 行 0 选中 → 脚本置 `scrollLeft=80` 等一帧重绘 → `getImageData` 只取选中格顶/底描边 y（行带上/下缘 1px 条带、x∈[0,230)）断言无 primaryColor 像素；**禁整块固定区断言**——固定列 col 1 为 link 列（默认主色文本）会假阳性。需完整覆盖时拖窄舞台（ct-resize-handle，最小 320）后重试；截图辅助人工复核 |
| 2 合并 hover | 片 2 | 自检（浏览器）| 断言 D（独立检查项）：`buildSpans` 夹具（spanMethod 行 0 status 列 rowspan=3）+ hover `{row:0,col:2}` + hoverMode row → x=300（col 3，区域外，底色取各行自身）y=50/90/126（行 0/1/2）= `blendColor(hoverBg, bgNormal/bgStripe/bgNormal)`、y=150（行 3）不变 = bgStripe。断言 E（独立检查项）：行 3 amount 列 colspan=2 区域 + hoverMode column → x=350（col 3）、x=425（col 4；区域覆盖 check 列故该行勾选框不绘制）y=150 = `blendColor(hoverBg, bgStripe)`（区域底色 = 锚行 3 背景）、x=560（col 5 区外）y=150 = bgStripe。断言 F（独立检查项，现状回归）：hoverMode cell + hover `{row:0,col:2}` → (250,50)/(250,90) = `blendColor(hoverBg, bgNormal)`（区域底色 = 锚行 0 背景，跨行 1/2 同色）、(250,150) 不变 |
| 2 合并 hover | 终验 | 浏览器 | demo `spans` 场景（分类列 autoRowSpan 7 行区域——小计行 cat/sub 置空形成空值分段边界；小计行 summary colspan 'rest' → cols 5-7，main-view.vue:898-950）→ hoverMode=row hover 合并格 → 区域全行高亮；hoverMode=column hover 小计行 → 区域整宽高亮；hoverMode=cell hover 合并格 → 区域整体高亮；hover 移出无残影（覆盖 hoverRegions 列带扩展） |
| 3 回归 | 终验 | `命令` + 自检 + 浏览器 | `npm run build` 通过；自检面板全绿（既有断言含无 spans 物理 hover 带混合色断言，painter.js 自检 519/529-531）；demo 默认场景（无固定列无合并）hover 行带、cell hover、无固定列选中描边目测不变 |

**canvas 像素验证分级**（任务约束要求注明）：
- playwright mcp 可用：访问 `http://localhost:3000/data/table-ex/`，切场景/hoverMode，`evaluate` 读 `.mu-table-ex__canvas` 的 `getImageData` 采样断言（区域内 = hoverBg 混色、固定列区选中描边条带无 primaryColor），截图辅助人工复核。
- mcp 不可用/身份阻塞：`npm run build` + demo 自检面板（runChecks 在位 canvas 像素断言，即断言 A/B/D/E/F）+ 代码走查，剩余项（残影类动态行为）标"需人工"。

**demo 夹具结论：无需补充**。验收 1 用 `fixed` 场景（有水平滚动空间 + 点击选中链路 use-cell-click.js:138）；验收 2 用 `spans` 场景（跨行/跨列区域 + hoverMode 控件）；两者组合（固定+合并+滚动）如需，`spans` 场景拖窄舞台（ct-resize-handle）即可产生溢出，不改夹具。

## 实施步骤

切片：两个可独立演示的行为（片 1 = 验收 1，片 2 = 验收 2）。实施粒度为整体（decisions.md），串行执行；两片共用 `paint-overlay.js` 与 painter 自检文件，不并发。

- **片 1（固定列选中遮挡）**
  1. 步骤 1：painter.js 自检补断言 A/B，A、B 各自独立检查项（同一检查项内 A 抛错会短路 B，无法同时观察红/绿）。完成判据：断言 A 红（现状固定列区有描边像素）、B 绿（固定区格照常描边）。文件集：`demo/src/data/table-ex/self-checks/painter.js`。依赖：无。
  2. 步骤 2：`paintCellSelection` 包 `withClip`。完成判据：断言 A/B 全绿、既有断言无回归。文件集：`src/components/table/ex/table-paint/paint-overlay.js`。依赖：步骤 1。
- **片 2（合并 hover 区域覆盖）**
  3. 步骤 3：painter.js 自检补断言 D/E/F（新增 `buildSpans` import + spans 夹具；D/E/F 各自独立检查项）。完成判据：断言 D 红、E 红（现状区域仅锚行/锚列高亮）、F 绿（cell 模式区域高亮现状回归）。文件集：`demo/src/data/table-ex/self-checks/painter.js`。依赖：无（与片 1 串行）。
  4. 步骤 4：`paintHoverHighlight`/`paintHoverRow`/`paintHoverCol` 区域扩展 + `hoverRegions` 列带扩展。完成判据：断言 D/E/F 全绿、既有断言无回归。文件集：`src/components/table/ex/table-paint/paint-overlay.js`、`src/components/table/ex/composables/use-pointer.js`。依赖：步骤 3。
- **终验（跨片）**
  5. 步骤 5：`npm run build` + demo 浏览器终验（测试计划表 1/2/3 终验行）。依赖：步骤 2、4。

## 未解问题

1. hover 编辑描边（蓝/灰，paint-overlay.js:97-153）在 hover 格部分滚入固定列区时描边左段压固定列上沿——指针驱动（`colAt` 固定列优先，layout.js:243-254）使完全滚入不可能命中，仅部分滚入的窄条场景可见，属既有边缘行为。验收标准未覆盖，本设计不处理；如需一并裁剪可在描边函数内加同源 clip（约 4 行），留用户裁定。
