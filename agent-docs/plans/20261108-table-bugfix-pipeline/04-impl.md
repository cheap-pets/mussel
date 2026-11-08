# 实施记录（含终审裁决）

## 终审裁决（03-review-1.md：4 major + 5 minor）

### Major

| # | 裁决 | 理由与核实 |
|---|---|---|
| M1 keepRows 帧依赖 | **采纳**（修复方案偏离设计，见「偏离」1） | 证据链逐点核实成立：`beginSpanFrame` 每帧 `new Set()`（paint-body.js:22-24 原实现）；`endSpanFrame` 无条件裁剪（:27-31）；header 帧 `paintHeaderPass` 不调 `paintCellRange` ⇒ keepRows 恒空，且 `watch(() => props.headerChecked, ...)` → `invalidate({ header: true })` 为真实入口（use-relayout.js）；hover/选中/单格帧均为局部脏区（use-pointer.js `hoverRegions`、use-cell-select.js `selectCell`、use-cell-click.js veil 接线）。设计原条件 `(row < start \|\| row >= end) && !(keepRows && keepRows.has(row))` 仅在"本帧恰好绘制过该区域"时保留锚行条目，header 帧后条目即被删，点击/悬停丢失可复现——修复不完整。 |
| M2 步骤 2.3 e2e 不可执行 | **采纳**（删除 2.3） | demo spans 场景合并来源核实：autoRowSpan 仅 cat/sub/name 文本列（main-view.vue `spanColumns`）；spanMethod 仅小计行 `summary colspan 'rest'`（rowspan=1，滚出即整行不可见）；链接列不参与纵向合并，小计行 record 无 `links` 字段——不存在"多行合并区域内的 link 条目"。不扩展 demo 夹具（保持 AC5 最小改动面）。4b 改由自检面板断言承担（2.1 追加断言在浏览器跑通 draw → 锚行条目保留 → header 帧/行带帧后仍保留的完整行为链）。 |
| M3 步骤 1.3 判据口径错误 | **采纳**（判据已修正执行） | 核实成立：`--hover-col-left` 写 `pos.left + offset` 为内容坐标；th 无 hover 绑定（table-row.vue:9 仅 td `@mouseenter`）；`setHoverIndicator` 30ms noLeading 节流。修正后口径：滚至最大 scrollLeft，找"部分遮挡列"（视口左缘 < 固定区右缘 < 视口右缘）hover 其表体格，期望 `--hover-col-left = 固定区右缘(相对 wrap) + scrollLeft`、`--hover-col-width = 列右缘视口 x − 固定区右缘`，等待 ≥50ms。已按此执行，见「自检」。 |
| M4 步骤 3.3 无执行入口 | **采纳**（断言并入 painter.js 自检） | 核实成立：demo 为打包产物无控制台 import 入口；self-checks/painter.js:33 已 `import { buildSpans }` 且 `buildSpans({ warn })` 支持注入捕获（spans.js:59-67）。数组警告断言并入 painter.js 新增 check，判据改"自检面板新断言绿"。 |

### Minor

| # | 裁决 | 说明 |
|---|---|---|
| m1 itemHits 契约注释两处未同步 | **采纳** | painter.js 头注（"批次结束按可视行裁剪"补豁免口径）与 click-resolve.js `resolveItemClick` JSDoc（"窗口外行不在集合内 → null"补例外）随片 2 同步；两文件计入改动清单。 |
| m2 警告文案与 key 去重矛盾 | **采纳** | 文案定为「spanMethod 返回值须为 { 列键: 跨度 } 对象，收到数组，返回值忽略（同类不再重复提示）」。 |
| m3 问题 6 证据表述过宽 | **采纳（仅修记录）** | 修正表述：估高链仅 link 列经 `linkItemCountOf` 消费 `col._render`（row-geometry.js:59-73，`isLinkColumn` 门控）；bool 列不进入该分支。结论（问题 6 非缺陷不改代码）不变。02-design.md 不改动，本记录为修正后口径。 |
| m4 fixedColumnsWidth 取值时点 | **采纳（记录已知限制，不改码）** | 实测佐证（table-advanced 滚动后）：sticky th 的 offsetLeft 含滚动位移（th0 0→283、th1 80→363 ≈ 原值 + scrollLeft），若 `sizechange` 在横向已滚动时触发，`onResize` 的 `th.offsetLeft` 会使 `fixedColumnsWidth` 偏大 scrollLeft，问题 2 公式随之偏大。属既有行为非本批引入，无稳定复现路径（滚动本身不触发 sizechange）；不在 onResize 内减 scrollLeft（浏览器对 sticky offsetLeft 语义有差异，改既有行为超出本任务边界）。验证脚本避免"滚动后再触发 resize"。 |
| m5 范围核对缺基线 | **采纳** | 实施前已保存 `git status --short` 基线（11 M + 9 ??，均任务外既有），终验差异集合核对见「自检」。 |

## 改动文件

| 文件 | 问题/评审项 |
|---|---|
| `src/components/table/base/table.vue` | 问题 1（internalColumns 固定块重写，恰好 N 列）+ 问题 2（offset = `Math.max(0, fixedWidth + scrollLeft - cellLeft)`）+ 注释同步 |
| `src/components/table/ex/table-paint/paint-body.js` | 问题 3 + M1：删 `spanKeepRows`/`beginSpanFrame` 帧机制，`endSpanFrame(itemHits, viewRows, spans)` 以 `regionsForRows(spans, start, end)` 锚行集为豁免集；`trimItemHits` 条件 `(row < start \|\| row >= end) && !keepRows.has(row)`；头注同步 |
| `src/components/table/ex/table-paint/painter.js` | M1：`paint()` 删 `beginSpanFrame` 调用、`endSpanFrame` 增传 `state.spans`；m1：头注 itemHits 契约补豁免口径 |
| `src/components/table/ex/interaction/click-resolve.js` | m1：`resolveItemClick` JSDoc 补豁免例外说明（仅注释） |
| `src/components/table/ex/geometry/layout.js` | 问题 4：新增导出 `spacerWidthOf(colsWidth, containerWidth)`，`relayout` 改引用 |
| `src/components/table/ex/composables/use-column-resize.js` | 问题 4：`applyOverrideGeometry` 改引用 `spacerWidthOf`（import 补项） |
| `src/components/table/ex/editing/editor.js` | 问题 5：删 `rawWasArray` 死字段（源码 grep 0 残留） |
| `src/components/table/ex/spans/spans-method.js` | 问题 7 + m2：`Array.isArray(declared)` 单列拦截 + `emitWarn('spanMethod:array', …)` |
| `demo/src/data/table-advanced/main-view.vue` | 片 1 验证载体：固定列表加 `hover-mode="cross"`（note 同步） |
| `demo/src/data/table-ex/self-checks/painter.js` | 问题 3/7 回归断言 ×2（checks 末尾追加，不动他人未提交条目） |

不改动：`column-types/bool.js`（问题 6 非缺陷）；`table.scss`、`onResize`（m4 已知限制）；docs-site 文档（口径本为 N 列，修复后代码与文档一致）。

## 偏离

1. **设计步骤 2.2（问题 3 修复方案）**：设计原方案仅改 `trimItemHits` 判定条件、豁免集仍为"本帧 region pass 锚行集合"（spanKeepRows）。终审采纳 M1 后改为豁免集与帧内容解耦：`endSpanFrame` 增传 `spans`，豁免集 = `regionsForRows(spans, viewRows.start, viewRows.end)` 的锚行集合，`spanKeepRows`/`beginSpanFrame` 帧机制随之删除（消费点仅 painter.js 一处，已核清：grep 源码无其他引用）。正确性推导：脏区帧 region pass 的 rows ⊆ 窗口 ⇒ 旧豁免集 ⊆ 新豁免集，新方案严格更保；有界性保持（豁免行数 ≤ 与窗口相交区域数，每帧新建即弃，长滚不增长目标不受影响）。
2. **设计步骤 2.3（demo e2e）删除**（M2）：场景内不存在多行区域条目，判据不可执行；4b 由 2.1 自检断言承担。
3. **设计步骤 3.3 验证方式**（M4）：由"临时调用 buildSpans"改为 painter.js 自检断言。
4. **改动清单扩 2 文件**（m1）：`painter.js`（table-paint）、`click-resolve.js` 注释同步，超出设计原 8 文件清单。
5. **警告文案调整**（m2）：去掉与 key 去重矛盾的"该行忽略"。
6. **步骤 1.3 判据口径修正**（M3）：内容坐标期望 = 固定区右缘(相对 wrap) + scrollLeft；"滚至中部"改"滚至最大后取部分遮挡列"（实测 max scrollLeft=282.7 时第 4 列部分遮挡 62.7px，评审"滚至中部无遮挡"的否证成立）。

## 自检

### 修复前 Red（步骤 2.1 判据，playwright `/data/table-ex/?t=red1`）

- 自检 241/243，恰 2 条红（新增断言）：
  - 问题 3：「锚行 0 link 条目组应保留（12 条截断 10），实际 缺失」
  - 问题 7：「数组形态警告条数（多行仅一条）期望 1，实际 2」（数组走索引串警告 ×2）

### 修复后 Green

- `/data/table-ex/?t=green1` 与 `?scene=spans&t=spans1`：自检 **243/243 全绿**（含新增 2 断言：整幅 + header 帧 + 区域外行带帧后锚行条目均保留、无 spans 对照窗口外删除不变、数组警告 1 条且文案含"对象/数组"、对象路径不回归；既有 241 项无回归）。console 1 error 为 demo 夹具故意的坏 data URL（修复前后一致，与本任务无关）。
- `/data/table-advanced/?t=fixed1`（片 1，DOM 断言）：
  - 1.2：滚至 max scrollLeft=282.7 后 th0/th1 `getBoundingClientRect().left` 不变（钉住），th2（邮箱）左移 >50px；th1 含 `last-fixed-col`，th2/th3 无 `fixed-col`——恰好固定 2 列 ✓。
  - 1.3（M3 修正口径）：滚至最大，第 4 列（地区，部分遮挡 62.7px）hover 表体格：`--hover-col-left = 502.67 = 固定区右缘 220 + scrollLeft 282.67` ✓、`--hover-col-width = 57.33 = 120 − 62.67` ✓；固定列 hover：left = 283 = 0 + scrollLeft（对齐钉位）✓；滚回顶部无遮挡列：left = 440 = 布局位置、width = 120（offset 0）✓。
  - 顺带 m4 实测：滚动后 sticky th offsetLeft 0→283 / 80→363（含 scrollLeft），普通 td offsetLeft 440 恒定（内容坐标）——已知限制记录成立，问题 2 公式依赖的普通格口径经实测确认。
- `/data/table/?t=reg1`（4d）：15 表格渲染正常，无固定列表 hover 列指示 offset=0（left=0、width=56 正确），布尔列显示正常。
- `npm run build`：通过（dev + ex-production 两次 vite build 成功；输出仅 npm 配置警告，非构建错误）。

### 范围核对（m5）

- 实施前基线：11 M + 9 ??（任务外既有，含 self-checks 5 文件与 painter.js 已是 M）。
- 实施后新增 M 恰为上表 9 文件（`painter.js` self-checks 为基线 M 上的末尾追加）；?? 项无新增触碰。与终审后改动清单一致。

## 遗留

1. **m4 已知限制（不改码）**：横向已滚动时若 `sizechange` 触发，`fixedColumnsWidth` 会含 scrollLeft（sticky th offsetLeft 语义），问题 2 公式随之偏大。验证时避免滚动后再触发 resize；后续如需修复属独立任务。
2. **m3 表述修正**：02-design.md 问题 6 证据第 3 条"估高链不消费 `_render`"过宽，正确口径见裁决表（本记录）；若后续统一 bool 空值产物形态（`return null`），须按修正口径重新评估。
3. **4b 的 e2e 层验证**：spans 场景无可点击的多行区域条目（M2），浏览器面板断言（243/243 含该链路）为 4b 的验证载体；若需真 e2e（点击区域内链接），需另批扩展 demo 夹具。
4. **验证入口（供 verifier）**：
   - 自检面板：`/data/table-ex/?t=<ts>`（页面加载自动跑，「重跑自检」按钮可重跑），新增断言位于 painter 模块末两条。
   - 片 1 判据：`/data/table-advanced/?t=<ts>` 固定列表（第二个 section）；脚本模式见本记录「自检」1.2/1.3 段（mouseenter dispatch + ≥120ms 等待节流 + ≥450ms 等待 scrolling 复位）。
   - 经典回归：`/data/table/?t=<ts>`。
