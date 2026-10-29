# 实施记录：G1-a（constants.js + editor.js）

任务：canvas-table 改进 · 并发波 1 / 步骤 G1-a。依据 `02-design.md`（终稿）问题 3/4/5 方案与「接口 / 数据结构」节。基线 `mussel-table` @ `3d41296`。

## 改动文件

| 文件 | 对应设计步骤 | 说明 |
|---|---|---|
| `src/components/canvas-table/constants.js` | G1-a（问题 1/5 常量收拢） | 新增 4 常量：`ROW_TOP_INSET = 1`（行顶内容内缩，与 gridlines 无关）、`EDITOR_BUTTON_AREA = 24`、`EDITOR_BUTTON_ICON_SIZE = 16`、`CELL_LINE_HEIGHT_FALLBACK = 18`（--cell-line-height 镜像，供 editor/painter 槽位锚；cell-painters 既有本地 `FALLBACK_LINE_HEIGHT` 与 row-geometry `LINE_HEIGHT_FALLBACK` 未动，按设计避免交叉依赖） |
| `src/components/canvas-table/editor.js` | G1-a（问题 3/4/5） | ① 新增 `./constants` import（`CELL_PADDING_FALLBACK` / `CELL_LINE_HEIGHT_FALLBACK` / `ROW_TOP_INSET` / `EDITOR_BUTTON_AREA`，后者为接口节 `editorButtonRectOf` 产物的 width/height 来源）；② `NON_EDITABLE_TYPES` 补 `link/button/progress`，注释改记「link 20261027 起恢复不可编辑（用户清单 4，decisions [S1]），button/progress 为 canvas 专属展示类型一并排除」；③ 删 `EDITOR_GAP` 与 `gridlineShows`；④ `editorRectOf(rect)` 改恒等映射 = 整格矩形（删 topGridline/rightGridline 参数）；⑤ 新增 `editorButtonRectOf(rect, { padding, lineHeight })`：right-align `x = rect.x + rect.width − padding − EDITOR_BUTTON_AREA`，`centerY = rect.y + ROW_TOP_INSET + padding + lineHeight/2`（与问题 1 文字锚同一槽位式，不使用 rect.height）；⑥ `resolveEditorType` text/link 分支收窄为 `text`（link 落未知类型回退 input，实际被 isCellEditable 拦截）；`resolveTextLikeEditorType` 保留；⑦ `computeEditorStyle` 删 `gridlines`/`theme` 参数与 topGridline/rightGridline 计算，矩形 = 整格，bordered 判定（switch false / textarea true / border!==false）与 `heightAt=0 → height 0` 保持不变；⑧ 模块头 JSDoc 与各函数注释同步（EDITOR_GAP 口径作废、text/link 表述收窄、模块隔离节补 constants 引入说明） |

## 偏离

无。两处设计未逐字列出的连带说明（非方案偏离）：

1. import 清单在设计列出的三常量外多导入 `EDITOR_BUTTON_AREA`——「接口 / 数据结构」节明示 `editorButtonRectOf` 产物 `width/height: EDITOR_BUTTON_AREA`，常量已定义在 constants.js（本组文件），按镜像常量收拢惯例引用而非写字面量 24。
2. editor.js 模块头 JSDoc 同步改写——原头注声明的「统一等距内缩矩形定位（EDITOR_GAP 口径）」「text/link 列缺省判定」「theme 参数保留」随实现作废，保留会与代码自相矛盾（设计 cell-painters 行同类要求「模块头注释同步」）。

## 自检

完成判据（设计「实施步骤」G1-a）：两文件无语法/自洽错误、`editorRectOf`/`editorButtonRectOf`/`computeEditorStyle` 单文件可 import；未跑全量 eslint、未跑 demo 页面。

- **语法**：两文件复制为 `.mjs` 经 `node --check` ESM 解析通过。
- **单文件 lint**（仅白名单两文件，非全量）：`NODE_PATH=$(npm root -g) npx eslint src/components/canvas-table/constants.js src/components/canvas-table/editor.js` → 0 error 0 warning。
- **单文件可 import + 行为断言**：/tmp 搭最小 vite 构建（复用项目 `@`/`~icons` alias + pluginVue + pluginSvg，产物写 /tmp，未触碰仓库），真实管线解析 import 后 node 运行 17 条断言全部通过：
  - constants 四新常量取值正确；
  - `editorRectOf` 恒等映射；多余 `{ topGridline, rightGridline }` 实参被忽略（painter.js:778 中间态调用兼容，非编译错误）；
  - `editorButtonRectOf` 默认参 `{x:10,y:20,w:100,h:36}` → `x=78, y=26, 24×24`（centerY = y + 1 + 8 + 9 = 38）；自定义 padding/lineHeight 同式成立；
  - `NON_EDITABLE_TYPES` 含 link/button/progress；link 列 `isCellEditable` false、text 列仍 true；
  - `resolveEditorType` text 数组 → textarea、单值 → input；
  - `computeEditorStyle` 产出整格矩形（滚动/fixed 偏移用例 `left/top/width/height` = cellRect 恒等）；多余 `gridlines`/`theme` 属性被忽略；`heightAt=0 → height 0` 保持；switch/textarea bordered 判定不变。
- **工作区核对**：`git status` 本组仅上述两文件由本组改动；树中另存在的 `badge.*` / `canvas-table.scss` / `cell-painters.js` / `interactions.js` / `theme.js` 改动属并发其他组工作区状态，本组未触碰。

## 已知中间态（设计注明，未越界修复）

1. `demo/src/data/canvas-table/self-checks/editor.js:27`、`self-checks/painter.js:20` 具名导入 `EDITOR_GAP` 已失效——G2-2 / G2-4 收口（未动）。
2. `painter.js:778` `paintHoverEditorStroke` 仍传 `{ topGridline, rightGridline }`——新签名忽略之，已实测兼容，S4 收口（未动）。
3. `canvas-table.vue:885` `computeEditorStyle` 调用仍传 `gridlines`/`theme`——解构忽略，S5 收口（未动）。
4. `canvas-table.scss` 的 -5px 补偿与 header-shadow `top: 0` 属 G1-c（未动）。

## 遗留

- **lint 环境注记**：项目本地 node_modules 无 eslint / eslint-config-standard（`.bin` 下无 eslint），直接 `npx eslint` 报 `Could not find config "standard"`。现以全局 eslint 8.57.0 + `NODE_PATH=$(npm root -g)` 运行成功；V 阶段（A10 全量 eslint）需沿用同法或先补装依赖。
- 树中 `src/components/badge/*` 有非本任务设计的未跟踪改动，归属不明，本组未触碰、未验证，留集成阶段注意。
- 页面级验证（A3/A4/A5）不在本组判据内，待 G2 整组落地后由验证步骤执行。
