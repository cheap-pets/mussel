# 实施记录：S4（painter.js）

模式：串行集成步骤 / 步骤 S4。白名单：`src/components/table-ex/painter.js`（仅此文件）。
依赖：G1-a（constants/editor）、G1-b（cell-painters）、G1-c（theme/interactions/scss）已全部合入，按其已落地 API 对接（`drawCell` 新参 `rightInset`/`hoverItem`、`requestIconImage`、`linkHoverColorOf`、`editorRectOf` 恒等、`editorButtonRectOf`、constants 四新常量）。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| src/components/table-ex/painter.js | S4（问题 1/3/5/6/9） | 见下 |

改动摘要（net +128/−43）：

- **import**：`./cell-painters.js` 增 `requestIconImage`；`./editor.js` 增 `editorButtonRectOf`；`./constants.js` 增 `CELL_LINE_HEIGHT_FALLBACK`、`ROW_TOP_INSET`、`EDITOR_BUTTON_AREA`、`EDITOR_BUTTON_ICON_SIZE`。
- **模块头**：分区 5 层列表补「编辑按钮图标」；state 契约新增 `hoverItem`（`{ row, col, kind, index, disabled } | null`，drawCellClipped 仅对 hover 格注入三字段；hoverMode none 时壳归一 null）与 `editingCell`（`{ row, col } | null`，veil 跳绘 + 清命中组）两字段；itemHits 条目形状更新为 `{ kind, index, rect, disabled }`（disabled 问题 7 isTruthyAttr 口径，veil 格整组清空）。
- **drawCellClipped（问题 1/6/7/9）**：抽三个纯助手——`isVeiledCell`/`veilEditingCell`（editingCell 命中格跳过 drawCell 并**显式清空本格 itemHits 组**为 `[]`，防浮层下点中残留条目；行背景带与格线照画）、`rightInsetOf`（`(非末列 || blankTail) && isGridlineMode(gridlines ?? 'all', 'column')` → 1，blankTail = `layout.stickyWidth > (layout.contentWidth || 0)` 与问题 9 同一派生式）、`cellHoverItemOf`（仅 hover 格产出 `{ kind, index, disabled }`）；`clipIfPartial` 抽取（原 partial save/clip/restore 逻辑不变，控制函数复杂度）。
- **paintColGridlines / paintHeaderColLineRange（问题 9）**：break 条件 `c >= n - 1` → `c >= n - 1 && !blankTail`，`blankTail` 就地求值（同上派生式，不入 state）；线位/颜色/门控全部沿用既有口径，无空白区行为不变。
- **paintTreeArrowAccent（问题 1）**：centerY 由 `viewportRowY + heightAt(row)/2` 改槽位式 `viewportRowY + ROW_TOP_INSET + cellPadding + cellLineHeight / 2`（padding/lineHeight = 快照 `cellPadding`/`cellLineHeight`，回退 `CELL_PADDING_FALLBACK`/`CELL_LINE_HEIGHT_FALLBACK`）；删除仅剩此一处使用的 `geometry` 变量；函数头注补「与 cell-painters drawCell centerY 同式同值，超高行不再错位出双层边」。
- **paintHoverEditorStroke（问题 3）**：删除 `gridlines` 变量与 `topGridline`/`rightGridline` 实参，`editorRectOf(cellRectAt(...))` 无参调用恒等整格，`strokeRect(left+0.5, top+0.5, w−1, h−1)` 1px 内描边与格线重叠；头注改记问题 3 口径（EDITOR_GAP 作废）。
- **paintEditorButton（问题 5，新增）**：hover 格所在列 `editorButton.icon` 存在时（prepareColumn 展开原始列字段，内部列直接可读），经 `editorButtonRectOf(cellRectAt(...), { padding, lineHeight })` 取区矩形（centerY = 首行槽位锚），`requestIconImage(icon, theme.textColor, () => state.onImageLoad?.(hover.row, hover.col))` 取缓存条目，仅 `status === 'loaded'` 才 `drawImage(EDITOR_BUTTON_ICON_SIZE 居中于 EDITOR_BUTTON_AREA 区)`（inset = (24−16)/2 = 4）；loading/failed 不半绘制，onLoad 经 withImageRelay 转 invalidateCell 联动重绘；hoverMode none 随 paintHoverOverlay 门控一并抑制。
- **paintHoverOverlay**：末尾（树箭头主色之后）挂 `paintEditorButton`，绘制顺序 = 高亮 → 编辑描边 → 树箭头主色 → 编辑按钮；头注同步。
- **未改**：`drawHeaderCell`/`drawSortIcon`（问题 8 组件侧零改动，diff 中 drawHeaderCell 相关行数 0）；自检、demo、其他源码均未触碰。

## 偏离

无。两点边界内说明（非方案偏离）：

1. 新增 `EDITOR_BUTTON_AREA` import（设计改动清单只列 `CELL_LINE_HEIGHT_FALLBACK`、`ROW_TOP_INSET`）——「接口 / 数据结构」节明示图标 16×16 居中于 24×24 区、两常量已由 G1-a 落地 constants.js，按镜像常量收拢惯例引用而非写字面量（与 G1-a 记录的 `EDITOR_BUTTON_AREA` import 同理）。
2. 为满足 eslint complexity ≤10 / multiline-ternary（基线 0/0），将 veil 判定、rightInset 求值、hoverItem 求值、partial clip 抽为四个模块内纯助手（`isVeiledCell`/`veilEditingCell`/`rightInsetOf`/`cellHoverItemOf`/`clipIfPartial`），行为与设计逐条对应，无逻辑变化。

## 自检（S4 完成判据逐条）

| 判据 | 方式 | 结果 |
|---|---|---|
| eslint 单文件通过 | `NODE_PATH=/usr/local/lib/node_modules npx eslint src/components/table-ex/painter.js` | 0 error / 0 warning，exit 0 |
| paintTreeArrowAccent centerY 与 cell-painters 槽位式逐值相等（r≥1 与 row 0 两态） | esbuild 打包 + stub ctx 直调 `draw`（树夹具：treeNode 列 + flatInfo levels [0,0,1] / hasChildren [true,true,false] + 变高行 [36,60,36]），提取两分区三角形坐标：hover row 1（r≥1，h=60）常态/accent centerY 同为 **90**（= 36+36+1+8+9；旧式 heightAt/2 = 102）；hover row 0（r=0，h=36）同为 **54**（= 36+1+8+9 = 旧式 36+18）；两态 moveTo/lineTo 三点坐标逐值相等，无 0.5px 错位 | PASS（8 断言） |
| veil（editingCell 跳绘 + 显式清空 itemHits） | 同 harness：预置 (0,0) 命中组含一条假条目 → 整帧绘制后该组 `=== []`；veil 格锚位（y=54）无 fillText；同 row 右格 fillText 照常；行背景带 fillRect(0,36,W,36) 照画 | PASS（4 断言） |
| rightInset 注入门控 | 3×100 列 center 对齐：all 无空白 → x [49.5, 149.5, 250]；all + blankTail（stickyWidth 400 > contentWidth 300）→ 末列 249.5；row 模式 → 门控归 0 [50, 250]；column 模式 → [49.5, 149.5, 249.5] | PASS（4 断言） |
| hoverItem 注入门控 | 双 link 列（color: primary），hoverItem 仅 {row:0,col:1,kind:'link',index:0}：hover 色（#222222）fillText 恰 1 处且落在 col1 x 区间；常态色（#111111）恰 3 处（col0 两条 + col1 次条）；下划线 fillRect 恰 1 条（y=61 = 54+5+2，x 在 col1） | PASS（5 断言） |
| paintEditorButton | FakeImage 同步 onload：loaded → drawImage 恰 1 次且参数 (·, 112, 46, 16, 16)（editorButtonRectOf(0,36,140,36) → 区 x=108,y=42 + inset 4）；PendingImage 不 onload → 无任何 drawImage（不半绘制）且整帧无异常；gridlines row / 无空白对照下末列线不画 | PASS（10 断言） |
| paintHoverEditorStroke 整格描边 | 整帧含 `strokeRect(0.5, 36.5, 139, 35)` = 格 (0,36,140,36) 的 1px 内缘（无参 editorRectOf 恒等） | PASS（含上组） |
| blankTail 末列线（问题 9） | blankTail：表体 `fillRect(239, 36, 1, ·)` 与表头 `fillRect(239, 0, 1, 35)` 均存在；无空白（stickyWidth 240 = contentWidth）与 gridlines 'row' 两态该线不画 | PASS（4 断言） |
| 无 drawHeaderCell 树态改动 | `git diff` 中 drawHeaderCell 相关增删行数 = 0；drawSortIcon/isSortableHeader 未触碰 | PASS |
| 白名单 | `git status` 本轮仅 painter.js 为本组改动（树中 badge.*/props.js 等为他组/既有在途状态，未触碰） | PASS |

harness 合计 **30 passed / 0 failed**（临时文件在 /tmp，已清理，未触碰仓库）。

## 遗留

- 页面级验证（A1–A11 全表）不在本组判据：S5（table-ex.vue 壳接线）与 G2 各组落地后由 V 集成验证执行；`hoverItem`/`editingCell` 两 state 字段当前壳侧尚未接线（S5），painter 侧契约已就绪（缺省 undefined 时行为与现状一致，不影响 G2 前的任何既有路径）。
- eslint 需 `NODE_PATH=/usr/local/lib/node_modules` 前缀（沿用 G1 各组环境备注；本地 node_modules 缺 eslint-config-standard）。
- requestIconImage 的 SVG data URL 浏览器 onload 行为（R5 唯一未验点）归浏览器验证阶段。
