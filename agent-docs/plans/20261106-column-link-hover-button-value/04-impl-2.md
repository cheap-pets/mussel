# 实施记录（追加轮 2：背景截断补齐）

设计输入：02-design-2.md（amender 共写定稿，含 06-amend-2.md 台账修正）；基线约束（decisions.md）已遵守：未回退任何未提交改动（轮 1 + 夹具修复保留原样），未执行 checkout/stash/commit。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/table/ex/table-paint/paint-utils.js` | 片A 步骤1 + 片C 步骤1 | 新增导出 `contentRightXOf` / `contentBottomYOf`（视口口径现算，与轮 1 内联式逐字同式；`contentBottomYOf` 保留空表 rowCount > 0 门控）；`isSelectedRow` 由模块私有改为导出；新增导出 `baseRowBackground`（斑马/普通非选中口径底色）；`rowBackground` 重排为 `selected ? selectBg : baseRowBackground(...)`（行为等价） |
| `src/components/table/ex/table-paint/paint-gridlines.js` | 片A 步骤2 | `paintGridlines` / `paintColGridlines` 内联 cap 式改用 `contentRightXOf` / `contentBottomYOf` helper（等价替换，注释同步共享式出处；行为逐字不变） |
| `src/components/table/ex/table-paint/paint-header.js` | 片A 步骤3 | 表头背景 `fillRect(0, 0, W, headHeight)` 宽度改 `Math.min(W, contentRightX)`（追加轮 2 裁定：末列右缘以右不再绘表头背景，n=0 时宽 0 与末线同口径）；`contentRightX` 上提为函数级单次求值，底边框与背景共用；`:271` 「表头背景仍整宽」旧注释替换为追加轮 2 裁定说明 |
| `src/components/table/ex/table-paint/paint-overlay.js` | 片B 步骤1 | `paintHoverRow` 宽 `layout.stickyWidth` → `Math.min(layout.stickyWidth, contentRightXOf(layout))`；`paintHoverCol` 高 `layout.stickyHeight - headHeight` → `contentBottomYOf(layout) - headHeight`；两函数注释与 `paintHoverHighlight` 头注同步（hover 带不越界口径；cell 模式 spanRectOf 天然在格内不改） |
| `src/components/table/ex/composables/use-pointer.js` | 片B 步骤2 | `hoverCellOf` 头注「行带高亮整宽」→「行带高亮至末列右缘（追加轮 2 需求 B 绘制 cap 后口径）」（仅注释，R5 放行逻辑逐字未动） |
| `src/components/table/ex/table-paint/paint-body.js` | 片C 步骤2 | `paintBodyRow` / `paintBodyRowSpans` 行带分支同构改写：非选中行现状逐字不变；选中行 `selectBg` 带 `capEnd = Math.min(bandEnd, contentRightXOf(layout))`，`capEnd < bandEnd` 时延伸区补 `baseRowBackground`（非选中口径底色）；`paintCellRange` 头注 bandToX 说明补选中口径 |
| `demo/src/data/table-ex-basic/main-view.vue` | 片B 步骤3 + 片C 步骤3 | sparse 表绑 `:hover-mode="hoverMode"`（复用样式 section 既有 ref）与 `v-model:selected-record-key="sparseSelectedKey"`（新增 ref）；section note 更新（水平格线与表头背景止于末列右侧 + hover/选中高亮不越界）；未绑 `:striped`（按设计，三行 bgNormal，斑马延伸区由自检夹具覆盖） |
| `demo/src/data/table-ex/self-checks/painter.js` | 集成 步骤1 | 「行背景带宽度」检查项按新口径改写：`:1236` 拆为 `(250,126)` selectBg（status 列内）+ `(450,126)` bgNormal（延伸区非选中底色）；`:1241` → `(450,90)` bgStripe（hover 行带止于 contentRightX=350）；`:1250` → `(450,50)` bgNormal；`:1252` 保持；新并入断言：表头背景 `(450,4)` `[0,0,0,0]` / `(300,4)` bgFill、3 行夹具（`makeRecords(3)` + hoverMode column + hover {row:1,col:2}）列带 `(200,100)` blend(hoverBg, bgStripe) / `(200,200)` 透明、选中斑马行（selectedKey:1）`(250,90)` selectBg / `(450,90)` bgStripe；name/return 与模块头描述同步（行底色带仍整宽；hover/选中高亮与表头背景止于有效缘）。检查项数不变，总项数保持 223 |

测试文件：无测试框架，未新增（按设计，验证经 demo + playwright + 自检页）。

## 偏离

无设计偏离。两点说明（不构成偏离）：

1. 验证期间 playwright 探针出现 3 次采样全为基色的假阴性：radio 点击触发页面滚动，sparse 画布移出视口（rect y=1133 > 视口高），鼠标落点落空。等待滚动稳定后重测全部通过，与实现无关（见自检）。
2. 片A 的 `paint-header.js` 中轮 1 头注「spans null 分支逐字保留原实现」句子所指的 `paintCellRange` 分支结构未动；选中带改动按追加轮 2 设计落在 `paintBodyRow`（spans null 分支调用的行带绘制）内部，列满场景行为零变化（自检 `:428/:434` 断言保持通过）。

## 自检

项目无 lint/typecheck 脚本（纯 JS），语法检查 `node --check`，行为验证 demo + playwright 像素探针（dpr=2，rollup watch 常开直访，未重复打包）。demo 为暗色主题：bgFill=[45,49,53]、bgNormal=[7,8,8]、hover 混色=[30,32,33]、selectBg 混色=[25,45,75]。

- `node --check` 全部改动 `.js` 文件 + `painter.js`：通过。
- 需A（sparse 表，容器宽 996，contentRightX=290，表头 36 + 3×36 末行底 144）：
  - 通过：表头 y=18 处 x=230/250 为表头背景 [45,49,53]、x=340/450 为透明 [0,0,0,0]；x=450 纵扫 y=0..35 透明、y=36 起行底色、y=144 起透明。
- 需A 不回归（基础用法表，列满铺满）：表头 y=18 x=100/500/993 均为 [45,49,53] 整宽铺满。
- 需B-1（row hover，sparse 默认模式）：hover (250,54) → x=250 混色 [30,32,33]、x=340/x=450 行底色原色 [7,8,8]；移出后全部还原 [7,8,8]。
- 需B-2（column hover，radio 联动）：hover 名称列 → (145,54)/(145,100) 混色、(145,200) 透明 alpha=0（止于末行底 144）、异列 (250,54) 无混色。
- 需B-3：cell 模式 hover (row1,col2) → 仅 (250,54) 混色，同行异列/同列异行/延伸区均基色；cross 模式 hover (row1,col1) → (145,54) 双带叠加 [49,51,53]、行带 (250,54) 混色、列带 (145,90)/(145,126) 混色、行带延伸区 (340,54)/(450,54) 基色、列带 y=200 透明。
- R5 空白区放行保留：hover 延伸区 (340,54) → 列内 (250,54) 行带混色出现（止于末列右缘），延伸区无混色。
- 需C（受控选中，sparse 未绑 striped → 三行 bgNormal）：点第 1 行 → (250,54) selectBg [25,45,75]、(340,54) bgNormal [7,8,8]；再点第 3 行 → (250,126) selectBg、(340,126) bgNormal。
- 基线（基础用法表）：hover 行 → x=100/500/993 全宽混色 [30,32,34]（铺满不回归）；点击选中 → 全宽 selectBg [25,45,75]（现状口径）。
- DOM 通道：`/data/table/` 渲染正常（50 行、3 个 `.mu-table__cell-link`），本轮未涉及 DOM 改动。
- `/data/table-ex/` 自检页：**223/223 通过**；控制台唯一 error 为既有负向夹具 `badSrc` 无效 data URL（设计预期内）。
- `npm run build`：exit=0，4 段构建（base dev/prod 285 modules + ex dev/prod 330 modules）全部通过。

## 遗留

1. 文档三处同步（skills references / docs quick-reference / docs-site）按 00-task 约束不在本轮，待实现经用户确认后统一更新（含本轮表头背景/hover/选中截断口径）。
2. 设计「未解问题」三点记录随验收对齐：R5 空白区 hover/选中命中放行保留（仅绘制收缩）；cap 后空白区为画布透明（透出页面背景）；`00-task.md:31`「表头背景仍整宽」为被取代的旧口径，验证者按 02-design-2.md 需A 判据判定。
3. 临时产物：`.playwright-mcp/` 验证快照与探针日志（未加入 git）。
