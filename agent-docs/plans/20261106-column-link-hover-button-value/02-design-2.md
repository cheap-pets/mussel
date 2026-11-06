# 设计（追加轮 2：背景截断补齐）

## 方案概述

三项绘制范围收缩，全部位于 canvas 通道 painter 簇，无公共 API 变更；R5 空白区命中放行（hover 状态 / 光标 / 点击选中）全部保持，仅收缩绘制矩形：

1. **需求 A（表头背景截断）**：`paintHeader` 表头背景 `fillRect(0, 0, W, headHeight)`（`paint-header.js:272-273`）宽度 cap 至 `contentRightX`（与轮 1 末线同式，`paint-header.js:283-284` 同源值）——末列右缘以右不再绘表头背景（decisions.md 追加轮 2 裁定，取代「表头背景仍整宽」）。
2. **需求 B（hover 背景不越界）**：绘制链核查结论——canvas 通道 hover 态背景填充共 3 处（`paint-overlay.js`）：`paintHoverRow` 行带整宽（`:55-57`，列向越界）、`paintHoverCol` 列带整高（`:59-66`，行向越界）、cell 模式 `spanRectOf` 矩形（`:76-80`，天然在有效行列内，不改）；条目级 hover 底衬（`item-painters.js:313-316`、`canvas-kind-painters.js:63-69,177-178`）在格内条目矩形，不越界不改；hover 描边 / 树箭头 / 编辑按钮非背景填充不改。改动仅两函数：行带宽 cap 至 `contentRightX`、列带高 cap 至 `contentBottomY`。
3. **需求 C（选中背景同口径）**：选中背景实为行选中底色 `selectBg`，经分区 1 行带绘制（`paint-body.js:72-73,107-108`），滚动 pass `bandToX = stickyWidth`（`painter.js:95`）使带充满视口右缘 → 列向越界。改法与 hover 同口径（高亮截断、底色保持）：选中行 `selectBg` 带宽 cap 至 `contentRightX`，cap 掉的延伸区补画非选中口径底色（与普通行一致）；单元格选中 `paintCellSelection`（`paint-overlay.js:149-179`）为描边且矩形天然在格内，核查不改。

支撑改动：`paint-utils.js` 提共享 helper `contentRightXOf` / `contentBottomYOf`（轮 1 内联同式收敛为单一定义，6 个消费点去重；`paint-gridlines.js` / `paint-header.js` 内联式等价替换，行为逐字不变）。行满/列满或滚动溢出时 `contentRightX >= stickyWidth`、`contentBottomY >= stickyHeight`（轮 1 已推演，`paint-gridlines.js:152-156` 注释），所有 cap 为 min() 无操作，现状零回归。

DOM 通道（mu-table）列宽铺满容器（轮 1 已查明，`base/table.scss:22-28`），无「列少空白区」，不涉及。

## 遵循约定与复用

本轮无探索报告；约定提取自轮 1 设计（02-design.md「遵循约定与复用」，均已核对仍有效）+ 本轮新核对：

- **视口换算**：`viewportColX` / `viewportRowY`（`table-paint/paint-utils.js:26-31`）；cap 口径与轮 1 `contentRightX` / `contentBottomY` 同式（`paint-gridlines.js:117-126,157-159`、`paint-header.js:283-284`），空表维持现状（rowCount > 0 门控，decisions.md 裁定）。
- **行背景优先级**：`rowBackground` = 选中（selectBg）> 斑马偶行（bgStripe）> 普通（bgNormal）（`paint-utils.js:65-71`）；行底色带充满至视口右缘为 R1/人工 3 意见 1 既有裁定（`paint-body.js:182-184` 头注、自检 `painter.js:1213`），本轮不推翻、只在其上叠高亮 cap。
- **色值**：`theme.colors` / 快照字段（selectBg / hoverBg / bgNormal / bgStripe，`shared/theme.js:116-121`），本轮无新色值。
- **R5 空白区放行**：`hoverCellOf`（`composables/use-pointer.js:59-67`）与 `hitTest.beyondCols`（`interaction/interactions.js:83`）命中判定不改；`paintHoverOverlay` 外层 withClip 表体区裁剪（`paint-overlay.js:224`）不动。
- **自检约定**：`demo/src/data/table-ex/self-checks/painter.js` 像素断言（assertPixel 支持数组期望含 alpha，`:199-207`）；夹具 600×252、默认列满（Σ=630>600，`:87-90`）、窄列夹具 Σ=350（`:1216-1227`）。
- **demo 约定**：复用「格线截断（行少 / 列少）」section（`demo/src/data/table-ex-basic/main-view.vue:92-101`，sparseColumns Σ=290 × 3 行 × 320px）；hover-mode 控件复用「样式与 hover 反馈」section 的 `hoverMode` ref（`:70-79`）；行选中受控口径复用基础用法 section 的 `selected-record-key` 绑法（`:10-13`）。
- **注释风格**：改动处中文注释注明出处/决策依据（与模块现状一致）。

## 改动清单

| 文件 | 改动 | 原因 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-utils.js` | 新增导出 `contentRightXOf(layout)` / `contentBottomYOf(layout)`（视口口径现算，公式与轮 1 逐字同式）；`rowBackground` 拆出 `baseRowBackground(state, row)`（非选中口径底色）并导出 `isSelectedRow` | 需求 A/B/C 共 6 个 cap 消费点同式去重；需求 C 补底色需非选中口径底色（避免优先级链双源漂移） |
| `src/components/table/ex/table-paint/paint-header.js` | 表头背景 `fillRect(0, 0, W, headHeight)` 宽度改 `Math.min(W, contentRightXOf(layout))`；`:283-284` 内联 contentRightX 式改用 helper；`:271` 注释「表头背景仍整宽」同步 | 需求 A（decisions.md 追加轮 2 裁定取代旧裁定） |
| `src/components/table/ex/table-paint/paint-gridlines.js` | `paintGridlines` / `paintColGridlines` 内联 cap 式（`:117-126,157-159`）改用 helper | 等价重构（与轮 1 行为逐字一致），同式收敛至单一定义 |
| `src/components/table/ex/table-paint/paint-overlay.js` | `paintHoverRow` 宽 `layout.stickyWidth` → `Math.min(layout.stickyWidth, contentRightXOf(layout))`；`paintHoverCol` 高 `layout.stickyHeight - headHeight` → `contentBottomYOf(layout) - headHeight`；两函数及 `paintHoverHighlight` 注释同步（hover 带不越界口径） | 需求 B：行带列向 / 列带行向 cap；cell 模式核查不越界不改 |
| `src/components/table/ex/table-paint/paint-body.js` | `paintBodyRow` / `paintBodyRowSpans` 行带绘制分支：选中行（`isSelectedRow`）`selectBg` 带宽 cap 至 `contentRightXOf(layout)`，cap 掉的延伸区补 `baseRowBackground` 底色；非选中行维持现状；`paintCellRange` 头注 bandToX 说明补选中口径 | 需求 C：选中高亮与 hover 同口径（截高亮、保底色）；行向天然有效（带高 = heightAt(row)） |
| `src/components/table/ex/composables/use-pointer.js` | `hoverCellOf` 头注「行带高亮整宽」→「行带高亮至末列右缘」（仅注释，R5 放行逻辑不动） | 需求 B 后注释与实现一致 |
| `demo/src/data/table-ex-basic/main-view.vue` | sparse 表：绑 `:hover-mode="hoverMode"`（复用既有 ref `:263`）与 `v-model:selected-record-key="sparseSelectedKey"`（新增 ref）；section note（`:94`）更新（表头背景止于末列右缘 + hover/选中高亮不越界） | 需求 B/C 的 demo 验证夹具（列带 cap 需 column/cross 模式、选中需受控行键）；`:94` note 中「表头背景仍整宽」已过时。**sparse 表不绑 `:striped`**（`striped` prop 为 `Boolean`、默认 false，`table-ex.vue:118`）→ 三行为 bgNormal，斑马行延伸区底色不在 demo 验证范围，改由自检夹具覆盖 |
| `demo/src/data/table-ex/self-checks/painter.js` | 「行背景带宽度」检查项（`:1212-1270`）：断言 `:1236`（选中底色充满延伸区）、`:1241`（hover 行带延伸区混色）、`:1250`（脏区重绘延伸区）按新口径改写；并入 4 组新断言（表头背景右界透明、hover 行带右界、hover 列带下界（行少夹具）、选中带右界 + 延伸区底色，含斑马行 bgStripe 延伸区）；检查项 name（`:1213`）、return（`:1268`）与模块头 `:10-11` 描述同步。采样坐标与期望值见「实施步骤 集成」 | 自检 223/223 保持（夹具随新契约同步，检查项数不变；断言全部落在既有检查项内，不新增检查项） |

测试文件：无测试框架，不新增；验证经 demo + playwright + 自检页（见测试计划）。

## 接口 / 数据结构

均为 painter 簇内部扩展，无公共 API 变更。

**1. paint-utils.js 新导出**（与 `viewportColX` / `viewportRowY` 同层）

```js
/** 有效内容右缘视口 x（末列右缘；n=0 时 0）——格线/表头/hover/选中 cap 同源式 */
export function contentRightXOf (layout) {
  const n = layout.colWidths.length
  return n ? viewportColX(layout, n - 1) + (layout.colWidths[n - 1] || 0) : 0
}

/** 有效内容底缘视口 y（末行底部；行满/溢出时 ≥ stickyHeight，min() 无操作；
    空表维持 stickyHeight 现状，decisions.md 裁定） */
export function contentBottomYOf (layout) {
  return layout.rowGeometry.rowCount > 0
    ? Math.min(layout.stickyHeight,
        layout.headHeight + layout.rowGeometry.totalHeight - layout.scrollTop)
    : layout.stickyHeight
}

/** 非选中口径行底色（斑马/普通；rowBackground 去选中分支） */
export function baseRowBackground (state, row) {
  return state.striped && row % 2 === 1 ? state.theme.bgStripe : state.theme.bgNormal
}

export function isSelectedRow (state, row) { /* 原模块私有函数原样导出 */ }

// rowBackground 重排（行为等价）：
// selected ? selectBg : baseRowBackground(state, row)
```

**2. paintHeader 表头背景 cap**（`paint-header.js:272-273`）

```js
ctx.fillStyle = theme.bgFill
ctx.fillRect(0, 0, Math.min(W, contentRightXOf(layout)), headHeight)
```

- n=0（无列）时宽 0，与轮 1 末线 cap（`:287`）同口径；表头内容 / 列分隔线 / 底边框均在列区内，不受影响。
- 擦除链路（`painter.js:68-76` paintHeaderPass 整表头 withClip + eraseClipRegion）不变：cap 后右侧被擦除为透明，不再回填。

**3. paintHoverRow / paintHoverCol cap**（`paint-overlay.js`，纯内部）

```js
function paintHoverRow (ctx, layout, row) {
  // 宽 cap：列少时不绘入末列右缘以右（追加轮 2 需求 B；列满/溢出 min() 无操作）
  ctx.fillRect(0, viewportRowY(layout, row),
    Math.min(layout.stickyWidth, contentRightXOf(layout)),
    layout.rowGeometry.heightAt(row))
}

function paintHoverCol (ctx, layout, col) {
  // 高 cap：行少时不绘入末行底部以下（与格线 contentBottomY 同源式）
  const yTo = contentBottomYOf(layout)
  ctx.fillRect(viewportColX(layout, col), layout.headHeight,
    layout.colWidths[col] || 0, yTo - layout.headHeight)
}
```

- cell 模式（`spanRectOf`）与 cross 模式两条带分支结构不动；R5 空白区命中（col=-1）时 colValid false，列带本就不画。
- 行 hover 状态出现的前提是 rowCount > 0（`hoverCellOf` 需 rowIndex ≥ 0），`contentBottomYOf` 的空表门控在 hover 路径恒走有效分支。

**4. 选中行带 cap + 补底**（`paint-body.js` `paintBodyRow` / `paintBodyRowSpans`，两处同构）

```js
// 伪代码（替换原 ctx.fillStyle = rowBackground(state, r); fillRect(x0, y, bandWidth, rowHeight)）
const bandEnd = x0 + bandWidth                 // bandWidth 语义不变（bandToX = stickyWidth）
const selected = isSelectedRow(state, r)

if (!selected) {                               // 非选中行：现状逐字不变
  ctx.fillStyle = rowBackground(state, r)
  ctx.fillRect(x0, y, bandWidth, rowHeight)
} else {
  const capEnd = Math.min(bandEnd, contentRightXOf(layout))
  ctx.fillStyle = rowBackground(state, r)      // selectBg（混色现状不变）
  ctx.fillRect(x0, y, capEnd - x0, rowHeight)
  if (capEnd < bandEnd) {                      // 延伸区补非选中口径底色（与 hover cap 后露出一致）
    ctx.fillStyle = baseRowBackground(state, r)
    ctx.fillRect(capEnd, y, bandEnd - capEnd, rowHeight)
  }
}
```

- 列满/滚动溢出：`contentRightX >= stickyWidth >= bandEnd` → cap 无操作、无补画，选中行现状逐字不变（自检 `painter.js:428,434` 列满断言保持）。
- 固定列 pass：不传 bandToX，`bandEnd = 固定列区右缘 ≤ contentRightX` 恒成立 → cap 无操作（`painter.js:320` 调用、`paint-body.js:182-184` 头注）。
- region pass（`paintSpanRegions`，`paint-body.js:147-156`）：区域矩形由 `spanRegionRect` 列几何构成，右缘 ≤ contentRightX，天然不越界，不改。
- 行向：选中带高 = `heightAt(row)` 天然有效；选中无行向越界问题（hover 列带同理只有行向问题）。

## 被拒绝的备选

1. **选中带整体 cap、延伸区留透明**。拒绝：与 hover 口径不一致——hover 带 cap 后延伸区露出的是整宽行底色带（R1 裁定），选中行却透明，相邻普通行（底色充满）与选中行（透明）在延伸区形成底色断层；且透明透出页面背景，视觉突兀。
2. **选中行底色整宽 + selectBg 分段叠加（先画 baseBg 再整宽/分段叠 selectBg）**。拒绝：改变列满场景现状混色——现状滚动 pass 选中带为透明画布上 selectBg 原色（自检 `painter.js:428` 断言），叠加式变为 blend(selectBg, baseBg)，违反「行满/列满现状不回归」验收基线。
3. **行底色带（bgNormal/bgStripe）随选中一并截断**。拒绝：行背景充满至视口右缘为 R1/人工 3 意见 1 已确认裁定（decisions.md 无推翻记录），且需求 B/C 仅约束「hover / 选中高亮」，不约束普通底色。
4. **relayout 预计算 contentRight / contentBottom 字段供 painter 消费**。拒绝：轮 1 已拒绝（视口坐标随 scrollTop/scrollLeft 变化，paint 时现算才是正确口径）；本轮沿用。

## 风险与回滚

- **单向/双向门**：全部双向门（绘制矩形收缩 + 等价重构，无 API/数据结构破坏）；无共享生成文件。
- **透明区视觉**：表头背景与 hover/选中高亮 cap 后，末列右缘以右画布透明（`.mu-table-ex__canvas` 与壳无 CSS 背景，`table-ex.scss:38-40,10-22`），透出页面背景（demo 页白 vs bgFill 浅灰有可感知差异）——「去掉」即透明的用户指令预期（decisions.md 追加轮 2）；普通行底色带仍充满延伸区，表体区无此断层。
- **不回归推演**：列满/溢出与固定 pass 的 min() 无操作已在上文逐路径推演；轮 1 格线断言、自检 `painter.js:386-387`（表头底色，列满夹具）、`:428/:434`（选中底色，列满）、`:516-530`（hover 带，列满 50 行夹具）、`:857-897`（hover 描边，列区内采样）均不受影响；R5 命中放行自检（`interactions.js:127` 检查项）不动。
- **半透明混色链路**：hoverBg/selectBg 半透明叠加依赖下层行底色带合成起点；cap 后带外区域无高亮层、底色带不变（普通行）或补齐（选中行），无「半透明高亮画在透明画布上」的混色断层；脏区路径（行带/列带/单格均整 clip 擦除重画，`painter.js:79-173`）先擦后画，无旧高亮残留。
- **回滚**：按改动清单逆向编辑逐文件回退。**不得用 `git checkout`**——工作区含未提交基线改动（decisions.md 约束）。
- **并行风险**：片A 与片B 文件集合不相交；片C 与集成片串行（见实施步骤）。

## 测试计划

环境同轮 1：rollup watch 常开，直访 `http://localhost:3000/data/table-ex-basic/`（注意实际路径含 `/data/` 前缀，04-impl.md 环境说明）；playwright mcp；像素探针 `evaluate` + `getImageData`，坐标换算 `cssX × canvas.width / canvas.clientWidth`（dpr=2，轮 1 口径）。验证表 =「格线截断（行少 / 列少）」sparse 表（3 行 × Σ290 窄列（90/110/90）× 容器高 320px（`main-view.vue:100` `height: 320px`）+ demo-section `wide`，容器宽 ≈1000 ≫ 340）；探针参考点：末列右缘 x≈290（css 坐标，实施时以实际布局换算），列内参考 x≈250，延伸区参考 x≈340；末行底 y≈144（表头 36 + 3×36）。

| 验收标准 | 片 | 手段 | 检查方式 |
|---|---|---|---|
| 需A 末列右缘以右不绘表头背景 | 片A | 浏览器 | sparse 表：探针 x≈340、表头 y 段（headHeight/2）alpha=0（透明）；x≈230 同 y 为表头背景色（`--mu-bg-fill` 谱系；末列 caption「数量」右对齐文字左缘 ≈254，取 230 避开字形）；末列内表头文字/列分隔线正常（截图辅助） |
| 需A 行满/列满表头背景不回归 | 终验 | 浏览器 | 基础用法表（200 行 flex 列铺满）：容器右缘内 x 处表头 y 段仍为表头背景色（整宽铺满） |
| 需B-1 行 hover 带不越末列右缘 | 片B | 浏览器 | sparse 表（默认 hover-mode=row）hover 任意行：行带 y 处 x≈250 为 hover 混色（底色叠 `--mu-gray-translucent`）、x≈340 为行底色原色（无 hover 混色）；移出后还原 |
| 需B-2 列 hover 带不越末行底部 | 片B | 浏览器 | hover-mode 切 column（radio 控件联动）hover sparse 表「名称」列：列带 x 处 y≈100 为 hover 混色、y≈200（> 末行底 144）为透明（alpha=0，行少区无底色带） |
| 需B-3 cell / cross 模式无回归 | 片B | 浏览器 | hover-mode 切 cell：hover 单格高亮限于格矩形（格内混色、格外底色）；切 cross：行带 + 列带同时按需A/B 口径截断（探针两点复判） |
| 需C 选中底色不越末列右缘 | 片C | 浏览器 | 点击 sparse 表第 1 行（id 1 = 行索引 0，行中心 y≈54；`v-model:selected-record-key` 受控）：x≈250 为 selectBg（列内）、x≈340 为 bgNormal（延伸区非选中口径底色）；再点第 3 行（id 3 = 行索引 2，y≈126）表现同（**sparse 表未绑 `:striped`，`striped` 默认 false → 三行均 bgNormal**；斑马行延伸区 = bgStripe 由自检夹具 `selectedKey: 1` 断言覆盖） |
| 基线 行满/列满 hover 与选中不回归 | 终验 | 浏览器 | 基础用法表：hover 行 → 行带混色延伸至容器右缘（x≈右缘-2 处仍 hover 混色）；点击选中 → selectBg 铺满整行宽（现状口径）；`/data/table/` DOM 通道无回归（本轮不涉及，抽查渲染正常） |
| 自检 223/223 | 集成 | 浏览器 | `/data/table-ex/` 自检页全通过（检查项数不变；「行背景带宽度」检查项按新口径改写后通过） |
| 编译检查 | 终验 | 命令 | `npm run build` 通过 |

## 实施步骤

改动可拆为 3 个独立可演示行为（A / B / C），但片C 依赖片A 的 helper（`paint-utils.js` 共享）、片B 与片C 共享 demo 文件，故 A/B 可并行、C 与集成串行：

**片A（需求 A：表头背景截断 + helper 收敛）** — 依赖：无

1. `paint-utils.js`：新增 `contentRightXOf` / `contentBottomYOf` 导出。
2. `paint-gridlines.js`：两处内联 cap 式改用 helper（等价替换，`node --check` + 自检页格线断言不回归为判据）。
3. `paint-header.js`：表头背景宽度 cap；`:283-284` 内联式改 helper；注释同步。
   - 完成判据：demo sparse 表末列右缘以右表头 y 段透明、列内表头背景正常；基础用法表头背景铺满不变。对应验收：需A + 需A 不回归。
   - 文件：`paint-utils.js`、`paint-gridlines.js`、`paint-header.js`。

**片B（需求 B：hover 带不越界）** — 依赖：无（与片A 并行，文件集合不相交）

1. `paint-overlay.js`：`paintHoverRow` 宽 cap、`paintHoverCol` 高 cap，注释同步。
2. `use-pointer.js`：`hoverCellOf` 注释「行带高亮整宽」字样同步（无逻辑改动）。
3. demo `main-view.vue`：sparse 表绑 `:hover-mode="hoverMode"`；section note 更新。
   - 完成判据：需B-1/2/3 三态探针通过；R5 空白区 hover 行（延伸区命中）行带仍出现（止于末列右缘）。对应验收：需B。
   - 文件：`paint-overlay.js`、`use-pointer.js`、`demo/src/data/table-ex-basic/main-view.vue`。

**片C（需求 C：选中带同口径）** — 依赖：片A（helper）、片B（demo 文件先行动作完成）

1. `paint-utils.js`：`baseRowBackground` 拆分 + `isSelectedRow` 导出。
2. `paint-body.js`：`paintBodyRow` / `paintBodyRowSpans` 选中行带 cap + 延伸区补底；`paintCellRange` 头注补充。
3. demo `main-view.vue`：sparse 表绑 `v-model:selected-record-key`（新增 `sparseSelectedKey` ref）。
   - 完成判据：点击 sparse 表行选中 → 选中带止于末列右缘、延伸区为非选中口径底色（需C）；基础用法表选中行铺满不变（基线）。对应验收：需C。
   - 文件：`paint-utils.js`、`paint-body.js`、`demo/src/data/table-ex-basic/main-view.vue`。

**集成（自检同步 + 全量验证）** — 依赖：片A、片B、片C

1. `demo/src/data/table-ex/self-checks/painter.js`「行背景带宽度」检查项（`:1212-1270`）：
   - 改写 `:1236`（「选中底色充满延伸区」）为两点：`(250,126)` 期望 `THEME.selectBg`（status 列内；不用 x=340——amount 列 currency 右对齐文本右缘 ≈341，会采到字形）、`(450,126)` 期望 `THEME.bgNormal`（selectedKey=2 → 行索引 2 偶数，非选中口径底色）；`:1229-1230` 注释同步。
   - 改写 `:1241`（「hover 行带延伸区混色」）→ `(450,90)` 期望 `THEME.bgStripe`（hover 行带止于 contentRightX=350，延伸区无 hoverBg 叠加）；`:1250`（脏区重绘）→ `(450,50)` 期望 `THEME.bgNormal`；`:1252` 保持。
   - 并入新断言：表头背景右界 `(450,4)` 期望 `[0,0,0,0]`、`(300,4)` 期望 `THEME.bgFill`（'金额' 右对齐文字 ≈314..342，300∈空白）；窄列 3 行夹具（`makeRecords(3)` + `hoverMode: 'column'` + `hover: { row: 1, col: 2 }`）列带下界 `(200,100)` 期望 `blendColor(THEME.hoverBg, THEME.bgStripe)`、`(200,200)` 期望 `[0,0,0,0]`（末行底 144 < 200，画布高 252）；选中斑马行延伸区（窄列夹具 `selectedKey: 1`）`(250,90)` 期望 `THEME.selectBg`、`(450,90)` 期望 `THEME.bgStripe`。
   - name（`:1213`）、return（`:1268`）与模块头 `:10-11` 描述同步（行底色带仍整宽；hover / 选中高亮止于末列右缘）。
   - 检查项数不变（断言均并入既有检查项，总项数保持 223）。
2. 全量验证：测试计划全表 playwright 过一遍 + `/data/table-ex/` 自检 223/223 + `npm run build`。
   - 完成判据：表内全部条目通过。
   - 文件：`demo/src/data/table-ex/self-checks/painter.js`。

## 未解问题

无阻塞项。三点记录（不改变方案，供验收时对齐预期）：

1. **R5 空白区命中放行保留**：末列右缘以右的空白延伸区 hover / 点击选中仍生效（hover 状态、pointer 光标、行选中），仅高亮背景不再绘入该区。若用户预期「空白区完全无 hover/选中反馈」，需另行指令（涉及 `interactions.js` hitTest 的 beyondCols 放行逻辑，超出本轮「绘制不越界」验收范围）。
2. **cap 后空白区为画布透明**（透出页面背景），非任何填充色：用户指令为「去掉 / 不得绘入」，按透明实现；表头区（bgFill 浅灰 → 页面背景）与表体高亮区（高亮色 → 行底色）视觉变化即需求预期。
3. **旧验收口径滞后（非阻塞，仅提醒验证者）**：`00-task.md:31`「表头背景仍整宽」与 `02-design.md:181`（轮 1 测试行）已被追加轮 2 指令取代（`decisions.md:9-12`）；验证者须按本设计需A 判据（末列右缘以右表头 y 段 alpha=0）判定，不得据旧文本判为回归。`00-task.md`/`02-design.md` 不改（历史记录）。
